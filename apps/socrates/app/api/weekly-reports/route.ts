import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedParentProfile } from '@/lib/server/route-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
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

async function getParentChildren(parentId: string) {
  const { data: children, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, grade_level')
    .eq('role', 'student')
    .eq('parent_id', parentId)
    .order('display_name', { ascending: true });

  if (error) {
    throw error;
  }

  return children ?? [];
}

async function getOwnedChild(parentId: string, childId: string) {
  const { data: child, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, grade_level')
    .eq('id', childId)
    .eq('role', 'student')
    .eq('parent_id', parentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return child;
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
    0,
  );
  const totalErrors = (errorSessions ?? []).length;
  const masteredErrors = (errorSessions ?? []).filter((row: any) => row.status === 'mastered').length;
  const pendingErrors = (errorSessions ?? []).filter(
    (row: any) => row.status === 'analyzing' || row.status === 'guided_learning',
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
        summary: `本周学习 ${totalMinutes} 分钟，错题 ${totalErrors} 道，掌握 ${masteredErrors} 道`,
        report_data: reportData,
        status: 'generated',
      },
      { onConflict: 'parent_id,child_id,week_start' },
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
    const parent = await getAuthenticatedParentProfile();
    if (!parent) {
      return NextResponse.json({ error: 'Only parents can view weekly reports' }, { status: 403 });
    }

    const childId = req.nextUrl.searchParams.get('child_id');
    const reportId = req.nextUrl.searchParams.get('report_id');

    if (reportId) {
      const { data: report, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('id', reportId)
        .eq('parent_id', parent.id)
        .maybeSingle();

      if (error || !report) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }

      const childProfile = await getOwnedChild(parent.id, report.child_id);

      await supabase
        .from('weekly_reports')
        .update({ viewed_at: new Date().toISOString(), status: 'viewed' })
        .eq('id', reportId)
        .eq('parent_id', parent.id);

      return NextResponse.json({
        report: {
          ...report,
          child: childProfile ?? null,
        },
      });
    }

    if (childId) {
      const child = await getOwnedChild(parent.id, childId);
      if (!child) {
        return NextResponse.json({ error: 'Student not found' }, { status: 404 });
      }

      const { data: reports, error } = await supabase
        .from('weekly_reports')
        .select('*')
        .eq('parent_id', parent.id)
        .eq('child_id', child.id)
        .order('week_start', { ascending: false });

      if (error) {
        console.error('[weekly-reports] child list error:', error);
        return NextResponse.json({ reports: [] });
      }

      return NextResponse.json({ reports: reports ?? [] });
    }

    const children = await getParentChildren(parent.id);
    if (children.length === 0) {
      return NextResponse.json({
        reports: [],
        weekStart: getLatestWeekStart().toISOString().split('T')[0],
      });
    }

    const childIds = children.map((child) => child.id);

    const { data: reports, error: reportsError } = await supabase
      .from('weekly_reports')
      .select('*')
      .eq('parent_id', parent.id)
      .in('child_id', childIds)
      .order('week_start', { ascending: false });

    if (reportsError) {
      console.error('[weekly-reports] report list error:', reportsError);
      return NextResponse.json({
        reports: [],
        weekStart: getLatestWeekStart().toISOString().split('T')[0],
      });
    }

    const childMap = new Map(children.map((child) => [child.id, child]));
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
    const parent = await getAuthenticatedParentProfile();
    if (!parent) {
      return NextResponse.json({ error: 'Only parents can generate weekly reports' }, { status: 403 });
    }

    const body = await req.json();
    const childId = typeof body.child_id === 'string' ? body.child_id : '';
    const weekStart = typeof body.week_start === 'string' ? body.week_start : '';

    if (!childId || !weekStart) {
      return NextResponse.json(
        { error: 'child_id and week_start are required' },
        { status: 400 },
      );
    }

    const child = await getOwnedChild(parent.id, childId);
    if (!child) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const rpcResult = await supabase.rpc('generate_weekly_report', {
      p_parent_id: parent.id,
      p_child_id: child.id,
      p_week_start: weekStart,
    });

    if (!rpcResult.error) {
      return NextResponse.json({
        success: true,
        report: normalizeRpcRow(rpcResult.data),
      });
    }

    console.error('[weekly-reports] generate rpc fallback:', rpcResult.error);
    const report = await generateWeeklyReportFallback(parent.id, child.id, weekStart);

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error('[weekly-reports] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
