'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Award,
  Bell,
  BellOff,
  BookOpen,
  Calendar,
  Check,
  CheckCheck,
  Loader2,
  Trash2,
  TrendingUp,
} from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  formatConversationInterventionStatus,
  formatMasteryInterventionStatus,
} from '@/lib/notifications/intervention-status';
import { cn } from '@/lib/utils';

interface NotificationItem {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string | null;
  data: Record<string, unknown> | null;
  action_url: string | null;
  action_text: string | null;
  is_read: boolean;
  created_at: string;
}

type ConversationRiskData = {
  intervention_status?: string | null;
  intervention_effect?: 'pending' | 'risk_lowered' | 'risk_persisting' | null;
};

type MasteryRiskData = {
  risk_type?: 'mastery_risk' | 'transfer_evidence_gap' | string;
  intervention_status?: string | null;
  intervention_effect?: 'pending' | 'risk_lowered' | 'risk_persisting' | null;
  intervention_task_title?: string | null;
  intervention_feedback_note?: string | null;
};

type ParentSignalData = {
  guardian_signal_label?: string | null;
  top_blocker_label?: string | null;
  stuck_stage_label?: string | null;
  daily_checkin_status_label?: string | null;
};

type ParentInsightSummary = {
  selected_student: {
    id: string;
    display_name: string | null;
  } | null;
  guardian_signal: {
    level: 'green' | 'yellow' | 'red';
    label: string;
    reason: string;
  };
  daily_checkin_status: {
    status: 'completed' | 'stuck' | 'unfinished';
    status_label: string;
    guardian_signal_label: string | null;
    top_blocker_label: string | null;
    stuck_stage_label: string | null;
    suggested_parent_prompt: string | null;
    status_summary: string;
  } | null;
  suggested_parent_prompt: string;
  top_blocker: {
    label: string | null;
    count: number;
    root_cause_summary: string | null;
    child_poka_yoke_action: string | null;
    suggested_guardian_action: string | null;
    false_error_gate: boolean;
    stuck_stage_label: string | null;
  } | null;
  focus_summary: string;
};

function conversationRiskStatusLabel(data: ConversationRiskData | null | undefined) {
  return formatConversationInterventionStatus(data);
}

function transferAwareMasteryStatusLabel(data: MasteryRiskData | null | undefined) {
  const label = formatMasteryInterventionStatus(data);
  return label ? `${label}。` : null;
}

function parentSignalStatusLabel(data: ParentSignalData | null | undefined) {
  if (!data) {
    return null;
  }

  const parts = [
    data.guardian_signal_label,
    data.daily_checkin_status_label,
    data.top_blocker_label,
    data.stuck_stage_label ? `卡在${data.stuck_stage_label}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' · ') : null;
}

const notificationConfig: Record<
  string,
  { icon: React.ElementType; color: string; bgColor: string }
> = {
  study_complete: {
    icon: BookOpen,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  review_reminder: {
    icon: Calendar,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  achievement: {
    icon: Award,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  new_error: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  mastery_update: {
    icon: TrendingUp,
    color: 'text-warm-500',
    bgColor: 'bg-warm-100 dark:bg-warm-900/30',
  },
  conversation_risk: {
    icon: AlertCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
  parent_signal: {
    icon: AlertCircle,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  subscription: {
    icon: Award,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  system: {
    icon: Bell,
    color: 'text-warm-600',
    bgColor: 'bg-warm-100 dark:bg-warm-900/30',
  },
};

function getSignalBadgeClassName(level: 'green' | 'yellow' | 'red') {
  switch (level) {
    case 'red':
      return 'bg-red-100 text-red-700';
    case 'yellow':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-emerald-100 text-emerald-700';
  }
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  return date.toLocaleDateString('zh-CN');
}

export function NotificationCenter() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [parentInsight, setParentInsight] = useState<ParentInsightSummary | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isParent = profile?.role === 'parent';

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/notifications?user_id=${profile.id}&limit=10`);
      if (!response.ok) {
        throw new Error('获取通知失败');
      }

      const result = await response.json();
      setNotifications(result.data || []);
      setUnreadCount(result.unread_count || 0);
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  const fetchParentInsight = useCallback(async () => {
    if (!profile?.id) return;

    setInsightLoading(true);
    try {
      const response = await fetch('/api/parent/insights');
      if (!response.ok) {
        throw new Error('failed-to-fetch-parent-insight');
      }

      const result = await response.json();
      setParentInsight(result as ParentInsightSummary);
    } catch (error) {
      console.error('Failed to fetch parent insight:', error);
    } finally {
      setInsightLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (!isParent || !profile?.id) {
      return;
    }

    void fetchNotifications();
  }, [fetchNotifications, isParent, profile?.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId?: string) => {
    if (!profile?.id) return;

    try {
      const body = notificationId
        ? { user_id: profile.id, notification_ids: [notificationId] }
        : { user_id: profile.id, mark_all_read: true };

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to update notifications');
      }

      if (notificationId) {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notificationId ? { ...item, is_read: true } : item
          )
        );
        setUnreadCount((current) => Math.max(0, current - 1));
      } else {
        setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!profile?.id) return;

    try {
      const response = await fetch(
        `/api/notifications?id=${notificationId}&user_id=${profile.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      setNotifications((current) => {
        const target = current.find((item) => item.id === notificationId);
        if (target && !target.is_read) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return current.filter((item) => item.id !== notificationId);
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  if (!isParent) return null;

  const insightStudentName = parentInsight?.selected_student?.display_name || '当前孩子';
  const insightControlsUrl = parentInsight?.selected_student?.id
    ? `/controls?student_id=${parentInsight.selected_student.id}`
    : '/controls';
  const insightTaskUrl = parentInsight?.selected_student?.id
    ? `/tasks?child_id=${parentInsight.selected_student.id}`
    : '/tasks';

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen((current) => !current);
          if (!isOpen) {
            void fetchNotifications();
            void fetchParentInsight();
          }
        }}
        className={cn(
          'relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full',
          'transition-all duration-300 hover:bg-warm-100 focus:outline-none focus:ring-2 focus:ring-warm-500/50'
        )}
        aria-label="Notifications"
      >
        <Bell className={cn('h-5 w-5', unreadCount > 0 ? 'text-warm-500' : 'text-warm-600')} />
        {unreadCount > 0 ? (
          <span
            className={cn(
              'absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full',
              'bg-red-500 text-[10px] font-bold text-white'
            )}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          className={cn(
            'absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-border/50 bg-card/95 shadow-xl backdrop-blur-xl',
            'sm:w-96'
          )}
        >
          <div className="flex items-center justify-between border-b border-border/50 p-4">
            <h3 className="flex items-center gap-2 font-semibold">
              <Bell className="h-4 w-4" />
              Notification center
            </h3>
            {unreadCount > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAsRead()}
                className="h-7 gap-1 text-xs"
              >
                <CheckCheck className="h-3 w-3" />
                Mark all read
              </Button>
            ) : null}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {insightLoading ? (
              <div className="flex items-center justify-center border-b border-border/30 py-4">
                <Loader2 className="h-5 w-5 animate-spin text-warm-600" />
              </div>
            ) : parentInsight ? (
              <div className="border-b border-border/40 bg-warm-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide text-warm-600">
                      Parent signal
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {insightStudentName} 当前状态
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                      {parentInsight.guardian_signal.reason}
                    </p>
                  </div>
                  <Badge className={getSignalBadgeClassName(parentInsight.guardian_signal.level)}>
                    {parentInsight.guardian_signal.label}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {parentInsight.daily_checkin_status ? (
                    <Badge variant="outline" className="border-slate-200 text-slate-700">
                      {parentInsight.daily_checkin_status.status_label}
                    </Badge>
                  ) : null}
                  {parentInsight.top_blocker?.stuck_stage_label ? (
                    <Badge variant="outline" className="border-slate-200 text-slate-700">
                      卡在: {parentInsight.top_blocker.stuck_stage_label}
                    </Badge>
                  ) : null}
                  {parentInsight.top_blocker?.false_error_gate ? (
                    <Badge variant="outline" className="border-amber-200 text-amber-700">
                      先确认是否真错题
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-white/80 p-3">
                  <p className="text-xs font-medium text-slate-500">当前最大卡点</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {parentInsight.top_blocker?.label ? (
                      <Badge className="bg-red-100 text-red-700">
                        {parentInsight.top_blocker.label}
                      </Badge>
                    ) : null}
                    {parentInsight.top_blocker?.count ? (
                      <span className="text-xs text-slate-500">
                        最近重复 {parentInsight.top_blocker.count} 次
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm text-slate-700">
                    {parentInsight.top_blocker?.root_cause_summary || parentInsight.focus_summary}
                  </p>
                </div>

                <div className="mt-3 space-y-1 text-xs text-slate-600">
                  {parentInsight.top_blocker?.suggested_guardian_action ? (
                    <p>家长动作: {parentInsight.top_blocker.suggested_guardian_action}</p>
                  ) : null}
                  {parentInsight.top_blocker?.child_poka_yoke_action ? (
                    <p>孩子动作: {parentInsight.top_blocker.child_poka_yoke_action}</p>
                  ) : null}
                  {!parentInsight.top_blocker?.suggested_guardian_action &&
                  !parentInsight.top_blocker?.child_poka_yoke_action ? (
                    <p>
                      {parentInsight.daily_checkin_status?.suggested_parent_prompt ||
                        parentInsight.suggested_parent_prompt}
                    </p>
                  ) : null}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = insightControlsUrl;
                    }}
                  >
                    去看陪学看板
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-full px-3 text-xs"
                    onClick={() => {
                      setIsOpen(false);
                      window.location.href = insightTaskUrl;
                    }}
                  >
                    查看任务
                  </Button>
                </div>
              </div>
            ) : null}

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-warm-600" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-warm-600">
                <BellOff className="mb-2 h-10 w-10 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {notifications.map((notification) => {
                  const config =
                    notificationConfig[notification.type] || notificationConfig.system;
                  const Icon = config.icon;
                  const conversationRiskData =
                    notification.type === 'conversation_risk'
                      ? (notification.data as ConversationRiskData | null)
                      : null;
                  const conversationRiskStatus = conversationRiskStatusLabel(conversationRiskData);
                  const masteryRiskData =
                    notification.type === 'mastery_update'
                      ? (notification.data as MasteryRiskData | null)
                      : null;
                  const masteryRiskStatus = transferAwareMasteryStatusLabel(masteryRiskData);
                  const parentSignalData =
                    notification.type === 'parent_signal'
                      ? (notification.data as ParentSignalData | null)
                      : null;
                  const parentSignalStatus = parentSignalStatusLabel(parentSignalData);

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-4 transition-colors hover:bg-warm-100/30',
                        !notification.is_read && 'bg-warm-100'
                      )}
                    >
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
                            config.bgColor
                          )}
                        >
                          <Icon className={cn('h-5 w-5', config.color)} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="line-clamp-1 text-sm font-medium">
                                {notification.title}
                              </p>
                              <p className="mt-0.5 line-clamp-2 text-xs text-warm-600">
                                {notification.content || 'No additional details'}
                              </p>
                              {conversationRiskStatus ? (
                                <p className="mt-1 text-xs text-red-600">
                                  {conversationRiskStatus}
                                </p>
                              ) : null}
                              {masteryRiskStatus ? (
                                <p className="mt-1 text-xs text-amber-700">{masteryRiskStatus}</p>
                              ) : null}
                              {parentSignalStatus ? (
                                <p className="mt-1 text-xs text-amber-700">{parentSignalStatus}</p>
                              ) : null}
                            </div>
                            {!notification.is_read ? (
                              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-warm-500" />
                            ) : null}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-warm-600">
                              {formatTime(notification.created_at)}
                            </span>
                            <div className="flex items-center gap-1">
                              {!notification.is_read ? (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="rounded-full p-1.5 transition-colors hover:bg-warm-100"
                                  title="Mark as read"
                                >
                                  <Check className="h-3.5 w-3.5 text-warm-600" />
                                </button>
                              ) : null}
                              {notification.action_url ? (
                                <button
                                  onClick={() => {
                                    setIsOpen(false);
                                    window.location.href = notification.action_url!;
                                  }}
                                  className="rounded-full p-1.5 transition-colors hover:bg-warm-100"
                                  title={notification.action_text || 'Open'}
                                >
                                  <Calendar className="h-3.5 w-3.5 text-warm-600" />
                                </button>
                              ) : null}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="rounded-full p-1.5 transition-colors hover:bg-warm-100"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-warm-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {notifications.length > 0 ? (
            <div className="border-t border-warm-200 p-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="w-full rounded-full text-xs"
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/notifications';
                }}
              >
                View all notifications
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
