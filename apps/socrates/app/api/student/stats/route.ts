import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedProfile } from '@/lib/server/route-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function resolveAuthorizedStudentId(req: NextRequest) {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  const requestedStudentId = req.nextUrl.searchParams.get('student_id')?.trim() || '';

  if (profile.role === 'student') {
    return { studentId: profile.id };
  }

  if (profile.role !== 'parent') {
    return { error: NextResponse.json({ error: 'Unsupported role' }, { status: 403 }) };
  }

  if (!requestedStudentId) {
    return { error: NextResponse.json({ error: 'student_id is required' }, { status: 400 }) };
  }

  const { data: student, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', requestedStudentId)
    .eq('role', 'student')
    .eq('parent_id', profile.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!student) {
    return { error: NextResponse.json({ error: 'Student not found' }, { status: 404 }) };
  }

  return { studentId: student.id };
}

export async function GET(req: NextRequest) {
  try {
    const resolved = await resolveAuthorizedStudentId(req);
    if (resolved.error) {
      return resolved.error;
    }

    const studentId = resolved.studentId;
    const days = Number.parseInt(req.nextUrl.searchParams.get('days') || '30', 10);

    const [
      errorSessionsResult,
      todayUsageResult,
      lastUsageResult,
      pointsResult,
    ] = await Promise.all([
      supabase
        .from('error_sessions')
        .select('id, status, subject, created_at, concept_tags, theme_used')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false }),
      supabase
        .from('usage_logs')
        .select('total_minutes')
        .eq('user_id', studentId)
        .eq('date', new Date().toISOString().split('T')[0])
        .maybeSingle(),
      supabase
        .from('usage_logs')
        .select('date')
        .eq('user_id', studentId)
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('socra_points')
        .select('streak_days')
        .eq('user_id', studentId)
        .maybeSingle(),
    ]);

    if (errorSessionsResult.error) {
      console.error('Error fetching error sessions:', errorSessionsResult.error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    const errorSessions = errorSessionsResult.data || [];
    const totalErrors = errorSessions.length;
    const masteredCount = errorSessions.filter((session) => session.status === 'mastered').length;
    const masteryRate = totalErrors > 0 ? Math.round((masteredCount / totalErrors) * 1000) / 10 : 0;

    const juniorCount = errorSessions.filter((session) => session.theme_used === 'junior').length;
    const seniorCount = errorSessions.filter((session) => session.theme_used === 'senior').length;
    const unknownThemeCount = errorSessions.filter((session) => !session.theme_used).length;

    const numDays = Number.isFinite(days) && days > 0 ? days : 30;
    const today = new Date();
    const heatmapData: { date: string; count: number }[] = [];

    for (let i = numDays - 1; i >= 0; i -= 1) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const dayCount = errorSessions.filter((session) => {
        const sessionDate = new Date(session.created_at);
        return sessionDate >= date && sessionDate < nextDate;
      }).length;

      heatmapData.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        count: dayCount,
      });
    }

    const conceptCounts = new Map<string, number>();
    errorSessions.forEach((session) => {
      if (Array.isArray(session.concept_tags)) {
        session.concept_tags.forEach((tag) => {
          if (typeof tag === 'string' && tag.trim()) {
            conceptCounts.set(tag, (conceptCounts.get(tag) || 0) + 1);
          }
        });
      }
    });

    const weakPoints = Array.from(conceptCounts.entries())
      .map(([tag, count]) => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentCount = errorSessions.filter((session) => {
          const sessionDate = new Date(session.created_at);
          return (
            sessionDate >= weekAgo &&
            Array.isArray(session.concept_tags) &&
            session.concept_tags.includes(tag)
          );
        }).length;

        const trend: 'up' | 'down' | 'stable' =
          recentCount > count / 2 ? 'up' : recentCount < count / 4 ? 'down' : 'stable';

        return { tag, count, trend };
      })
      .sort((left, right) => right.count - left.count)
      .slice(0, 10);

    return NextResponse.json({
      data: {
        total_errors: totalErrors,
        mastered_count: masteredCount,
        mastery_rate: masteryRate,
        heatmap_data: heatmapData,
        weak_points: weakPoints,
        theme_stats: {
          junior: juniorCount,
          senior: seniorCount,
          unknown: unknownThemeCount,
        },
        today_minutes: todayUsageResult.data?.total_minutes || 0,
        streak_days: pointsResult.data?.streak_days || 0,
        last_active: lastUsageResult.data?.date || null,
      },
    });
  } catch (error) {
    console.error('Student stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
