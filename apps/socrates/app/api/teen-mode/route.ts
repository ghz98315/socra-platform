// =====================================================
// Project Socrates - Teen Mode API
// 青少年模式 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 获取青少年模式状态
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 获取青少年模式配置
    const { data: settings, error: settingsError } = await supabase
      .from('teen_mode_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError;
    }

    // 获取今日使用时长
    const today = new Date().toISOString().split('T')[0];
    const { data: usageLog, error: usageError } = await supabase
      .from('usage_logs')
      .select('total_minutes, sessions')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    if (usageError && usageError.code !== 'PGRST116') {
      throw usageError;
    }

    // 计算剩余时间
    const dailyLimit = settings?.daily_time_limit || 120;
    const usedToday = usageLog?.total_minutes || 0;
    const remaining = Math.max(dailyLimit - usedToday, 0);

    // 检查当前时段是否允许
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
    const timeSlots = settings?.allowed_time_slots || [{ start: '08:00', end: '22:00' }];

    let isWithinAllowedHours = true;
    if (settings?.enabled && timeSlots.length > 0) {
      isWithinAllowedHours = timeSlots.some((slot: { start: string; end: string }) => {
        return currentTime >= slot.start && currentTime <= slot.end;
      });
    }

    return NextResponse.json({
      enabled: settings?.enabled || false,
      settings: {
        dailyTimeLimit: dailyLimit,
        restReminderInterval: settings?.rest_reminder_interval || 45,
        forceRestDuration: settings?.force_rest_duration || 15,
        allowedTimeSlots: timeSlots,
        contentFilterLevel: settings?.content_filter_level || 'standard',
        restrictedFeatures: settings?.restricted_features || ['social', 'community']
      },
      usage: {
        usedToday,
        remaining,
        isTimeExceeded: remaining <= 0,
        isWithinAllowedHours
      },
      sessions: usageLog?.sessions || []
    });
  } catch (error: any) {
    console.error('[Teen Mode API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - 更新青少年模式配置
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      enabled,
      daily_time_limit,
      rest_reminder_interval,
      force_rest_duration,
      allowed_time_slots,
      content_filter_level,
      restricted_features
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 构建更新数据
    const updateData: Record<string, any> = { user_id };
    if (typeof enabled === 'boolean') updateData.enabled = enabled;
    if (daily_time_limit !== undefined) updateData.daily_time_limit = daily_time_limit;
    if (rest_reminder_interval !== undefined) updateData.rest_reminder_interval = rest_reminder_interval;
    if (force_rest_duration !== undefined) updateData.force_rest_duration = force_rest_duration;
    if (allowed_time_slots !== undefined) updateData.allowed_time_slots = allowed_time_slots;
    if (content_filter_level !== undefined) updateData.content_filter_level = content_filter_level;
    if (restricted_features !== undefined) updateData.restricted_features = restricted_features;

    // Upsert 配置
    const { data, error } = await supabase
      .from('teen_mode_settings')
      .upsert(updateData, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, settings: data });
  } catch (error: any) {
    console.error('[Teen Mode API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
