// =====================================================
// Project Socrates - Notifications Center Page
// 通知中心页面
// =====================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Clock,
  BookOpen,
  Trophy,
  Star,
  Calendar,
  Crown,
  AlertCircle,
  Loader2,
  ChevronRight,
  Settings,
  X,
} from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { PageHeader } from '@/components/PageHeader';

// 通知类型配置
const notificationTypeConfig: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  review: {
    label: '复习提醒',
    icon: BookOpen,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  task: {
    label: '任务提醒',
    icon: Calendar,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  task_completed: {
    label: '任务完成',
    icon: Check,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  achievement: {
    label: '成就解锁',
    icon: Trophy,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  points: {
    label: '积分奖励',
    icon: Star,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  streak: {
    label: '连续学习',
    icon: Clock,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
  subscription: {
    label: '会员提醒',
    icon: Crown,
    color: 'text-warm-600',
    bgColor: 'bg-warm-100',
  },
  system: {
    label: '系统通知',
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
};

notificationTypeConfig.mastery_update = {
  label: '掌握风险',
  icon: AlertCircle,
  color: 'text-amber-700',
  bgColor: 'bg-amber-100',
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
  risk_type?: 'mastery_risk' | 'transfer_evidence_gap' | string;
  intervention_status?: string | null;
  intervention_effect?: 'pending' | 'risk_lowered' | 'risk_persisting' | null;
  intervention_feedback_note?: string | null;
  intervention_task_title?: string | null;
};

function conversationRiskStatusLabel(data: ConversationRiskData | null | undefined) {
  if (data?.intervention_effect === 'risk_lowered') {
    return '家长已沟通，风险暂时下降';
  }

  if (data?.intervention_effect === 'risk_persisting') {
    return '家长已沟通，但风险仍在重复';
  }

  if (data?.intervention_status === 'completed') {
    return '家长已完成沟通';
  }

  if (data?.intervention_status) {
    return '已创建家长干预任务';
  }

  return null;
}

function masteryRiskStatusLabel(data: MasteryRiskData | null | undefined) {
  if (!data?.intervention_status) {
    return null;
  }

  const isTransferEvidenceGap = data.risk_type === 'transfer_evidence_gap';

  if (data.intervention_effect === 'risk_lowered') {
    return isTransferEvidenceGap ? '补做后已形成迁移证据' : '补救后风险已下降';
  }

  if (data.intervention_effect === 'risk_persisting') {
    return isTransferEvidenceGap ? '补做后仍缺迁移证据' : '补救后同类风险仍在重复';
  }

  if (data.intervention_status === 'completed') {
    return data.intervention_feedback_note
      ? `任务已完成: ${data.intervention_feedback_note}`
      : isTransferEvidenceGap
        ? '补齐迁移证据任务已完成'
        : '补救任务已完成';
  }

  return data.intervention_task_title
    ? `${isTransferEvidenceGap ? '已生成迁移证据任务' : '已生成补救任务'}: ${data.intervention_task_title}`
    : isTransferEvidenceGap
      ? '已生成补齐迁移证据任务'
      : '已生成补救任务';
}

export default function NotificationsPage() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // 加载通知
  const loadNotifications = useCallback(async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const params = new URLSearchParams({
        user_id: profile.id,
        is_read: selectedTab === 'unread' ? 'false' : 'all',
        limit: '50',
      });

      const response = await fetch(`/api/notifications?${params}`);
      const result = await response.json();

      if (response.ok) {
        setNotifications(result.data || []);
        setTotalCount(result.total || 0);
        setUnreadCount(result.unread_count || 0);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, selectedTab]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // 标记已读
  const handleMarkRead = async (notificationIds?: string[]) => {
    if (!profile?.id) return;

    try {
      setActionLoading(true);
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          notification_ids: notificationIds,
          mark_all_read: !notificationIds,
        }),
      });

      if (response.ok) {
        await loadNotifications();
        setSelectedIds([]);
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // 删除通知
  const handleDelete = async (notificationId?: string) => {
    if (!profile?.id) return;

    try {
      setActionLoading(true);
      const params = new URLSearchParams({ user_id: profile.id });
      if (notificationId) {
        params.append('id', notificationId);
      } else {
        params.append('read', 'true');
      }

      const response = await fetch(`/api/notifications?${params}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadNotifications();
      }
    } catch (error) {
      console.error('Error deleting notifications:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // 格式化时间
  const formatTime = (dateStr: string) => {
    const date = parseISO(dateStr);
    return formatDistanceToNow(date, { addSuffix: true, locale: zhCN });
  };

  // 渲染通知项
  const renderNotification = (notification: Notification) => {
    const config = notificationTypeConfig[notification.type] || notificationTypeConfig.system;
    const Icon = config.icon;
    const isSelected = selectedIds.includes(notification.id);
    const isExpired = notification.expires_at && isPast(parseISO(notification.expires_at));
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
      <Card
        key={notification.id}
        className={cn(
          'transition-all cursor-pointer hover:shadow-md',
          !notification.is_read && 'border-l-4 border-l-warm-500',
          isSelected && 'ring-2 ring-warm-500',
          isExpired && 'opacity-50'
        )}
        onClick={() => {
          if (!notification.is_read) {
            handleMarkRead([notification.id]);
          }
          if (notification.action_url) {
            window.location.href = notification.action_url;
          }
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* 图标 */}
            <div className={cn('w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0', config.bgColor)}>
              <Icon className={cn('w-5 h-5', config.color)} />
            </div>

            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  'font-medium truncate',
                  !notification.is_read ? 'text-gray-900' : 'text-gray-600'
                )}>
                  {notification.title}
                </h3>
                {!notification.is_read && (
                  <span className="w-2 h-2 rounded-full bg-warm-500 flex-shrink-0" />
                )}
              </div>
              {notification.content && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                  {notification.content}
                </p>
              )}
              {conversationRiskStatus ? (
                <p className="text-sm text-red-600 mb-2">
                  {conversationRiskStatus}
                </p>
              ) : null}
              {masteryRiskStatus ? (
                <p className="text-sm text-amber-700 mb-2">
                  {masteryRiskStatus}
                </p>
              ) : null}
              {conversationRiskData?.intervention_feedback_note ? (
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                  家长反馈: {conversationRiskData.intervention_feedback_note}
                </p>
              ) : null}
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <span>{formatTime(notification.created_at)}</span>
                {notification.action_text && (
                  <span className="flex items-center gap-1 text-warm-500">
                    {notification.action_text}
                    <ChevronRight className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>

            {/* 删除按钮 */}
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0 opacity-0 group-hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(notification.id);
              }}
            >
              <X className="w-4 h-4 text-gray-400" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 筛选后的通知
  const filteredNotifications = notifications;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-warm-50">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <PageHeader
          title="通知中心"
          description="查看您的所有通知和提醒"
          icon={Bell}
          iconColor="text-warm-500"
        />
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-24">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-white/80">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{totalCount}</p>
              <p className="text-sm text-gray-500">全部通知</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80">
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-warm-600">{unreadCount}</p>
              <p className="text-sm text-gray-500">未读通知</p>
            </CardContent>
          </Card>
        </div>

        {/* 操作栏 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={selectedTab === 'all' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('all')}
            >
              全部
            </Button>
            <Button
              size="sm"
              variant={selectedTab === 'unread' ? 'default' : 'outline'}
              onClick={() => setSelectedTab('unread')}
              className="relative"
            >
              未读
              {unreadCount > 0 && (
                <Badge className="ml-1 px-1.5 py-0.5 text-xs bg-red-500 text-white">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleMarkRead()}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCheck className="w-4 h-4 mr-1" />
                    全部已读
                  </>
                )}
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDelete()}
              disabled={actionLoading}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              清除已读
            </Button>
          </div>
        </div>

        {/* 通知列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {selectedTab === 'unread' ? '没有未读通知' : '暂无通知'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map(renderNotification)}
          </div>
        )}

        {/* 设置入口 */}
        <Card className="mt-6 bg-gradient-to-r from-gray-50 to-warm-50 border-gray-200">
          <CardContent className="p-4">
            <Button
              variant="ghost"
              className="w-full justify-between"
              onClick={() => {
                // 跳转到通知设置页面
                window.location.href = '/settings/notifications';
              }}
            >
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>通知设置</span>
              </div>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
