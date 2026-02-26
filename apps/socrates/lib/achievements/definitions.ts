// =====================================================
// Project Socrates - Achievement Definitions
// 成就定义配置
// =====================================================

import type { AchievementDefinition, LevelConfig } from './types';

// 所有成就定义
export const ACHIEVEMENTS: AchievementDefinition[] = [
  // ============ 学习成就 ============
  {
    id: 'first_error',
    type: 'learning',
    name: '初学者',
    description: '上传你的第一道错题',
    icon: '📚',
    rarity: 'common',
    points: 10,
    requirement: {
      type: 'count',
      target: 1,
      description: '上传 1 道错题',
    },
  },
  {
    id: 'error_collector_10',
    type: 'learning',
    name: '错题收集家',
    description: '累计上传 10 道错题',
    icon: '📖',
    rarity: 'common',
    points: 30,
    requirement: {
      type: 'count',
      target: 10,
      description: '上传 10 道错题',
    },
  },
  {
    id: 'error_collector_50',
    type: 'learning',
    name: '错题达人',
    description: '累计上传 50 道错题',
    icon: '📚',
    rarity: 'rare',
    points: 100,
    requirement: {
      type: 'count',
      target: 50,
      description: '上传 50 道错题',
    },
  },
  {
    id: 'error_collector_100',
    type: 'learning',
    name: '错题大师',
    description: '累计上传 100 道错题',
    icon: '🏆',
    rarity: 'epic',
    points: 300,
    requirement: {
      type: 'count',
      target: 100,
      description: '上传 100 道错题',
    },
  },

  // ============ 连续学习成就 ============
  {
    id: 'streak_3',
    type: 'streak',
    name: '起步者',
    description: '连续学习 3 天',
    icon: '🔥',
    rarity: 'common',
    points: 20,
    requirement: {
      type: 'streak',
      target: 3,
      description: '连续学习 3 天',
    },
  },
  {
    id: 'streak_7',
    type: 'streak',
    name: '坚持者',
    description: '连续学习 7 天',
    icon: '⚡',
    rarity: 'common',
    points: 50,
    requirement: {
      type: 'streak',
      target: 7,
      description: '连续学习 7 天',
    },
  },
  {
    id: 'streak_14',
    type: 'streak',
    name: '勤奋者',
    description: '连续学习 14 天',
    icon: '💪',
    rarity: 'rare',
    points: 100,
    requirement: {
      type: 'streak',
      target: 14,
      description: '连续学习 14 天',
    },
  },
  {
    id: 'streak_30',
    type: 'streak',
    name: '学霸养成',
    description: '连续学习 30 天',
    icon: '🌟',
    rarity: 'epic',
    points: 300,
    requirement: {
      type: 'streak',
      target: 30,
      description: '连续学习 30 天',
    },
  },
  {
    id: 'streak_100',
    type: 'streak',
    name: '学习传奇',
    description: '连续学习 100 天',
    icon: '👑',
    rarity: 'legendary',
    points: 1000,
    requirement: {
      type: 'streak',
      target: 100,
      description: '连续学习 100 天',
    },
  },

  // ============ 掌握成就 ============
  {
    id: 'first_mastery',
    type: 'mastery',
    name: '首次攻克',
    description: '掌握第一道错题',
    icon: '✅',
    rarity: 'common',
    points: 15,
    requirement: {
      type: 'count',
      target: 1,
      description: '掌握 1 道错题',
    },
  },
  {
    id: 'mastery_10',
    type: 'mastery',
    name: '攻克试炼',
    description: '掌握 10 道错题',
    icon: '🎯',
    rarity: 'common',
    points: 50,
    requirement: {
      type: 'count',
      target: 10,
      description: '掌握 10 道错题',
    },
  },
  {
    id: 'mastery_50',
    type: 'mastery',
    name: '攻克专家',
    description: '掌握 50 道错题',
    icon: '🎖️',
    rarity: 'rare',
    points: 150,
    requirement: {
      type: 'count',
      target: 50,
      description: '掌握 50 道错题',
    },
  },
  {
    id: 'mastery_100',
    type: 'mastery',
    name: '攻克大师',
    description: '掌握 100 道错题',
    icon: '🏅',
    rarity: 'epic',
    points: 500,
    requirement: {
      type: 'count',
      target: 100,
      description: '掌握 100 道错题',
    },
  },

  // ============ 复习成就 ============
  {
    id: 'review_10',
    type: 'learning',
    name: '复习新手',
    description: '完成 10 次复习',
    icon: '📝',
    rarity: 'common',
    points: 20,
    requirement: {
      type: 'count',
      target: 10,
      description: '完成 10 次复习',
    },
  },
  {
    id: 'review_50',
    type: 'learning',
    name: '复习达人',
    description: '完成 50 次复习',
    icon: '📋',
    rarity: 'rare',
    points: 100,
    requirement: {
      type: 'count',
      target: 50,
      description: '完成 50 次复习',
    },
  },

  // ============ 特殊成就 ============
  {
    id: 'early_bird',
    type: 'special',
    name: '早起鸟',
    description: '在早上 6-8 点完成学习',
    icon: '🌅',
    rarity: 'rare',
    points: 30,
    requirement: {
      type: 'special',
      target: 1,
      description: '早上学习 1 次',
    },
  },
  {
    id: 'night_owl',
    type: 'special',
    name: '夜猫子',
    description: '在晚上 22-24 点完成学习',
    icon: '🦉',
    rarity: 'rare',
    points: 30,
    requirement: {
      type: 'special',
      target: 1,
      description: '晚上学习 1 次',
    },
  },
  {
    id: 'weekend_warrior',
    type: 'special',
    name: '周末战士',
    description: '在周末坚持学习',
    icon: '⚔️',
    rarity: 'common',
    points: 20,
    requirement: {
      type: 'special',
      target: 1,
      description: '周末学习 1 次',
    },
  },
  {
    id: 'perfectionist',
    type: 'special',
    name: '完美主义者',
    description: '单次学习完成所有错题',
    icon: '💎',
    rarity: 'epic',
    points: 100,
    hidden: true,
    requirement: {
      type: 'special',
      target: 1,
      description: '一次清空待复习',
    },
  },
];

// 等级配置
export const LEVELS: LevelConfig[] = [
  { level: 1, xp_required: 0, title: '初学者' },
  { level: 2, xp_required: 50, title: '学徒' },
  { level: 3, xp_required: 150, title: '见习生' },
  { level: 4, xp_required: 300, title: '学习者' },
  { level: 5, xp_required: 500, title: '探索者' },
  { level: 6, xp_required: 800, title: '研究员' },
  { level: 7, xp_required: 1200, title: '学者' },
  { level: 8, xp_required: 1800, title: '专家' },
  { level: 9, xp_required: 2500, title: '大师' },
  { level: 10, xp_required: 3500, title: '宗师' },
  { level: 11, xp_required: 5000, title: '传奇' },
  { level: 12, xp_required: 7000, title: '圣者' },
  { level: 13, xp_required: 10000, title: '贤者' },
  { level: 14, xp_required: 15000, title: '智者' },
  { level: 15, xp_required: 25000, title: '哲学家' },
];

// 根据 XP 计算等级
export function getLevelFromXP(xp: number): LevelConfig {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp_required) {
      return LEVELS[i];
    }
  }
  return LEVELS[0];
}

// 获取下一等级所需 XP
export function getNextLevelXP(currentXP: number): { current: number; next: number; progress: number } {
  const currentLevel = getLevelFromXP(currentXP);
  const nextLevelIndex = currentLevel.level;
  const nextLevel = LEVELS[nextLevelIndex] || LEVELS[LEVELS.length - 1];

  const xpForCurrentLevel = currentLevel.xp_required;
  const xpForNextLevel = nextLevel.xp_required;
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;

  return {
    current: currentXP,
    next: xpForNextLevel,
    progress: Math.min(100, (xpInCurrentLevel / xpNeededForNext) * 100),
  };
}

// 稀有度配置
export const RARITY_CONFIG = {
  common: {
    label: '普通',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    borderColor: 'border-gray-300',
  },
  rare: {
    label: '稀有',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    borderColor: 'border-blue-400',
  },
  epic: {
    label: '史诗',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    borderColor: 'border-purple-400',
  },
  legendary: {
    label: '传说',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    borderColor: 'border-yellow-400',
  },
};
