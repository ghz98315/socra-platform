// =====================================================
// Project Socrates - Achievements API
// 成就系统 API 端点（数据库持久化版本）
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 成就定义
import { ACHIEVEMENTS, LEVELS, getLevelFromXP, getNextLevelXP } from '@/lib/achievements/definitions';
import type { AchievementDefinition, UserAchievement, AchievementStats, UserLevel } from '@/lib/achievements/types';

// 创建 Supabase 客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 获取用户成就信息
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 获取用户已解锁的成就
    const { data: unlockedData, error: unlockedError } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user_id);

    if (unlockedError) {
      console.error('Error fetching achievements:', unlockedError);
    }

    const unlocked = (unlockedData || []) as UserAchievement[];
    const unlockedIds = new Set(unlocked.map(a => a.achievement_id));

    // 获取用户等级
    const { data: levelData, error: levelError } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', user_id)
      .single();

    let level = levelData as UserLevel | null;
    if (!level || levelError) {
      // 创建默认等级记录
      const { data: newLevel, error: createError } = await supabase
        .from('user_levels')
        .insert({
          user_id,
          level: 1,
          xp: 0,
          total_xp: 0,
          current_streak: 0,
          longest_streak: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating level:', createError);
        level = {
          user_id,
          level: 1,
          xp: 0,
          total_xp: 0,
          current_streak: 0,
          longest_streak: 0,
        } as UserLevel;
      } else {
        level = newLevel as UserLevel;
      }
    }

    // 计算统计信息
    const stats: AchievementStats = {
      total_achievements: ACHIEVEMENTS.length,
      unlocked_achievements: unlocked.length,
      total_points: ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0),
      earned_points: unlocked.reduce((sum, a) => {
        const def = ACHIEVEMENTS.find(d => d.id === a.achievement_id);
        return sum + (def?.points || 0);
      }, 0),
      current_streak: level?.current_streak || 0,
      longest_streak: level?.longest_streak || 0,
    };

    // 构建成就列表（包含进度）
    const achievements = ACHIEVEMENTS.map(def => {
      const unlockedRecord = unlocked.find(a => a.achievement_id === def.id);
      return {
        ...def,
        unlocked: !!unlockedRecord,
        unlocked_at: unlockedRecord?.unlocked_at || null,
        progress: unlockedRecord?.progress || 0,
      };
    });

    const levelConfig = getLevelFromXP(level?.total_xp || 0);
    const nextLevel = getNextLevelXP(level?.total_xp || 0);

    return NextResponse.json({
      data: {
        achievements,
        level: {
          ...level,
          level: levelConfig.level,
          title: levelConfig.title,
          current: nextLevel.current,
          next: nextLevel.next,
          progress: nextLevel.progress,
        },
        stats,
      },
    });
  } catch (error: any) {
    console.error('Achievements GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 解锁成就 / 更新进度
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, action, data } = body;

    if (!user_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 获取用户当前等级
    const { data: levelData } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', user_id)
      .single();

    const currentLevel = levelData as UserLevel | null;

    // 获取已解锁成就
    const { data: unlockedData } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user_id);

    const unlocked = (unlockedData || []) as UserAchievement[];
    const unlockedIds = new Set(unlocked.map(a => a.achievement_id));

    // 从数据库获取实际统计数据（而不是依赖传递的 count）
    const actualStats = await getActualStats(user_id, action);
    console.log('[Achievements] Actual stats from database:', actualStats);

    let newlyUnlocked: AchievementDefinition[] = [];
    let xpGained = 0;

    // 根据动作类型检查成就
    const achievementsToCheck = getAchievementsForAction(action, data);
    const achievementsToInsert: Array<{ user_id: string; achievement_id: string; progress: number }> = [];

    for (const achievement of achievementsToCheck) {
      if (unlockedIds.has(achievement.id)) continue;

      // 使用数据库查询的实际数据来检查
      if (shouldUnlockAchievement(achievement, action, actualStats)) {
        achievementsToInsert.push({
          user_id,
          achievement_id: achievement.id,
          progress: 100,
        });
        newlyUnlocked.push(achievement);
        xpGained += achievement.points;
        console.log('[Achievements] Unlocked:', achievement.id, achievement.name);
      }
    }

    // 批量插入新解锁的成就
    if (achievementsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('user_achievements')
        .insert(achievementsToInsert);

      if (insertError) {
        console.error('Error inserting achievements:', insertError);
      }
    }

    // 更新 XP 和连续学习
    if (xpGained > 0 || action === 'streak_updated') {
      const newTotalXp = (currentLevel?.total_xp || 0) + xpGained;
      const newLevelConfig = getLevelFromXP(newTotalXp);

      const updateData: Record<string, number | string> = {
        total_xp: newTotalXp,
        level: newLevelConfig.level,
        xp: newTotalXp - newLevelConfig.xp_required,
      };

      if (action === 'streak_updated' && actualStats.streak) {
        updateData.current_streak = actualStats.streak;
        updateData.longest_streak = Math.max(currentLevel?.longest_streak || 0, actualStats.streak);
        updateData.last_activity_date = new Date().toISOString().split('T')[0];
      }

      await supabase
        .from('user_levels')
        .upsert({
          user_id,
          ...updateData,
        });
    }

    return NextResponse.json({
      data: {
        unlocked: newlyUnlocked,
        xp_gained: xpGained,
        total_xp: (currentLevel?.total_xp || 0) + xpGained,
      },
    });
  } catch (error: any) {
    console.error('Achievements POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 从数据库获取实际统计数据
async function getActualStats(userId: string, action: string): Promise<{ count?: number; streak?: number }> {
  try {
    switch (action) {
      case 'error_uploaded': {
        // 查询实际的错题数量
        const { count, error } = await supabase
          .from('error_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userId);
        if (error) console.error('[Achievements] Error counting errors:', error);
        return { count: count || 0 };
      }

      case 'error_mastered': {
        // 查询实际掌握的错题数量
        const { count, error } = await supabase
          .from('error_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userId)
          .eq('status', 'mastered');
        if (error) console.error('[Achievements] Error counting mastered:', error);
        return { count: count || 0 };
      }

      case 'review_completed': {
        // 查询实际完成的复习次数
        const { count, error } = await supabase
          .from('review_schedule')
          .select('*', { count: 'exact', head: true })
          .eq('student_id', userId)
          .eq('is_completed', true);
        if (error) console.error('[Achievements] Error counting reviews:', error);
        return { count: count || 0 };
      }

      case 'streak_updated': {
        // 从 user_levels 获取连续学习天数
        const { data, error } = await supabase
          .from('user_levels')
          .select('current_streak')
          .eq('user_id', userId)
          .single();
        if (error) console.error('[Achievements] Error getting streak:', error);
        return { streak: data?.current_streak || 0 };
      }

      default:
        return {};
    }
  } catch (error) {
    console.error('[Achievements] Error getting actual stats:', error);
    return {};
  }
}

// 获取与动作相关的成就
function getAchievementsForAction(action: string, data: any): AchievementDefinition[] {
  switch (action) {
    case 'error_uploaded':
      return ACHIEVEMENTS.filter(a =>
        ['first_error', 'error_collector_10', 'error_collector_50', 'error_collector_100'].includes(a.id)
      );
    case 'error_mastered':
      return ACHIEVEMENTS.filter(a =>
        ['first_mastery', 'mastery_10', 'mastery_50', 'mastery_100'].includes(a.id)
      );
    case 'review_completed':
      return ACHIEVEMENTS.filter(a =>
        ['review_10', 'review_50'].includes(a.id)
      );
    case 'streak_updated':
      return ACHIEVEMENTS.filter(a => a.requirement.type === 'streak');
    case 'special_event':
      return ACHIEVEMENTS.filter(a => a.id === data?.event_type);
    default:
      return [];
  }
}

// 检查是否应该解锁成就（使用数据库查询的实际数据）
function shouldUnlockAchievement(achievement: AchievementDefinition, action: string, stats: { count?: number; streak?: number }): boolean {
  if (achievement.requirement.type === 'count') {
    const count = stats?.count || 0;
    const result = count >= achievement.requirement.target;
    console.log(`[Achievements] Checking ${achievement.id}: count=${count}, target=${achievement.requirement.target}, result=${result}`);
    return result;
  }
  if (achievement.requirement.type === 'streak') {
    const streak = stats?.streak || 0;
    const result = streak >= achievement.requirement.target;
    console.log(`[Achievements] Checking ${achievement.id}: streak=${streak}, target=${achievement.requirement.target}, result=${result}`);
    return result;
  }
  return false;
}
