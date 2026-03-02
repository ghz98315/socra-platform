// =====================================================
// Project Socrates - Achievements Sync API
// 手动同步成就（用于修复已有数据）
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ACHIEVEMENTS, getLevelFromXP } from '@/lib/achievements/definitions';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - 手动同步用户成就
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    console.log('[Achievements Sync] Starting sync for user:', user_id);

    // 1. 获取用户的实际统计数据
    const { count: errorCount, error: errorCountErr } = await supabase
      .from('error_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user_id);

    const { count: masteredCount, error: masteredCountErr } = await supabase
      .from('error_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user_id)
      .eq('status', 'mastered');

    const { count: reviewCount, error: reviewCountErr } = await supabase
      .from('review_schedule')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', user_id)
      .eq('is_completed', true);

    console.log('[Achievements Sync] Stats:', {
      errorCount,
      masteredCount,
      reviewCount,
      errors: { errorCountErr, masteredCountErr, reviewCountErr }
    });

    // 2. 获取已解锁的成就
    const { data: unlockedData } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user_id);

    const unlocked = unlockedData || [];
    const unlockedIds = new Set(unlocked.map((a: any) => a.achievement_id));

    // 3. 检查应该解锁的成就
    const achievementsToInsert: Array<{ user_id: string; achievement_id: string; progress: number; unlocked_at: string }> = [];
    const newlyUnlocked: string[] = [];
    let xpGained = 0;

    // 检查上传错题成就
    const uploadAchievements = ACHIEVEMENTS.filter(a =>
      ['first_error', 'error_collector_10', 'error_collector_50', 'error_collector_100'].includes(a.id)
    );

    console.log('[Achievements Sync] Upload achievements to check:', uploadAchievements.map(a => ({
      id: a.id,
      target: a.requirement?.target,
      hasRequirement: !!a.requirement
    })));

    for (const achievement of uploadAchievements) {
      console.log('[Achievements Sync] Checking:', achievement.id, {
        alreadyUnlocked: unlockedIds.has(achievement.id),
        requirement: achievement.requirement,
        errorCount
      });

      if (unlockedIds.has(achievement.id)) {
        console.log('[Achievements Sync] Already unlocked:', achievement.id);
        continue;
      }

      const target = achievement.requirement?.target;
      if (!target) {
        console.log('[Achievements Sync] No target for:', achievement.id);
        continue;
      }

      if ((errorCount || 0) >= target) {
        achievementsToInsert.push({
          user_id,
          achievement_id: achievement.id,
          progress: 100,
          unlocked_at: new Date().toISOString(),
        });
        newlyUnlocked.push(achievement.id);
        xpGained += achievement.points;
        console.log('[Achievements Sync] Unlocking:', achievement.id, 'count:', errorCount, 'target:', target);
      }
    }

    // 检查掌握错题成就
    const masteryAchievements = ACHIEVEMENTS.filter(a =>
      ['first_mastery', 'mastery_10', 'mastery_50', 'mastery_100'].includes(a.id)
    );

    for (const achievement of masteryAchievements) {
      if (unlockedIds.has(achievement.id)) continue;
      const target = achievement.requirement.target;
      if ((masteredCount || 0) >= target) {
        achievementsToInsert.push({
          user_id,
          achievement_id: achievement.id,
          progress: 100,
          unlocked_at: new Date().toISOString(),
        });
        newlyUnlocked.push(achievement.id);
        xpGained += achievement.points;
        console.log('[Achievements Sync] Unlocking:', achievement.id, 'count:', masteredCount, 'target:', target);
      }
    }

    // 检查复习成就
    const reviewAchievements = ACHIEVEMENTS.filter(a =>
      ['review_10', 'review_50'].includes(a.id)
    );

    for (const achievement of reviewAchievements) {
      if (unlockedIds.has(achievement.id)) continue;
      const target = achievement.requirement.target;
      if ((reviewCount || 0) >= target) {
        achievementsToInsert.push({
          user_id,
          achievement_id: achievement.id,
          progress: 100,
          unlocked_at: new Date().toISOString(),
        });
        newlyUnlocked.push(achievement.id);
        xpGained += achievement.points;
        console.log('[Achievements Sync] Unlocking:', achievement.id, 'count:', reviewCount, 'target:', target);
      }
    }

    // 4. 插入新成就
    if (achievementsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('user_achievements')
        .insert(achievementsToInsert);

      if (insertError) {
        console.error('[Achievements Sync] Insert error:', insertError);
        return NextResponse.json({ error: 'Failed to insert achievements', details: insertError }, { status: 500 });
      }
    }

    // 5. 更新 XP
    if (xpGained > 0) {
      const { data: levelData } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user_id)
        .single();

      const currentXp = levelData?.total_xp || 0;
      const newTotalXp = currentXp + xpGained;
      const newLevelConfig = getLevelFromXP(newTotalXp);

      await supabase
        .from('user_levels')
        .upsert({
          user_id,
          total_xp: newTotalXp,
          level: newLevelConfig.level,
          xp: newTotalXp - newLevelConfig.xp_required,
        });

      console.log('[Achievements Sync] XP updated:', currentXp, '->', newTotalXp);
    }

    return NextResponse.json({
      success: true,
      stats: {
        errorCount: errorCount || 0,
        masteredCount: masteredCount || 0,
        reviewCount: reviewCount || 0,
      },
      newlyUnlocked,
      xpGained,
    });
  } catch (error: any) {
    console.error('[Achievements Sync] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
