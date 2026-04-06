'use client';

import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, BookOpen, ArrowRight, Lock } from 'lucide-react';
import Link from 'next/link';
import { useBookChapters } from '../lib/useBookChapters';

export default function BookPage() {
  const { chapters, isLoaded } = useBookChapters();

  return (
    <>
<div className="py-12 md:py-24 px-4 sm:px-6 max-w-5xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-8 md:mb-12 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回首页
      </Link>

      <div className="flex flex-col md:flex-row gap-12 lg:gap-24 items-start">
        {/* Left: Book Cover */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-sm mx-auto md:w-1/2 lg:w-2/5 shrink-0"
        >
          <div className="w-full aspect-[2/3] bg-[#fafafa] rounded-r-2xl rounded-l-sm shadow-2xl relative overflow-hidden border border-neutral-200">
            <div className="absolute left-0 top-0 bottom-0 w-4 sm:w-6 bg-neutral-300 border-r border-neutral-400/30 shadow-inner"></div>
            <div className="pl-10 sm:pl-12 pr-6 sm:pr-8 py-10 sm:py-16 h-full flex flex-col justify-between">
              <div>
                <p className="text-xs sm:text-sm font-mono text-neutral-500 tracking-widest uppercase mb-4 sm:mb-6">Socrates Press</p>
                <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 leading-[1.25] tracking-tight">从错误开始：<br/>一套真正能闭环的<br/>学习系统</h1>
              </div>
              <div>
                <div className="w-8 sm:w-12 h-1 bg-neutral-900 mb-4 sm:mb-6"></div>
                <p className="text-base sm:text-lg font-bold text-neutral-900">关博 / 工程爸</p>
                <p className="text-xs sm:text-sm text-neutral-500 mt-1">一位工程师爸爸用工厂管理逻辑重建的学习方法</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Book Details */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full md:w-1/2 lg:w-3/5"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium mb-6">
            <BookOpen className="w-4 h-4" />
            <span>电子书首发</span>
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4 sm:mb-5 leading-[1.3] tracking-tight">
            从错误开始：一套真正能闭环的学习系统
          </h2>
          <p className="text-lg sm:text-xl text-neutral-500 mb-8 font-medium leading-relaxed">
            一位工程师爸爸用工厂管理逻辑重建的学习方法
          </p>

          <div className="space-y-6 mb-10 text-base sm:text-lg text-neutral-600 leading-[1.8] text-justify">
            <p>大宝做几何题，正弦用成余弦。你问他为什么错，他说"粗心了"。</p>
            <p>你在工厂做了十年，从来没有人能用"操作员粗心"结案一个质量问题。你知道这两个字背后藏着什么——一个没有被找到的根因，和一个准备再次发生的错误。</p>
            <p>这本书，从那个下午开始写。</p>
            <p>我将比亚迪10年质量管理的硬核逻辑，降维应用到孩子的日常错题管理中，为你揭示如何通过“5步闭环”彻底告别无效刷题。</p>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 sm:p-6 mb-10">
            <p className="text-sm sm:text-base text-neutral-600 leading-loose">
              <strong className="text-neutral-900">💡 购书须知：</strong>首发特惠套装 ¥39.9，包含《从错误开始》电子书（永久买断）与 <strong>Socrates</strong> 错题系统 1 个月使用权益。1个月期满后，Socrates 系统可按季度续订（¥69/季度）。两者搭配使用效果最佳，相当于“心法+兵器”。
            </p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 mb-10 shadow-sm">
            <h3 className="font-bold text-lg sm:text-xl text-neutral-900 mb-5">你将在这本书中获得：</h3>
            <ul className="space-y-4 text-base sm:text-lg leading-relaxed">
              {['为什么传统的“错题本”注定会失败？', '如何用 8D 根因分析法解构一道错题？', '建立个人专属的“知识防呆系统”', 'Socrates 工具的深度配合使用指南'].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-neutral-600">
                  <CheckCircle2 className="w-5 h-5 text-neutral-900 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

            <div className="flex flex-col sm:flex-row gap-4" id="preview">
              <Link href="/book-purchase" className="bg-neutral-900 text-white px-8 py-4 rounded-full font-medium text-center hover:bg-neutral-800 transition-colors shadow-lg shadow-neutral-900/20">
                购买「书+工具」套装 (¥39.9)
              </Link>
              <Link href="/read/prologue" className="bg-white border border-neutral-200 text-neutral-900 px-8 py-4 rounded-full font-medium text-center hover:bg-neutral-50 transition-colors">
                开始免费试读
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Table of Contents & Preview Section */}
      <div id="toc-section" className="pt-16 md:pt-24 pb-24 bg-[#fafafa] border-t border-neutral-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="mb-12">
            <h3 className="text-sm font-bold text-[#e8600a] mb-6 tracking-widest">目录</h3>
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-neutral-900 mb-6">这本书讲什么</h2>
            <p className="text-neutral-600 text-base md:text-lg leading-relaxed text-justify">
              这不是一本"学习技巧大全"，也不是一份App使用说明。它是一个做了十年工厂管理的工程爸，在看着孩子说出"粗心了"然后翻页的那个下午，突然意识到一件事之后写下来的——我们处理孩子错误的方式，和工厂里最不合格的质量报告，没有任何本质区别。书分四个部分：道（认知）、法（方法）、术（执行）、器（工具），一层一层往下走。
            </p>
          </div>
          
          <div className="h-px w-full bg-neutral-200 mb-12"></div>

          <div className="space-y-16">
              {/* Group chapters by part */}
              {(() => {
                const parts: {
                  partId: string;
                  partLabel?: string;
                  partTitle?: string;
                  partSubtitle?: string;
                  partSummary?: string;
                  chapters: typeof chapters;
                }[] = [];

                let currentPartId = '';
                chapters.forEach(chapter => {
                  const pId = chapter.partId || chapter.id; // Use chapter id as part id if no part
                  if (pId !== currentPartId) {
                    parts.push({
                      partId: pId,
                      partLabel: chapter.partLabel,
                      partTitle: chapter.partTitle,
                      partSubtitle: chapter.partSubtitle,
                      partSummary: chapter.partSummary,
                      chapters: []
                    });
                    currentPartId = pId;
                  }
                  
                  if (!chapter.isPartCover) {
                    parts[parts.length - 1].chapters.push(chapter);
                  } else {
                    const currentPart = parts[parts.length - 1];
                    currentPart.partLabel = chapter.partLabel || currentPart.partLabel;
                    currentPart.partTitle = chapter.partTitle || currentPart.partTitle;
                    currentPart.partSubtitle = chapter.partSubtitle || currentPart.partSubtitle;
                    currentPart.partSummary = chapter.partSummary || currentPart.partSummary;
                  }
                });

                return parts.map((part, index) => (
                  <div key={part.partId} className="relative">
                    {part.partLabel && part.partTitle && (
                      <div className="mb-8 py-6 border-y border-dashed border-neutral-300">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-[#1a2744] text-white flex items-center justify-center font-serif text-xl shrink-0">
                            {part.partTitle}
                          </div>
                          <div>
                            <h3 className="text-lg md:text-xl font-bold text-[#1a2744] mb-2 mt-1">
                              {part.partLabel}：{part.partSubtitle}
                            </h3>
                            {part.partSummary && (
                              <p className="text-neutral-500 text-sm leading-relaxed">
                                {part.partSummary}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className={part.partLabel ? "pl-16" : ""}>
                      {part.chapters.map(chapter => {
                        const num = chapter.chapterNumber !== undefined ? chapter.chapterNumber.toString().padStart(2, '0') : '';
                        const titleText = chapter.title;

                        return (
                          <div key={chapter.id} className="mb-8 group">
                            <Link href={`/read/${chapter.id}`} className="block">
                              <div className="flex items-start gap-3">
                                {num && <span className="text-[#e8600a] font-bold text-lg mt-0.5 shrink-0">{num}</span>}
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <h4 className={`text-lg font-medium text-neutral-800 group-hover:text-[#e8600a] transition-colors ${!num ? 'font-serif text-xl' : ''}`}>
                                      {titleText}
                                    </h4>
                                    {chapter.isFree ? (
                                      <span className="text-[10px] font-medium px-2 py-0.5 bg-green-100 text-green-700 rounded-sm shrink-0">可试读</span>
                                    ) : (
                                      <Lock className="w-3.5 h-3.5 text-neutral-300 shrink-0" />
                                    )}
                                  </div>
                                  {chapter.summary && (
                                    <p className="text-sm md:text-base text-neutral-500 leading-relaxed italic">
                                      {chapter.summary}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Divider between parts, except the last one */}
                    {index < parts.length - 1 && (
                      <div className="h-px w-full bg-neutral-200 mt-16"></div>
                    )}
                  </div>
                ));
              })()}
            </div>

            <div className="mt-24 p-8 bg-neutral-50 rounded-2xl text-center border border-neutral-100">
              <h4 className="text-lg font-bold text-neutral-900 mb-3">准备好升级孩子的学习系统了吗？</h4>
              <p className="text-neutral-600 mb-8">购买完整版电子书，解锁全部 12 个章节与实操模板，并获得 Socrates 错题系统 1 个月使用权益。</p>
              <Link href="/book-purchase" className="inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-8 py-4 rounded-full font-medium hover:bg-neutral-800 transition-colors no-underline shadow-lg shadow-neutral-900/20">
                前往扫码购买套装 (¥39.9) <ArrowRight className="w-4 h-4" />
              </Link>
          </div>
        </div>
      </div>
    </>
  );
}


