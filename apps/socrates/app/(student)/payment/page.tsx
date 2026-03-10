// =====================================================
// Project Socrates - Payment Page
// 支付页面
// =====================================================

'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Shield,
  Clock,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CreditCard,
  Smartphone,
  Gift,
} from 'lucide-react';

// 套餐配置
const PLANS = {
  monthly: {
    id: 'pro_monthly',
    name: '月度会员',
    price: 29.9,
    originalPrice: 49.9,
    period: '月',
    discount: 40,
    popular: false,
    bestValue: false,
  },
  quarterly: {
    id: 'pro_quarterly',
    name: '季度会员',
    price: 79.9,
    originalPrice: 149.7,
    period: '季',
    discount: 47,
    popular: true,
    bestValue: false,
  },
  yearly: {
    id: 'pro_yearly',
    name: '年度会员',
    price: 239.9,
    originalPrice: 598.8,
    period: '年',
    discount: 60,
    popular: false,
    bestValue: true,
  },
};

// 会员权益
const BENEFITS = [
  { icon: '🎯', title: '无限错题上传', desc: '不限次数上传错题' },
  { icon: '🤖', title: 'AI深度分析', desc: '每题详细解析和变式' },
  { icon: '📊', title: '学习报告', desc: '周报/月报AI分析' },
  { icon: '📝', title: '作文批改', desc: '无限作文AI批改' },
  { icon: '📅', title: '时间规划', desc: 'AI智能排期功能' },
  { icon: '🏆', title: '成就系统', desc: '解锁全部成就徽章' },
];

function PaymentContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'quarterly';

  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLANS>(
    (initialPlan as keyof typeof PLANS) || 'quarterly'
  );
  const [couponCode, setCouponCode] = useState('');
  const [couponStatus, setCouponStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = PLANS[selectedPlan];

  // 验证优惠码
  const handleCouponCheck = async () => {
    if (!couponCode) return;

    setCouponStatus('checking');
    try {
      const response = await fetch(`/api/coupon/validate?code=${couponCode}`);
      const data = await response.json();

      if (data.valid) {
        setCouponStatus('valid');
        setCouponDiscount(data.discount || 0);
      } else {
        setCouponStatus('invalid');
        setCouponDiscount(0);
      }
    } catch {
      setCouponStatus('invalid');
      setCouponDiscount(0);
    }
  };

  // 计算最终价格
  const calculateFinalPrice = () => {
    let price = plan.price;
    if (couponStatus === 'valid' && couponDiscount > 0) {
      price = price * (1 - couponDiscount / 100);
    }
    return price.toFixed(2);
  };

  // 处理支付
  const handlePayment = async () => {
    if (!user) {
      router.push('/login?redirect=/payment');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 创建订单
      const requestBody = {
        user_id: user.id,
        plan_code: plan.id,
        coupon_code: couponStatus === 'valid' ? couponCode : null,
        payment_method: paymentMethod,
      };
      console.log('[Payment] Sending request:', requestBody);

      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!orderResponse.ok) {
        const orderError = await orderResponse.json();
        throw new Error(orderError.error || '创建订单失败');
      }

      const orderData = await orderResponse.json();

      // 调起微信支付
      if (paymentMethod === 'wechat' && orderData.wechatPayParams) {
        // 在实际环境中，这里会调用微信 JSAPI
        // 模拟支付成功跳转
        router.push(`/payment/success?order_id=${orderData.orderId}`);
      } else if (paymentMethod === 'alipay' && orderData.alipayUrl) {
        // 支付宝支付
        window.location.href = orderData.alipayUrl;
      } else {
        // 模拟支付（开发环境）
        setTimeout(() => {
          router.push(`/payment/success?order_id=${orderData.orderId}`);
        }, 1500);
      }
    } catch (err: any) {
      console.error('Payment error:', err);
      setError(err.message || '支付失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">开通会员</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* 套餐选择 */}
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">选择套餐</h2>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(PLANS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key as keyof typeof PLANS)}
                className={cn(
                  'relative p-4 rounded-xl border-2 transition-all',
                  selectedPlan === key
                    ? 'border-warm-500 bg-warm-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                {p.popular && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-warm-500 text-white text-xs">
                    热门
                  </Badge>
                )}
                {p.bestValue && (
                  <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs">
                    最划算
                  </Badge>
                )}
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <div className="mt-2">
                    <span className="text-2xl font-bold text-warm-600">¥{p.price}</span>
                    <span className="text-xs text-gray-500">/{p.period}</span>
                  </div>
                  <p className="text-xs text-gray-400 line-through mt-1">
                    ¥{p.originalPrice}
                  </p>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    省{p.discount}%
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 会员权益 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">会员权益</h3>
            <div className="grid grid-cols-2 gap-3">
              {BENEFITS.map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-lg">{benefit.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{benefit.title}</p>
                    <p className="text-xs text-gray-500">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 优惠码 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Gift className="w-4 h-4" />
              优惠码
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="输入优惠码"
                value={couponCode}
                onChange={(e) => {
                  setCouponCode(e.target.value.toUpperCase());
                  setCouponStatus('idle');
                }}
                className="flex-1 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-warm-500 focus:border-transparent"
              />
              <Button
                variant="outline"
                onClick={handleCouponCheck}
                disabled={!couponCode || couponStatus === 'checking'}
              >
                {couponStatus === 'checking' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  '验证'
                )}
              </Button>
            </div>
            {couponStatus === 'valid' && (
              <p className="mt-2 text-sm text-green-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                优惠码有效，立减 {couponDiscount}%
              </p>
            )}
            {couponStatus === 'invalid' && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                优惠码无效
              </p>
            )}
          </CardContent>
        </Card>

        {/* 支付方式 */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium text-gray-900 mb-3">支付方式</h3>
            <div className="space-y-2">
              <button
                onClick={() => setPaymentMethod('wechat')}
                className={cn(
                  'w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all',
                  paymentMethod === 'wechat'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="w-8 h-8 rounded bg-green-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">微</span>
                </div>
                <span className="font-medium">微信支付</span>
                {paymentMethod === 'wechat' && (
                  <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
                )}
              </button>
              <button
                onClick={() => setPaymentMethod('alipay')}
                className={cn(
                  'w-full p-3 rounded-lg border-2 flex items-center gap-3 transition-all',
                  paymentMethod === 'alipay'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <div className="w-8 h-8 rounded bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">支</span>
                </div>
                <span className="font-medium">支付宝</span>
                {paymentMethod === 'alipay' && (
                  <CheckCircle className="w-5 h-5 text-blue-500 ml-auto" />
                )}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 价格汇总 */}
        <Card className="mb-6 bg-warm-50 border-warm-200">
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
              {couponStatus === 'valid' && couponDiscount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">优惠码</span>
                  <span className="text-green-600">-{couponDiscount}%</span>
                </div>
              )}
              <div className="border-t border-warm-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">实付金额</span>
                  <span className="text-2xl font-bold text-warm-600">
                    ¥{calculateFinalPrice()}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 错误提示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* 安全提示 */}
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400 mb-4">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            安全支付
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            随时取消
          </span>
        </div>
      </div>

      {/* 底部支付按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handlePayment}
            disabled={loading}
            className="w-full h-12 text-lg bg-gradient-to-r from-warm-500 to-warm-600 hover:from-warm-600 hover:to-warm-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                支付中...
              </>
            ) : (
              `立即支付 ¥${calculateFinalPrice()}`
            )}
          </Button>
          <p className="text-xs text-gray-400 text-center mt-2">
            开通即表示同意《会员服务协议》
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-warm-500" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
