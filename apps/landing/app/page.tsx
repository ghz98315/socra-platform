'use client';

import { useState } from 'react';
import { Button } from '@socra/ui';
import { Card } from '@socra/ui';
import {
  Brain,
  PenTool,
  Calendar,
  BookOpen,
  Target,
  TrendingUp,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';
import Image from 'next/image';
import { FeaturedPostsCarousel } from '../components/FeaturedPostsCarousel';

// 已上线产品
const products = [
  {
    icon: Brain,
    title: '苏格拉底 AI 辅导',
    description: '上传错题，AI 引导你独立思考，不是给答案，而是教你思路',
    features: ['智能题目识别', '苏格拉底式引导', '个性化学习路径', '复习计划生成'],
    link: 'https://socrates.socra.cn',
    gradient: 'from-orange-400 to-pink-500',
  },
  {
    icon: PenTool,
    title: '作文批改',
    description: 'AI 智能批改作文，提供评分、润色建议和结构分析',
    features: ['智能评分', '润色建议', '结构优化', '语法检查'],
    link: 'https://essay.socra.cn',
    gradient: 'from-purple-400 to-indigo-500',
  },
  {
    icon: Calendar,
    title: '学习规划',
    description: '智能排期，要事优先，专注计时，养成高效学习习惯',
    features: ['AI智能排期', '要事优先', '专注计时', '进度跟踪'],
    link: 'https://socrates.socra.cn/planner',
    gradient: 'from-green-400 to-teal-500',
  },
];

// 即将上线产品
const upcomingProducts = [
  { title: '英语口语练习', emoji: '🗣️' },
  { title: '数学公式推导', emoji: '📐' },
  { title: '物理实验模拟', emoji: '⚗️' },
  { title: '化学方程式配平', emoji: '🧪' },
  { title: '历史时间线', emoji: '📜' },
  { title: '地理知识图谱', emoji: '🌍' },
  { title: '更多产品...', emoji: '🚀' },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-blue-50 text-gray-800">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Socrates" width={36} height={36} />
            <span className="font-bold text-xl bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              Socrates
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#products" className="text-gray-600 hover:text-orange-500 transition">产品</a>
            <a href="#about" className="text-gray-600 hover:text-orange-500 transition">关于</a>
            <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white" asChild>
              <a href="https://socrates.socra.cn">开始学习</a>
            </Button>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white px-6 py-4 space-y-4 border-t">
            <a href="#products" className="block text-gray-600">产品</a>
            <a href="#about" className="block text-gray-600">关于</a>
            <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white" asChild>
              <a href="https://socrates.socra.cn">开始学习</a>
            </Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-orange-100 text-orange-600 rounded-full text-sm font-medium">
              陪伴孩子成长的 AI 助手
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            让孩子学会
            <span className="bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
              独立思考
            </span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            不是给答案，而是教思路。Socrates 用 AI 引导孩子主动思考，
            告别无效刷题，让学习更轻松、更高效。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white" asChild>
              <a href="https://socrates.socra.cn">
                立即体验
                <ChevronRight className="w-5 h-5 ml-1" />
              </a>
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 flex justify-center gap-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-500">50%</div>
              <div className="text-sm text-gray-500">节省学习时间</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-500">K12</div>
              <div className="text-sm text-gray-500">全学段覆盖</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">AI</div>
              <div className="text-sm text-gray-500">智能引导</div>
            </div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">我们的产品</h2>
            <p className="text-gray-600">为孩子打造全方位的学习助手</p>
          </div>

          {/* 已上线产品 */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            {products.map((product) => (
              <div
                key={product.title}
                className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${product.gradient} flex items-center justify-center mb-6`}>
                  <product.icon className="w-8 h-8 text-white" />
                </div>

                <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
                <p className="text-gray-600 mb-6">{product.description}</p>

                <ul className="space-y-2 mb-6">
                  {product.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <a
                  href={product.link}
                  className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-600 font-medium transition"
                >
                  立即体验
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>

          {/* 即将上线产品 */}
          <div className="mt-16">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-100 to-pink-100 text-orange-600 rounded-full text-sm font-medium">
                <Sparkles className="w-4 h-4" />
                更多产品即将上线
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {upcomingProducts.map((product, index) => (
                <div
                  key={index}
                  className="bg-white/60 backdrop-blur rounded-2xl p-4 text-center opacity-70 hover:opacity-100 transition-opacity"
                >
                  <div className="text-3xl mb-2">{product.emoji}</div>
                  <div className="text-sm font-medium text-gray-600">{product.title}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 社区精选 */}
      <FeaturedPostsCarousel />

      {/* About */}
      <section id="about" className="py-20 px-6 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6 text-center">关于 Socrates</h2>
            <p className="text-lg text-gray-700 text-center leading-relaxed mb-8">
              我们相信每个孩子都有独立思考的能力。Socrates 采用苏格拉底式教学法，
              通过提问引导孩子自己找到答案，培养终身受益的思维能力。
            </p>

            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow">
                  <BookOpen className="w-6 h-6 text-orange-500" />
                </div>
                <div className="font-medium">引导式学习</div>
                <div className="text-sm text-gray-500">不是给答案</div>
              </div>
              <div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow">
                  <Target className="w-6 h-6 text-pink-500" />
                </div>
                <div className="font-medium">精准定位</div>
                <div className="text-sm text-gray-500">找到薄弱点</div>
              </div>
              <div>
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <div className="font-medium">持续进步</div>
                <div className="text-sm text-gray-500">可视化成长</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">开始孩子的智能学习之旅</h2>
          <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white" asChild>
            <a href="https://socrates.socra.cn">
              免费体验
              <ChevronRight className="w-5 h-5 ml-1" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Image src="/logo.png" alt="Socrates" width={32} height={32} />
            <span className="font-bold text-xl text-white">Socrates</span>
          </div>

          <div className="flex justify-center gap-8 mb-6 text-sm">
            <span>公众号：工程爸的AI教育工厂</span>
            <span>微信：ghz98315</span>
          </div>

          <p className="text-sm">&copy; {new Date().getFullYear()} Socrates. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
