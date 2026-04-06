import { Button } from '@socra/ui';
import { ArrowUpRight, ChevronRight, Menu, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getFeaturedEssay } from '../lib/essays';

const quickLinks = [
  {
    label: '最新主文',
    value: '每周更新',
    description: '先从正在连载的核心文章开始，理解整套方法的起点。',
    href: '/essays',
  },
  {
    label: '方法结构',
    value: '道法术器',
    description: '四条主线并行展开，把零散经验整理成可持续的方法框架。',
    href: '#themes',
  },
  {
    label: '系统入口',
    value: 'Socrates',
    description: '当内容讲清楚以后，再进入系统把方法真正跑起来。',
    href: '/start',
  },
];

const highlightCards = [
  {
    tag: '主文',
    title: '粗心，是关闭追问的借口',
    body: '先从最常见、也最容易被误判的问题开始，把“粗心”这层表面解释拆开。',
    href: '/essays/careless-is-not-the-cause',
  },
  {
    tag: '结构',
    title: '这不是碎片文章，而是一套完整方法',
    body: '围绕道、法、术、器四条主线展开，每篇文章都属于更大结构的一部分。',
    href: '/essays',
  },
  {
    tag: '系统',
    title: '书讲清楚为什么，Socrates 承接怎么做',
    body: '从问题、根因、验证到复习，把方法从内容页自然接进系统执行。',
    href: '/start',
  },
];

const themeCards = [
  {
    key: '道',
    period: 'Part 01',
    place: '认知起点',
    title: '先修正对错误的理解',
    body: '错误不是羞耻，更不是一句“粗心”就可以结案的事情。',
    points: ['粗心不是原因', '做对一次不等于学会', '错题本为何会失效'],
    tone: 'orange' as const,
  },
  {
    key: '法',
    period: 'Part 02',
    place: '思维工具',
    title: '建立能上手的分析工具',
    body: '把问题继续追到根因，而不是停在表面经验和情绪判断。',
    points: ['5 Why', 'PDCA', '三类根因'],
    tone: 'blue' as const,
  },
  {
    key: '术',
    period: 'Part 03',
    place: '执行路径',
    title: '把方法放进真实学习过程',
    body: '让学生、家长和复习路径都进入同一套闭环节奏。',
    points: ['学生路径', '家长站位', '纠偏动作'],
    tone: 'pink' as const,
  },
  {
    key: '器',
    period: 'Part 04',
    place: '系统承接',
    title: '让系统成为稳定执行的基础设施',
    body: '当规模起来以后，系统不是点缀，而是闭环能不能持续的关键。',
    points: ['手工模板', '系统边界', 'Socrates 承接'],
    tone: 'cream' as const,
  },
];

const chapterCards = [
  {
    title: '粗心，是关闭追问的借口',
    meta: '道 · 2026-04-01',
    blurb: '把“粗心”从结论，重新拉回问题现场。',
    href: '/essays/careless-is-not-the-cause',
    tone: 'orange' as const,
  },
  {
    title: '5 Why 如何用在学习中',
    meta: '法 · 即将更新',
    blurb: '从表面错误继续追到真正的根因。',
    href: '/essays',
    tone: 'blue' as const,
  },
  {
    title: '学生的完整使用路径',
    meta: '术 · 即将更新',
    blurb: '让每一步都被定义，而不是只靠感觉推进。',
    href: '/essays',
    tone: 'pink' as const,
  },
  {
    title: 'Socrates 如何承接这套方法',
    meta: '器 · 即将更新',
    blurb: '方法先立住，系统再把它稳定跑起来。',
    href: '/start',
    tone: 'dark' as const,
  },
];

const systemCards = [
  {
    title: '学生入口',
    body: '带着真实问题进入，不再只是追答案。',
    dot: 'bg-orange-500',
  },
  {
    title: '家长入口',
    body: '看到状态与介入信号，而不是直接接管过程。',
    dot: 'bg-sky-500',
  },
  {
    title: '复习入口',
    body: '把验证和复习接起来，不让理解在中途断掉。',
    dot: 'bg-pink-500',
  },
];

const workflowSteps = [
  { title: '带入问题', subtitle: '从真实错误开始' },
  { title: '追到根因', subtitle: '不止停在表面解释' },
  { title: '验证理解', subtitle: '把知道变成会用' },
  { title: '接入复习', subtitle: '让理解变得稳定' },
];

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'Socrates',
      url: 'https://socra.cn',
      logo: 'https://socra.cn/logo.png',
      description: '从错误中学习，建立真正能闭环的学习系统。',
    },
    {
      '@type': 'WebSite',
      name: 'Socrates',
      url: 'https://socra.cn',
      inLanguage: 'zh-CN',
      description: '围绕闭环学习、道法术器与 Socrates 系统承接展开的内容入口。',
    },
  ],
};

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-white/95 px-3 py-1 text-[12px] text-stone-700 shadow-[0_6px_16px_rgba(255,138,0,0.06)]">
      <Sparkles className="h-3.5 w-3.5 text-orange-500" />
      {children}
    </span>
  );
}

function SectionHeading({
  tag,
  title,
  description,
  align = 'left',
}: {
  tag: string;
  title: string;
  description: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-[760px] text-center' : 'max-w-[760px]'}>
      <Pill>{tag}</Pill>
      <h2 className="mt-5 text-[30px] font-semibold leading-[1.08] tracking-[-0.04em] text-stone-950 sm:text-[34px] [font-family:var(--font-display)]">
        {title}
      </h2>
      <p className="mt-4 text-[16px] leading-7 text-stone-600">{description}</p>
    </div>
  );
}

function AccentSquare({
  className,
  color = 'orange',
}: {
  className?: string;
  color?: 'orange' | 'blue' | 'pink';
}) {
  const toneClass = {
    orange: 'bg-orange-400',
    blue: 'bg-sky-400',
    pink: 'bg-pink-400',
  }[color];

  return <div className={['h-2.5 w-2.5 rotate-45 rounded-[2px]', toneClass, className].join(' ')} />;
}

function AbstractArt({
  tone = 'orange',
  title,
  eyebrow,
  className,
}: {
  tone?: 'orange' | 'blue' | 'pink' | 'dark' | 'cream';
  title: string;
  eyebrow: string;
  className?: string;
}) {
  const toneClass = {
    orange: 'bg-[linear-gradient(145deg,#ffbf42_0%,#ff8a00_54%,#ffd88f_100%)] text-stone-950',
    blue: 'bg-[linear-gradient(145deg,#8fd0ff_0%,#4d95ff_50%,#dff0ff_100%)] text-stone-950',
    pink: 'bg-[linear-gradient(145deg,#ffd9e3_0%,#ff9db5_52%,#fff0f4_100%)] text-stone-950',
    dark: 'bg-[linear-gradient(145deg,#171717_0%,#363636_55%,#555555_100%)] text-white',
    cream: 'bg-[linear-gradient(145deg,#f6ead8_0%,#fff7ec_56%,#ecdac3_100%)] text-stone-950',
  }[tone];

  return (
    <div
      className={[
        'relative overflow-hidden rounded-[26px] border border-black/5 shadow-[0_24px_54px_rgba(41,26,16,0.08)]',
        toneClass,
        className ?? 'aspect-[1.5/1]',
      ].join(' ')}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(255,255,255,0.52),transparent_16%),radial-gradient(circle_at_78%_68%,rgba(255,255,255,0.20),transparent_16%)]" />
      <div className="absolute left-[10%] top-[18%] h-[48%] w-[44%] rounded-full bg-white/20" />
      <div className="absolute right-[12%] top-[22%] h-[30%] w-[22%] rounded-[34px] bg-white/20" />
      <div className="absolute bottom-[18%] right-[18%] h-[14%] w-[28%] rounded-full bg-white/18" />
      <div className="absolute inset-x-6 top-5 flex items-center justify-between text-[10px] tracking-[0.16em] opacity-80">
        <span>{eyebrow}</span>
        <span>Socrates</span>
      </div>
      <div className="absolute inset-x-6 bottom-6">
        <p className="text-[20px] font-semibold leading-tight [font-family:var(--font-display)]">{title}</p>
      </div>
    </div>
  );
}

function FeatureCard({
  tag,
  title,
  body,
  href,
}: {
  tag: string;
  title: string;
  body: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-[22px] border border-[rgba(62,45,30,0.08)] bg-white px-5 py-5 shadow-[0_14px_28px_rgba(41,26,16,0.04)] transition hover:translate-y-[-2px] hover:border-[rgba(62,45,30,0.14)] hover:shadow-[0_18px_32px_rgba(41,26,16,0.07)]"
    >
      <div className="flex items-center gap-2">
        <AccentSquare color={tag === '主文' ? 'orange' : tag === '结构' ? 'blue' : 'pink'} />
        <p className="text-[12px] tracking-[0.14em] text-orange-500">{tag}</p>
      </div>
      <h3 className="mt-3 text-[20px] font-semibold leading-7 text-stone-950 [font-family:var(--font-display)]">{title}</h3>
      <p className="mt-3 text-[14px] leading-7 text-stone-600">{body}</p>
      <span className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-stone-900">
        查看
        <ArrowUpRight className="h-4 w-4 transition group-hover:translate-x-[1px] group-hover:translate-y-[-1px]" />
      </span>
    </Link>
  );
}

function ThemeTimelineCard({
  card,
  color,
}: {
  card: (typeof themeCards)[number];
  color: 'orange' | 'blue' | 'pink';
}) {
  const badgeClass = {
    orange: 'bg-[linear-gradient(135deg,#ff9a1f_0%,#ff7b00_100%)] text-white',
    blue: 'bg-[linear-gradient(135deg,#59b8ff_0%,#3f8cff_100%)] text-white',
    pink: 'bg-[linear-gradient(135deg,#ff9dba_0%,#ff6f9a_100%)] text-white',
  }[color];

  return (
    <div className="relative pl-7">
      <div className="absolute left-[3px] top-8 h-3.5 w-3.5 rounded-full border-4 border-[#f4efe7] bg-orange-500 shadow-[0_0_0_1px_rgba(255,138,0,0.22)]" />
      <div className="rounded-[22px] border border-[rgba(62,45,30,0.08)] bg-white px-5 py-5 shadow-[0_14px_28px_rgba(41,26,16,0.04)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[22px] font-semibold leading-tight text-stone-950 [font-family:var(--font-display)]">{card.title}</p>
            <p className="mt-1 text-[13px] text-stone-500">{card.place}</p>
          </div>
          <span className={`shrink-0 rounded-full px-4 py-2 text-[12px] font-medium ${badgeClass}`}>{card.period}</span>
        </div>
        <p className="mt-5 text-[14px] leading-7 text-stone-600">{card.body}</p>
        <div className="mt-5 grid gap-2">
          {card.points.map((point) => (
            <div key={point} className="rounded-full bg-[rgba(244,239,231,0.92)] px-3 py-2 text-[13px] text-stone-700">
              {point}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const featuredEssay = getFeaturedEssay();
  const heroLinks = quickLinks.map((item) =>
    item.label === '最新主文' ? { ...item, href: `/essays/${featuredEssay.slug}` } : item,
  );

  return (
    <div className="min-h-screen bg-transparent text-stone-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <nav className="sticky top-0 z-50 border-b border-black/5 bg-[rgba(244,239,231,0.88)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1220px] items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Socrates" width={32} height={32} />
            <div>
              <span className="block text-[15px] font-semibold text-stone-950 [font-family:var(--font-display)]">Socrates</span>
              <span className="block text-[10px] tracking-[0.16em] text-stone-500">从错误中学习</span>
            </div>
          </Link>

          <div className="hidden items-center gap-7 text-[14px] text-stone-600 md:flex">
            <Link href="/essays" className="transition hover:text-stone-950">
              文章
            </Link>
            <a href="#themes" className="transition hover:text-stone-950">
              方法
            </a>
            <Link href="/start" className="transition hover:text-stone-950">
              开始使用
            </Link>
            <Link href="/about" className="transition hover:text-stone-950">
              关于
            </Link>
          </div>

          <details className="group md:hidden">
            <summary className="flex list-none items-center justify-center rounded-full border border-black/10 bg-white p-2 text-stone-700">
              <Menu className="h-5 w-5 group-open:hidden" />
              <span className="hidden text-sm font-medium group-open:inline">关闭</span>
            </summary>
            <div className="absolute inset-x-0 top-16 border-t border-black/5 bg-[#f4efe7] px-5 py-4">
              <div className="space-y-3 text-sm text-stone-600">
                <Link href="/essays" className="block">
                  文章
                </Link>
                <a href="#themes" className="block">
                  方法
                </a>
                <Link href="/start" className="block">
                  开始使用
                </Link>
                <Link href="/about" className="block">
                  关于
                </Link>
              </div>
            </div>
          </details>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden px-5 pb-10 pt-10 sm:px-6 lg:px-8 lg:pb-14 lg:pt-14">
          <div className="absolute inset-x-0 top-0 h-[22rem] bg-[radial-gradient(circle_at_18%_18%,rgba(255,157,48,0.10),transparent_18%),radial-gradient(circle_at_85%_12%,rgba(126,200,255,0.08),transparent_14%)]" />
          <div className="mx-auto max-w-[1220px]">
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="relative max-w-[820px] lg:pr-10">
                <AccentSquare className="absolute left-0 top-1" />
                <div className="pl-5">
                  <Pill>正在连载的一本书</Pill>
                  <p className="mt-6 text-[11px] tracking-[0.2em] text-stone-400">闭环学习手册 / 每周更新</p>
                  <h1 className="mt-4 max-w-[12.5ch] text-[36px] font-semibold leading-[1.02] tracking-[-0.045em] text-stone-950 sm:text-[48px] lg:text-[58px] xl:text-[62px] [font-family:var(--font-display)]">
                    <span className="block">从错误中学习，</span>
                    <span className="mt-1.5 block text-[#9d4e2d]">重新理解孩子为什么学不会</span>
                  </h1>
                  <p className="mt-6 max-w-[34rem] text-[18px] leading-[1.7] text-[rgba(94,86,78,0.8)] [font-family:var(--font-display)] sm:text-[19px]">
                    一套把错误变成理解、把理解变成闭环的学习方法。
                  </p>
                  <p className="mt-5 max-w-[34rem] text-[15px] leading-7 text-stone-600">
                    这不是提分技巧，也不是碎片经验。这是一部持续更新的书，也是一个已经有系统承接的方法框架。
                  </p>
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                    <Button
                      size="lg"
                      className="rounded-full bg-stone-950 px-7 text-[14px] text-white shadow-[0_14px_28px_rgba(23,19,15,0.10)] hover:bg-stone-800"
                      asChild
                    >
                      <Link href={`/essays/${featuredEssay.slug}`}>
                        先读这本书
                        <ChevronRight className="ml-1 h-5 w-5" />
                      </Link>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      className="rounded-full border-[rgba(94,86,78,0.16)] bg-white/92 px-7 text-[14px] text-stone-900 hover:bg-white"
                      asChild
                    >
                      <Link href="/start">进入 Socrates</Link>
                    </Button>
                  </div>
                  <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-stone-500">
                    <span>围绕错误分析与闭环学习持续更新</span>
                    <span className="hidden h-1 w-1 rounded-full bg-stone-300 sm:block" />
                    <span>书负责讲清楚，系统负责跑起来</span>
                  </div>
                </div>
              </div>

              <div className="border-t border-[rgba(62,45,30,0.08)] pt-6 lg:border-t-0 lg:border-l lg:border-[rgba(62,45,30,0.10)] lg:pl-8 lg:pt-10">
                <p className="text-[11px] tracking-[0.2em] text-stone-400">阅读索引</p>
                <div className="mt-5 grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
                  {heroLinks.map((item, index) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className={[
                        'group block',
                        index > 0 ? 'border-t border-[rgba(62,45,30,0.08)] pt-5' : '',
                        index > 0 && 'sm:border-t-0 sm:pt-0 lg:border-t lg:pt-5',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <p className="text-[27px] font-semibold leading-[1.02] tracking-[-0.035em] text-stone-950 [font-family:var(--font-display)]">
                        {item.value}
                      </p>
                      <p className="mt-2 text-[12px] tracking-[0.14em] text-stone-400">{item.label}</p>
                      <p className="mt-3 max-w-[16rem] text-[14px] leading-6 text-stone-600">{item.description}</p>
                      <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-stone-900">
                        进入
                        <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-[1px] group-hover:translate-y-[-1px]" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              <AbstractArt eyebrow="主视觉" title="《从错误开始》" tone="orange" />
              <AbstractArt eyebrow="作品封面" title="从错误中学习" tone="dark" />
            </div>
          </div>
        </section>

        <section className="bg-[linear-gradient(180deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.40)_100%)] px-5 py-9 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1220px]">
            <div className="mb-6 flex items-center justify-between gap-4">
              <SectionHeading
                tag="导航块"
                title="先看重点，再决定往哪里走"
                description="这一层不是解释全部内容，而是给用户三个最清楚的切入点。"
              />
              <AccentSquare color="orange" className="hidden sm:block" />
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {highlightCards.map((card) => (
                <FeatureCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1220px]">
            <SectionHeading
              tag="道法术器"
              title="用四个部分，把一本书立起来"
              description="每个部分都可以独立阅读，但它们最终会回到同一件事：如何让一次错误，真正进入理解、验证、复习与反馈。"
            />

            <div className="mt-10 grid gap-10 xl:grid-cols-2">
              <div>
                <div className="mb-6 flex items-center gap-3">
                  <AccentSquare color="orange" />
                  <h3 className="text-[20px] font-semibold text-stone-950">认知与执行</h3>
                </div>
                <div className="relative space-y-7 before:absolute before:bottom-3 before:left-[9px] before:top-3 before:w-px before:bg-[rgba(62,45,30,0.10)]">
                  <ThemeTimelineCard card={themeCards[0]} color="orange" />
                  <ThemeTimelineCard card={themeCards[2]} color="pink" />
                </div>
              </div>

              <div>
                <div className="mb-6 flex items-center gap-3">
                  <AccentSquare color="blue" />
                  <h3 className="text-[20px] font-semibold text-stone-950">工具与承接</h3>
                </div>
                <div className="relative space-y-7 before:absolute before:bottom-3 before:left-[9px] before:top-3 before:w-px before:bg-[rgba(62,45,30,0.10)]">
                  <ThemeTimelineCard card={themeCards[1]} color="blue" />
                  <ThemeTimelineCard card={themeCards[3]} color="orange" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="themes" className="relative overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.40)_100%)] px-5 py-12 sm:px-6 lg:px-8">
          <div className="absolute right-[6%] top-10 hidden h-24 w-24 rounded-full bg-orange-100/70 blur-2xl lg:block" />
          <div className="mx-auto max-w-[1220px]">
            <div className="flex items-center justify-between gap-4">
              <SectionHeading
                tag="章节精选"
                title="先从这几篇开始"
                description="这里不把全部文章一次摊开，而是先给最值得读的几个入口。"
              />
              <Link href="/essays" className="hidden text-[14px] font-medium text-stone-700 hover:text-stone-950 sm:inline-flex">
                查看全部文章
              </Link>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {chapterCards.map((card) => (
                <Link
                  key={card.title}
                  href={card.href}
                  className="group overflow-hidden rounded-[24px] border border-black/5 bg-white shadow-[0_16px_30px_rgba(41,26,16,0.04)] transition hover:translate-y-[-2px] hover:shadow-[0_18px_34px_rgba(41,26,16,0.08)]"
                >
                  <div className="p-3">
                    <AbstractArt eyebrow={card.meta} title={card.title} tone={card.tone} className="aspect-[1.16/1]" />
                  </div>
                  <div className="px-5 pb-5">
                    <p className="text-[12px] tracking-[0.14em] text-stone-500">{card.meta}</p>
                    <p className="mt-3 text-[20px] font-semibold leading-7 text-stone-950 transition group-hover:text-[#9d4e2d] [font-family:var(--font-display)]">
                      {card.title}
                    </p>
                    <p className="mt-3 text-[14px] leading-7 text-stone-600">{card.blurb}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1220px]">
            <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {workflowSteps.map((step, index) => (
                <div key={step.title} className="rounded-[20px] border border-black/5 bg-white px-4 py-4 shadow-[0_12px_24px_rgba(41,26,16,0.03)]">
                  <div className={`h-2.5 w-2.5 rounded-full ${index === 0 ? 'bg-orange-500' : index === 1 ? 'bg-sky-500' : index === 2 ? 'bg-pink-500' : 'bg-stone-500'}`} />
                  <p className="mt-4 text-[16px] font-semibold text-stone-950">{step.title}</p>
                  <p className="mt-2 text-[14px] leading-7 text-stone-600">{step.subtitle}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
              <div>
                <SectionHeading
                  tag="系统承接"
                  title="书负责讲清楚，Socrates 负责跑起来"
                  description="当你认同这套方法之后，下一步不是继续看更多解释，而是把它接进真实学习过程。问题、根因、验证、复习和反馈，应该在系统里变成一条稳定路径。"
                />
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button className="rounded-full bg-stone-950 px-8 text-[14px] text-white hover:bg-stone-800" asChild>
                    <Link href="/start">
                      进入 Socrates
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full border-[rgba(94,86,78,0.16)] bg-white px-8 text-[14px] text-stone-900 hover:bg-[rgba(255,255,255,0.8)]"
                    asChild
                  >
                    <Link href="/essays">先读文章再说</Link>
                  </Button>
                </div>
              </div>

              <div className="grid gap-5">
                <AbstractArt eyebrow="产品界面" title="学习工作台" tone="orange" className="aspect-[1.42/1]" />
                <div className="grid gap-4 sm:grid-cols-3">
                  {systemCards.map((card) => (
                    <div key={card.title} className="rounded-[20px] border border-black/5 bg-white px-4 py-4 shadow-[0_14px_28px_rgba(41,26,16,0.04)]">
                      <div className={`h-2.5 w-2.5 rounded-full ${card.dot}`} />
                      <p className="mt-4 text-[16px] font-semibold text-stone-950">{card.title}</p>
                      <p className="mt-2 text-[14px] leading-7 text-stone-600">{card.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-[#14110f] px-5 py-10 text-stone-300 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1220px] gap-8 lg:grid-cols-[1.1fr_0.9fr_0.9fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Socrates" width={30} height={30} />
              <div>
                <p className="text-[15px] font-semibold text-white [font-family:var(--font-display)]">Socrates</p>
                <p className="text-[10px] tracking-[0.16em] text-stone-500">从错误中学习</p>
              </div>
            </div>
            <p className="mt-4 max-w-[28rem] text-[14px] leading-7 text-stone-400">
              一本正在连载的闭环学习手册，以及承接这套方法的系统入口。
            </p>
          </div>

          <div>
            <p className="text-[12px] tracking-[0.14em] text-stone-500">入口</p>
            <div className="mt-4 space-y-3 text-[14px]">
              <Link href="/essays" className="block hover:text-white">
                文章
              </Link>
              <Link href="/start" className="block hover:text-white">
                开始使用
              </Link>
              <Link href="/about" className="block hover:text-white">
                关于
              </Link>
            </div>
          </div>

          <div>
            <p className="text-[12px] tracking-[0.14em] text-stone-500">联系与合规</p>
            <div className="mt-4 space-y-3 text-[14px]">
              <p>公众号: 工程师爸爸的智能教育工厂</p>
              <p>微信: ghz98315</p>
              <Link href="/privacy" className="block hover:text-white">
                隐私政策
              </Link>
              <Link href="/terms" className="block hover:text-white">
                服务条款
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-[1220px] border-t border-white/10 pt-5 text-[12px] text-stone-500">
          © {new Date().getFullYear()} Socrates。保留所有权利。
        </div>
      </footer>
    </div>
  );
}
