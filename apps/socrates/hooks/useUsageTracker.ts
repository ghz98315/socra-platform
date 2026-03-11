// =====================================================
// Project Socrates - Usage Tracker Hook
// 使用时长追踪 Hook
// =====================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

export interface UsageStats {
  usedToday: number;           // 今日已用时长（分钟）
  dailyLimit: number;          // 每日限制（分钟）
  remaining: number;           // 剩余时长（分钟）
  isTimeExceeded: boolean;     // 是否超时
  isWithinAllowedHours: boolean; // 是否在允许时段
  enabled: boolean;            // 青少年模式是否开启
  restReminderInterval: number; // 休息提醒间隔（分钟）
  forceRestDuration: number;   // 强制休息时长（分钟）
}

export interface UsageTrackerResult {
  stats: UsageStats | null;
  isLoading: boolean;
  currentSessionMinutes: number;  // 当前会话时长（分钟）
  startSession: () => void;
  endSession: () => void;
  syncUsage: () => Promise<void>;
}

const SYNC_INTERVAL = 5 * 60 * 1000; // 5分钟同步一次
const SESSION_KEY = 'socrates_session_start';

export function useUsageTracker(): UsageTrackerResult {
  const { user, profile } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSessionMinutes, setCurrentSessionMinutes] = useState(0);

  const sessionStartRef = useRef<Date | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minuteTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 获取青少年模式状态
  const fetchTeenModeStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/teen-mode?user_id=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setStats({
          usedToday: data.usage?.usedToday || 0,
          dailyLimit: data.settings?.dailyTimeLimit || 120,
          remaining: data.usage?.remaining || 120,
          isTimeExceeded: data.usage?.isTimeExceeded || false,
          isWithinAllowedHours: data.usage?.isWithinAllowedHours !== false,
          enabled: data.enabled || false,
          restReminderInterval: data.settings?.restReminderInterval || 45,
          forceRestDuration: data.settings?.forceRestDuration || 15,
        });
      }
    } catch (error) {
      console.error('[useUsageTracker] Failed to fetch teen mode status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // 同步使用时长到服务器
  const syncUsage = useCallback(async () => {
    if (!user?.id || !sessionStartRef.current) return;

    const now = new Date();
    const durationMinutes = Math.floor((now.getTime() - sessionStartRef.current.getTime()) / 60000);

    if (durationMinutes <= 0) return;

    try {
      await fetch('/api/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          duration_minutes: durationMinutes,
          session_start: sessionStartRef.current.toISOString(),
          session_end: now.toISOString(),
        }),
      });

      // 更新本地状态
      setStats(prev => {
        if (!prev) return prev;
        const newUsedToday = prev.usedToday + durationMinutes;
        return {
          ...prev,
          usedToday: newUsedToday,
          remaining: Math.max(prev.dailyLimit - newUsedToday, 0),
          isTimeExceeded: newUsedToday >= prev.dailyLimit,
        };
      });

      // 重置会话开始时间
      sessionStartRef.current = now;
    } catch (error) {
      console.error('[useUsageTracker] Failed to sync usage:', error);
    }
  }, [user?.id]);

  // 开始会话
  const startSession = useCallback(() => {
    sessionStartRef.current = new Date();
    localStorage.setItem(SESSION_KEY, sessionStartRef.current.toISOString());
    setCurrentSessionMinutes(0);
  }, []);

  // 结束会话
  const endSession = useCallback(async () => {
    await syncUsage();
    sessionStartRef.current = null;
    localStorage.removeItem(SESSION_KEY);
    setCurrentSessionMinutes(0);
  }, [syncUsage]);

  // 更新当前会话时长
  const updateCurrentSessionMinutes = useCallback(() => {
    if (!sessionStartRef.current) return;
    const minutes = Math.floor((Date.now() - sessionStartRef.current.getTime()) / 60000);
    setCurrentSessionMinutes(minutes);
  }, []);

  // 初始化
  useEffect(() => {
    if (user?.id && profile?.role === 'student') {
      fetchTeenModeStatus();

      // 恢复会话或开始新会话
      const savedSessionStart = localStorage.getItem(SESSION_KEY);
      if (savedSessionStart) {
        sessionStartRef.current = new Date(savedSessionStart);
      } else {
        startSession();
      }

      // 设置同步定时器
      syncTimerRef.current = setInterval(syncUsage, SYNC_INTERVAL);

      // 设置分钟计时器
      minuteTimerRef.current = setInterval(updateCurrentSessionMinutes, 60000);
    }

    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      if (minuteTimerRef.current) clearInterval(minuteTimerRef.current);
    };
  }, [user?.id, profile?.role, fetchTeenModeStatus, startSession, syncUsage, updateCurrentSessionMinutes]);

  // 页面可见性变化处理
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时同步使用时长
        syncUsage();
      } else {
        // 页面显示时重新获取状态
        fetchTeenModeStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncUsage, fetchTeenModeStatus]);

  // 页面卸载前同步
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sessionStartRef.current && user?.id) {
        const now = new Date();
        const durationMinutes = Math.floor((now.getTime() - sessionStartRef.current.getTime()) / 60000);

        // 使用 sendBeacon 确保数据发送
        if (durationMinutes > 0) {
          navigator.sendBeacon('/api/usage', JSON.stringify({
            user_id: user.id,
            duration_minutes: durationMinutes,
            session_start: sessionStartRef.current.toISOString(),
            session_end: now.toISOString(),
          }));
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [user?.id]);

  return {
    stats,
    isLoading,
    currentSessionMinutes,
    startSession,
    endSession,
    syncUsage,
  };
}
