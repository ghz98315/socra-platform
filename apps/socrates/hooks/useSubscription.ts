// =====================================================
// Project Socrates - Subscription Hook
// 订阅系统 React Hook
// =====================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';

// 订阅数据类型
export interface SubscriptionData {
  has_subscription: boolean;
  is_pro: boolean;
  current_plan: {
    plan_code: string;
    plan_name: string;
    features: Record<string, any>;
    started_at: string;
    expires_at: string | null;
  } | null;
  subscription_history: Array<{
    plan_name: string;
    status: string;
    started_at: string;
    expires_at: string | null;
  }>;
}

export interface PlanData {
  id: string;
  plan_code: string;
  plan_name: string;
  price: number;
  original_price: number | null;
  duration_days: number | null;
  is_popular: boolean;
  discount_percent: number | null;
  features: Record<string, any>;
}

// 获取用户订阅信息
export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({
        has_subscription: false,
        is_pro: false,
        current_plan: null,
        subscription_history: []
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscription', {
        headers: {
          'x-user-id': user.id
        }
      });

      if (!response.ok) {
        throw new Error('获取订阅信息失败');
      }

      const data = await response.json();
      setSubscription(data);
    } catch (err: any) {
      console.error('[useSubscription] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // 检查是否有 Pro 权限
  const isPro = subscription?.is_pro ?? false;

  // 检查功能限制
  const checkFeature = useCallback(async (feature: string, currentUsage: number) => {
    if (!user) return { allowed: false, limit: 0, remaining: 0, is_pro: false };

    try {
      const response = await fetch('/api/subscription/check-feature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          feature,
          current_usage: currentUsage
        })
      });

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('[checkFeature] Error:', err);
      return { allowed: false, limit: 0, remaining: 0, is_pro: false };
    }
  }, [user?.id]);

  return {
    subscription,
    isPro,
    loading,
    error,
    refresh: fetchSubscription,
    checkFeature
  };
}

// 获取订阅计划列表
export function usePlans() {
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/subscription/plans');

      if (!response.ok) {
        throw new Error('获取套餐列表失败');
      }

      const data = await response.json();
      setPlans(data.plans);
    } catch (err: any) {
      console.error('[usePlans] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    plans,
    loading,
    error,
    refresh: fetchPlans
  };
}
