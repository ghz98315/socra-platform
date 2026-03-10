// =====================================================
// Project Socrates - Payment Success Page
// 支付成功页面
// =====================================================

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Crown, Sparkles, ArrowRight, Gift, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';

// Pro会员权益
const proBenefits = [
  '无限AI对话次数',
  '所有学科支持',
  '高级错题分析',
  '个性化学习报告',
  '优先客服支持'
];

// Standard会员权益
const standardBenefits = [
  '每日50次AI对话',
  '数学/语文/英语支持',
  '基础错题分析',
  '学习进度跟踪'
];

// 内部组件 - 使用 useSearchParams
function PaymentSuccessContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  // 获取URL参数
  const planName = searchParams.get('plan') || 'pro';
  const amount = searchParams.get('amount') || '99';

  // 判断是否为Pro会员
  const isPro = planName.toLowerCase() === 'pro';

  // 根据套餐类型获取权益
  const benefits = isPro ? proBenefits : standardBenefits;

  // 获取套餐显示名称
  const getPlanDisplayName = () => {
    const plan = planName.toLowerCase();
    if (plan === 'monthly' || plan === 'pro') return '月度会员';
    if (plan === 'quarterly') return '季度会员';
    if (plan === 'yearly') return '年费会员';
    return '会员';
  };

  // 格式化价格显示
  const formatPrice = () => {
    const plan = planName.toLowerCase();
    if (plan === 'monthly' || plan === 'pro') return `¥${amount}/月`;
    if (plan === 'quarterly') return `¥${Number(amount) * 3}/季`;
    if (plan === 'yearly') return `¥${Number(amount) * 12}/年`;
    return `¥${amount}`;
  };

  // 庆祝动画
  useEffect(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval: NodeJS.Timeout = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        return clearInterval(interval);
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#ffd700', '#ff6b00', '#fbbf24', '#ff9500'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ffd700', '#ff6b00', '#fbbf24', '#ff9500'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  // 自动跳转倒计时
  useEffect(() => {
    if (countdown <= 0) {
      router.push('/dashboard');
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(countdown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-white to-orange-50 flex items-center justify-center p-4">
      {/* 装饰背景 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-yellow-200 rounded-full blur-3xl opacity-40" />
        <div className="absolute top-1/2 -left-40 w-60 h-60 bg-gradient-to-br from-yellow-200 to-orange-200 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-60 h-60 bg-gradient-to-br from-orange-300 to-yellow-300 rounded-full blur-3xl opacity-30" />
      </div>

      {/* 主卡片 */}
      <Card className="w-full max-w-md relative z-10 shadow-xl border-0">
        <CardContent className="p-8">
          {/* 成功图标 */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg animate-bounce">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">支付成功</h1>

          <p className="text-gray-600 text-center mb-6">
            恭喜您已成为{' '}
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-semibold">
              {isPro ? (<><Crown className="w-4 h-4" />Pro</>) : ('Standard')}
            </span>{' '}
            会员
          </p>

          {/* 订单详情 */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm text-gray-500">订阅方案</p>
                <p className="text-lg font-bold text-gray-900">{getPlanDisplayName()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">支付金额</p>
                <p className="text-lg font-bold text-orange-600">{formatPrice()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Gift className="w-4 h-4 text-orange-500" />
              <span>感谢您的支持，祝您学习愉快！</span>
            </div>
          </div>

          {/* 权益列表 */}
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              您已解锁以下权益
            </p>
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3 text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => router.push('/dashboard')} className="flex-1">
              返回首页
            </Button>
            <Button onClick={() => router.push('/workbench')} className="flex-1 bg-gradient-to-r from-orange-500 to-warm-500 hover:from-orange-600 hover:to-warm-600 text-white">
              开始学习
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {/* 倒计时提示 */}
          <p className="text-center text-sm text-gray-400 mt-4">
            <span className="text-orange-500 font-medium">{countdown}</span> 秒后自动跳转到首页
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// 加载中组件
function PaymentSuccessLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
        <p className="text-gray-500">加载中...</p>
      </div>
    </div>
  );
}

// 主导出组件 - 使用 Suspense 包装
export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
