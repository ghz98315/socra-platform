// =====================================================
// Socra Platform - Landing Pricing Page
// 定价页面
// =====================================================

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Crown, Sparkles, Zap, Shield, Heart } from 'lucide-react';
import { Button } from '@socra/ui';
import { cn } from '@socra/ui';

const plans = [
  {
    name: '免费版',
    price: 0,
    period: '永久免费',
    description: '适合尝鲜体验',
    features: [
      { text: '每日 3 次 AI 对话', included: true },
      { text: '基础错题管理', included: true },
      { text: '简单复习提醒', included: true },
      { text: '社区基础功能', included: true },
      { text: '高级 AI 对话', included: false },
      { text: '无限错题分析', included: false },
      { text: '智能复习计划', included: false },
      { text: '详细学习报告', included: false },
    ],
    cta: '开始使用',
    popular: false,
  },
  {
    name: 'Pro 会员',
    price: 29,
    period: '月付',
    yearlyPrice: 199,
    yearlyPeriod: '年付',
    description: '适合认真学习者',
    features: [
      { text: '无限 AI 对话学习', included: true },
      { text: '无限错题分析', included: true },
      { text: '艾宾浩斯智能复习', included: true },
      { text: '详细学习报告', included: true },
      { text: 'AI 时间规划助手', included: true },
      { text: '优先客服支持', included: true },
      { text: '专属 Pro 标识', included: true },
      { text: '提前体验新功能', included: true },
    ],
    cta: '立即升级',
    popular: true,
  },
];

const faqs = [
  {
    q: 'Pro 会员可以随时取消吗？',
    a: '是的，您可以随时取消订阅。取消后，您仍可使用 Pro 功能直到当前计费周期结束。',
  },
  {
    q: '年付有什么优惠？',
    a: '选择年付可享受 35% 的折扣，原价 ¥348/年，现仅需 ¥199/年。',
  },
  {
    q: '免费版和 Pro 有什么区别？',
    a: '免费版每天限制 3 次 AI 对话，Pro 会员享有无限对话、智能复习计划、详细学习报告等高级功能。',
  },
  {
    q: '支持哪些支付方式？',
    a: '目前支持微信支付，后续将支持支付宝和银行卡支付。',
  },
];

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-warm-500 to-orange-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-xl text-gray-900">Socrates</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              功能
            </Link>
            <Link href="/pricing" className="text-warm-600 font-medium">
              定价
            </Link>
            <Link href="/login" className="text-gray-600 hover:text-gray-900 transition-colors">
              登录
            </Link>
            <Button asChild className="bg-warm-500 hover:bg-warm-600 text-white">
              <Link href="/register">免费注册</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-20 pb-12 text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            选择适合你的
            <span className="text-warm-500">学习方案</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            从免费开始，随时升级解锁更多功能
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-gray-100 rounded-full p-1">
            <button
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                billingCycle === 'monthly'
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
              onClick={() => setBillingCycle('monthly')}
            >
              月付
            </button>
            <button
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                billingCycle === 'yearly'
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              )}
              onClick={() => setBillingCycle('yearly')}
            >
              年付
              <span className="ml-1 text-xs text-green-600">省35%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative rounded-2xl p-8 transition-all",
                  plan.popular
                    ? "bg-gradient-to-b from-amber-50 to-orange-50 border-2 border-amber-200 shadow-xl shadow-amber-100/50"
                    : "bg-white border border-gray-200 shadow-sm hover:shadow-md"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium">
                      <Sparkles className="w-3 h-3" />
                      最受欢迎
                    </span>
                  </div>
                )}

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-500">{plan.description}</p>
                </div>

                <div className="text-center mb-8">
                  {plan.price === 0 ? (
                    <div className="text-4xl font-bold text-gray-900">免费</div>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold text-gray-900">
                        ¥{billingCycle === 'monthly' ? plan.price : plan.yearlyPrice}
                      </span>
                      <span className="text-gray-500">
                        /{billingCycle === 'monthly' ? '月' : '年'}
                      </span>
                    </div>
                  )}
                  {plan.yearlyPrice && billingCycle === 'yearly' && (
                    <p className="text-sm text-gray-500 mt-1">
                      原价 ¥{plan.price * 12}/年
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      {feature.included ? (
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <X className="w-3 h-3 text-gray-400" />
                        </div>
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          feature.included ? "text-gray-700" : "text-gray-400"
                        )}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={cn(
                    "w-full h-12 text-base font-medium",
                    plan.popular
                      ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-200/50"
                      : "bg-gray-100 hover:bg-gray-200 text-gray-900"
                  )}
                  asChild
                >
                  <Link href={plan.price === 0 ? '/register' : '/subscription'}>
                    {plan.cta}
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Highlight */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            Pro 会员专属权益
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Zap, title: '无限 AI 对话', desc: '随时随地与 AI 进行苏格拉底式学习对话' },
              { icon: Crown, title: '智能复习计划', desc: '艾宾浩斯遗忘曲线，科学安排复习' },
              { icon: Shield, title: '详细学习报告', desc: '全面分析学习数据，发现薄弱点' },
              { icon: Heart, title: '优先支持', desc: '专属客服通道，问题优先解决' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 flex items-center justify-center">
                  <item.icon className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">
            常见问题
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-amber-500 to-orange-500">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            准备好开启高效学习之旅了吗？
          </h2>
          <p className="text-white/90 mb-8">
            立即注册，免费体验核心功能
          </p>
          <Button
            size="lg"
            className="bg-white text-amber-600 hover:bg-gray-100 font-medium px-8"
            asChild
          >
            <Link href="/register">免费开始</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-sm text-gray-500">
          <p>© 2026 Socrates。保留所有权利。</p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-gray-900">隐私政策</Link>
            <Link href="/terms" className="hover:text-gray-900">用户协议</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
