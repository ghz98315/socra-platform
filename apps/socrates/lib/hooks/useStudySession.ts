// =====================================================
// Project Socrates - Study Session Management Hook
// =====================================================

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface StudySession {
  id: string;
  student_id: string;
  session_type: 'error_analysis' | 'review';
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
}

interface UseStudySessionOptions {
  autoSave?: boolean;
  saveInterval?: number; // seconds
}

export function useStudySession(options: UseStudySessionOptions = {}) {
  const { autoSave = true, saveInterval = 30 } = options;
  const supabase = createClient();

  const [session, setSession] = useState<StudySession | null>(null);
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);

  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // 开始新的学习会话
  const startSession = useCallback(async (sessionType: 'error_analysis' | 'review') => {
    setLoading(true);
    try {
      // 先结束之前的会话
      if (session && isActive) {
        await endSession();
      }

      const { data, error } = await (supabase as any)
        .from('study_sessions')
        .insert({
          session_type: sessionType,
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      setSession(data);
      setIsActive(true);
      startTimeRef.current = new Date();

      // 设置自动保存
      if (autoSave) {
        saveIntervalRef.current = setInterval(() => {
          updateSessionDuration();
        }, saveInterval * 1000);
      }

      return data;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [session, isActive, autoSave, saveInterval, supabase]);

  // 更新会话时长
  const updateSessionDuration = useCallback(async () => {
    if (!session || !isActive || !startTimeRef.current) return;

    const duration = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);

    const { error } = await (supabase as any)
      .from('study_sessions')
      .update({ duration_seconds: duration })
      .eq('id', session.id);

    if (error) {
      console.error('Error updating duration:', error);
    }
  }, [session, isActive, supabase]);

  // 结束会话
  const endSession = useCallback(async () => {
    if (!session || !isActive) return;

    setIsActive(false);

    if (saveIntervalRef.current) {
      clearInterval(saveIntervalRef.current);
      saveIntervalRef.current = null;
    }

    const endTime = new Date();
    const duration = startTimeRef.current
      ? Math.floor((endTime.getTime() - startTimeRef.current.getTime()) / 1000)
      : 0;

    const { error } = await (supabase as any)
      .from('study_sessions')
      .update({
        end_time: endTime.toISOString(),
        duration_seconds: duration,
      })
      .eq('id', session.id);

    if (error) {
      console.error('Error ending session:', error);
    }

    setSession(null);
    startTimeRef.current = null;
  }, [session, isActive, supabase]);

  // 获取历史会话
  const getHistory = useCallback(async (limit = 10) => {
    const { data, error } = await (supabase as any)
      .from('study_sessions')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching history:', error);
      return [];
    }

    return data || [];
  }, [supabase]);

  // 页面卸载时自动结束会话
  useEffect(() => {
    return () => {
      if (isActive && session) {
        endSession();
      }
    };
  }, [isActive, session, endSession]);

  // 页面隐藏时暂停计时
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isActive) {
        updateSessionDuration();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isActive, updateSessionDuration]);

  return {
    session,
    loading,
    isActive,
    startSession,
    endSession,
    getHistory,
    updateDuration: updateSessionDuration,
  };
}

// 会话管理器单例
class SessionManager {
  private static instance: SessionManager;
  private session: StudySession | null = null;
  private startTime: Date | null = null;
  private supabase = createClient();

  private constructor() {}

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  async start(sessionType: 'error_analysis' | 'review'): Promise<StudySession> {
    // 结束之前的会话
    if (this.session) {
      await this.end();
    }

    const { data, error } = await (this.supabase as any)
      .from('study_sessions')
      .insert({
        session_type: sessionType,
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !data) {
      throw error;
    }

    this.session = data;
    this.startTime = new Date();
    return data;
  }

  async end(): Promise<void> {
    if (!this.session || !this.startTime) return;

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000);

    await (this.supabase as any)
      .from('study_sessions')
      .update({
        end_time: endTime.toISOString(),
        duration_seconds: duration,
      })
      .eq('id', this.session.id);

    this.session = null;
    this.startTime = null;
  }

  get isActive(): boolean {
    return this.session !== null;
  }

  get currentSession(): StudySession | null {
    return this.session;
  }

  async updateDuration(): Promise<void> {
    if (!this.session || !this.startTime) return;

    const duration = Math.floor((Date.now() - this.startTime.getTime()) / 1000);

    await (this.supabase as any)
      .from('study_sessions')
      .update({ duration_seconds: duration })
      .eq('id', this.session.id);
  }
}

export const sessionManager = SessionManager.getInstance();
