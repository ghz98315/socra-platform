// =====================================================
// Project Socrates - Achievement Triggers
// 成就触发工具函数
// =====================================================

import type { AchievementDefinition } from './types';

interface TriggerResult {
  unlocked: AchievementDefinition[];
  xp_gained: number;
}

/**
 * 触发成就检查
 */
export async function triggerAchievement(
  userId: string,
  action: 'error_uploaded' | 'error_mastered' | 'review_completed' | 'streak_updated' | 'special_event',
  data?: Record<string, any>
): Promise<TriggerResult> {
  try {
    const response = await fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: userId,
        action,
        data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to trigger achievement');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Achievement trigger error:', error);
    return { unlocked: [], xp_gained: 0 };
  }
}

/**
 * 错题上传触发
 */
export async function onErrorUploaded(userId: string, totalCount: number): Promise<TriggerResult> {
  return triggerAchievement(userId, 'error_uploaded', { count: totalCount });
}

/**
 * 错题掌握触发
 */
export async function onErrorMastered(userId: string, totalCount: number): Promise<TriggerResult> {
  return triggerAchievement(userId, 'error_mastered', { count: totalCount });
}

/**
 * 复习完成触发
 */
export async function onReviewCompleted(userId: string, totalCount: number): Promise<TriggerResult> {
  return triggerAchievement(userId, 'review_completed', { count: totalCount });
}

/**
 * 连续学习更新触发
 */
export async function onStreakUpdated(userId: string, streak: number): Promise<TriggerResult> {
  return triggerAchievement(userId, 'streak_updated', { streak });
}

/**
 * 特殊事件触发
 */
export async function onSpecialEvent(
  userId: string,
  eventType: 'early_bird' | 'night_owl' | 'weekend_warrior' | 'perfectionist'
): Promise<TriggerResult> {
  return triggerAchievement(userId, 'special_event', { event_type: eventType });
}

/**
 * 检查是否应该触发特殊成就
 */
export function checkSpecialAchievements(): string[] {
  const events: string[] = [];
  const now = new Date();
  const hour = now.getHours();
  const dayOfWeek = now.getDay();

  // 早起鸟 (6-8点)
  if (hour >= 6 && hour < 8) {
    events.push('early_bird');
  }

  // 夜猫子 (22-24点)
  if (hour >= 22 && hour < 24) {
    events.push('night_owl');
  }

  // 周末战士
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    events.push('weekend_warrior');
  }

  return events;
}

/**
 * 显示成就解锁通知
 */
export function showAchievementNotification(achievements: AchievementDefinition[]) {
  if (typeof window === 'undefined' || achievements.length === 0) return;

  // 使用浏览器的 Notification API
  if ('Notification' in window && Notification.permission === 'granted') {
    achievements.forEach((achievement, index) => {
      setTimeout(() => {
        new Notification('成就解锁！', {
          body: `${achievement.icon} ${achievement.name} - ${achievement.description}`,
          icon: '/favicon.ico',
        });
      }, index * 1000);
    });
  }
}

/**
 * 请求通知权限
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}
