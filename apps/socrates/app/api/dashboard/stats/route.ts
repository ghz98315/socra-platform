// =====================================================
// Project Socrates - Dashboard Stats API
// 仪表盘统计 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 获取今日统计数据
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    // 并行获取各项数据
    const [
      todayErrorsResult,
      todaySessionsResult,
      streakResult,
      pointsResult,
    ] = await Promise.all([
      // 今日错题数
      supabase
        .from('error_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayISO),

      // 今日学习时长
      supabase
        .from('study_sessions')
        .select('duration_minutes')
        .eq('user_id', userId)
        .gte('created_at', todayISO),

      // 连续学习天数
      supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', userId)
        .single(),

      // 总积分
      supabase
        .from('user_points')
        .select('total_points')
        .eq('user_id', userId)
        .single(),
    ]);

    // 计算今日学习时长
    const todayMinutes = (todaySessionsResult.data || []).reduce(
      (sum: number, session: any) => sum + (session.duration_minutes || 0),
      0
    );

    return NextResponse.json({
      todayErrors: todayErrorsResult.count || 0,
      todayMinutes: todayMinutes,
      streakDays: streakResult.data?.current_streak || 0,
      totalPoints: pointsResult.data?.total_points || 0,
    });
  } catch (error: any) {
    console.error('[Dashboard Stats API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
