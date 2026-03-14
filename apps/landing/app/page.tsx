'use client';

import { useState } from 'react';
import { Button } from '@socra/ui';
import {
  Brain,
  PenTool,
  Calendar,
  BookOpen,
  Target,
  ChevronRight,
  Sparkles,
  CheckCircle,
  Menu,
  X,
  Crown,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import { FeaturedPostsCarousel } from '../components/FeaturedPostsCarousel';

const roleCards = [
  {
    title: '我是家长',
    description: '想看孩子卡在哪里、怎么进步，以及值不值得长期使用。',
    cta: '看家长关心的效果',
    href: '#results',
  },
  {
    title: '我是学生',
    description: '想知道这个工具怎么帮我做题、改作文、安排复习更省力。',
    cta: '看学生工作台',
    href: '#abilities',
  },
];

const pains = [
  {
    title: '错题一讲就懂，一考又错',
    description: '孩子听懂了答案，但没有建立自己的理解路径。',
  },
  {
    title: '作文知道分数，不知道问题在哪',
    description: '只有结尾点评，很难让孩子知道具体该怎么改。',
  },
  {
    title: '每天学什么、先复习什么，总是靠感觉',
    description: '任务分散、节奏混乱，越努力越容易低效重复。',
  },
];

const scenarios = [
  {
    icon: Brain,
    title: '错题工作台',
    headline: '让不会的题，真正变成会做的题',
    description:
      '上传题目后，AI 不直接给答案，而是一步步引导孩子找到卡点、想清思路、记录问题。',
    bullets: ['减少“看懂了但不会做”', '把一次不会，变成下一次真的会'],
    href: 'https://socrates.socra.cn',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: PenTool,
    title: '作文批改工作台',
    headline: '让作文问题和亮点，直接回到原文位置',
    description:
      '错字、亮点、修改建议不再堆在结尾，而是像批注一样直接落在对应句子上。',
    bullets: ['孩子更容易看懂哪里要改', '家长也能直观看到提升点'],
    href: 'https://essay.socra.cn',
    gradient: 'from-rose-500 to-orange-500',
  },
  {
    icon: Calendar,
    title: '智能复习与计划',
    headline: '让复习和计划不再靠临时想起',
    description:
      '把错题、待完成任务和重点内容自动整理进学习清单，让每天更清楚先做什么。',
    bullets: ['减少无效重复', '把复习真正变成可执行的节奏'],
    href: 'https://socrates.socra.cn/planner',
    gradient: 'from-emerald-500 to-teal-500',
  },
];

const comparisons = [
  {
    title: '错题处理',
    before: '题目讲完就过去，下次遇到类似题还是不会。',
    after: '不会的题会被记录、归类，并进入后续复习清单。',
  },
  {
    title: '作文修改',
    before: '作文只有一段总结，看不出到底哪句话有问题。',
    after: '批注直接对应原文位置，错字、亮点和修改建议更直观。',
  },
  {
    title: '家长感知',
    before: '家长只能不断催，孩子也容易烦。',
    after: '家长能看到重点问题、执行情况和阶段变化。',
  },
];

const loopSteps = ['发现不会', 'AI 引导理解', '记录到错题本', '进入复习计划', '查看反馈变化', '持续优化'];

const searchEntries = [
  {
    title: 'AI 作文批改',
    description: '更直观地看到哪里写得好，哪里需要改。',
    href: 'https://essay.socra.cn',
  },
  {
    title: '错题本怎么高效复习',
    description: '让错题不只是收藏，而是真的被重新掌握。',
    href: 'https://socrates.socra.cn/error-book',
  },
  {
    title: '数学几何题不会怎么办',
    description: '用更清楚的引导方式帮助理解图形与思路。',
    href: 'https://socrates.socra.cn/workbench',
  },
  {
    title: '怎么安排孩子的学习计划',
    description: '把任务和复习节奏排清楚，减少无序感。',
    href: 'https://socrates.socra.cn/planner',
  },
];

const heroHighlights = ['不是替孩子思考', '作文批注直达原文', '错题自动进入复习'];
const heroStats = [
  ['4 个核心场景', '辅导、作文、复习、计划统一串联'],
  ['原文级反馈', '错字、亮点、修改直接落回对应句子'],
  ['更少催促', '家长看到过程，孩子看清下一步'],
];

const pricingPlans = [
  {
    name: '免费版',
    price: '免费',
    note: '先体验核心能力',
    audience: '适合第一次使用，先感受是否真的有帮助',
    features: ['每日基础 AI 使用额度', '错题辅导与作文批改体验', '学习记录与基础追踪'],
    href: 'https://socrates.socra.cn/register',
    cta: '免费注册',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '¥79.9',
    unit: '/季',
    note: '适合高频使用',
    audience: '适合每周高频使用的家庭',
    features: ['更完整的 AI 学习支持', '高级错题分析与复习安排', '更丰富的学习反馈与报告'],
    href: 'https://socrates.socra.cn/subscription',
    cta: '查看 Pro 权益',
    highlight: true,
  },
  {
    name: '年度版',
    price: '¥239.9',
    unit: '/年',
    note: '适合长期规划',
    audience: '适合按学期和年度持续陪学',
    features: ['包含 Pro 全部权益', '适合学期或年度连续使用', '家庭长期学习管理更划算'],
    href: 'https://socrates.socra.cn/subscription',
    cta: '选择年度方案',
    highlight: false,
  },
];

const faqs = [
  {
    question: '会不会直接把答案给孩子？',
    answer: '不会。平台的核心设计是引导孩子理解思路，而不是替孩子完成思考。',
  },
  {
    question: '适合哪些年级和学科？',
    answer: '当前更适合中小学阶段常见学习场景，包括错题辅导、作文批改和学习规划。',
  },
  {
    question: '作文批改和普通点评有什么不同？',
    answer: '普通点评常常只在结尾给建议，这里会把错字、亮点和修改建议直接对应回原文位置。',
  },
  {
    question: '家长能看到哪些反馈？',
    answer: '可以看到孩子最近的重点问题、复习执行情况，以及阶段性的学习变化。',
  },
  {
    question: '免费版和会员版差别是什么？',
    answer: '免费版适合先体验核心能力，会员版适合更高频、更完整和更持续的学习支持。',
  },
];

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Socrates',
      url: 'https://socra.cn',
      logo: 'https://socra.cn/logo.png',
      sameAs: ['https://socrates.socra.cn', 'https://essay.socra.cn'],
      description: '面向中小学生的 AI 学习辅导平台，提供错题引导、作文批改、智能复习和学习规划。',
    },
    {
      '@type': 'WebSite',
      name: 'Socrates',
      url: 'https://socra.cn',
      description: '帮助孩子学会思考，而不是只记答案。',
      inLanguage: 'zh-CN',
    },
  ],
};

function SectionHeading({
  kicker,
  title,
  description,
  align = 'center',
}: {
  kicker: string;
  title: string;
  description: string;
  align?: 'center' | 'left';
}) {
  const isLeft = align === 'left';
  return (
    <div className={`max-w-3xl ${isLeft ? '' : 'mx-auto text-center'}`}>
      <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/85 px-4 py-2 text-sm font-medium text-orange-700 shadow-[0_10px_30px_rgba(245,123,55,0.08)]">
        <Sparkles className="h-4 w-4" />
        {kicker}
      </span>
      <h2 className="text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl [font-family:var(--font-display)]">
        {title}
      </h2>
      <p className={`mt-4 text-base leading-7 text-stone-600 sm:text-lg ${isLeft ? 'max-w-2xl' : ''}`}>{description}</p>
    </div>
  );
}

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[660px]">
      <div className="absolute inset-0 -z-10 rounded-[2.8rem] bg-[radial-gradient(circle_at_top_left,_rgba(245,123,55,0.28),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.18),_transparent_34%)] blur-3xl" />
      <div className="relative overflow-hidden rounded-[2.35rem] border border-white/80 bg-[linear-gradient(180deg,rgba(255,253,250,0.98)_0%,rgba(255,245,235,0.94)_100%)] p-5 shadow-[0_38px_120px_rgba(45,30,20,0.15)] backdrop-blur">
        <div className="absolute inset-x-8 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(245,123,55,0.42),transparent)]" />
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['作文批注', '原文直达'],
            ['错题复习', '自动衔接'],
            ['时间计划', '今日可执行'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/80 bg-white/72 px-3 py-3 shadow-[0_10px_24px_rgba(45,30,20,0.045)]">
              <p className="text-[11px] uppercase tracking-[0.24em] text-stone-400">{label}</p>
              <p className="mt-1 text-sm font-medium text-stone-700">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-[1.9rem] border border-white/85 bg-white/78 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-100/80 pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">今日学习工作台</p>
              <p className="mt-1 text-sm text-stone-500">发现问题、修改原文、进入复习，再排进今天计划</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">统一串联</span>
              <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-600">家长可见过程</span>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[1.55rem] border border-orange-100/80 bg-[linear-gradient(180deg,#fffdfa_0%,#fff8f1_100%)] p-4 shadow-[0_14px_32px_rgba(45,30,20,0.045)]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">作文批注</p>
                  <p className="mt-1 text-sm text-stone-500">错字、亮点、修改建议直接回到原文位置</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[11px] font-medium text-orange-700 shadow-sm">原文直改</span>
              </div>
              <div className="mt-4 space-y-3 text-[13px] leading-6 text-stone-700 sm:text-sm sm:leading-7">
                <p>
                  我的家乡有一条小河，春天的风一吹，河边的柳树就像
                  <span className="rounded bg-emerald-100/85 px-1 text-emerald-700 underline decoration-emerald-500 decoration-2 underline-offset-4">
                    绿色的瀑布
                  </span>
                  ，特别好看。
                </p>
                <p>
                  我常常和朋友一起去捉小鱼，有时候也会坐在石头上发呆，觉得那里真是一个
                  <span className="rounded bg-amber-100/85 px-1 text-amber-700 underline decoration-amber-500 decoration-2 underline-offset-4">
                    很安静很温柔
                  </span>
                  的地方。
                </p>
                <p>
                  但是有一次我把“柳树”写成了
                  <span className="rounded bg-rose-100/85 px-1 text-rose-700 underline decoration-rose-500 decoration-2 underline-offset-4">
                    柳数
                  </span>
                  ，老师提醒我以后要更仔细观察和检查。
                </p>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  ['错字', '直接标出'],
                  ['亮点', '保留强化'],
                  ['建议', '对应句子'],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-full border border-white/90 bg-white/90 px-3 py-1.5 text-xs text-stone-600 shadow-sm">
                    <span className="font-semibold text-stone-800">{label}</span>
                    <span className="ml-1">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[1.5rem] border border-stone-200 bg-stone-900 p-4 text-white shadow-[0_18px_44px_rgba(28,24,20,0.24)]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-300">错题引导</p>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-stone-200">先想思路</span>
                </div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-stone-100">
                  <div className="rounded-2xl bg-white/8 px-3 py-2.5">先别急着算答案，题目真正问的是什么？</div>
                  <div className="rounded-2xl bg-orange-500/15 px-3 py-2.5 text-orange-50">我好像没看懂“相对速度”这一步。</div>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-emerald-100 bg-[linear-gradient(180deg,#f7fdf9_0%,#eefaf2_100%)] p-4 shadow-[0_14px_34px_rgba(31,94,66,0.08)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600">今日时间计划</p>
                    <p className="mt-1 text-sm text-stone-500">今天先做什么，一眼清楚</p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">45 分钟</span>
                </div>
                <div className="mt-4 space-y-2.5 text-sm text-stone-700">
                  {[
                    ['17:00', '分数应用题复盘'],
                    ['17:20', '作文修改第 2 版'],
                    ['17:40', '几何辅助线再练 2 题'],
                  ].map(([time, item]) => (
                    <div key={item} className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/90 px-3 py-2.5">
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-600">{time}</span>
                      <span className="ml-3 flex-1 text-stone-700">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#fffefb_42%,#fffaf4_100%)] text-stone-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/70 bg-[#fffaf2]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <a href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Socrates" width={38} height={38} />
            <div>
              <span className="block text-lg font-semibold text-stone-900 [font-family:var(--font-display)]">Socrates</span>
              <span className="block text-xs tracking-[0.16em] text-stone-500">AI 学习辅导平台</span>
            </div>
          </a>

          <div className="hidden items-center gap-7 text-sm text-stone-600 md:flex">
            <a href="#abilities" className="transition hover:text-orange-600">核心能力</a>
            <a href="#results" className="transition hover:text-orange-600">真实效果</a>
            <a href="#pricing" className="transition hover:text-orange-600">会员方案</a>
            <a href="#faq" className="transition hover:text-orange-600">常见问题</a>
            <Button className="rounded-full bg-stone-900 px-6 text-white hover:bg-stone-800" asChild>
              <a href="https://socrates.socra.cn">免费体验</a>
            </Button>
          </div>

          <button
            className="rounded-full border border-orange-100 bg-white/90 p-2 text-stone-700 md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="切换导航菜单"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-orange-100 bg-[#fffaf2] px-5 py-4 md:hidden">
            <div className="space-y-3 text-sm text-stone-600">
              <a href="#abilities" className="block">核心能力</a>
              <a href="#results" className="block">真实效果</a>
              <a href="#pricing" className="block">会员方案</a>
              <a href="#faq" className="block">常见问题</a>
              <Button className="mt-2 w-full rounded-full bg-stone-900 text-white hover:bg-stone-800" asChild>
                <a href="https://socrates.socra.cn">免费体验</a>
              </Button>
            </div>
          </div>
        )}
      </nav>

      <main>
        <section className="relative overflow-hidden px-5 pb-12 pt-28 sm:px-6 lg:px-8 lg:pb-18 lg:pt-32">
          <div className="absolute left-1/2 top-14 -z-20 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(248,180,96,0.26),_transparent_62%)]" />
          <div className="absolute inset-x-0 top-0 -z-20 h-[44rem] bg-[linear-gradient(180deg,rgba(255,248,239,0.94)_0%,rgba(255,254,251,0)_100%)]" />
          <div className="mx-auto max-w-7xl">
            <div className="relative overflow-hidden rounded-[2.7rem] border border-white/80 bg-[linear-gradient(135deg,rgba(255,251,245,0.97)_0%,rgba(255,245,234,0.95)_44%,rgba(255,252,247,0.98)_100%)] shadow-[0_30px_120px_rgba(45,30,20,0.09)]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.72),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(245,123,55,0.10),transparent_28%)]" />
              <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(245,123,55,0.4),transparent)]" />
              <div className="relative px-6 py-7 sm:px-8 lg:px-10 lg:py-10">
                <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr]">
                  <div className="max-w-[41rem]">
                    <span className="inline-flex items-center gap-2 rounded-full border border-orange-200/80 bg-white/88 px-4 py-2 text-[13px] font-medium text-orange-700 shadow-[0_10px_30px_rgba(245,123,55,0.08)]">
                      <Sparkles className="h-4 w-4" />
                      陪孩子学会思考的 AI 学习助手
                    </span>

                    <h1 className="mt-6 max-w-[13ch] text-[2.8rem] font-semibold leading-[0.98] text-stone-950 sm:text-[4rem] lg:text-[5rem] [font-family:var(--font-display)]">
                      孩子不是不会学，
                      <span className="block text-orange-600">只是缺一个会引导思考的学习助手</span>
                    </h1>

                    <p className="mt-5 max-w-[36rem] text-[1rem] leading-8 text-stone-600 sm:text-[1.08rem]">
                      错题辅导、作文批改、智能复习、时间计划串成一套学习工作台，帮助孩子真正学会思路，而不是只记答案。
                    </p>

                    <div className="mt-6 flex flex-wrap gap-2.5">
                      {heroHighlights.map((item, index) => (
                        <div key={item} className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/76 px-3.5 py-2 text-sm font-medium text-stone-700 shadow-[0_10px_24px_rgba(45,30,20,0.04)]">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[11px] font-semibold text-orange-700">
                            0{index + 1}
                          </span>
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                      <Button size="lg" className="rounded-full bg-stone-900 px-7 text-base text-white hover:bg-stone-800" asChild>
                        <a href="https://socrates.socra.cn">
                          免费体验苏格拉底辅导
                          <ChevronRight className="ml-1 h-5 w-5" />
                        </a>
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        className="rounded-full border-orange-200 bg-white/80 px-7 text-base text-orange-700 hover:bg-orange-50"
                        asChild
                      >
                        <a href="https://essay.socra.cn">
                          查看作文批改效果
                          <ChevronRight className="ml-1 h-5 w-5" />
                        </a>
                      </Button>
                    </div>

                    <p className="mt-3 text-sm text-stone-500">先免费体验，再决定是否升级会员。</p>

                    <div className="mt-8 grid gap-3 sm:grid-cols-3">
                      {heroStats.map(([title, description]) => (
                        <div key={title} className="rounded-[1.4rem] border border-white/85 bg-white/70 px-4 py-4 shadow-[0_12px_30px_rgba(45,30,20,0.04)]">
                          <p className="text-sm font-semibold text-stone-900">{title}</p>
                          <p className="mt-1.5 text-sm leading-6 text-stone-600">{description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <HeroPreview />
                </div>

                <div className="mt-8 border-t border-white/80 pt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {roleCards.map((card, index) => (
                      <a
                        key={card.title}
                        href={card.href}
                        className={`group rounded-[1.7rem] border px-5 py-5 shadow-[0_14px_34px_rgba(45,30,20,0.045)] transition hover:-translate-y-0.5 ${
                          index === 0
                            ? 'border-orange-200 bg-[linear-gradient(135deg,rgba(255,248,238,0.96)_0%,rgba(255,240,224,0.92)_100%)]'
                            : 'border-stone-200 bg-white/72'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">{card.title}</p>
                            <h3 className="mt-1.5 text-[1.35rem] font-semibold text-stone-900 [font-family:var(--font-display)]">{card.cta}</h3>
                            <p className="mt-2 max-w-md text-sm leading-6 text-stone-600">{card.description}</p>
                          </div>
                          <div className="rounded-2xl border border-white/80 bg-white/82 p-2.5 text-stone-900 shadow-sm">
                            {index === 0 ? <Target className="h-5 w-5" /> : <BookOpen className="h-5 w-5" />}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="px-5 py-[4rem] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-orange-100 bg-[linear-gradient(180deg,#fffdf9_0%,#fff7ef_100%)] px-5 py-8 shadow-[0_16px_46px_rgba(45,30,20,0.06)] sm:px-8 sm:py-9">
            <SectionHeading
              kicker="家长最常遇到的困境"
              title="很多孩子不是不努力，而是一直在低效重复"
              description="问题往往不是做题少，而是不会复盘、不会表达、不会安排节奏。"
            />

            <div className="mt-8 grid gap-4 lg:grid-cols-3">
              {pains.map((pain, index) => (
                <div key={pain.title} className="rounded-[1.35rem] border border-white/80 bg-white/92 px-5 py-4 shadow-[0_12px_28px_rgba(45,30,20,0.04)]">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-[12px] font-semibold text-orange-700">
                    0{index + 1}
                  </span>
                  <h3 className="mt-3 text-lg font-semibold leading-7 text-stone-900">{pain.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{pain.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="abilities" className="px-5 py-[4rem] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              kicker="核心能力"
              title="把分散的学习问题，放进一条真正能执行的路径里"
              description="不是多几个功能，而是把“不会”“会了”“忘了”“再复习”真正接起来。"
              align="left"
            />

            <div className="mt-10 grid gap-5 xl:grid-cols-[1.16fr_0.84fr]">
              {scenarios.map((scenario) => (
                <div
                  key={scenario.title}
                  className={`flex h-full flex-col rounded-[1.9rem] border border-stone-200 bg-white/92 p-6 shadow-[0_18px_45px_rgba(45,30,20,0.055)] ${
                    scenario.title === '错题工作台'
                      ? 'border-orange-200 bg-[linear-gradient(180deg,#fffdf9_0%,#fff6ec_100%)] xl:row-span-2 xl:min-h-[33rem]'
                      : ''
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-[1rem] bg-gradient-to-br ${scenario.gradient} text-white shadow-lg`}>
                    <scenario.icon className="h-7 w-7" />
                  </div>
                  <p className="mt-5 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">{scenario.title}</p>
                  <h3 className="mt-2 text-[1.7rem] font-semibold leading-[1.16] text-stone-900 [font-family:var(--font-display)]">{scenario.headline}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{scenario.description}</p>

                  {scenario.title === '错题工作台' && (
                    <div className="mt-5 space-y-4">
                      <div className="rounded-[1.5rem] border border-orange-100 bg-[linear-gradient(180deg,#fffaf4_0%,#fffdf9_100%)] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-500">一次不会，后面怎么接起来</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {['先理解卡点', '自动记录错题', '进入后续复习'].map((item) => (
                            <div key={item} className="rounded-2xl bg-white px-3 py-3 text-sm font-medium text-stone-700 shadow-sm">
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[1.45rem] bg-stone-900 p-4 text-white shadow-[0_18px_40px_rgba(28,24,20,0.22)]">
                        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-orange-200">家长最能感知的变化</p>
                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                          {[
                            ['当天看懂', '不是直接给答案'],
                            ['后面记住', '自动进复习清单'],
                            ['持续看到变化', '不是一次性讲题'],
                          ].map(([title, copy]) => (
                            <div key={title} className="rounded-2xl bg-white/10 px-3 py-3">
                              <p className="text-sm font-medium">{title}</p>
                              <p className="mt-1 text-xs leading-5 text-stone-200">{copy}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <ul className="mt-5 space-y-2.5">
                    {scenario.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3 text-sm text-stone-700">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                  <a href={scenario.href} className="mt-6 inline-flex items-center gap-2 font-medium text-orange-600 transition hover:text-orange-700">
                    立即进入
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="results" className="px-5 py-[4rem] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              kicker="真实效果"
              title="不是多一个工具，而是少走很多弯路"
              description="看见前后差异，用户才会相信这不是“又一个 AI 工具”。"
              align="left"
            />

            <div className="mt-10 overflow-hidden rounded-[2.1rem] border border-stone-200 bg-white/94 shadow-[0_20px_58px_rgba(45,30,20,0.06)]">
              <div className="grid border-b border-stone-200 bg-[linear-gradient(180deg,#fffdfb_0%,#fff8f1_100%)] lg:grid-cols-[0.92fr_1.04fr_1.04fr]">
                <div className="px-6 py-5 lg:px-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">观察点</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">从日常学习体验里，看最关键的前后差别。</p>
                </div>
                <div className="border-t border-stone-200 px-6 py-5 lg:border-l lg:border-t-0 lg:px-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">以前</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">问题讲完就结束，效果往往停留在当下。</p>
                </div>
                <div className="border-t border-stone-200 px-6 py-5 lg:border-l lg:border-t-0 lg:px-7">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-500">现在</p>
                  <p className="mt-2 text-sm leading-6 text-stone-700">理解、记录、复习、反馈能真正接起来。</p>
                </div>
              </div>

              {comparisons.map((comparison, index) => (
                <div
                  key={comparison.title}
                  className={`grid lg:grid-cols-[0.92fr_1.04fr_1.04fr] ${index !== comparisons.length - 1 ? 'border-b border-stone-200' : ''}`}
                >
                  <div className="px-6 py-5 lg:px-7">
                    <h3 className="text-lg font-semibold text-stone-900">{comparison.title}</h3>
                  </div>
                  <div className="border-t border-stone-200 px-6 py-5 lg:border-l lg:border-t-0 lg:px-7">
                    <p className="text-sm leading-7 text-stone-600">{comparison.before}</p>
                  </div>
                  <div className="border-t border-stone-200 bg-[linear-gradient(180deg,#fffaf4_0%,#fffefb_100%)] px-6 py-5 lg:border-l lg:border-t-0 lg:px-7">
                    <p className="text-sm leading-7 text-stone-700">{comparison.after}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FeaturedPostsCarousel className="py-[4.5rem]" />

        <section className="px-5 py-[4rem] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl rounded-[2rem] border border-stone-200 bg-white/90 px-5 py-8 shadow-[0_18px_50px_rgba(45,30,20,0.055)] sm:px-8 sm:py-9">
            <SectionHeading
              kicker="学习闭环"
              title="从发现问题，到真正记住，不再断开"
              description="如果只是讲一道题、改一篇作文，价值是短暂的。真正重要的是形成闭环。"
            />

            <div className="mt-8 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              {loopSteps.map((step, index) => (
                <div key={step} className="relative rounded-[1.35rem] border border-orange-100 bg-[#fffaf4] px-4 py-4">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-400">step 0{index + 1}</span>
                  <p className="mt-2.5 text-sm font-medium leading-6 text-stone-900">{step}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-sm leading-6 text-stone-600">
              这也是为什么我们不是只做一个工具，而是把学习过程真正串起来。
            </p>
          </div>
        </section>

        <section className="px-5 py-[4rem] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              kicker="热门学习场景"
              title="你想先解决哪一个学习问题？"
              description="首页先帮你快速进入，后续每个专题页再把问题讲清楚。"
            />

            <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {searchEntries.map((entry) => (
                <a
                  key={entry.title}
                  href={entry.href}
                  className="group rounded-[1.45rem] border border-stone-200 bg-white/92 px-5 py-4 shadow-[0_14px_34px_rgba(45,30,20,0.045)] transition hover:-translate-y-0.5 hover:border-orange-200 hover:bg-[#fffaf3]"
                >
                  <p className="text-base font-semibold text-stone-900">{entry.title}</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{entry.description}</p>
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-orange-600">
                    进入场景
                    <ChevronRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="px-5 py-[4rem] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              kicker="会员方案"
              title="先免费开始，再按需求升级"
              description="先让孩子感受到有效，再决定是否开通更完整的能力。"
              align="left"
            />

            <div className="mt-10 grid gap-4 xl:grid-cols-3">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative rounded-[1.9rem] border px-6 py-6 shadow-[0_18px_48px_rgba(45,30,20,0.055)] ${
                    plan.highlight
                      ? 'translate-y-[-6px] border-orange-300 bg-[linear-gradient(180deg,#fff8ef_0%,#fff3ea_100%)]'
                      : 'border-stone-200 bg-white/92'
                  }`}
                >
                  {plan.highlight && (
                    <span className="absolute -top-3 left-6 inline-flex items-center gap-1 rounded-full bg-stone-900 px-4 py-1 text-xs font-medium text-white">
                      <Zap className="h-3 w-3" />
                      当前主推
                    </span>
                  )}

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-semibold text-stone-900 [font-family:var(--font-display)]">{plan.name}</h3>
                      <p className="mt-1.5 text-sm text-stone-500">{plan.note}</p>
                    </div>
                    {plan.highlight && <Crown className="h-6 w-6 text-orange-500" />}
                  </div>

                  <p className="mt-4 rounded-full bg-white/88 px-3 py-1.5 text-xs font-medium text-stone-600">
                    {plan.audience}
                  </p>

                  <div className="mt-6 flex items-end gap-1 text-stone-900">
                    <span className={`font-semibold ${plan.highlight ? 'text-[3rem]' : 'text-[2.55rem]'}`}>{plan.price}</span>
                    {plan.unit ? <span className="pb-1 text-base text-stone-500">{plan.unit}</span> : null}
                  </div>

                  <ul className="mt-6 space-y-2.5">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-stone-700">
                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.highlight ? 'default' : 'outline'}
                    className={`mt-6 w-full rounded-full ${
                      plan.highlight
                        ? 'bg-stone-900 text-white hover:bg-stone-800'
                        : 'border-stone-300 bg-white/80 text-stone-800 hover:bg-stone-50'
                    }`}
                    asChild
                  >
                    <a href={plan.href}>{plan.cta}</a>
                  </Button>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-stone-200 bg-white/75 px-4 py-3 text-sm text-stone-500">
              不是先付费再感受价值，而是先体验价值，再决定升级。
            </div>
          </div>
        </section>
        <section id="faq" className="px-5 py-[4rem] sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <SectionHeading
              kicker="常见问题"
              title="家长最常问的问题"
              description="把关键疑虑说清楚，决定会更快。"
            />

            <div className="mt-9 space-y-3">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-[1.35rem] border border-stone-200 bg-white/94 px-5 py-4 shadow-[0_12px_28px_rgba(45,30,20,0.035)]"
                >
                  <summary className="cursor-pointer list-none text-base font-medium text-stone-900 marker:hidden">
                    <div className="flex items-center justify-between gap-4">
                      <span>{faq.question}</span>
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-500 transition">
                        展开
                      </span>
                    </div>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-stone-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-[4.5rem] pt-4 sm:px-6 lg:px-8 lg:pb-[5.5rem]">
          <div className="mx-auto max-w-5xl rounded-[2.25rem] border border-orange-200 bg-[linear-gradient(135deg,#fff6e8_0%,#fffaf6_45%,#fff3e6_100%)] px-6 py-10 text-center shadow-[0_22px_60px_rgba(45,30,20,0.075)] sm:px-10">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-orange-700 shadow-sm">
              <Sparkles className="h-4 w-4" />
              先体验，再决定
            </span>
            <h2 className="mt-5 text-[2rem] font-semibold leading-tight text-stone-950 sm:text-[2.5rem] [font-family:var(--font-display)]">
              现在开始，让孩子少走弯路，多建立思路
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
              先体验一次真正有帮助的学习流程，再决定要不要继续。
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" className="rounded-full bg-stone-900 px-8 text-white hover:bg-stone-800" asChild>
                <a href="https://socrates.socra.cn">
                  免费体验
                  <ChevronRight className="ml-1 h-5 w-5" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-stone-300 bg-white/80 px-8 text-stone-800 hover:bg-white"
                asChild
              >
                <a href="#abilities">查看产品能力</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-200 bg-[#1f1a17] px-5 py-12 text-stone-300 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Socrates" width={34} height={34} />
              <div>
                <p className="text-lg font-semibold text-white [font-family:var(--font-display)]">Socrates</p>
                <p className="text-sm text-stone-400">帮助孩子学会思考，而不是只记答案。</p>
              </div>
            </div>
            <p className="mt-5 max-w-md text-sm leading-7 text-stone-400">
              面向中小学生的 AI 学习辅导平台，连接错题引导、作文批改、智能复习与学习规划。
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">产品入口</p>
            <div className="mt-4 space-y-3 text-sm">
              <a href="https://socrates.socra.cn" className="block hover:text-white">苏格拉底辅导</a>
              <a href="https://essay.socra.cn" className="block hover:text-white">作文批改</a>
              <a href="https://socrates.socra.cn/planner" className="block hover:text-white">学习规划</a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">联系与合规</p>
            <div className="mt-4 space-y-3 text-sm">
              <p>公众号：工程爸的AI教育工厂</p>
              <p>微信：ghz98315</p>
              <a href="/privacy" className="block hover:text-white">隐私政策</a>
              <a href="/terms" className="block hover:text-white">服务条款</a>
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="block hover:text-white">
                ICP备案
              </a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl border-t border-white/10 pt-6 text-sm text-stone-500">
          &copy; {new Date().getFullYear()} Socrates. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
