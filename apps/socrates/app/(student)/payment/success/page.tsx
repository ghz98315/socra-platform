// =====================================================
// Project Socrates - Payment Success Page
// 支付成功页面
// =====================================================

'use client';

import { useEffect, useState, from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CheckCircle,
  PartyPopper,
  Crown,
  Sparkles,
  ArrowRight,
  Gift,
  Star,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PaymentSuccessPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(3);

  const planName = searchParams.get('plan') || 'Pro 季度会员';
  const amount = searchParams.get('amount') || '79.9';

  // 倒计时自动跳转
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  // 庆祝动画
  useEffect(() => {
    // 触发 confetti
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
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#3b82f6'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#f59e0b', '#fbbf24', '#10b981', '#3b82f6'],
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  const benefits = [
    { icon: '🎯', text: '无限错题上传' },
    { icon: '🤖', text: 'AI深度分析' },
    { icon: '📊', text: '学习报告' },
    { icon: '📝', text: '作文批改' },
    { icon: '📅', text: '时间规划' },
    { icon: '🏆', text: '成就系统' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-white to-orange-50 flex flex-col items-center justify-center p-4">
      {/* 成功图标 */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-warm-400 to-orange-500 flex items-center justify-center shadow-lg animate-bounce">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <div className="absolute -top-2 -right-2">
          <Crown className="w-8 h-8 text-yellow-500 animate-pulse" />
        </div>
      </div>

      {/* 成功消息 */}
      <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
        <Sparkles className="w-6 h-6 text-warm-500" />
        支付成功！
      </h1>
      <p className="text-gray-600 mb-6">
        恭喜！您已成为 Socrates Pro 会员
      </p>

      {/* 订单信息卡片 */}
      <Card className="w-full max-w-sm mb-6 border-warm-200 bg-white/80 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600">套餐</span>
            <span className="font-semibold text-gray-900">{planName}</span>
          </div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600">支付金额</span>
            <span className="font-bold text-warm-600">¥{amount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">支付方式</span>
            <span className="text-gray-900">微信支付</span>
          </div>
        </CardContent>
      </Card>

      {/* 解锁权益 */}
      <Card className="w-full max-w-sm mb-6">
        <CardContent className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Gift className="w-5 h-5 text-warm-500" />
            已解锁 Pro 权益
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-green-50 rounded-lg"
              >
                <span className="text-lg">{benefit.icon}</span>
                <span className="text-sm text-gray-700">{benefit.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 特殊福利提示 */}
      <div className="w-full max-w-sm mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
        <div className="flex items-start gap-3">
          <Star className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-gray-900 mb-1">专属福利</p>
            <p className="text-sm text-gray-600">
              作为 Pro 会员，您可以获得优先客服支持、新功能抢先体验等专属权益
            </p>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="w-full max-w-sm space-y-3">
        <Button
          onClick={() => router.push('/dashboard')}
          className="w-full h-12 bg-gradient-to-r from-warm-500 to-orange-500 hover:from-warm-600 hover:to-orange-600"
        >
          开始学习
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/subscription')}
          className="w-full"
        >
          查看会员详情
        </Button>
      </div>

      {/* 自动跳转提示 */}
      <p className="text-xs text-gray-400 mt-6">
        {countdown} 秒后自动跳转到首页...
      </p>
    </div>
  );
}
