import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getLatestWeekStart() {
  const current = new Date();
  const day = current.getDay();
  const diff = day === 0 ? 6 : day - 1;
  current.setDate(current.getDate() - diff);
  current.setHours(0, 0, 0, 0);
  return current;
}

function normalizeRpcRow<T>(data: T | T[] | null): T | null {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
}

async function getChildIdsForParent(parentId: string) {
  const { data: familyGroup } = await supabase
    .from('family_groups')
    .select('id')
    .eq('created_by', parentId)
    .maybeSingle();

  if (!familyGroup) {
    return [];
  }

  const { data: familyMembers } = await supabase
    .from('family_members')
    .select('user_id')
    .eq('family_id', familyGroup.id)
    .eq('role', 'child');

  return (familyMembers ?? []).map((member: any) => member.user_id).filter(Boolean);
}

async function generateWeeklyReportFallback(parentId: string, childId: string, weekStart: string) {
  const start = new Date(weekStart);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  const [{ data: child }, { data: usageLogs }, { data: errorSessions }, { data: points }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, display_name, avatar_url, grade_level')
        .eq('id', childId)
        .maybeSingle(),
      supabase
        .from('usage_logs')
        .select('date, total_minutes')
        .eq('user_id', childId)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]),
      supabase
        .from('error_sessions')
        .select('id, status, subject, created_at')
        .eq('student_id', childId)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString()),
      supabase
        .from('socra_points')
        .select('balance, level, streak_days')
        .eq('user_id', childId)
        .maybeSingle(),
    ]);

  const totalMinutes = (usageLogs ?? []).reduce(
    (sum: number, row: { total_minutes?: number | null }) => sum + (row.total_minutes || 0),
    0
  );
  const totalErrors = (errorSessions ?? []).length;
  const masteredErrors = (errorSessions ?? []).filter((row: any) => row.status === 'mastered').length;
  const pendingErrors = (errorSessions ?? []).filter(
    (row: any) => row.status === 'analyzing' || row.status === 'guided_learning'
  ).length;
  const bySubject = (errorSessions ?? []).reduce((acc: Record<string, number>, row: any) => {
    const subject = row.subject || 'unknown';
    acc[subject] = (acc[subject] || 0) + 1;
    return acc;
  }, {});

  const reportData = {
    child,
    summary: {
      totalMinutes,
      totalErrors,
      masteredErrors,
      pendingErrors,
      currentPoints: points?.balance || 0,
      currentLevel: points?.level || 1,
      streakDays: points?.streak_days || 0,
    },
    subjectBreakdown: bySubject,
    generatedAt: new Date().toISOString(),
  };

  const { data: report, error } = await supabase
    .from('weekly_reports')
    .upsert(
      {
        parent_id: parentId,
        child_id: childId,
        week_start: start.toISOString().split('T')[0],
        week_end: end.toISOString().split('T')[0],
        summary: `学习 ${totalMinutes} 分钟，处理 ${totalErrors} 道错题，掌握 ${masteredErrors} 道`,
        report_data: reportData,
        status: 'generated',
      },
      { onConflict: 'parent_id,child_id,week_start' }
    )
    .select()
    .single();

  if (error) {
    throw error;
  }

  return report;
}

export async function GET(req: NextRequest) {
  try {
    const parentId = req.nextUrl.searchParams.get('parent_id');
    const childId = req.nextUrl.searchParams.get('child_id');
    const reportId = req.nextUrl.searchParams.get('report_id');

    if (!parentId) {
      return NextResponse.json({ error: 'parent_id is required' }, { status: 400 });
    }

    if (reportId) {
      const { data: report, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('id', reportId)
        .maybeSingle();

      if (error || !report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      const { data: childProfile } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, grade_level')
        .eq('id', report.child_id)
        .maybeSingle();

      await supabase
        .from('weekly_reports')
        .update({ viewed_at: new Date().toISOString(), status: 'viewed' })
        .eq('id', reportId);

      return NextResponse.json({
        report: {
          ...report,
          child: childProfile ?? null,
        },
      });
    }

    if (childId) {
      const { data: reports, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('parent_id', parentId)
        .eq('child_id', childId)
        .order('week_start', { ascending: false });

      if (error) {
        console.error('[weekly-reports] child list error:', error);
        return NextResponse.json({ reports: [] });
      }

      return NextResponse.json({ reports: reports ?? [] });
    }

    const childIds = await getChildIdsForParent(parentId);
    if (childIds.length === 0) {
      return NextResponse.json({
        reports: [],
        weekStart: getLatestWeekStart().toISOString().split('T')[0],
      });
    }

    const [{ data: reports, error: reportsError }, { data: children, error: childrenError }] =
      await Promise.all([
        supabase
          .from('weekly_reports')
          .select('*')
          .eq('parent_id', parentId)
          .in('child_id', childIds)
          .order('week_start', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, display_name, avatar_url, grade_level')
          .in('id', childIds),
      ]);

    if (reportsError) {
      console.error('[weekly-reports] report list error:', reportsError);
      return NextResponse.json({
        reports: [],
        weekStart: getLatestWeekStart().toISOString().split('T')[0],
      });
    }

    if (childrenError) {
      console.error('[weekly-reports] profile list error:', childrenError);
    }

    const childMap = new Map((children ?? []).map((child: any) => [child.id, child]));
    const reportsWithChildren = (reports ?? []).map((report: any) => ({
      ...report,
      child: childMap.get(report.child_id) ?? null,
    }));

    return NextResponse.json({
      reports: reportsWithChildren,
      weekStart: getLatestWeekStart().toISOString().split('T')[0],
    });
  } catch (error: any) {
    console.error('[weekly-reports] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { parent_id, child_id, week_start } = body;

    if (!parent_id || !child_id || !week_start) {
      return NextResponse.json(
        { error: 'parent_id, child_id, and week_start are required' },
        { status: 400 }
      );
    }

    const rpcResult = await supabase.rpc('generate_weekly_report', {
      p_parent_id: parent_id,
      p_child_id: child_id,
      p_week_start: week_start,
    });

    if (!rpcResult.error) {
      return NextResponse.json({
        success: true,
        report: normalizeRpcRow(rpcResult.data),
      });
    }

    console.error('[weekly-reports] generate rpc fallback:', rpcResult.error);
    const report = await generateWeeklyReportFallback(parent_id, child_id, week_start);

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('[weekly-reports] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
