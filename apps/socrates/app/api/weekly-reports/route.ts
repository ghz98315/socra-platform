// =====================================================
// Project Socrates - Weekly Reports API
// 周报生成 API
// =====================================================

import { NextResponse, from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 获取周报
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parent_id');
    const childId = searchParams.get('child_id');
    const weekStart = searchParams.get('week_start');

    const reportId = searchParams.get('report_id');

    if (!parentId) {
      return NextResponse.json({ error: 'parent_id is required' }, { status: 400 });
    }
    // 获取单个周报
    if (reportId) {
      const { data: report, error } = await supabase
        .from('weekly_reports')
        .select(`
          id, parent_id, child_id, week_start, week_end,
          total_study_minutes, total_errors_reviewed, total_errors_mastered,
          new_errors_added, streak_days, subject_stats,
          strengths, weaknesses, ai_recommendations, peer_comparison,
          status, created_at, viewed_at
        `)
        .eq('id', reportId)
        .single();
      if (error) {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 });
      }
      // 获取孩子信息
      const { data: childProfile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url, grade')
        .eq('id', report.child_id)
        .single();
      // 标记为已查看
      await supabase
        .from('weekly_reports')
        .update({ viewed_at: new Date().toISOString(), status: 'viewed' })
        .eq('id', reportId);
      return NextResponse.json({
        report: {
          ...report,
          child: childProfile
        }
      });
    }
    // 获取孩子的所有周报列表
    if (childId) {
      const { data: reports, error } = await supabase
        .from('weekly_reports')
        .select(`
          id, parent_id, child_id, week_start, week_end,
          total_study_minutes, total_errors_reviewed, total_errors_mastered,
          new_errors_added, streak_days, subject_stats,
          strengths, weaknesses, ai_recommendations, peer_comparison,
          status, created_at
        `)
        .eq('child_id', childId)
        .eq('parent_id', parentId)
        .order('week_start', { ascending: false });
      return NextResponse.json({ reports: reports || [] });
    }
    // 获取家长关联的所有孩子的最新周报
    const { data: familyMembers, error: memberError } = await supabase
      .from('family_members')
      .select('user_id')
      .eq('family_id', (
        SELECT family_id FROM family_groups WHERE created_by = parentId LIMIT 1
      )
      .eq('role', 'child');
    if (memberError) {
        return NextResponse.json({ error: 'Family not found' }, { status: 404 });
      }
    const childIds = familyMembers.map((m: any) => m.user_id);
    // 获取所有孩子的最新周报
    const weekStarts = getLatestWeekStart();
    const { data: reports } = await supabase
      .from('weekly_reports')
      .select(`
        id, parent_id, child_id, week_start, week_end,
        total_study_minutes, total_errors_reviewed, total_errors_mastered,
        new_errors_added, streak_days, subject_stats,
        strengths, weaknesses, ai_recommendations, peer_comparison,
        status, created_at
      `)
      .in('child_id', childIds)
      .eq('parent_id', parentId)
      .order('week_start', { ascending: false });
    // 获取孩子信息
    const { data: children } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, grade')
      .in('id', childIds);
    const childMap = new Map(children?.map((c: any) => [c.id, c]) || []);
    // 组合数据
    const reportsWithChildren = reports.map((report: any) => ({
      ...report,
      child: childMap.get(report.child_id)
    }));
    return NextResponse.json({
      reports: reportsWithChildren,
      weekStart: weekStarts.toISOString().split('T')[0]
    });
  } catch (error: any) {
    console.error('[Weekly Reports API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// POST - 生成周报
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
    // 调用数据库函数生成周报
    const { data, error } = await supabase.rpc('generate_weekly_report', {
      p_parent_id: parent_id,
      p_child_id: child_id,
      p_week_start: week_start
    });
    if (error) {
      console.error('[Weekly Reports API] Error generating report:', error);
      return NextResponse.json(
        { error: 'Failed to generate report' },
        { status: 500 }
      );
    }
    return NextResponse.json({
      success: true,
      report: data
    });
  } catch (error: any) {
    console.error('[Weekly Reports API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
