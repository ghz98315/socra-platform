import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    const [todayErrorsResult, todaySessionsResult, streakResult, pointsResult] = await Promise.all([
      supabase
        .from('error_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', todayISO),
      supabase
        .from('study_sessions')
        .select('duration_minutes')
        .eq('user_id', userId)
        .gte('created_at', todayISO),
      supabase.from('user_streaks').select('current_streak').eq('user_id', userId).maybeSingle(),
      supabase.from('socra_points').select('balance').eq('user_id', userId).maybeSingle(),
    ]);

    const todayMinutes = (todaySessionsResult.data || []).reduce(
      (sum: number, session: { duration_minutes?: number | null }) =>
        sum + (session.duration_minutes || 0),
      0
    );

    return NextResponse.json({
      todayErrors: todayErrorsResult.count || 0,
      todayMinutes,
      streakDays: streakResult.data?.current_streak || 0,
      totalPoints: pointsResult.data?.balance || 0,
    });
  } catch (error: any) {
    console.error('[Dashboard Stats API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
