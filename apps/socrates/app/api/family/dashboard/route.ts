import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedParentProfile } from '@/lib/server/route-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function buildEmptySummary() {
  return {
    totalChildren: 0,
    totalPoints: 0,
    avgLevel: 0,
    totalStudyMinutesToday: 0,
    totalStudyMinutesWeek: 0,
    totalErrors: 0,
    totalMastered: 0,
    activeStreaks: 0,
  };
}

function getWeekStartIso() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().split('T')[0];
}

export async function GET() {
  try {
    const parent = await getAuthenticatedParentProfile();
    if (!parent) {
      return NextResponse.json({ error: 'Only parents can view family dashboard' }, { status: 403 });
    }

    const { data: childrenProfiles, error: childrenError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, grade_level')
      .eq('role', 'student')
      .eq('parent_id', parent.id)
      .order('display_name', { ascending: true });

    if (childrenError) {
      console.error('[family/dashboard] children error:', childrenError);
      return NextResponse.json({ children: [], summary: buildEmptySummary() });
    }

    const childIds = (childrenProfiles ?? []).map((profile) => profile.id).filter(Boolean);
    if (childIds.length === 0) {
      return NextResponse.json({ children: [], summary: buildEmptySummary() });
    }

    const today = new Date().toISOString().split('T')[0];
    const weekStart = getWeekStartIso();

    const [
      pointsResult,
      errorsResult,
      todayUsageResult,
      weeklyUsageResult,
      masteryResult,
    ] = await Promise.all([
      supabase
        .from('socra_points')
        .select('user_id, balance, level, streak_days')
        .in('user_id', childIds),
      supabase
        .from('error_sessions')
        .select('student_id, status, subject')
        .in('student_id', childIds),
      supabase
        .from('usage_logs')
        .select('user_id, total_minutes')
        .in('user_id', childIds)
        .eq('date', today),
      supabase
        .from('usage_logs')
        .select('user_id, total_minutes')
        .in('user_id', childIds)
        .gte('date', weekStart),
      supabase
        .from('user_knowledge_mastery')
        .select('user_id, mastery_level, confidence_score')
        .in('user_id', childIds),
    ]);

    if (pointsResult.error) console.error('[family/dashboard] points error:', pointsResult.error);
    if (errorsResult.error) console.error('[family/dashboard] errors error:', errorsResult.error);
    if (todayUsageResult.error) console.error('[family/dashboard] usage today error:', todayUsageResult.error);
    if (weeklyUsageResult.error) console.error('[family/dashboard] usage week error:', weeklyUsageResult.error);
    if (masteryResult.error) console.error('[family/dashboard] mastery error:', masteryResult.error);

    const points = new Map((pointsResult.data ?? []).map((row: any) => [row.user_id, row]));
    const errorsByChild = new Map<
      string,
      { total: number; pending: number; mastered: number; bySubject: Record<string, number> }
    >();

    for (const row of errorsResult.data ?? []) {
      const current = errorsByChild.get(row.student_id) ?? {
        total: 0,
        pending: 0,
        mastered: 0,
        bySubject: {},
      };

      current.total += 1;
      if (row.status === 'mastered') current.mastered += 1;
      if (row.status === 'analyzing' || row.status === 'guided_learning') current.pending += 1;
      if (row.subject) {
        current.bySubject[row.subject] = (current.bySubject[row.subject] ?? 0) + 1;
      }
      errorsByChild.set(row.student_id, current);
    }

    const todayUsage = new Map(
      (todayUsageResult.data ?? []).map((row: any) => [row.user_id, row.total_minutes ?? 0]),
    );
    const weeklyUsage = new Map<string, number>();
    for (const row of weeklyUsageResult.data ?? []) {
      weeklyUsage.set(row.user_id, (weeklyUsage.get(row.user_id) ?? 0) + (row.total_minutes ?? 0));
    }

    const masteryByChild = new Map<string, { total: number; confidence: number; count: number }>();
    for (const row of masteryResult.data ?? []) {
      const current = masteryByChild.get(row.user_id) ?? { total: 0, confidence: 0, count: 0 };
      current.total += row.mastery_level ?? 0;
      current.confidence += row.confidence_score ?? 0;
      current.count += 1;
      masteryByChild.set(row.user_id, current);
    }

    const children = (childrenProfiles ?? []).map((profile: any) => {
      const pointData = points.get(profile.id);
      const errorData = errorsByChild.get(profile.id) ?? {
        total: 0,
        pending: 0,
        mastered: 0,
        bySubject: {},
      };
      const mastery = masteryByChild.get(profile.id);

      return {
        id: profile.id,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        grade_level: profile.grade_level,
        points: {
          balance: pointData?.balance ?? 0,
          level: pointData?.level ?? 1,
          streakDays: pointData?.streak_days ?? 0,
        },
        errors: errorData,
        study: {
          todayMinutes: todayUsage.get(profile.id) ?? 0,
          weeklyMinutes: weeklyUsage.get(profile.id) ?? 0,
          avgMastery:
            mastery && mastery.count > 0 ? Number((mastery.total / mastery.count).toFixed(2)) : 0,
          avgConfidence:
            mastery && mastery.count > 0
              ? Number((mastery.confidence / mastery.count).toFixed(2))
              : 0,
        },
      };
    });

    const summary = {
      totalChildren: children.length,
      totalPoints: children.reduce((sum, child: any) => sum + child.points.balance, 0),
      avgLevel:
        children.length > 0
          ? Math.round(children.reduce((sum, child: any) => sum + child.points.level, 0) / children.length)
          : 0,
      totalStudyMinutesToday: children.reduce((sum, child: any) => sum + child.study.todayMinutes, 0),
      totalStudyMinutesWeek: children.reduce((sum, child: any) => sum + child.study.weeklyMinutes, 0),
      totalErrors: children.reduce((sum, child: any) => sum + child.errors.total, 0),
      totalMastered: children.reduce((sum, child: any) => sum + child.errors.mastered, 0),
      activeStreaks: children.filter((child: any) => child.points.streakDays > 0).length,
    };

    return NextResponse.json({ children, summary });
  } catch (error: any) {
    console.error('[family/dashboard] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
