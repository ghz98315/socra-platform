// =====================================================
// Project Socrates - Achievements API
// 成就系统 API 端点
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';

// 成就定义
import { ACHIEVEMENTS, LEVELS, getLevelFromXP, getNextLevelXP } from '@/lib/achievements/definitions';
import type { AchievementDefinition, UserAchievement, AchievementStats, UserLevel } from '@/lib/achievements/types';

// 模拟用户成就数据存储（实际应使用数据库）
const userAchievements: Map<string, UserAchievement[]> = new Map();
const userLevels: Map<string, UserLevel> = new Map();
const userStats: Map<string, AchievementStats> = new Map();

// GET - 获取用户成就信息
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 获取用户已解锁的成就
    const unlocked = userAchievements.get(user_id) || [];
    const unlockedIds = new Set(unlocked.map(a => a.achievement_id));

    // 获取用户等级
    let level = userLevels.get(user_id);
    if (!level) {
      level = {
        user_id,
        level: 1,
        xp: 0,
        total_xp: 0,
        title: '初学者',
      };
      userLevels.set(user_id, level);
    }

    // 获取统计信息
    let stats = userStats.get(user_id);
    if (!stats) {
      stats = {
        total_achievements: ACHIEVEMENTS.length,
        unlocked_achievements: unlocked.length,
        total_points: ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0),
        earned_points: unlocked.reduce((sum, a) => {
          const def = ACHIEVEMENTS.find(d => d.id === a.achievement_id);
          return sum + (def?.points || 0);
        }, 0),
        current_streak: 0,
        longest_streak: 0,
      };
      userStats.set(user_id, stats);
    }

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

    return NextResponse.json({
      data: {
        achievements,
        level: {
          ...level,
          ...getNextLevelXP(level.total_xp),
          config: getLevelFromXP(level.total_xp),
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

    let newlyUnlocked: AchievementDefinition[] = [];
    let xpGained = 0;

    // 根据动作类型处理
    switch (action) {
      case 'error_uploaded':
        newlyUnlocked = checkAchievements(user_id, 'error_count', data.count || 1);
        break;
      case 'error_mastered':
        newlyUnlocked = checkAchievements(user_id, 'mastery_count', data.count || 1);
        break;
      case 'review_completed':
        newlyUnlocked = checkAchievements(user_id, 'review_count', data.count || 1);
        break;
      case 'streak_updated':
        newlyUnlocked = checkAchievements(user_id, 'streak', data.streak || 1);
        updateStreak(user_id, data.streak);
        break;
      case 'special_event':
        newlyUnlocked = checkAchievements(user_id, data.event_type, 1);
        break;
    }

    // 计算获得的 XP
    xpGained = newlyUnlocked.reduce((sum, a) => sum + a.points, 0);

    // 更新用户等级
    if (xpGained > 0) {
      updateXP(user_id, xpGained);
    }

    return NextResponse.json({
      data: {
        unlocked: newlyUnlocked,
        xp_gained: xpGained,
        total_xp: userLevels.get(user_id)?.total_xp || 0,
      },
    });
  } catch (error: any) {
    console.error('Achievements POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 检查成就解锁
function checkAchievements(user_id: string, type: string, value: number): AchievementDefinition[] {
  const unlocked = userAchievements.get(user_id) || [];
  const unlockedIds = new Set(unlocked.map(a => a.achievement_id));
  const newlyUnlocked: AchievementDefinition[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.id)) continue;

    let shouldUnlock = false;

    switch (type) {
      case 'error_count':
        if (achievement.requirement.type === 'count' &&
            ['first_error', 'error_collector_10', 'error_collector_50', 'error_collector_100'].includes(achievement.id)) {
          shouldUnlock = value >= achievement.requirement.target;
        }
        break;
      case 'mastery_count':
        if (achievement.requirement.type === 'count' &&
            ['first_mastery', 'mastery_10', 'mastery_50', 'mastery_100'].includes(achievement.id)) {
          shouldUnlock = value >= achievement.requirement.target;
        }
        break;
      case 'review_count':
        if (achievement.requirement.type === 'count' &&
            ['review_10', 'review_50'].includes(achievement.id)) {
          shouldUnlock = value >= achievement.requirement.target;
        }
        break;
      case 'streak':
        if (achievement.requirement.type === 'streak') {
          shouldUnlock = value >= achievement.requirement.target;
        }
        break;
      case 'early_bird':
        if (achievement.id === 'early_bird') shouldUnlock = true;
        break;
      case 'night_owl':
        if (achievement.id === 'night_owl') shouldUnlock = true;
        break;
      case 'weekend_warrior':
        if (achievement.id === 'weekend_warrior') shouldUnlock = true;
        break;
    }

    if (shouldUnlock) {
      const newAchievement: UserAchievement = {
        id: `ua_${Date.now()}_${achievement.id}`,
        user_id,
        achievement_id: achievement.id,
        unlocked_at: new Date().toISOString(),
        progress: 100,
      };
      unlocked.push(newAchievement);
      newlyUnlocked.push(achievement);
    }
  }

  if (newlyUnlocked.length > 0) {
    userAchievements.set(user_id, unlocked);
    updateStats(user_id);
  }

  return newlyUnlocked;
}

// 更新用户 XP
function updateXP(user_id: string, xp: number) {
  let level = userLevels.get(user_id);
  if (!level) {
    level = {
      user_id,
      level: 1,
      xp: 0,
      total_xp: 0,
      title: '初学者',
    };
  }

  level.total_xp += xp;
  const newLevelConfig = getLevelFromXP(level.total_xp);
  level.level = newLevelConfig.level;
  level.title = newLevelConfig.title;
  level.xp = level.total_xp - newLevelConfig.xp_required;

  userLevels.set(user_id, level);
}

// 更新连续学习天数
function updateStreak(user_id: string, streak: number) {
  let stats = userStats.get(user_id);
  if (!stats) {
    stats = {
      total_achievements: ACHIEVEMENTS.length,
      unlocked_achievements: 0,
      total_points: ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0),
      earned_points: 0,
      current_streak: 0,
      longest_streak: 0,
    };
  }

  stats.current_streak = streak;
  stats.longest_streak = Math.max(stats.longest_streak, streak);
  userStats.set(user_id, stats);
}

// 更新统计信息
function updateStats(user_id: string) {
  const unlocked = userAchievements.get(user_id) || [];
  let stats = userStats.get(user_id);

  if (!stats) {
    stats = {
      total_achievements: ACHIEVEMENTS.length,
      unlocked_achievements: 0,
      total_points: ACHIEVEMENTS.reduce((sum, a) => sum + a.points, 0),
      earned_points: 0,
      current_streak: 0,
      longest_streak: 0,
    };
  }

  stats.unlocked_achievements = unlocked.length;
  stats.earned_points = unlocked.reduce((sum, a) => {
    const def = ACHIEVEMENTS.find(d => d.id === a.achievement_id);
    return sum + (def?.points || 0);
  }, 0);

  userStats.set(user_id, stats);
}
