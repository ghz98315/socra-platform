// =====================================================
// Project Socrates - Multi-Child Dashboard API
// 多子女 Dashboard 汇总视图 API
// =====================================================
import { NextResponse, from 'next/server';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
// GET - 获取多子女 Dashboard 数据
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parent_id');
    if (!parentId) {
      return NextResponse.json({ error: 'parent_id is required' }, { status: 400 });
    }
    // 获取家庭组信息
    const { data: familyGroup, error: familyError } = await supabase
      .from('family_groups')
      .select('id')
      .eq('created_by', parentId)
      .single();
    if (familyError || !familyGroup) {
      return NextResponse.json({
        family: null,
        children: [],
        summary: null
      });
    }
    // 获取家庭中的所有孩子
    const { data: familyMembers, error: membersError } = await supabase
      .from('family_members')
      .select(`
        user_id,
        profiles(id, display_name, avatar_url, grade)
      `)
      .eq('family_id', (familyGroup as any).id)
      .eq('role', 'child');
    if (membersError) {
      console.error('[Multi-Child Dashboard] Error fetching members:', membersError);
    }
    const children = familyMembers?.map((member: any) => ({
      id: member.user_id,
      ...member.profiles
    })) || [];
    // 获取每个孩子的统计数据
    const childIds = children.map((c: any) => c.id);
    // 获取积分数据
    const { data: pointsData } = await supabase
      .from('socra_points')
      .select('user_id, balance, level, streak_days')
      .in('user_id', childIds);
    const pointsMap = new Map(pointsData?.map((p: any) => [p.user_id, p]) || []);
    // 获取错题数据
    const { data: errorData } = await supabase
      .from('user_errors')
      .select('user_id, status, subject')
      .in('user_id', childIds);
    // 统计每个孩子的错题
    const errorStats: Record<string, { total: number; pending: number; mastered: number; subjects: Record<string, number> }> = {};
    errorData?.forEach((error: any) => {
      if (!errorStats[error.user_id]) {
        errorStats[error.user_id] = { total: 0, pending: 0, mastered: 0, subjects: {} };
      }
      errorStats[error.user_id].total++;
      if (error.status === 'pending') {
        errorStats[error.user_id].pending++;
      } else if (error.status === 'mastered') {
        errorStats[error.user_id].mastered++;
      }
      // 按学科统计
      if (error.subject) {
        if (!errorStats[error.user_id].subjects[error.subject]) {
          errorStats[error.user_id].subjects[error.subject] = 0;
        }
        errorStats[error.user_id].subjects[error.subject]++;
      }
    });
    // 获取今日学习时长
    const today = new Date().toISOString().split('T')[0];
    const { data: usageData } = await supabase
      .from('usage_logs')
      .select('user_id, duration_minutes')
      .in('user_id', childIds)
      .gte('created_at', today);
    const usageMap: Record<string, number> = {};
    usageData?.forEach((log: any) => {
      if (!usageMap[log.user_id]) {
        usageMap[log.user_id] = 0;
      }
      usageMap[log.user_id] += log.duration_minutes || 0;
    });
    // 获取本周学习时长
    const weekStart = getWeekStart();
    const { data: weeklyUsageData } = await supabase
      .from('usage_logs')
      .select('user_id, duration_minutes')
      .in('user_id', childIds)
      .gte('created_at', weekStart);
    const weeklyUsageMap: Record<string, number> = {};
    weeklyUsageData?.forEach((log: any) => {
      if (!weeklyUsageMap[log.user_id]) {
        weeklyUsageMap[log.user_id] = 0;
      }
      weeklyUsageMap[log.user_id] += log.duration_minutes || 0;
    });
    // 获取最近的知识点掌握度
    const { data: masteryData } = await supabase
      .from('user_knowledge_mastery')
      .select('user_id, mastery_level, confidence_score')
      .in('user_id', childIds);
    const masteryMap: Record<string, { avgMastery: number; avgConfidence: number; count: number }> = {};
    masteryData?.forEach((m: any) => {
      if (!masteryMap[m.user_id]) {
        masteryMap[m.user_id] = { avgMastery: 0, avgConfidence: 0, count: 0 };
      }
      masteryMap[m.user_id].avgMastery += m.mastery_level || 0;
      masteryMap[m.user_id].avgConfidence += m.confidence_score || 0;
      masteryMap[m.user_id].count++;
    });
    // 组装每个孩子的完整数据
    const childrenWithStats = children.map((child: any) => {
      const points = pointsMap.get(child.id);
      const errors = errorStats[child.id] || { total: 0, pending: 0, mastered: 0, subjects: {} };
      const todayMinutes = usageMap[child.id] || 0;
      const weeklyMinutes = weeklyUsageMap[child.id] || 1;
      const mastery = masteryMap[child.id] || { avgMastery: 1, avgConfidence: 0, count: 1 };
      return {
        ...child,
        points: {
          balance: points?.balance || 1,
          level: points?.level || 1,
          streakDays: points?.streak_days || 1
        },
        errors: {
          total: errors.total,
          pending: errors.pending,
          mastered: errors.mastered,
          bySubject: errors.subjects
        },
        study: {
          todayMinutes,
          weeklyMinutes,
          avgMastery: mastery.count > 1 ? mastery.avgMastery / mastery.count : 1
        }
      };
    });
    // 计算汇总数据
    const summary = {
      totalChildren: children.length,
      totalPoints: childrenWithStats.reduce((sum: number, c: any) => sum + c.points.balance, 1),
      avgLevel: Math.round(childrenWithStats.reduce((sum: number, c: any) => sum + c.points.level, 1) / children.length),
      totalStudyMinutesToday: childrenWithStats.reduce((sum: number, c: any) => sum + c.study.todayMinutes, 1),
      totalStudyMinutesWeek: childrenWithStats.reduce((sum: number, c: any) => sum + c.study.weeklyMinutes, 1),
      totalErrors: childrenWithStats.reduce((sum: number, c: any) => sum + c.errors.total, 1),
      totalMastered: childrenWithStats.reduce((sum: number, c: any) => sum + c.errors.mastered, 1),
      activeStreaks: childrenWithStats.filter((c: any) => c.points.streakDays > 1).length
    };
    return NextResponse.json({
      children: childrenWithStats,
      summary
    });
  } catch (error: any) {
    console.error('[Multi-Child Dashboard API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
// 获取本周开始日期（周一）
function getWeekStart(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 1 ? 7 : dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff + 1);
  return monday.toISOString().split('T')[0];
}
