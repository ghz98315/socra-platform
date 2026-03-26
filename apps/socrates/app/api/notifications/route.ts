// =====================================================
// Project Socrates - Notifications API
// 通知系统 API (完整版)
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 通知类型
export type NotificationType =
  | 'review'           // 复习提醒
  | 'review_reminder'  // 复习提醒（家长端）
  | 'task'             // 任务提醒
  | 'task_completed'   // 任务完成
  | 'study_complete'   // 学习完成（家长端）
  | 'achievement'      // 成就达成
  | 'mastery_update'   // 掌握度提升
  | 'new_error'        // 新错题上传
  | 'points'           // 积分奖励
  | 'conversation_risk' // 对话风险信号
  | 'streak'           // 连续学习
  | 'subscription'     // 订阅相关
  | 'system';          // 系统通知

// 通知接口
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string | null;
  data: Record<string, any> | null;
  action_url: string | null;
  action_text: string | null;
  is_read: boolean;
  read_at: string | null;
  priority: number;
  expires_at: string | null;
  created_at: string;
}

type TaskCompletionRow = {
  notes: string | null;
  completed_at: string | null;
  updated_at: string | null;
};

type ParentTaskRow = {
  id: string;
  description: string | null;
  title?: string | null;
  status: string | null;
  completed_at: string | null;
  updated_at: string | null;
  task_completions: TaskCompletionRow[] | null;
};

type ReviewAttemptRow = {
  session_id: string;
  mastery_judgement: string;
  created_at: string;
};

const REVIEW_RISK_JUDGEMENTS = new Set([
  'not_mastered',
  'assisted_correct',
  'explanation_gap',
  'pseudo_mastery',
]);

function parseConversationTaskMarkers(description: string | null | undefined) {
  const content = description || '';
  const sessionMatch = content.match(/\[conversation-session:([^\]]+)\]/);
  const categoryMatch = content.match(/\[conversation-risk:([^\]]+)\]/);

  if (!sessionMatch || !categoryMatch) {
    return null;
  }

  return {
    session_id: sessionMatch[1],
    risk_category: categoryMatch[1],
  };
}

function getTaskCompletion(task: ParentTaskRow) {
  if (!Array.isArray(task.task_completions) || task.task_completions.length === 0) {
    return null;
  }

  return task.task_completions[0] ?? null;
}

function buildConversationTaskKey(sessionId: string, category: string) {
  return `${sessionId}:${category}`;
}

// GET - 获取通知列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type');
    const isRead = searchParams.get('is_read');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 先尝试获取通知，如果表不存在则返回空数据
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('priority', { ascending: false })
      .range(offset, offset + limit - 1);

    // 筛选条件
    if (type) {
      query = query.eq('type', type);
    }
    if (isRead !== null && isRead !== 'all') {
      query = query.eq('is_read', isRead === 'true');
    }

    const { data: notifications, error, count } = await query;
    const rawNotifications = (notifications || []) as Notification[];
    let enrichedNotifications = rawNotifications;

    // 如果表不存在或其他错误，返回空数据而不是500错误
    if (error) {
      console.error('[Notifications API] GET error:', error);
      // 返回空数据，让前端正常工作
      return NextResponse.json({
        data: [],
        total: 0,
        unread_count: 0,
      });
    }

    // 获取未读数量
    const conversationRiskNotifications = rawNotifications.filter(
      (item) => item.type === 'conversation_risk' && item.data?.session_id && item.data?.risk_category,
    );

    if (conversationRiskNotifications.length > 0) {
      const { data: interventionTasks, error: interventionTasksError } = await supabase
        .from('parent_tasks')
        .select(
          `
            id,
            description,
            status,
            completed_at,
            updated_at,
            task_completions (
              notes,
              completed_at,
              updated_at
            )
          `,
        )
        .eq('parent_id', userId)
        .eq('task_type', 'conversation_intervention')
        .order('created_at', { ascending: false });

      if (interventionTasksError) {
        console.error(
          '[Notifications API] Failed to enrich conversation risk notifications:',
          interventionTasksError,
        );
      } else {
        const taskMap = new Map<string, ParentTaskRow>();

        for (const task of (interventionTasks || []) as ParentTaskRow[]) {
          const markers = parseConversationTaskMarkers(task.description);
          if (!markers) {
            continue;
          }

          const key = buildConversationTaskKey(markers.session_id, markers.risk_category);
          if (!taskMap.has(key)) {
            taskMap.set(key, task);
          }
        }

        enrichedNotifications = rawNotifications.map((notification) => {
          if (notification.type !== 'conversation_risk' || !notification.data) {
            return notification;
          }

          const sessionId = String(notification.data.session_id || '');
          const riskCategory = String(notification.data.risk_category || '');
          if (!sessionId || !riskCategory) {
            return notification;
          }

          const matchedTask = taskMap.get(buildConversationTaskKey(sessionId, riskCategory));
          if (!matchedTask) {
            return notification;
          }

          const completion = getTaskCompletion(matchedTask);
          const interventionCompletedAt = completion?.completed_at ?? matchedTask.completed_at ?? null;
          const postInterventionRepeatCount =
            interventionCompletedAt &&
            new Date(notification.created_at).getTime() > new Date(interventionCompletedAt).getTime()
              ? 1
              : 0;
          const interventionEffect =
            (matchedTask.status ?? 'pending') === 'completed'
              ? postInterventionRepeatCount > 0
                ? 'risk_persisting'
                : 'risk_lowered'
              : 'pending';

          return {
            ...notification,
            data: {
              ...notification.data,
              intervention_task_id: matchedTask.id,
              intervention_status: matchedTask.status ?? 'pending',
              intervention_feedback_note: completion?.notes ?? null,
              intervention_completed_at: interventionCompletedAt,
              intervention_effect: interventionEffect,
              post_intervention_repeat_count: postInterventionRepeatCount,
            },
          };
        });
      }
    }

    const masteryRiskNotifications = enrichedNotifications.filter(
      (item) =>
        item.type === 'mastery_update' &&
        item.data?.risk_type === 'mastery_risk' &&
        item.data?.intervention_task_id,
    );

    if (masteryRiskNotifications.length > 0) {
      const reviewTaskIds = Array.from(
        new Set(
          masteryRiskNotifications
            .map((item) => String(item.data?.intervention_task_id || ''))
            .filter(Boolean),
        ),
      );
      const reviewSessionIds = Array.from(
        new Set(
          masteryRiskNotifications
            .map((item) => String(item.data?.session_id || ''))
            .filter(Boolean),
        ),
      );

      const { data: reviewInterventionTasks, error: reviewInterventionTasksError } = await supabase
        .from('parent_tasks')
        .select(
          `
            id,
            title,
            status,
            completed_at,
            updated_at,
            task_completions (
              notes,
              completed_at,
              updated_at
            )
          `,
        )
        .eq('parent_id', userId)
        .eq('task_type', 'review_intervention')
        .in('id', reviewTaskIds);
      const { data: reviewAttempts, error: reviewAttemptsError } =
        reviewSessionIds.length > 0
          ? await supabase
              .from('review_attempts')
              .select('session_id, mastery_judgement, created_at')
              .in('session_id', reviewSessionIds)
              .order('created_at', { ascending: false })
          : { data: [], error: null };

      if (reviewInterventionTasksError) {
        console.error(
          '[Notifications API] Failed to enrich mastery risk notifications:',
          reviewInterventionTasksError,
        );
      } else if (reviewAttemptsError) {
        console.error(
          '[Notifications API] Failed to load review attempts for mastery risk notifications:',
          reviewAttemptsError,
        );
      } else {
        const taskMap = new Map<string, ParentTaskRow>();
        for (const task of (reviewInterventionTasks || []) as ParentTaskRow[]) {
          taskMap.set(task.id, task);
        }
        const attemptsBySession = new Map<string, ReviewAttemptRow[]>();
        for (const attempt of (reviewAttempts || []) as ReviewAttemptRow[]) {
          const current = attemptsBySession.get(attempt.session_id) ?? [];
          current.push(attempt);
          attemptsBySession.set(attempt.session_id, current);
        }

        enrichedNotifications = enrichedNotifications.map((notification) => {
          if (
            notification.type !== 'mastery_update' ||
            notification.data?.risk_type !== 'mastery_risk' ||
            !notification.data?.intervention_task_id
          ) {
            return notification;
          }

          const taskId = String(notification.data.intervention_task_id);
          const matchedTask = taskMap.get(taskId);
          if (!matchedTask) {
            return notification;
          }

          const completion = getTaskCompletion(matchedTask);
          const interventionCompletedAt = completion?.completed_at ?? matchedTask.completed_at ?? null;
          const notificationJudgement = String(notification.data.mastery_judgement || '');
          const sessionId = String(notification.data.session_id || '');
          const followupAttempts = interventionCompletedAt
            ? (attemptsBySession.get(sessionId) ?? []).filter(
                (attempt) => new Date(attempt.created_at).getTime() > new Date(interventionCompletedAt).getTime(),
              )
            : [];
          const postInterventionRepeatCount = followupAttempts.filter(
            (attempt) => attempt.mastery_judgement === notificationJudgement,
          ).length;
          const hasSafeFollowup = followupAttempts.some(
            (attempt) => !REVIEW_RISK_JUDGEMENTS.has(attempt.mastery_judgement),
          );
          const interventionEffect =
            (matchedTask.status ?? 'pending') === 'completed'
              ? postInterventionRepeatCount > 0
                ? 'risk_persisting'
                : hasSafeFollowup
                  ? 'risk_lowered'
                  : 'pending'
              : 'pending';

          return {
            ...notification,
            data: {
              ...notification.data,
              intervention_task_title: matchedTask.title ?? null,
              intervention_status: matchedTask.status ?? 'pending',
              intervention_feedback_note: completion?.notes ?? null,
              intervention_completed_at: interventionCompletedAt,
              intervention_effect: interventionEffect,
              post_intervention_repeat_count: postInterventionRepeatCount,
            },
          };
        });
      }
    }

    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    return NextResponse.json({
      data: enrichedNotifications,
      total: count || 0,
      unread_count: unreadCount || 0,
    });
  } catch (error: any) {
    console.error('[Notifications API] GET error:', error);
    // 返回空数据而不是500错误
    return NextResponse.json({
      data: [],
      total: 0,
      unread_count: 0,
    });
  }
}

// POST - 创建通知
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      type,
      title,
      content,
      data,
      action_url,
      action_text,
      priority,
      expires_at,
    } = body;

    if (!user_id || !type || !title) {
      return NextResponse.json(
        { error: 'user_id, type, and title are required' },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        content: content || null,
        data: data || null,
        action_url: action_url || null,
        action_text: action_text || null,
        priority: priority || 0,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: notification,
      message: '通知创建成功',
    });
  } catch (error: any) {
    console.error('[Notifications API] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - 标记通知为已读
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, notification_ids, mark_all_read } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    let markedCount = 0;

    if (mark_all_read) {
      // 标记所有为已读
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user_id)
        .eq('is_read', false)
        .select('id');

      if (error) throw error;
      markedCount = data?.length || 0;
    } else if (notification_ids && notification_ids.length > 0) {
      // 标记指定通知为已读
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user_id)
        .in('id', notification_ids)
        .eq('is_read', false)
        .select('id');

      if (error) throw error;
      markedCount = data?.length || 0;
    } else {
      return NextResponse.json(
        { error: 'Either notification_ids or mark_all_read is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `已标记 ${markedCount} 条通知为已读`,
      marked_count: markedCount,
    });
  } catch (error: any) {
    console.error('[Notifications API] PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - 删除通知
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('user_id');
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';
    const deleteRead = searchParams.get('read') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (deleteAll) {
      // 删除所有通知
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return NextResponse.json({ message: '所有通知已删除' });
    }

    if (deleteRead) {
      // 删除已读通知
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true);

      if (error) throw error;

      return NextResponse.json({ message: '已读通知已删除' });
    }

    if (notificationId) {
      // 删除指定通知
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      return NextResponse.json({ message: '通知已删除' });
    }

    return NextResponse.json(
      { error: 'Either id, all=true, or read=true is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Notifications API] DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
