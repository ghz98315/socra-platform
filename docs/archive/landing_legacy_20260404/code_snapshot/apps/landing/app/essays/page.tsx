import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, Sparkles } from 'lucide-react';
import { getEssaysBySeries, getFeaturedEssay, seriesOrder } from '../../lib/essays';

const seriesIntros = [
  '重新理解错误，不再用“粗心了”过早结案。',
  '把问题继续追到根因，建立可复用的分析方法。',
  '把理解放进验证、复习和迁移里，形成真正掌握。',
  '当执行开始复杂时，用系统把闭环稳定跑起来。',
];

export const metadata: Metadata = {
  title: '文章 | 闭环学习手册',
  description:
    '围绕“从错误中学习”的闭环学习方法持续连载，按道、法、术、器组织，适合从第一篇开始系统阅读。',
};

export default function EssaysPage() {
  const featuredEssay = getFeaturedEssay();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#fffefb_42%,#fffaf4_100%)] text-stone-800">
      <main className="px-5 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <section className="rounded-[2.4rem] border border-white/85 bg-[linear-gradient(135deg,rgba(255,251,245,0.97)_0%,rgba(255,245,234,0.95)_44%,rgba(255,252,247,0.98)_100%)] px-6 py-8 shadow-[0_28px_90px_rgba(45,30,20,0.08)] sm:px-8 sm:py-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/88 px-4 py-2 text-sm font-medium text-orange-700 shadow-[0_10px_28px_rgba(245,123,55,0.08)]">
              <Sparkles className="h-4 w-4" />
              闭环学习手册
            </span>
            <h1 className="mt-5 text-[2.35rem] font-semibold leading-[1.05] tracking-[-0.03em] text-stone-950 sm:text-[3.1rem] [font-family:var(--font-display)]">
              这不是零散文章，而是一套持续展开的方法
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-stone-600 sm:text-lg">
              你可以从任何一篇开始读，但它们最终都会回到同一件事:
              如何让一次错误，真正进入理解、验证和复习。
            </p>
          </section>

          <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white/92 px-6 py-7 shadow-[0_18px_48px_rgba(45,30,20,0.05)] sm:px-8">
            <p className="text-xs font-semibold tracking-[0.24em] text-stone-400">推荐起点</p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950 [font-family:var(--font-display)]">
              {featuredEssay.title}
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">{featuredEssay.summary}</p>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-stone-500">
              <span className="rounded-full bg-[#fffaf4] px-3 py-1 text-orange-700">{featuredEssay.series}</span>
              <span>{featuredEssay.readingTime}</span>
              {featuredEssay.publishedAt ? <span>{featuredEssay.publishedAt}</span> : null}
            </div>
            <Link
              href={`/essays/${featuredEssay.slug}`}
              className="mt-6 inline-flex items-center gap-2 font-medium text-orange-600 transition hover:text-orange-700"
            >
              去读这一篇
              <ChevronRight className="h-4 w-4" />
            </Link>
          </section>

          <div className="mt-8 space-y-6">
            {seriesOrder.map((series, index) => {
              const essays = getEssaysBySeries(series);
              if (essays.length === 0) return null;

              return (
                <section
                  key={series}
                  className="rounded-[2rem] border border-stone-200 bg-white/92 px-6 py-7 shadow-[0_18px_48px_rgba(45,30,20,0.05)] sm:px-8"
                >
                  <div className="max-w-2xl">
                    <p className="text-xs font-semibold tracking-[0.24em] text-orange-500">{series}</p>
                    <h2 className="mt-3 text-2xl font-semibold text-stone-950 [font-family:var(--font-display)]">
                      {seriesIntros[index]}
                    </h2>
                  </div>

                  <div className="mt-6 space-y-3">
                    {essays.map((essay) => (
                      <div key={essay.slug} className="rounded-[1.4rem] border border-stone-100 bg-[#fffaf4] px-4 py-4 sm:px-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="max-w-3xl">
                            <p className="text-base font-semibold text-stone-900">{essay.title}</p>
                            <p className="mt-2 text-sm leading-6 text-stone-600">{essay.summary}</p>
                          </div>
                          <div className="shrink-0 text-sm text-stone-500">
                            {essay.status === 'published' ? (
                              <Link
                                href={`/essays/${essay.slug}`}
                                className="inline-flex items-center gap-2 font-medium text-orange-600 hover:text-orange-700"
                              >
                                阅读
                                <ChevronRight className="h-4 w-4" />
                              </Link>
                            ) : (
                              <span className="rounded-full bg-white px-3 py-1 text-stone-500 shadow-sm">即将更新</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
