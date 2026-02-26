// =====================================================
// Project Socrates - Notification Center Component
// 通知中心组件 - 家长端
// =====================================================

'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  Trash2,
  BookOpen,
  Calendar,
  Award,
  AlertCircle,
  TrendingUp,
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// 通知类型
type NotificationType = 'study_complete' | 'review_reminder' | 'achievement' | 'new_error' | 'mastery_update';

interface Notification {
  id: string;
  parent_id: string;
  student_id: string;
  student_name?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

// 通知类型配置
const notificationConfig: Record<NotificationType, { icon: React.ElementType; color: string; bgColor: string }> = {
  study_complete: { icon: BookOpen, color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  review_reminder: { icon: Calendar, color: 'text-orange-500', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  achievement: { icon: Award, color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' },
  new_error: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  mastery_update: { icon: TrendingUp, color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
};

// 格式化时间
function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN');
}

export function NotificationCenter() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 只有家长才能看到通知
  const isParent = profile?.role === 'parent';

  // 获取通知
  useEffect(() => {
    if (isParent && profile?.id) {
      fetchNotifications();
    }
  }, [isParent, profile?.id]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/notifications?parent_id=${profile.id}&limit=10`);
      if (response.ok) {
        const result = await response.json();
        setNotifications(result.data || []);
        setUnreadCount(result.unread_count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId?: string) => {
    try {
      const body = notificationId
        ? { notification_id: notificationId }
        : { mark_all_read: true, parent_id: profile?.id };

      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (notificationId) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications?id=${notificationId}`, { method: 'DELETE' });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  if (!isParent) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 通知按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative min-w-[44px] min-h-[44px] flex items-center justify-center",
          "rounded-full hover:bg-muted transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-primary/50"
        )}
        aria-label="通知"
      >
        <Bell className={cn("w-5 h-5", unreadCount > 0 ? "text-primary" : "text-muted-foreground")} />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]",
              "flex items-center justify-center",
              "bg-red-500 text-white text-[10px] font-bold",
              "rounded-full animate-pulse"
            )}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知下拉框 */}
      {isOpen && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 w-80 sm:w-96",
            "bg-card/95 backdrop-blur-xl rounded-2xl",
            "border border-border/50 shadow-xl",
            "overflow-hidden z-50",
            "animate-slide-down"
          )}
        >
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4" />
              通知中心
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAsRead()}
                className="text-xs gap-1 h-7"
              >
                <CheckCheck className="w-3 h-3" />
                全部已读
              </Button>
            )}
          </div>

          {/* 通知列表 */}
          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <BellOff className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">暂无通知</p>
              </div>
            ) : (
              <div className="divide-y divide-border/30">
                {notifications.map((notification) => {
                  const config = notificationConfig[notification.type];
                  const Icon = config.icon;

                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-muted/30 transition-colors",
                        !notification.read && "bg-primary/5"
                      )}
                    >
                      <div className="flex gap-3">
                        {/* 图标 */}
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                            config.bgColor
                          )}
                        >
                          <Icon className={cn("w-5 h-5", config.color)} />
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium line-clamp-1">
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.read && (
                              <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                          </div>

                          {/* 时间和操作 */}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {formatTime(notification.created_at)}
                            </span>
                            <div className="flex items-center gap-1">
                              {!notification.read && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                  title="标记已读"
                                >
                                  <Check className="w-3.5 h-3.5 text-muted-foreground" />
                                </button>
                              )}
                              <button
                                onClick={() => deleteNotification(notification.id)}
                                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
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

          {/* 底部 */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-border/50 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs w-full"
                onClick={() => {
                  setIsOpen(false);
                  // TODO: Navigate to full notification page
                }}
              >
                查看全部通知
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
