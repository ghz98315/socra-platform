'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  BookOpen,
  PenTool,
  Calendar,
  Brain,
  Target,
  TrendingUp,
  Users,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle,
  Menu,
  X,
  Crown,
  Zap
} from 'lucide-react';
import Image from 'next/image';

// =====================================================
// 风格 A：科技简约风
// =====================================================
function StyleA() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const products = [
    {
      icon: Brain,
      title: '苏格拉底 AI 辅导',
      description: '上传错题，AI 引导你独立思考，不是给答案，而是教你思路',
      features: ['智能题目识别', '苏格拉底式引导', '个性化学习路径'],
      link: 'https://socra.cn',
      color: 'bg-blue-500',
    },
    {
      icon: PenTool,
      title: '作文批改',
      description: 'AI 智能批改作文，提供评分、润色建议和结构分析',
      features: ['智能评分', '润色建议', '结构优化'],
      link: 'https://essay.socra.cn',
      color: 'bg-purple-500',
    },
    {
      icon: Calendar,
      title: '学习规划',
      description: '智能排期，要事优先，抓重点难点先完成',
      features: ['智能排期', '要事优先', '进度跟踪'],
      link: 'https://planner.socra.cn',
      color: 'bg-green-500',
    },
  ];

  const features = [
    { icon: Sparkles, title: 'AI 识别', description: '拍照上传，智能识别题目内容' },
    { icon: Brain, title: '引导思考', description: '苏格拉底式提问，培养独立思考' },
    { icon: Target, title: '精准定位', description: '找到薄弱点，针对性提升' },
    { icon: TrendingUp, title: '学习报告', description: '可视化学习数据，见证进步' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Socrates" width={32} height={32} />
            <span className="font-semibold text-xl">Socrates</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#products" className="text-gray-600 hover:text-gray-900 transition">产品</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">定价</a>
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition">功能</a>
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition">关于</a>
            <Button asChild>
              <a href="https://socra.cn">开始使用</a>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-6 py-4 space-y-4">
            <a href="#products" className="block text-gray-600 hover:text-gray-900">产品</a>
            <a href="#pricing" className="block text-gray-600 hover:text-gray-900">定价</a>
            <a href="#features" className="block text-gray-600 hover:text-gray-900">功能</a>
            <a href="#about" className="block text-gray-600 hover:text-gray-900">关于</a>
            <Button className="w-full" asChild>
              <a href="https://socra.cn">开始使用</a>
            </Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            AI 驱动的智能学习平台
          </div>

          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
            AI 引导学习
            <br />
            <span className="text-blue-600">培养独立思考</span>
          </h1>

          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            告别题海战术和无效时间浪费。Socrates 用 AI 引导你思考，
            让每一次学习都更高效、更有价值。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8" asChild>
              <a href="https://socra.cn">
                免费开始
                <ChevronRight className="w-5 h-5 ml-1" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <a href="#pricing">查看定价</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">产品矩阵</h2>
            <p className="text-gray-600 text-lg">三款产品，覆盖学习全场景</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {products.map((product) => (
              <Card key={product.title} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className={`w-14 h-14 ${product.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <product.icon className="w-7 h-7 text-white" />
                  </div>

                  <h3 className="text-xl font-semibold mb-3">{product.title}</h3>
                  <p className="text-gray-600 mb-6">{product.description}</p>

                  <ul className="space-y-2 mb-6">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button variant="outline" className="w-full" asChild>
                    <a href={product.link}>
                      立即体验
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">会员订阅</h2>
            <p className="text-gray-600 text-lg">选择适合你的学习方案</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Standard */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">Standard</h3>
                  <div className="text-4xl font-bold text-gray-900">免费</div>
                  <p className="text-gray-500 text-sm mt-1">基础功能</p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    每日50次AI对话
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    数学/语文/英语支持
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    基础错题分析
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    学习进度跟踪
                  </li>
                </ul>

                <Button variant="outline" className="w-full" asChild>
                  <a href="https://socra.cn/register">免费注册</a>
                </Button>
              </CardContent>
            </Card>

            {/* Pro - Popular */}
            <Card className="border-2 border-blue-500 shadow-xl relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" />热门
                </span>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold">Pro</h3>
                    <Crown className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900">¥79.9<span className="text-lg font-normal text-gray-500">/季</span></div>
                  <p className="text-gray-500 text-sm mt-1">季度会员</p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    无限AI对话次数
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    所有学科支持
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    高级错题分析
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    个性化学习报告
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-blue-500" />
                    优先客服支持
                  </li>
                </ul>

                <Button className="w-full bg-blue-600 hover:bg-blue-700" asChild>
                  <a href="https://socra.cn/subscription">立即订阅</a>
                </Button>
              </CardContent>
            </Card>

            {/* Yearly */}
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold mb-2">年度会员</h3>
                  <div className="text-4xl font-bold text-gray-900">¥239.9<span className="text-lg font-normal text-gray-500">/年</span></div>
                  <p className="text-green-600 text-sm mt-1">省¥100+</p>
                </div>

                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    包含Pro全部权益
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    专属学习规划顾问
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    优先新功能体验
                  </li>
                  <li className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    家庭共享(最多3人)
                  </li>
                </ul>

                <Button variant="outline" className="w-full border-green-500 text-green-600 hover:bg-green-50" asChild>
                  <a href="https://socra.cn/subscription">选择年度</a>
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              月度会员 ¥29.9/月 · 季度会员 ¥79.9/季 · 年度会员 ¥239.9/年
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">核心功能</h2>
            <p className="text-gray-600 text-lg">AI 技术，让学习更智能</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">关于 Socrates</h2>
          <p className="text-lg text-gray-600 mb-8">
            我们相信，学会思考比学会答案更重要。
            Socrates 采用苏格拉底式教学法，通过提问引导学生自己思考，
            而不是直接给出答案。每一次学习，都是一次思维的锻炼。
          </p>
          <div className="flex items-center justify-center gap-8 text-gray-600">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>面向 K12 学生</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>节省 50% 学习时间</span>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            准备好开始了吗？
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            免费注册，立即体验 AI 引导学习的魅力
          </p>
          <Button size="lg" variant="secondary" className="text-lg px-8" asChild>
            <a href="https://socra.cn">
              免费开始
              <ChevronRight className="w-5 h-5 ml-1" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo.png" alt="Socrates" width={28} height={28} />
                <span className="font-semibold text-white text-lg">Socrates</span>
              </div>
              <p className="text-sm">AI 引导学习，培养独立思考</p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">产品</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="https://socra.cn" className="hover:text-white transition">苏格拉底 AI 辅导</a></li>
                <li><a href="https://essay.socra.cn" className="hover:text-white transition">作文批改</a></li>
                <li><a href="https://planner.socra.cn" className="hover:text-white transition">学习规划</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">联系我们</h4>
              <ul className="space-y-2 text-sm">
                <li>公众号：工程爸的AI教育工厂</li>
                <li>微信：ghz98315</li>
                <li>邮箱：ghz007@hotmail.com</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} Socrates. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// =====================================================
// 风格 B：教育温馨风
// =====================================================
function StyleB() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 已上线产品
  const products = [
    {
      icon: Brain,
      title: '苏格拉底 AI 辅导',
      description: '上传错题，AI 引导你独立思考，不是给答案，而是教你思路',
      features: ['智能题目识别', '苏格拉底式引导', '个性化学习路径', '复习计划生成'],
      link: 'https://socra.cn',
      gradient: 'from-orange-400 to-pink-500',
      status: 'online' as const,
    },
    {
      icon: PenTool,
      title: '作文批改',
      description: 'AI 智能批改作文，提供评分、润色建议和结构分析',
      features: ['智能评分', '润色建议', '结构优化', '语法检查'],
      link: 'https://essay.socra.cn',
      gradient: 'from-purple-400 to-indigo-500',
      status: 'online' as const,
    },
    {
      icon: Calendar,
      title: '学习规划',
      description: '智能排期，要事优先，抓重点难点先完成',
      features: ['智能排期', '要事优先', '进度跟踪', '提醒通知'],
      link: 'https://planner.socra.cn',
      gradient: 'from-green-400 to-teal-500',
      status: 'online' as const,
    },
  ];

  // 即将上线产品（预留）
  const upcomingProducts = [
    { title: '英语口语练习', emoji: '🗣️' },
    { title: '数学公式推导', emoji: '📐' },
    { title: '物理实验模拟', emoji: '⚗️' },
    { title: '化学方程式配平', emoji: '🧪' },
    { title: '历史时间线', emoji: '📜' },
    { title: '地理知识图谱', emoji: '🌍' },
    { title: '更多产品...', emoji: '🚀' },
  ];

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
            <a href="#pricing" className="text-gray-600 hover:text-orange-500 transition">定价</a>
            <a href="#about" className="text-gray-600 hover:text-orange-500 transition">关于</a>
            <Button className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" asChild>
              <a href="https://socra.cn">开始学习</a>
            </Button>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white px-6 py-4 space-y-4 border-t">
            <a href="#products" className="block text-gray-600">产品</a>
            <a href="#pricing" className="block text-gray-600">定价</a>
            <a href="#about" className="block text-gray-600">关于</a>
            <Button className="w-full bg-gradient-to-r from-orange-500 to-pink-500" asChild>
              <a href="https://socra.cn">开始学习</a>
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
            <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" asChild>
              <a href="https://socra.cn">
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

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">会员订阅</h2>
            <p className="text-gray-600">选择适合孩子的学习方案</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Standard */}
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Standard</h3>
                <div className="text-4xl font-bold text-gray-900">免费</div>
                <p className="text-gray-500 text-sm mt-1">基础功能</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  每日50次AI对话
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  数学/语文/英语支持
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  基础错题分析
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  学习进度跟踪
                </li>
              </ul>

              <Button variant="outline" className="w-full rounded-full" asChild>
                <a href="https://socra.cn/register">免费注册</a>
              </Button>
            </div>

            {/* Pro - Popular */}
            <div className="bg-gradient-to-b from-orange-50 to-pink-50 rounded-3xl p-8 shadow-xl relative border-2 border-orange-200">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-medium px-4 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" />最受欢迎
                </span>
              </div>
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold">Pro</h3>
                  <Crown className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">¥79.9<span className="text-lg font-normal text-gray-500">/季</span></div>
                <p className="text-gray-500 text-sm mt-1">季度会员</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                  无限AI对话次数
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                  所有学科支持
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                  高级错题分析
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                  个性化学习报告
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                  优先客服支持
                </li>
              </ul>

              <Button className="w-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" asChild>
                <a href="https://socra.cn/subscription">立即订阅</a>
              </Button>
            </div>

            {/* Yearly */}
            <div className="bg-white rounded-3xl p-8 shadow-lg">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">年度会员</h3>
                <div className="text-4xl font-bold text-gray-900">¥239.9<span className="text-lg font-normal text-gray-500">/年</span></div>
                <p className="text-green-600 text-sm mt-1">省¥100+</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  包含Pro全部权益
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  专属学习规划顾问
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  优先新功能体验
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  家庭共享(最多3人)
                </li>
              </ul>

              <Button variant="outline" className="w-full rounded-full border-green-500 text-green-600 hover:bg-green-50" asChild>
                <a href="https://socra.cn/subscription">选择年度</a>
              </Button>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              月度会员 ¥29.9/月 · 季度会员 ¥79.9/季 · 年度会员 ¥239.9/年
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-6 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold mb-6 text-center">关于 Socrates</h2>
            <p className="text-lg text-gray-700 text-center leading-relaxed">
              我们相信每个孩子都有独立思考的能力。Socrates 采用苏格拉底式教学法，
              通过提问引导孩子自己找到答案，培养终身受益的思维能力。
            </p>

            <div className="mt-10 grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow">
                  <BookOpen className="w-6 h-6 text-orange-500" />
                </div>
                <div className="font-medium">引导式学习</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow">
                  <Target className="w-6 h-6 text-pink-500" />
                </div>
                <div className="font-medium">精准定位</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow">
                  <TrendingUp className="w-6 h-6 text-purple-500" />
                </div>
                <div className="font-medium">持续进步</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">开始孩子的智能学习之旅</h2>
          <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600" asChild>
            <a href="https://socra.cn">
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

// =====================================================
// 风格 C：活力年轻风
// =====================================================
function StyleC() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const products = [
    {
      icon: Brain,
      title: '苏格拉底 AI 辅导',
      description: '拍照上传错题，AI 引导你思考',
      link: 'https://socra.cn',
      emoji: '🧠',
    },
    {
      icon: PenTool,
      title: '作文批改',
      description: 'AI 批改评分，一键润色优化',
      link: 'https://essay.socra.cn',
      emoji: '✍️',
    },
    {
      icon: Calendar,
      title: '学习规划',
      description: '智能排期，抓重点先完成',
      link: 'https://planner.socra.cn',
      emoji: '📅',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Socrates" width={32} height={32} />
            <span className="font-bold text-xl">Socrates</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#products" className="text-gray-400 hover:text-white transition">产品</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition">定价</a>
            <a href="#about" className="text-gray-400 hover:text-white transition">关于</a>
            <Button className="bg-white text-black hover:bg-gray-200" asChild>
              <a href="https://socra.cn">开始使用</a>
            </Button>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-black/90 px-6 py-4 space-y-4 border-t border-white/10">
            <a href="#products" className="block text-gray-400">产品</a>
            <a href="#pricing" className="block text-gray-400">定价</a>
            <a href="#about" className="block text-gray-400">关于</a>
            <Button className="w-full bg-white text-black" asChild>
              <a href="https://socra.cn">开始使用</a>
            </Button>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-sm font-medium mb-8 backdrop-blur">
            <span className="animate-pulse">🚀</span>
            AI 驱动的学习革命
          </div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            AI 引导学习
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">
              培养独立思考
            </span>
          </h1>

          <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            告别题海战术，让 AI 成为你的私人学习教练。
            学会思考，比学会答案更重要。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" asChild>
              <a href="https://socra.cn">
                立即开始
                <ChevronRight className="w-5 h-5 ml-1" />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 border-white/20 text-white hover:bg-white/10" asChild>
              <a href="#products">了解更多</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">产品矩阵</h2>
            <p className="text-gray-400 text-lg">一站式学习解决方案</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {products.map((product, index) => (
              <a
                key={product.title}
                href={product.link}
                className="group relative bg-white/5 rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative">
                  <div className="text-5xl mb-6">{product.emoji}</div>
                  <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
                  <p className="text-gray-400">{product.description}</p>

                  <div className="mt-6 flex items-center text-sm text-purple-400 group-hover:text-purple-300">
                    <span>立即体验</span>
                    <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">会员订阅</h2>
            <p className="text-gray-400 text-lg">解锁全部学习潜能</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Standard */}
            <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">Standard</h3>
                <div className="text-4xl font-bold text-white">免费</div>
                <p className="text-gray-500 text-sm mt-1">基础功能</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  每日50次AI对话
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  数学/语文/英语支持
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  基础错题分析
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  学习进度跟踪
                </li>
              </ul>

              <Button variant="outline" className="w-full rounded-full border-white/20 text-white hover:bg-white/10" asChild>
                <a href="https://socra.cn/register">免费注册</a>
              </Button>
            </div>

            {/* Pro - Popular */}
            <div className="bg-gradient-to-b from-purple-900/50 to-pink-900/50 rounded-3xl p-8 border border-purple-500/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-medium px-4 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-3 h-3" />热门
                </span>
              </div>
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <h3 className="text-xl font-semibold">Pro</h3>
                  <Crown className="w-5 h-5 text-yellow-500" />
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-500 to-orange-400 bg-clip-text text-transparent">¥79.9<span className="text-lg font-normal text-gray-400">/季</span></div>
                <p className="text-gray-500 text-sm mt-1">季度会员</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  无限AI对话次数
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  所有学科支持
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  高级错题分析
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  个性化学习报告
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-300">
                  <CheckCircle className="w-4 h-4 text-purple-400" />
                  优先客服支持
                </li>
              </ul>

              <Button className="w-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" asChild>
                <a href="https://socra.cn/subscription">立即订阅</a>
              </Button>
            </div>

            {/* Yearly */}
            <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">年度会员</h3>
                <div className="text-4xl font-bold text-white">¥239.9<span className="text-lg font-normal text-gray-400">/年</span></div>
                <p className="text-green-400 text-sm mt-1">省¥100+</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  包含Pro全部权益
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  专属学习规划顾问
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  优先新功能体验
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  家庭共享(最多3人)
                </li>
              </ul>

              <Button variant="outline" className="w-full rounded-full border-green-500/50 text-green-400 hover:bg-green-500/10" asChild>
                <a href="https://socra.cn/subscription">选择年度</a>
              </Button>
            </div>
          </div>

          <div className="text-center mt-8">
            <p className="text-gray-500 text-sm">
              月度会员 ¥29.9/月 · 季度会员 ¥79.9/季 · 年度会员 ¥239.9/年
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-3xl p-8 md:p-12 border border-white/10">
            <h2 className="text-3xl font-bold mb-6 text-center">关于 Socrates</h2>
            <p className="text-lg text-gray-300 text-center leading-relaxed mb-8">
              我们相信，学会思考比学会答案更重要。Socrates 采用苏格拉底式教学法，
              通过 AI 引导你独立思考，培养受益终身的学习能力。
            </p>

            <div className="grid md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl mb-2">🎯</div>
                <div className="font-medium">精准定位</div>
                <div className="text-sm text-gray-400">找到薄弱点</div>
              </div>
              <div>
                <div className="text-3xl mb-2">💡</div>
                <div className="font-medium">引导思考</div>
                <div className="text-sm text-gray-400">不直接给答案</div>
              </div>
              <div>
                <div className="text-3xl mb-2">📈</div>
                <div className="font-medium">持续进步</div>
                <div className="text-sm text-gray-400">可视化成长</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            准备好改变学习方式了吗？
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            免费开始，体验 AI 引导学习的力量
          </p>
          <Button size="lg" className="text-lg px-10 bg-white text-black hover:bg-gray-200" asChild>
            <a href="https://socra.cn">
              免费开始
              <ChevronRight className="w-5 h-5 ml-1" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image src="/logo.png" alt="Socrates" width={28} height={28} />
                <span className="font-bold text-lg">Socrates</span>
              </div>
              <p className="text-sm text-gray-500">AI 引导学习，培养独立思考</p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">产品</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="https://socra.cn" className="hover:text-white transition">苏格拉底 AI 辅导</a></li>
                <li><a href="https://essay.socra.cn" className="hover:text-white transition">作文批改</a></li>
                <li><a href="https://planner.socra.cn" className="hover:text-white transition">学习规划</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">联系我们</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>公众号：工程爸的AI教育工厂</li>
                <li>微信：ghz98315</li>
                <li>邮箱：ghz007@hotmail.com</li>
              </ul>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>&copy; {new Date().getFullYear()} Socrates. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// =====================================================
// Main Export
// =====================================================
interface LandingPageProps {
  initialStyle?: 'A' | 'B' | 'C';
}

export default function LandingPage({ initialStyle = 'A' }: LandingPageProps) {
  if (initialStyle === 'A') return <StyleA />;
  if (initialStyle === 'B') return <StyleB />;
  return <StyleC />;
}
