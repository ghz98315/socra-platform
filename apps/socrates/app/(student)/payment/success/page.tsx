'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, CheckCircle, Crown, Gift, Loader2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/contexts/AuthContext';

const PRO_BENEFITS = [
  '不限量 AI 对话与题目复盘',
  '全部支持学科可用',
  '更深入的错因分析',
  '个性化学习报告',
  '优先支持与后续权益',
];

const STANDARD_BENEFITS = [
  '每日 50 次 AI 对话',
  '核心学科支持',
  '基础错因分析',
  '学习进度跟踪',
];

function normalizePlan(planName: string) {
  const plan = planName.toLowerCase();

  if (plan === 'pro_monthly' || plan === 'monthly' || plan === 'pro') {
    return { tier: 'pro', label: '月度会员', cycle: '月' };
  }

  if (plan === 'pro_quarterly' || plan === 'quarterly') {
    return { tier: 'pro', label: '季度会员', cycle: '季' };
  }

  if (plan === 'pro_yearly' || plan === 'yearly') {
    return { tier: 'pro', label: '年度会员', cycle: '年' };
  }

  return { tier: 'standard', label: '会员', cycle: '周期' };
}

function formatAmount(amount: string, cycle: string) {
  const numericAmount = Number(amount);
  if (Number.isNaN(numericAmount)) {
    return `¥${amount}`;
  }

  if (cycle === '周期') {
    return `¥${numericAmount.toFixed(2)}`;
  }

  return `¥${numericAmount.toFixed(2)}/${cycle}`;
}

function PaymentSuccessContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const planName = searchParams.get('plan') || 'pro';
  const amount = searchParams.get('amount') || '99';
  const planMeta = normalizePlan(planName);
  const isPro = planMeta.tier === 'pro';
  const benefits = isPro ? PRO_BENEFITS : STANDARD_BENEFITS;

  useEffect(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        window.clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random() * 0.2 + 0.1, y: Math.random() - 0.2 },
        colors: ['#ffd700', '#ff6b00', '#fbbf24', '#ff9500'],
      });

      confetti({
        ...defaults,
        particleCount,
        origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() - 0.2 },
        colors: ['#ffd700', '#ff6b00', '#fbbf24', '#ff9500'],
      });
    }, 250);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      router.push(user ? '/dashboard' : '/');
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [countdown, router, user]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-warm-50 via-white to-orange-50 p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-gradient-to-br from-orange-200 to-yellow-200 opacity-40 blur-3xl" />
        <div className="absolute -left-40 top-1/2 h-60 w-60 rounded-full bg-gradient-to-br from-yellow-200 to-orange-200 opacity-30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-60 w-60 rounded-full bg-gradient-to-br from-orange-300 to-yellow-300 opacity-30 blur-3xl" />
      </div>

      <Card className="relative z-10 w-full max-w-md border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-green-500 shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </div>

          <h1 className="mb-2 text-center text-2xl font-bold text-gray-900">支付成功</h1>

          <p className="mb-6 text-center text-gray-600">
            你的账号现在已开通
            <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 px-3 py-1 text-sm font-semibold text-orange-600">
              {isPro ? (
                <>
                  <Crown className="h-4 w-4" />
                  Pro 会员
                </>
              ) : (
                '会员'
              )}
            </span>
            权益。
          </p>

          <div className="mb-6 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">套餐</p>
                <p className="text-lg font-bold text-gray-900">{planMeta.label}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">金额</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatAmount(amount, planMeta.cycle)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Gift className="h-4 w-4 text-orange-500" />
              <span>感谢你支持 Socrates 的持续迭代。</span>
            </div>
          </div>

          <div className="mb-6">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
              <Sparkles className="h-4 w-4 text-orange-500" />
              已解锁权益
            </p>
            <div className="space-y-2">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-center gap-3 text-gray-700">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1">
              前往工作台
            </Button>
            <Button
              onClick={() => router.push('/study')}
              className="flex-1 bg-gradient-to-r from-orange-500 to-warm-500 text-white hover:from-orange-600 hover:to-warm-600"
            >
              开始学习
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <p className="mt-4 text-center text-sm text-gray-400">
            页面将在 <span className="font-medium text-orange-500">{countdown}</span> 秒后自动跳转。
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function PaymentSuccessLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-warm-50 via-white to-orange-50 p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="text-gray-500">正在加载支付结果...</p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
