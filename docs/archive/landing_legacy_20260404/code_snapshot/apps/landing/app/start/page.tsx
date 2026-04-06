import { Button } from '@socra/ui';
import { ChevronRight, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';

const steps = [
  {
    title: '先带入一个真实问题',
    description: '从一道不会的题、一篇需要修改的作文，或一个总在重复出现的问题开始。',
  },
  {
    title: '把问题继续追到根因',
    description: '不是立刻给答案，而是先看清卡点，区分到底是概念、方法还是习惯出了问题。',
  },
  {
    title: '把这次错误接进后续闭环',
    description: '让理解继续进入验证、复习和反馈，而不是停留在“这次会了”。',
  },
];

export const metadata: Metadata = {
  title: '开始使用 | 如何开始',
  description:
    '用最简方式说明如何开始使用这套闭环学习系统，把错误、根因、验证和复习真正接起来。',
};

export default function StartPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#fffefb_42%,#fffaf4_100%)] text-stone-800">
      <main className="px-5 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <section className="rounded-[2.4rem] border border-white/85 bg-[linear-gradient(135deg,rgba(255,251,245,0.97)_0%,rgba(255,245,234,0.95)_44%,rgba(255,252,247,0.98)_100%)] px-6 py-8 shadow-[0_28px_90px_rgba(45,30,20,0.08)] sm:px-8 sm:py-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/88 px-4 py-2 text-sm font-medium text-orange-700 shadow-[0_10px_28px_rgba(245,123,55,0.08)]">
              <Sparkles className="h-4 w-4" />
              开始使用
            </span>
            <h1 className="mt-5 text-[2.35rem] font-semibold leading-[1.06] tracking-[-0.03em] text-stone-950 sm:text-[3rem] [font-family:var(--font-display)]">
              如果你认同这套方法，下一步其实很简单
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600 sm:text-lg">
              系统不是替孩子完成思考，而是把前面文章里的那条闭环路径，真正变成每天能执行的流程。
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="rounded-full bg-stone-900 px-8 text-white hover:bg-stone-800" asChild>
                <a href="https://socrates.socra.cn">
                  进入系统
                  <ChevronRight className="ml-1 h-5 w-5" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-stone-300 bg-white/85 px-8 text-stone-800 hover:bg-white"
                asChild
              >
                <Link href="/essays">先去读文章</Link>
              </Button>
            </div>
          </section>

          <section className="mt-8 grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div
                key={step.title}
                className="rounded-[1.9rem] border border-stone-200 bg-white/92 px-5 py-6 shadow-[0_18px_45px_rgba(45,30,20,0.05)]"
              >
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-sm font-semibold text-orange-700">
                  0{index + 1}
                </span>
                <h2 className="mt-4 text-xl font-semibold text-stone-950 [font-family:var(--font-display)]">{step.title}</h2>
                <p className="mt-3 text-sm leading-7 text-stone-600">{step.description}</p>
              </div>
            ))}
          </section>

          <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white/94 px-6 py-7 shadow-[0_18px_48px_rgba(45,30,20,0.05)] sm:px-8">
            <h2 className="text-2xl font-semibold text-stone-950 [font-family:var(--font-display)]">边界也要说清楚</h2>
            <div className="mt-4 space-y-4 text-[1rem] leading-8 text-stone-700">
              <p>
                系统解决的是执行成本，不是替孩子完成思考。真正有价值的，仍然是问题被继续追问、理解被继续验证、错误被继续接入复习。
              </p>
              <p>
                所以如果你更想先理解方法，就先读文章；如果你已经认同这套方法，就可以直接开始。
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
