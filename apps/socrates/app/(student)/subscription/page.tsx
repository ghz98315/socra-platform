// =====================================================
// Project Socrates - Subscription Page
// 订阅页面 (优化版)
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionFeatures } from '@/components/subscription/SubscriptionFeatures';
import { buildAuthPageHref, buildEntryHref, buildEntryQuery, readEntryParams } from '@/lib/navigation/entry-intent';
import {
  ArrowRight,
  CheckCircle,
  Crown,
  Shield,
  Clock,
  Gift,
  TrendingUp,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';

// 计划配置
const PLAN_CONFIG = {
  monthly: {
    id: 'pro_monthly',
    name: '月度会员',
    price: 29.9,
    originalPrice: 49.9,
    period: '月',
    discount: 40,
    badge: null,
  },
  quarterly: {
    id: 'pro_quarterly',
    name: '季度会员',
    price: 79.9,
    originalPrice: 149.7,
    period: '季',
    discount: 47,
    badge: '热门',
    badgeColor: 'bg-warm-500',
    popular: true,
  },
  yearly: {
    id: 'pro_yearly',
    name: '年度会员',
    price: 239.9,
    originalPrice: 598.8,
    period: '年',
    discount: 60,
    badge: '最划算',
    badgeColor: 'bg-green-500',
    bestValue: true,
  },
};

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subscription, isPro, loading, error } = useSubscription();
  const entryParams = readEntryParams(searchParams);
  const flowEntryParams = {
    source: entryParams.source ?? 'subscription',
    intent: entryParams.intent ?? 'subscribe',
    redirect: entryParams.redirect,
  };
  const subscriptionReturnHref = buildEntryHref('/subscription', flowEntryParams);
  const loginRedirectHref = buildAuthPageHref('/login', {
    source: flowEntryParams.source,
    intent: flowEntryParams.intent,
    redirect: subscriptionReturnHref,
  });

  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLAN_CONFIG>('quarterly');
  const [couponCode, setCouponCode] = useState('');
  const [couponValid, setCouponValid] = useState<{ valid: boolean; discount: number } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const plan = PLAN_CONFIG[selectedPlan];

  // 处理优惠码验证
  const handleCouponCheck = async () => {
    if (!couponCode) return;

    setCheckingCoupon(true);
    try {
      const response = await fetch(`/api/coupon/validate?code=${couponCode}`);
      const data = await response.json();
      setCouponValid({
        valid: data.valid,
        discount: data.discount || 0
      });
    } catch {
      setCouponValid({ valid: false, discount: 0 });
    } finally {
      setCheckingCoupon(false);
    }
  };

  // 计算最终价格
  const calculateFinalPrice = () => {
    let price = plan.price;
    if (couponValid?.valid && couponValid.discount > 0) {
      price = price * (1 - couponValid.discount / 100);
    }
    return price.toFixed(2);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.replace(loginRedirectHref);
    }
  }, [authLoading, loginRedirectHref, user]);

  useEffect(() => {
    if (user) {
      return;
    }

    const timer = window.setTimeout(() => {
      window.location.replace(loginRedirectHref);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [loginRedirectHref, user]);

  // 处理订阅
  const handleSubscribe = async () => {
    if (!user) {
      window.location.href = loginRedirectHref;
      return;
    }

    const params = new URLSearchParams(buildEntryQuery(flowEntryParams));
    params.set('plan', selectedPlan);
    router.push(`/payment?${params.toString()}`);
  };

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-warm-500 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-gray-500">正在检查登录状态...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-warm-500 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-gray-500">正在跳转到登录页...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-warm-500 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>重试</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-white to-orange-50">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <PageHeader
          title={isPro ? '会员中心' : '升级会员'}
          description={isPro ? '查看你的会员权益' : '解锁全部学习功能，让学习更高效'}
          icon={Crown}
          iconColor="text-yellow-500"
        />
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-24">
        {flowEntryParams.redirect ? (
          <Card className="mb-6 border-warm-200 bg-warm-50/90">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-warm-900">支付成功后会回到原学习动作</p>
                <p className="mt-1 text-sm text-warm-700">这次升级不会打断你当前的学习路径。</p>
              </div>
              <Button
                variant="outline"
                className="border-warm-200 hover:bg-warm-100"
                onClick={() => router.push(flowEntryParams.redirect!)}
              >
                返回原任务
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {/* 当前订阅状态 */}
        {isPro && subscription?.current_plan && (
          <Card className="mb-6 bg-gradient-to-r from-warm-500 to-orange-400 border-0 shadow-lg">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-yellow-200" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm">当前会员</p>
                    <p className="text-white font-bold text-lg">
                      {subscription.current_plan.plan_name || '高级会员'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-white/20 text-white border-white/30">
                    有效期至 {subscription.current_plan?.expires_at
                      ? new Date(subscription.current_plan.expires_at).toLocaleDateString('zh-CN')
                      : '永久'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 套餐选择 */}
        {!isPro && (
          <>
            <div className="mb-6">
              <h2 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                选择套餐
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {Object.entries(PLAN_CONFIG).map(([key, p]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedPlan(key as keyof typeof PLAN_CONFIG)}
                    className={cn(
                      'relative p-4 rounded-xl border-2 transition-all duration-300',
                      selectedPlan === key
                        ? 'border-warm-500 bg-warm-50 shadow-md'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    )}
                  >
                    {p.badge && (
                      <Badge className={cn(
                        'absolute -top-2 left-1/2 -translate-x-1/2 text-white text-xs whitespace-nowrap',
                        p.badgeColor || 'bg-warm-500'
                      )}>
                        {p.badge}
                      </Badge>
                    )}
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900 mb-1">{p.name}</p>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-2xl font-bold text-warm-600">¥{p.price}</span>
                        <span className="text-xs text-gray-500">/{p.period}</span>
                      </div>
                      <p className="text-xs text-gray-400 line-through mt-1">
                        ¥{p.originalPrice}
                      </p>
                      <Badge variant="secondary" className="mt-2 text-xs bg-green-100 text-green-700">
                        省{p.discount}%
                      </Badge>
                    </div>
                    {selectedPlan === key && (
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-warm-500 flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 优惠码 */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Gift className="w-4 h-4 text-warm-500" />
                  优惠码
                </h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="输入优惠码"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponValid(null);
                    }}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-warm-500 focus:border-transparent"
                  />
                  <Button
                    variant="outline"
                    onClick={handleCouponCheck}
                    disabled={!couponCode || checkingCoupon}
                    size="sm"
                  >
                    {checkingCoupon ? '验证中...' : '验证'}
                  </Button>
                </div>
                {couponValid && (
                  <div className={cn(
                    "mt-2 text-sm flex items-center gap-1",
                    couponValid.valid ? "text-green-600" : "text-red-500"
                  )}>
                    {couponValid.valid ? (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        优惠码有效，立减 {couponValid.discount}%
                      </>
                    ) : (
                      '优惠码无效或已过期'
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 价格汇总 */}
            <Card className="mb-6 bg-gradient-to-r from-warm-50 to-orange-50 border-warm-200">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">原价</span>
                    <span className="text-gray-400 line-through">¥{plan.originalPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">套餐优惠</span>
                    <span className="text-green-600">-¥{(plan.originalPrice - plan.price).toFixed(2)}</span>
                  </div>
                  {couponValid?.valid && couponValid.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">优惠码</span>
                      <span className="text-green-600">-{couponValid.discount}%</span>
                    </div>
                  )}
                  <div className="border-t border-warm-200 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">实付金额</span>
                      <div className="text-right">
                        <span className="text-3xl font-bold text-warm-600">¥{calculateFinalPrice()}</span>
                        <span className="text-sm text-gray-500 ml-1">/{plan.period}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* 功能对比 */}
        <SubscriptionFeatures
          currentPlan={subscription?.current_plan?.plan_code || 'free'}
          onUpgrade={() => {
            const params = new URLSearchParams(buildEntryQuery(flowEntryParams));
            params.set('plan', selectedPlan);
            router.push(`/payment?${params.toString()}`);
          }}
        />

        {/* 底部订阅按钮 */}
        {!isPro && (
          <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t p-4 z-20">
            <div className="max-w-2xl mx-auto">
              <Button
                onClick={handleSubscribe}
                className="w-full h-14 text-lg bg-gradient-to-r from-warm-500 to-orange-500 hover:from-warm-600 hover:to-orange-600 shadow-lg"
              >
                <Crown className="w-5 h-5 mr-2" />
                立即订阅 ¥{calculateFinalPrice()}/{plan.period}
              </Button>
              {flowEntryParams.redirect ? (
                <Button
                  variant="ghost"
                  onClick={() => router.push(flowEntryParams.redirect!)}
                  className="mt-2 w-full text-warm-700 hover:bg-warm-50"
                >
                  先回原任务
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              ) : null}
              <div className="flex items-center justify-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Shield className="w-3 h-3" />
                  安全支付
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  随时取消
                </span>
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Gift className="w-3 h-3" />
                  7天退款
                </span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
