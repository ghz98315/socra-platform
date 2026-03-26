// =====================================================
// Project Socrates - Notification Bell Component
// 通知铃铛组件 (导航栏使用)
// =====================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Check,
  CheckCheck,
  BookOpen,
  Trophy,
  Star,
  Calendar,
  Crown,
  AlertCircle,
  Clock,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';

// 通知类型配置
const notificationTypeConfig: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  review: {
    label: '复习',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  task: {
    label: '任务',
    icon: Calendar,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  task_completed: {
    label: '完成',
    icon: Check,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  achievement: {
    label: '成就',
    icon: Trophy,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  points: {
    label: '积分',
    icon: Star,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  streak: {
    label: '连续',
    icon: Clock,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  subscription: {
    label: '会员',
    icon: Crown,
    color: 'text-warm-600',
    bgColor: 'bg-warm-100',
  },
  system: {
    label: '系统',
    icon: AlertCircle,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
  conversation_risk: {
    label: '对话风险',
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  mastery_update: {
    label: '掌握风险',
    icon: AlertCircle,
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
  },
};

interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  content: string | null;
  data: Record<string, unknown> | null;
  action_url: string | null;
  action_text: string | null;
  is_read: boolean;
  read_at: string | null;
  priority: number;
  expires_at: string | null;
  created_at: string;
}

type ConversationRiskData = {
  intervention_status?: string | null;
  intervention_effect?: 'pending' | 'risk_lowered' | 'risk_persisting' | null;
  intervention_feedback_note?: string | null;
};

type MasteryRiskData = {
  intervention_status?: string | null;
  intervention_task_title?: string | null;
  intervention_feedback_note?: string | null;
};

function conversationRiskStatusLabel(data: ConversationRiskData | null | undefined) {
  if (data?.intervention_effect === 'risk_lowered') {
    return '已沟通，风险下降';
  }

  if (data?.intervention_effect === 'risk_persisting') {
    return '已沟通，风险仍在';
  }

  if (data?.intervention_status === 'completed') {
    return '已沟通，待继续观察';
  }

  if (data?.intervention_status) {
    return '已建干预任务';
  }

  return null;
}

function masteryRiskStatusLabel(data: MasteryRiskData | null | undefined) {
  if (!data?.intervention_status) {
    return null;
  }

  if (data.intervention_status === 'completed') {
    return data.intervention_feedback_note
      ? `补救任务已完成: ${data.intervention_feedback_note}`
      : '补救任务已完成';
  }

  return data.intervention_task_title ? `已生成补救任务: ${data.intervention_task_title}` : '已生成补救任务';
}

interface NotificationBellProps {
  className?: string;
  compact?: boolean;
}

export function NotificationBell({ className, compact = false }: NotificationBellProps) {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 加载通知
  const loadNotifications = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        user_id: profile.id,
        limit: '5',
        is_read: 'false',
      });

      const response = await fetch(`/api/notifications?${params}`);
      const result = await response.json();

      if (response.ok) {
        setNotifications(result.data || []);
        setUnreadCount(result.unread_count || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  // 初始加载
  useEffect(() => {
    loadNotifications();
    // 每5分钟刷新一次
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 标记已读
  const handleMarkRead = async (notificationIds?: string[]) => {
    if (!profile?.id) return;

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          notification_ids: notificationIds,
          mark_all_read: !notificationIds,
        }),
      });

      await loadNotifications();
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* 铃铛按钮 */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) loadNotifications();
        }}
        className={cn(
          'relative',
          compact && 'w-8 h-8'
        )}
      >
        <Bell className={cn('w-5 h-5', unreadCount > 0 && 'text-warm-500 animate-bounce')} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* 下拉面板 */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* 头部 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-900">通知</span>
              {unreadCount > 0 && (
                <Badge className="bg-warm-500 text-white text-xs px-1.5">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 px-2"
                onClick={() => handleMarkRead()}
              >
                <CheckCheck className="w-3 h-3 mr-1" />
                全部已读
              </Button>
            )}
          </div>

          {/* 通知列表 */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center">
                <Bell className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">暂无新通知</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => {
                  const config = notificationTypeConfig[notification.type] || notificationTypeConfig.system;
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
                  const masteryRiskStatus = masteryRiskStatusLabel(masteryRiskData);

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'p-3 hover:bg-gray-50 cursor-pointer transition-colors',
                        !notification.is_read && 'bg-warm-50/50'
                      )}
                      onClick={() => {
                        if (!notification.is_read) {
                          handleMarkRead([notification.id]);
                        }
                        if (notification.action_url) {
                          window.location.href = notification.action_url;
                          setIsOpen(false);
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', config.bgColor)}>
                          <Icon className={cn('w-4 h-4', config.color)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            'text-sm font-medium truncate',
                            !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                          )}>
                            {notification.title}
                          </p>
                          {notification.content && (
                            <p className="text-xs text-gray-500 truncate mt-0.5">
                              {notification.content}
                            </p>
                          )}
                          {conversationRiskStatus ? (
                            <p className="mt-1 text-xs text-red-600">
                              {conversationRiskStatus}
                            </p>
                          ) : null}
                          {masteryRiskStatus ? (
                            <p className="mt-1 text-xs text-amber-700">{masteryRiskStatus}</p>
                          ) : null}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatTime(notification.created_at)}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <span className="w-2 h-2 rounded-full bg-warm-500 flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 底部 */}
          <div className="border-t border-gray-100 bg-gray-50">
            <Link
              href="/notifications"
              className="flex items-center justify-between px-4 py-3 text-sm text-warm-600 hover:bg-warm-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <span>查看全部通知</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
