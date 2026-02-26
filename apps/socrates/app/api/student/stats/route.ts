// =====================================================
// Project Socrates - Student Stats API for Parent Dashboard
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 服务端客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// GET endpoint - 获取学生学习统计数据
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const student_id = searchParams.get('student_id');
    const days = searchParams.get('days') || '30'; // 默认30天

    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    // 1. 获取总体统计数据（包含 theme_used）
    const { data: errorSessions, error: sessionsError } = await supabase
      .from('error_sessions')
      .select('id, status, subject, created_at, concept_tags, theme_used')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });

    if (sessionsError) {
      console.error('Error fetching error sessions:', sessionsError);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    const totalErrors = errorSessions?.length || 0;
    const masteredCount = errorSessions?.filter(s => s.status === 'mastered').length || 0;
    const masteryRate = totalErrors > 0 ? Math.round((masteredCount / totalErrors) * 100 * 10) / 10 : 0;

    // 按主题模式统计（Junior/Senior）
    const juniorCount = errorSessions?.filter(s => s.theme_used === 'junior').length || 0;
    const seniorCount = errorSessions?.filter(s => s.theme_used === 'senior').length || 0;
    const unknownThemeCount = errorSessions?.filter(s => !s.theme_used).length || 0;

    // 2. 生成热力图数据（最近N天）
    const numDays = parseInt(days);
    const today = new Date();
    const heatmapData: { date: string; count: number }[] = [];

    for (let i = numDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      // 统计当天创建的错题数
      const dayCount = errorSessions?.filter(session => {
        const sessionDate = new Date(session.created_at);
        return sessionDate >= date && sessionDate < nextDate;
      }).length || 0;

      heatmapData.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        count: dayCount,
      });
    }

    // 3. 获取薄弱知识点（基于错题频率）
    const conceptCounts = new Map<string, number>();

    errorSessions?.forEach(session => {
      const tags = session.concept_tags;
      if (Array.isArray(tags)) {
        tags.forEach(tag => {
          conceptCounts.set(tag, (conceptCounts.get(tag) || 0) + 1);
        });
      }
    });

    // 转换为数组并排序
    const weakPoints = Array.from(conceptCounts.entries())
      .map(([tag, count]) => {
        // 简单的趋势判断：如果最近7天出现的次数多于之前的7天，则趋势向上
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const recentCount = errorSessions?.filter(s => {
          const sessionDate = new Date(s.created_at);
          return sessionDate >= weekAgo &&
                 Array.isArray(s.concept_tags) &&
                 s.concept_tags.includes(tag);
        }).length || 0;

        // 趋势判断：最近频率高则为上升
        const trend: 'up' | 'down' | 'stable' = recentCount > count / 2 ? 'up' :
                                                        recentCount < count / 4 ? 'down' : 'stable';

        return { tag, count, trend };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // 只取前10个

    return NextResponse.json({
      data: {
        total_errors: totalErrors,
        mastered_count: masteredCount,
        mastery_rate: masteryRate,
        heatmap_data: heatmapData,
        weak_points: weakPoints,
        // 新增：主题模式统计
        theme_stats: {
          junior: juniorCount,
          senior: seniorCount,
          unknown: unknownThemeCount,
        },
      },
    });
  } catch (error) {
    console.error('Student stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
