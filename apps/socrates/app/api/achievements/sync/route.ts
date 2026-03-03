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

    // 2.5 清理无效的成就记录（achievement_id 不在定义中）和重复记录
    const validAchievementIds = new Set(ACHIEVEMENTS.map(a => a.id));
    const invalidRecords = unlocked.filter((a: any) => !validAchievementIds.has(a.achievement_id));

    if (invalidRecords.length > 0) {
      console.log('[Achievements Sync] Cleaning up invalid records:', invalidRecords.map((a: any) => a.achievement_id));
      const invalidIds = invalidRecords.map((a: any) => a.id);
      await supabase
        .from('user_achievements')
        .delete()
        .in('id', invalidIds);
    }

    // 检查重复记录（同一 achievement_id 有多条记录）
    const achievementCounts = new Map<string, number>();
    for (const a of unlocked) {
      const count = achievementCounts.get(a.achievement_id) || 0;
      achievementCounts.set(a.achievement_id, count + 1);
    }

    for (const [achievementId, count] of achievementCounts) {
      if (count > 1 && validAchievementIds.has(achievementId)) {
        // 保留最早的一条，删除其他的
        const duplicateRecords = unlocked
          .filter((a: any) => a.achievement_id === achievementId)
          .sort((a: any, b: any) => new Date(a.unlocked_at).getTime() - new Date(b.unlocked_at).getTime());

        const toDelete = duplicateRecords.slice(1).map((a: any) => a.id);
        if (toDelete.length > 0) {
          console.log('[Achievements Sync] Removing duplicates for:', achievementId, 'count:', toDelete.length);
          await supabase
            .from('user_achievements')
            .delete()
            .in('id', toDelete);
        }
      }
    }

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

    // 5. 重新计算总 XP（基于所有有效成就，而不仅仅是新解锁的）
    // 获取更新后的所有成就
    const { data: allUnlockedData } = await supabase
      .from('user_achievements')
      .select('achievement_id')
      .eq('user_id', user_id);

    const allUnlocked = allUnlockedData || [];

    // 计算正确的总 XP（复用前面定义的 validAchievementIds）
    const calculatedTotalXp = allUnlocked.reduce((sum: number, a: any) => {
      if (validAchievementIds.has(a.achievement_id)) {
        const def = ACHIEVEMENTS.find(d => d.id === a.achievement_id);
        return sum + (def?.points || 0);
      }
      return sum;
    }, 0);

    console.log('[Achievements Sync] Calculated total XP:', calculatedTotalXp);

    // 获取当前等级数据
    const { data: levelData } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', user_id)
      .single();

    const currentXp = levelData?.total_xp || 0;
    const newLevelConfig = getLevelFromXP(calculatedTotalXp);

    // 更新 XP（使用计算出的正确值）
    await supabase
      .from('user_levels')
      .upsert({
        user_id,
        total_xp: calculatedTotalXp,
        level: newLevelConfig.level,
        xp: calculatedTotalXp - newLevelConfig.xp_required,
        current_streak: levelData?.current_streak || 0,
        longest_streak: levelData?.longest_streak || 0,
      }, { onConflict: 'user_id' });

    console.log('[Achievements Sync] XP updated:', currentXp, '->', calculatedTotalXp);

    // 计算实际获得的 XP（可能与之前存储的不同）
    const actualXpGained = calculatedTotalXp - currentXp;

    return NextResponse.json({
      success: true,
      stats: {
        errorCount: errorCount || 0,
        masteredCount: masteredCount || 0,
        reviewCount: reviewCount || 0,
      },
      newlyUnlocked,
      xpGained: actualXpGained,
      totalXp: calculatedTotalXp,
      previousXp: currentXp,
    });
  } catch (error: any) {
    console.error('[Achievements Sync] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
