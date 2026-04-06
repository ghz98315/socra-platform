'use client';

import { motion } from 'motion/react';
import { ArrowRight, BookOpen, ChevronRight, Mail, PenTool, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import BookCoverMockup from './BookCoverMockup';
import { useArticles } from '../lib/useArticles';

export default function LandingPage() {
  const { articles, isLoaded } = useArticles();
  
  // Get the latest 2 published articles
  const latestArticles = articles.filter(a => a.slug !== '#').slice(0, 2);

  if (!isLoaded) return null;

  return (
    <>
{/* --- Hero Section --- */}
      <section className="pt-24 md:pt-32 pb-16 md:pb-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.2] tracking-tight text-neutral-900 mb-6 text-balance"
          >
            直面错误，<br className="md:hidden" />重塑认知。
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-base sm:text-lg md:text-xl text-neutral-500 mb-10 max-w-2xl mx-auto leading-[1.8] text-justify px-2 sm:px-0"
          >
            Socrates 是一个专注于「错题闭环管理」的工具系统。我们通过记录、分析、重构，帮你把每一次错误转化为成长的阶梯。
          </motion.p>
        </div>
      </section>

      {/* --- Articles Section --- */}
      <section id="articles" className="py-16 md:py-24 px-4 sm:px-6 bg-white border-y border-neutral-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="font-serif text-3xl font-bold text-neutral-900 mb-2">最新思考</h2>
              <p className="text-neutral-500">关于学习方法、错题管理与认知升级的探讨。</p>
            </div>
            <Link href="/essays" className="hidden sm:flex items-center gap-1 text-sm font-medium text-neutral-900 hover:underline underline-offset-4">
              查看全部系列 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-col">
            {latestArticles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group py-8 border-t border-neutral-200 first:border-t-0 flex flex-col md:flex-row gap-4 md:gap-8 items-start"
              >
                <div className="md:w-32 shrink-0 pt-1">
                  <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider block mb-1">{article.date}</span>
                  <span className="text-xs font-medium text-neutral-900 bg-neutral-100 px-2 py-1 rounded-sm">{article.category}</span>
                </div>
                <div className="flex-grow">
                  <Link href={article.slug !== '#' ? `/essays/${article.slug}` : '#'} className="block group-hover:opacity-80 transition-opacity">
                    <h3 className="font-serif text-xl md:text-2xl font-bold text-neutral-900 mb-4 leading-[1.4]">
                      {article.title}
                    </h3>
                    <div className="bg-neutral-50/80 rounded-r-lg border-l-[3px] border-neutral-200 p-4 mb-5 group-hover:border-neutral-400 transition-colors duration-300">
                      <p className="text-neutral-600 leading-[1.8] text-justify text-sm sm:text-base line-clamp-3">
                        {article.excerpt}
                      </p>
                    </div>
                  </Link>
                  <Link href={article.slug !== '#' ? `/essays/${article.slug}` : '#'} className="inline-flex items-center gap-1 text-sm font-medium text-neutral-900 hover:underline underline-offset-4">
                    阅读全文 <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* --- Book Promo Section --- */}
      <section id="book" className="py-16 md:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="bg-neutral-900 rounded-3xl overflow-hidden flex flex-col lg:flex-row items-center">
            <div className="lg:w-[46%] p-8 md:p-12 lg:p-16 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium mb-8 border border-white/20">
                <BookOpen className="w-4 h-4" />
                <span>电子书发布</span>
              </div>
              <h2 className="max-w-[11ch] font-serif text-3xl font-bold leading-[1.1] tracking-tight mb-5 md:text-4xl xl:text-[2.85rem]">
                《从错误开始：
                <br />
                一套真正能闭环的
                <br />
                学习系统》
              </h2>
              <p className="max-w-[20rem] text-lg leading-[1.5] text-neutral-400 md:text-xl">
                一位工程师爸爸用工厂管理逻辑重建的学习方法
              </p>
              <div className="mt-7 mb-8 h-px w-16 bg-[#e8600a]" />
              <div className="text-neutral-300 leading-[1.8] mb-10 space-y-4 text-sm md:text-base text-justify max-w-[28rem]">
                <p className="text-white/92 text-base md:text-[1.05rem]">大宝做几何题，正弦用成余弦。你问他为什么错，他说"粗心了"。</p>
                <p>你在工厂做了十年，从来没有人能用"操作员粗心"结案一个质量问题。你知道这两个字背后藏着什么：一个没有被找到的根因，和一个准备再次发生的错误。</p>
                <p>这本书，从那个下午开始写。</p>
                <div className="bg-white/5 p-4 rounded-xl border border-white/10 mt-6">
                  <p className="text-white font-medium mb-1">💡 心法与工具的完美结合</p>
                  <p className="text-neutral-400 text-sm">首发特惠 ¥39.9，包含电子书（永久买断）与 Socrates 错题系统 1 个月使用权益。期满后工具可按季度续订（¥69/季度）。心法与兵器搭配，帮你建立完整的错题闭环。</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/book" className="bg-white text-neutral-900 px-6 py-3 rounded-full font-medium text-center hover:bg-neutral-100 transition-colors whitespace-nowrap">
                  了解详情与购买
                </Link>
                <Link href="/book#preview" className="bg-transparent border border-white/30 text-white px-6 py-3 rounded-full font-medium text-center hover:bg-white/10 transition-colors whitespace-nowrap">
                  免费试读
                </Link>
              </div>
            </div>
            <div className="lg:w-[54%] w-full h-full min-h-[470px] lg:min-h-[660px] flex items-center justify-center p-6 sm:p-10 lg:p-10 relative overflow-hidden bg-[radial-gradient(circle_at_50%_38%,rgba(68,68,68,0.24),transparent_48%),linear-gradient(180deg,#242424_0%,#1e1e1e_100%)]">
              <div className="absolute inset-[7%] rounded-[2rem] border border-white/5" />
              <div className="absolute inset-x-[10%] bottom-[10%] h-10 rounded-full bg-black/20 blur-2xl" />
              <BookCoverMockup
                variant="home"
                className="w-[17.5rem] sm:w-[21rem] lg:w-[28rem]"
                rotateClassName="rotate-[-1deg] md:rotate-[2.5deg] hover:rotate-0"
              />
            </div>
          </div>
        </div>
      </section>

      {/* --- About Me Section --- */}
      <section id="about" className="py-16 md:py-24 px-4 sm:px-6 bg-white border-t border-neutral-200">
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-24 h-24 bg-neutral-200 rounded-full mx-auto mb-8 overflow-hidden">
            <img src="https://picsum.photos/seed/engineer/200/200" alt="关博 / 工程爸" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-4 break-keep text-balance">你好，我是 关博 / 工程爸</h2>
          <p className="text-neutral-500 font-medium mb-10 text-sm sm:text-base md:text-lg">Socrates 创始人 / 《从错误开始》作者</p>
          <p className="text-neutral-600 leading-[1.8] max-w-2xl mx-auto mb-12 text-base sm:text-lg md:text-xl text-justify">
            一个从比亚迪走出来的工程师，带着10年流程管理的肌肉记忆，现在同时活在三个身份里——创业者、宝爸、跑者。我卖的不是课，是一套思维迁移的工具：把工厂里"让系统自己说话"的质量管控逻辑，装进普通家长和孩子对付错题的日常里。
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 md:gap-10">
            <a href="mailto:ghz007@hotmail.com" className="flex items-center gap-2 text-neutral-500 hover:text-neutral-900 transition-colors">
              <Mail className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-sm md:text-base font-medium">ghz007@hotmail.com</span>
            </a>
            <div className="flex items-center gap-2 text-neutral-500">
              <MessageCircle className="w-5 h-5 md:w-6 md:h-6" />
              <span className="text-sm md:text-base font-medium">公众号：工程爸的AI进化工厂</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- Bottom CTA --- */}
      <section className="py-16 md:py-24 px-4 sm:px-6 bg-neutral-50">
        <div className="max-w-3xl mx-auto text-center">
          <PenTool className="w-12 h-12 text-neutral-300 mx-auto mb-6" />
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 mb-5 leading-[1.4] px-4 sm:px-0 text-balance">准备好建立你的错题闭环了吗？</h2>
          <p className="text-neutral-600 mb-10 text-base sm:text-lg leading-relaxed text-balance">加入 Socrates，体验系统化、智能化的错题管理工具。</p>
          <a href="https://socrates.socra.cn" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-900/20">
            开始使用 Socrates <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>
    </>
  );
}


