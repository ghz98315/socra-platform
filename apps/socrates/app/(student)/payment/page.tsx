'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Clock,
  CreditCard,
  Gift,
  Loader2,
  Shield,
  Smartphone,
} from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PLANS = {
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
  },
  yearly: {
    id: 'pro_yearly',
    name: '年度会员',
    price: 239.9,
    originalPrice: 598.8,
    period: '年',
    discount: 60,
    badge: '最划算',
  },
} as const;

const BENEFITS = [
  '不限量 AI 问题复盘与追问',
  '更深入的错因分析与解法拆解',
  '周报与月报学习反馈',
  '作文批改与润色建议',
  '学习规划与执行工具',
  '完整会员权益与成长记录',
];

type PlanKey = keyof typeof PLANS;

function PaymentContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan');
  const defaultPlan: PlanKey =
    initialPlan === 'monthly' || initialPlan === 'quarterly' || initialPlan === 'yearly'
      ? initialPlan
      : 'quarterly';

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(defaultPlan);
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>(
    'idle'
  );
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = PLANS[selectedPlan];

  const finalPrice = (() => {
    if (couponStatus !== 'valid' || couponDiscount <= 0) {
      return plan.price;
    }

    return Number((plan.price * (1 - couponDiscount / 100)).toFixed(2));
  })();

  const handleCouponCheck = async () => {
    if (!couponCode.trim()) {
      return;
    }

    setCouponStatus('checking');
    setError(null);

    try {
      const response = await fetch(`/api/coupon/validate?code=${encodeURIComponent(couponCode)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '优惠码校验失败');
      }

      if (data.valid) {
        setCouponStatus('valid');
        setCouponDiscount(Number(data.discount) || 0);
        return;
      }

      setCouponStatus('invalid');
      setCouponDiscount(0);
    } catch (err: any) {
      setCouponStatus('invalid');
      setCouponDiscount(0);
      setError(err.message || '优惠码校验失败');
    }
  };

  const handlePayment = async () => {
    if (!user) {
      router.push('/login?redirect=/payment');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestBody = {
        user_id: user.id,
        plan_code: plan.id,
        coupon_code: couponStatus === 'valid' ? couponCode.trim().toUpperCase() : null,
        payment_method: paymentMethod,
      };

      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || '创建订单失败');
      }

      const redirectUrl =
        orderData.redirectUrl ||
        orderData.payment?.redirectUrl ||
        `/payment/success?order_id=${orderData.orderId}`;

      if (
        paymentMethod === 'wechat' &&
        (orderData.wechatPayParams || orderData.payment?.wechatPayParams)
      ) {
        router.push(redirectUrl);
        return;
      }

      if (paymentMethod === 'alipay') {
        const alipayUrl = orderData.alipayUrl || orderData.payment?.alipayUrl || redirectUrl;
        window.location.href = alipayUrl;
        return;
      }

      router.push(redirectUrl);
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || '发起支付失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 to-white pb-24">
      <div className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-lg items-center gap-4 px-4 py-4">
          <button onClick={() => router.back()} className="rounded-full p-2 hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">确认订阅与支付</h1>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 py-6">
        <div className="mb-6">
          <h2 className="mb-3 text-sm font-medium text-gray-700">选择套餐</h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(PLANS).map(([key, currentPlan]) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key as PlanKey)}
                className={cn(
                  'relative rounded-xl border-2 p-4 text-left transition-all',
                  selectedPlan === key
                    ? 'border-warm-500 bg-warm-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {currentPlan.badge ? (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-warm-500 text-white text-xs">
                    {currentPlan.badge}
                  </Badge>
                ) : null}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">{currentPlan.name}</p>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-warm-600">¥{currentPlan.price}</span>
                    <span className="text-xs text-gray-500">/{currentPlan.period}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-400 line-through">
                    ¥{currentPlan.originalPrice}
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    省 {currentPlan.discount}%
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="mb-3 font-medium text-gray-900">会员权益</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-start gap-2">
                  <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                  <p className="text-sm text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="mb-3 flex items-center gap-2 font-medium text-gray-900">
              <Gift className="h-4 w-4" />
              优惠码
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入优惠码"
                value={couponCode}
                onChange={(event) => {
                  setCouponCode(event.target.value.toUpperCase());
                  setCouponStatus('idle');
                  setCouponDiscount(0);
                }}
                className="flex-1 rounded-lg border px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-warm-500"
              />
              <Button
                variant="outline"
                onClick={handleCouponCheck}
                disabled={!couponCode.trim() || couponStatus === 'checking'}
              >
                {couponStatus === 'checking' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '验证'
                )}
              </Button>
            </div>
            {couponStatus === 'valid' ? (
              <p className="mt-2 flex items-center gap-1 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                优惠码可用，优惠 {couponDiscount}%
              </p>
            ) : null}
            {couponStatus === 'invalid' ? (
              <p className="mt-2 flex items-center gap-1 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                优惠码无效或已失效。
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="mb-3 font-medium text-gray-900">支付方式</h3>
            <div className="space-y-2">
              <button
                onClick={() => setPaymentMethod('wechat')}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border-2 p-3 transition-all',
                  paymentMethod === 'wechat'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded bg-green-500">
                  <Smartphone className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">微信支付</span>
                {paymentMethod === 'wechat' ? (
                  <CheckCircle className="ml-auto h-5 w-5 text-green-500" />
                ) : null}
              </button>
              <button
                onClick={() => setPaymentMethod('alipay')}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg border-2 p-3 transition-all',
                  paymentMethod === 'alipay'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-500">
                  <CreditCard className="h-4 w-4 text-white" />
                </div>
                <span className="font-medium">支付宝</span>
                {paymentMethod === 'alipay' ? (
                  <CheckCircle className="ml-auto h-5 w-5 text-blue-500" />
                ) : null}
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 border-warm-200 bg-warm-50">
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
              {couponStatus === 'valid' && couponDiscount > 0 ? (
                <div className="flex justify-between">
                  <span className="text-gray-600">优惠码</span>
                  <span className="text-green-600">-{couponDiscount}%</span>
                </div>
              ) : null}
              <div className="mt-2 border-t border-warm-200 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">实付金额</span>
                  <span className="text-2xl font-bold text-warm-600">¥{finalPrice}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error ? (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        ) : null}

        <div className="mb-4 flex items-center justify-center gap-4 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            安全支付
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            随时取消
          </span>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4">
        <div className="mx-auto max-w-lg">
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="h-12 w-full text-lg bg-gradient-to-r from-warm-500 to-warm-600 hover:from-warm-600 hover:to-warm-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                正在发起支付...
              </>
            ) : (
              `确认支付 ¥${finalPrice}`
            )}
          </Button>
          <p className="mt-2 text-center text-xs text-gray-400">
            继续即表示你同意会员服务相关条款。
          </p>
        </div>
      </div>
    </div>
  );
}

function PaymentLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-warm-500" />
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentLoading />}>
      <PaymentContent />
    </Suspense>
  );
}
