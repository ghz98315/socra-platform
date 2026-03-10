// =====================================================
// Project Socrates - Points Hook
// 积分系统 React Hook
// =====================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

// 积分数据类型
export interface PointsData {
  balance: number;
  total_earned: number;
  total_spent: number;
  level: number;
  level_name: string;
  streak_days: number;
  longest_streak: number;
  next_level_points: number | null;
  progress_to_next: number;
}

export interface PointsTransaction {
  id: string;
  user_id: string;
  amount: number;
  balance_after: number;
  transaction_type: 'earn' | 'spend' | 'expire' | 'admin_adjust' | 'reward';
  source: string;
  related_id: string | null;
  related_type: string | null;
  description: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

// 获取用户积分信息
export function usePoints() {
  const { user } = useAuth();
  const [points, setPoints] = useState<PointsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPoints = useCallback(async () => {
    if (!user) {
      setPoints(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/points?user_id=${user.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch points');
      }

      const data = await response.json();
      setPoints(data);
    } catch (err: any) {
      console.error('[usePoints] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 初始化加载
  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  // 添加积分
  const addPoints = useCallback(async (
    amount: number,
    source: string,
    options?: {
      related_id?: string;
      related_type?: string;
      description?: string;
      metadata?: Record<string, any>;
    }
  ) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch('/api/points/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          amount,
          source,
          ...options
        })
      });

      const data = await response.json();

      if (data.success) {
        // 更新本地状态
        await fetchPoints();
        return { success: true, data };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }, [user?.id, fetchPoints]);

  return {
    points,
    loading,
    error,
    refresh: fetchPoints,
    addPoints
  };
}

// 获取积分交易记录
export function usePointsTransactions(options?: {
  limit?: number;
  offset?: number;
  source?: string;
  transaction_type?: string;
}) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!user) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        user_id: user.id,
    });

      if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());
    if (options?.source) params.set('source', options.source);
    if (options?.transaction_type) params.set('transaction_type', options.transaction_type);

      const response = await fetch(`/api/points/transactions?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setTotal(data.pagination.total);
    } catch (err: any) {
      console.error('[usePointsTransactions] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, options?.limit, options?.offset, options?.source, options?.transaction_type]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    total,
    loading,
    error,
    refresh: fetchTransactions
  };
}
