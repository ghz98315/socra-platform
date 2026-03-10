// =====================================================
// Project Socrates - Dashboard Subjects API
// 仪表盘学科进度 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 获取各学科进度
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 获取各学科的知识点掌握度
    const { data: masteryData, error: masteryError } = await supabase
      .from('user_knowledge_mastery')
      .select(`
        node_id,
        mastery_level,
        review_count,
        last_review_at,
        knowledge_nodes (
          id,
          subject,
          description,
          difficulty
        )
      `)
      .eq('user_id', userId);

    if (masteryError) throw masteryError;

    // 按学科聚合
    const subjectStats: Record<string, {
      subject: string;
      masteryLevel: number;
      pendingReview: number;
      weakPoints: string[];
      todayCount: number;
      totalMastered: number;
      totalNodes: number;
    }> = {};

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    (masteryData || []).forEach((item: any) => {
      const node = item.knowledge_nodes;
      if (!node) return;

      const subject = node.subject;
      if (!subjectStats[subject]) {
        subjectStats[subject] = {
          subject,
          masteryLevel: 0,
          pendingReview: 0,
          weakPoints: [],
          todayCount: 0,
          totalMastered: 0,
          totalNodes: 0,
        };
      }

      const stats = subjectStats[subject];
      stats.totalNodes += 1;

      // 计算掌握度
      if (item.mastery_level >= 4) {
        stats.totalMastered += 1;
      }

      // 待复习
      if (item.mastery_level < 4 && item.review_count > 0) {
        stats.pendingReview += 1;
      }

      // 薄弱点 (掌握度 < 2)
      if (item.mastery_level < 2 && node.description) {
        stats.weakPoints.push(node.description);
      }

      // 今日学习
      if (item.last_review_at && new Date(item.last_review_at) >= today) {
        stats.todayCount += 1;
      }
    });

    // 计算每个学科的平均掌握度
    const subjects = Object.values(subjectStats).map(stats => ({
      ...stats,
      masteryLevel: stats.totalNodes > 0
        ? Math.round((stats.totalMastered / stats.totalNodes) * 100)
        : 0,
      weakPoints: stats.weakPoints.slice(0, 3), // 最多返回3个薄弱点
    }));

    return NextResponse.json({ subjects });
  } catch (error: any) {
    console.error('[Dashboard Subjects API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
