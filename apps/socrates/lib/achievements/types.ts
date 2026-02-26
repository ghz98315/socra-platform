// =====================================================
// Project Socrates - Achievement System Types
// 学习成就系统类型定义
// =====================================================

// 成就类型
export type AchievementType =
  | 'learning'      // 学习相关
  | 'streak'        // 连续学习
  | 'mastery'       // 掌握相关
  | 'social'        // 社交相关
  | 'special';      // 特殊成就

// 成就定义
export interface AchievementDefinition {
  id: string;
  type: AchievementType;
  name: string;
  description: string;
  icon: string;           // emoji 或图标名
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;         // 获得积分
  requirement: {
    type: 'count' | 'streak' | 'time' | 'special';
    target: number;
    description: string;
  };
  hidden?: boolean;       // 是否隐藏（解锁前不显示）
}

// 用户成就记录
export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  progress?: number;      // 进度（用于显示）
}

// 用户等级信息
export interface UserLevel {
  user_id: string;
  level: number;
  xp: number;             // 当前经验值
  total_xp: number;       // 总经验值
  title: string;          // 等级称号
}

// 等级配置
export interface LevelConfig {
  level: number;
  xp_required: number;
  title: string;
  rewards?: string[];
}

// 成就统计
export interface AchievementStats {
  total_achievements: number;
  unlocked_achievements: number;
  total_points: number;
  earned_points: number;
  current_streak: number;
  longest_streak: number;
}

// 成就通知
export interface AchievementNotification {
  achievement: AchievementDefinition;
  unlockedAt: string;
  isNew: boolean;
}
