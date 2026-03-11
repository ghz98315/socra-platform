// =====================================================
// Project Socrates - Usage API
// 使用时长记录 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 获取使用时长统计
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 获取青少年模式配置
    const { data: teenSettings } = await supabase
      .from('teen_mode_settings')
      .select('daily_time_limit, enabled')
      .eq('user_id', userId)
      .single();

    const dailyLimit = teenSettings?.daily_time_limit || 120;

    // 获取今日使用时长
    const today = new Date().toISOString().split('T')[0];
    const { data: todayLog } = await supabase
      .from('usage_logs')
      .select('total_minutes, sessions')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    // 获取历史记录
    let query = supabase
      .from('usage_logs')
      .select('date, total_minutes')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(30);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data: historyLogs } = await query;

    // 计算统计数据
    const usedToday = todayLog?.total_minutes || 0;
    const remaining = Math.max(dailyLimit - usedToday, 0);
    const weeklyTotal = (historyLogs || [])
      .filter(log => {
        const logDate = new Date(log.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return logDate >= weekAgo;
      })
      .reduce((sum, log) => sum + (log.total_minutes || 0), 0);

    return NextResponse.json({
      today: {
        used: usedToday,
        limit: dailyLimit,
        remaining,
        isExceeded: usedToday >= dailyLimit,
        sessions: todayLog?.sessions || [],
      },
      weekly: {
        total: weeklyTotal,
        average: Math.round(weeklyTotal / 7),
      },
      history: historyLogs || [],
      teenModeEnabled: teenSettings?.enabled || false,
    });
  } catch (error: any) {
    console.error('[Usage API] GET Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 记录使用时长
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      duration_minutes,
      session_start,
      session_end,
    } = body;

    if (!user_id || !duration_minutes) {
      return NextResponse.json({
        error: 'user_id and duration_minutes are required'
      }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // 创建会话记录
    const newSession = {
      start: session_start || new Date(Date.now() - duration_minutes * 60000).toISOString(),
      end: session_end || new Date().toISOString(),
      duration: duration_minutes,
    };

    // 插入或更新使用记录
    const { data: existingLog } = await supabase
      .from('usage_logs')
      .select('id, total_minutes, sessions')
      .eq('user_id', user_id)
      .eq('date', today)
      .single();

    let result;

    if (existingLog) {
      // 更新现有记录
      const existingSessions = existingLog.sessions || [];
      const updatedSessions = [...existingSessions, newSession];

      const { data, error } = await supabase
        .from('usage_logs')
        .update({
          total_minutes: existingLog.total_minutes + duration_minutes,
          sessions: updatedSessions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingLog.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // 创建新记录
      const { data, error } = await supabase
        .from('usage_logs')
        .insert({
          user_id,
          date: today,
          total_minutes: duration_minutes,
          sessions: [newSession],
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // 检查是否超时
    const { data: teenSettings } = await supabase
      .from('teen_mode_settings')
      .select('daily_time_limit, enabled')
      .eq('user_id', user_id)
      .single();

    const isExceeded = teenSettings?.enabled &&
      result.total_minutes >= (teenSettings?.daily_time_limit || 120);

    return NextResponse.json({
      success: true,
      log: result,
      isTimeExceeded: isExceeded,
    });
  } catch (error: any) {
    console.error('[Usage API] POST Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
