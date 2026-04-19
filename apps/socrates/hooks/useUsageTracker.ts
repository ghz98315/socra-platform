'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/lib/contexts/AuthContext';

export interface UsageStats {
  usedToday: number;
  dailyLimit: number;
  remaining: number;
  isTimeExceeded: boolean;
  isWithinAllowedHours: boolean;
  enabled: boolean;
  restReminderInterval: number;
  forceRestDuration: number;
}

export interface UsageTrackerResult {
  stats: UsageStats | null;
  isLoading: boolean;
  currentSessionMinutes: number;
  startSession: () => void;
  endSession: () => void;
  syncUsage: () => Promise<void>;
}

const SYNC_INTERVAL = 5 * 60 * 1000;
const SESSION_KEY = 'socrates_session_start';

export function useUsageTracker(): UsageTrackerResult {
  const { profile } = useAuth();
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSessionMinutes, setCurrentSessionMinutes] = useState(0);

  const sessionStartRef = useRef<Date | null>(null);
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const minuteTimerRef = useRef<NodeJS.Timeout | null>(null);

  const activeStudentId = profile?.role === 'student' ? profile.id : null;

  const fetchTeenModeStatus = useCallback(async () => {
    if (!activeStudentId) {
      setStats(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/teen-mode?user_id=${activeStudentId}`);
      if (!response.ok) {
        return;
      }

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
    } catch (error) {
      console.error('[useUsageTracker] Failed to fetch teen mode status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeStudentId]);

  const syncUsage = useCallback(async () => {
    if (!activeStudentId || !sessionStartRef.current) {
      return;
    }

    const now = new Date();
    const durationMinutes = Math.floor((now.getTime() - sessionStartRef.current.getTime()) / 60000);
    if (durationMinutes <= 0) {
      return;
    }

    try {
      await fetch('/api/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: activeStudentId,
          duration_minutes: durationMinutes,
          session_start: sessionStartRef.current.toISOString(),
          session_end: now.toISOString(),
        }),
      });

      setStats((previous) => {
        if (!previous) {
          return previous;
        }

        const nextUsedToday = previous.usedToday + durationMinutes;
        return {
          ...previous,
          usedToday: nextUsedToday,
          remaining: Math.max(previous.dailyLimit - nextUsedToday, 0),
          isTimeExceeded: nextUsedToday >= previous.dailyLimit,
        };
      });

      sessionStartRef.current = now;
    } catch (error) {
      console.error('[useUsageTracker] Failed to sync usage:', error);
    }
  }, [activeStudentId]);

  const startSession = useCallback(() => {
    sessionStartRef.current = new Date();
    localStorage.setItem(SESSION_KEY, sessionStartRef.current.toISOString());
    setCurrentSessionMinutes(0);
  }, []);

  const endSession = useCallback(async () => {
    await syncUsage();
    sessionStartRef.current = null;
    localStorage.removeItem(SESSION_KEY);
    setCurrentSessionMinutes(0);
  }, [syncUsage]);

  const updateCurrentSessionMinutes = useCallback(() => {
    if (!sessionStartRef.current) {
      return;
    }

    setCurrentSessionMinutes(Math.floor((Date.now() - sessionStartRef.current.getTime()) / 60000));
  }, []);

  useEffect(() => {
    if (!activeStudentId) {
      sessionStartRef.current = null;
      localStorage.removeItem(SESSION_KEY);
      setCurrentSessionMinutes(0);
      setStats(null);
      setIsLoading(false);
      return;
    }

    void fetchTeenModeStatus();

    const savedSessionStart = localStorage.getItem(SESSION_KEY);
    if (savedSessionStart) {
      sessionStartRef.current = new Date(savedSessionStart);
    } else {
      startSession();
    }

    syncTimerRef.current = setInterval(syncUsage, SYNC_INTERVAL);
    minuteTimerRef.current = setInterval(updateCurrentSessionMinutes, 60000);

    return () => {
      if (syncTimerRef.current) {
        clearInterval(syncTimerRef.current);
      }
      if (minuteTimerRef.current) {
        clearInterval(minuteTimerRef.current);
      }
    };
  }, [activeStudentId, fetchTeenModeStatus, startSession, syncUsage, updateCurrentSessionMinutes]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        void syncUsage();
      } else {
        void fetchTeenModeStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchTeenModeStatus, syncUsage]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!sessionStartRef.current || !activeStudentId) {
        return;
      }

      const now = new Date();
      const durationMinutes = Math.floor((now.getTime() - sessionStartRef.current.getTime()) / 60000);
      if (durationMinutes <= 0) {
        return;
      }

      navigator.sendBeacon(
        '/api/usage',
        JSON.stringify({
          user_id: activeStudentId,
          duration_minutes: durationMinutes,
          session_start: sessionStartRef.current.toISOString(),
          session_end: now.toISOString(),
        }),
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeStudentId]);

  return {
    stats,
    isLoading,
    currentSessionMinutes,
    startSession,
    endSession,
    syncUsage,
  };
}
