// =====================================================
// Project Socrates - Notification Utilities
// 通知触发工具函数
// =====================================================

import type { NotificationType } from '@/app/api/notifications/route';

interface CreateNotificationParams {
  parentId: string;
  studentId: string;
  studentName?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
}

/**
 * 创建通知
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return false;
  }
}

/**
 * 学习完成通知
 */
export async function notifyStudyComplete(params: {
  parentId: string;
  studentId: string;
  studentName: string;
  subject: string;
  duration: number; // 分钟
}): Promise<boolean> {
  const subjectLabels: Record<string, string> = {
    math: '数学',
    physics: '物理',
    chemistry: '化学',
  };

  return createNotification({
    parentId: params.parentId,
    studentId: params.studentId,
    studentName: params.studentName,
    type: 'study_complete',
    title: '学习完成',
    message: `${params.studentName}刚刚完成了一道${subjectLabels[params.subject] || params.subject}错题的学习，用时${params.duration}分钟`,
    data: {
      subject: params.subject,
      duration: params.duration,
    },
  });
}

/**
 * 复习提醒通知
 */
export async function notifyReviewReminder(params: {
  parentId: string;
  studentId: string;
  studentName: string;
  count: number;
}): Promise<boolean> {
  return createNotification({
    parentId: params.parentId,
    studentId: params.studentId,
    studentName: params.studentName,
    type: 'review_reminder',
    title: '复习提醒',
    message: `${params.studentName}有${params.count}道错题需要复习`,
    data: {
      count: params.count,
    },
  });
}

/**
 * 成就达成通知
 */
export async function notifyAchievement(params: {
  parentId: string;
  studentId: string;
  studentName: string;
  achievement: string;
  streak?: number;
}): Promise<boolean> {
  return createNotification({
    parentId: params.parentId,
    studentId: params.studentId,
    studentName: params.studentName,
    type: 'achievement',
    title: '成就达成',
    message: params.streak
      ? `${params.studentName}已连续学习${params.streak}天！`
      : `${params.studentName}达成了"${params.achievement}"成就！`,
    data: {
      achievement: params.achievement,
      streak: params.streak,
    },
  });
}

/**
 * 掌握度更新通知
 */
export async function notifyMasteryUpdate(params: {
  parentId: string;
  studentId: string;
  studentName: string;
  concept: string;
}): Promise<boolean> {
  return createNotification({
    parentId: params.parentId,
    studentId: params.studentId,
    studentName: params.studentName,
    type: 'mastery_update',
    title: '掌握度提升',
    message: `${params.studentName}已掌握"${params.concept}"知识点`,
    data: {
      concept: params.concept,
    },
  });
}

/**
 * 新错题上传通知
 */
export async function notifyNewError(params: {
  parentId: string;
  studentId: string;
  studentName: string;
  subject: string;
}): Promise<boolean> {
  const subjectLabels: Record<string, string> = {
    math: '数学',
    physics: '物理',
    chemistry: '化学',
  };

  return createNotification({
    parentId: params.parentId,
    studentId: params.studentId,
    studentName: params.studentName,
    type: 'new_error',
    title: '新错题',
    message: `${params.studentName}上传了一道新的${subjectLabels[params.subject] || params.subject}错题`,
    data: {
      subject: params.subject,
    },
  });
}
