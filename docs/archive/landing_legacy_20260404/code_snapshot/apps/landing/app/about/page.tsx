import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: '关于 | 为什么会有这套内容',
  description:
    '解释这套闭环学习内容从哪里开始、为什么会写，以及工程管理的方法如何被迁移到学习系统里。',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#fffefb_42%,#fffaf4_100%)] text-stone-800">
      <main className="px-5 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <section className="rounded-[2.4rem] border border-white/85 bg-[linear-gradient(135deg,rgba(255,251,245,0.97)_0%,rgba(255,245,234,0.95)_44%,rgba(255,252,247,0.98)_100%)] px-6 py-8 shadow-[0_28px_90px_rgba(45,30,20,0.08)] sm:px-8 sm:py-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/88 px-4 py-2 text-sm font-medium text-orange-700 shadow-[0_10px_28px_rgba(245,123,55,0.08)]">
              <Sparkles className="h-4 w-4" />
              关于这套内容
            </span>
            <h1 className="mt-5 text-[2.35rem] font-semibold leading-[1.06] tracking-[-0.03em] text-stone-950 sm:text-[3rem] [font-family:var(--font-display)]">
              为什么会有这套内容
            </h1>
            <p className="mt-4 text-base leading-7 text-stone-600 sm:text-lg">
              这套内容不是从“做一个学习产品”开始的，而是从一个真实又反复出现的教育问题开始的。
            </p>
          </section>

          <div className="mt-8 space-y-6 rounded-[2rem] border border-stone-200 bg-white/94 px-6 py-7 shadow-[0_18px_48px_rgba(45,30,20,0.05)] sm:px-8 sm:py-9">
            <section>
              <h2 className="text-2xl font-semibold text-stone-950 [font-family:var(--font-display)]">起点，是那句“粗心了”</h2>
              <div className="mt-4 space-y-4 text-[1rem] leading-8 text-stone-700">
                <p>
                  孩子做错题时，经常会说“粗心了”。这句话听起来像解释，实际上却没有说明任何真正的原因。
                </p>
                <p>
                  一旦这句话成为结论，问题就被关掉了。老师不再追问，家长不再追问，孩子自己也不再追问。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-stone-950 [font-family:var(--font-display)]">方法，来自工程里的根因思维</h2>
              <div className="mt-4 space-y-4 text-[1rem] leading-8 text-stone-700">
                <p>
                  在工厂里，没有一份合格的问题报告会把根因写成“操作员粗心”。因为那不是根因，只是表面现象。
                </p>
                <p>
                  五问法、闭环循环、过程控制这些方法，本来就是为了解决“问题为什么会反复发生”。迁移到学习场景里，它们同样成立。
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-stone-950 [font-family:var(--font-display)]">系统，不是主角，而是承接</h2>
              <div className="mt-4 space-y-4 text-[1rem] leading-8 text-stone-700">
                <p>
                  先有方法，再有工具。文章负责把事情讲清楚，系统负责把事情持续做下去。
                </p>
                <p>
                  如果前面的内容让人理解为什么错误需要被继续追问，那么后面的系统就是把这条闭环路径真正放进执行过程里。
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
