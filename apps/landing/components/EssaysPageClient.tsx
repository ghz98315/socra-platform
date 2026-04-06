'use client';

import { motion } from 'motion/react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useArticles } from '../lib/useArticles';

export default function EssaysPage() {
  const { articles, isLoaded } = useArticles();

  if (!isLoaded) return null;

  return (
    <>
<section className="pt-16 md:pt-24 pb-12 px-4 sm:px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="font-serif text-3xl md:text-5xl font-bold text-neutral-900 mb-6">
            从错误开始，闭环学习
          </h1>
          <p className="text-lg text-neutral-600 leading-relaxed mb-12">
            这里是《从错误开始：一套真正能闭环的学习系统》的在线目录与连载阵地。<br/>
            我们将按照「道、法、术、器」的结构，为你拆解如何用工厂的质量管理逻辑，重建孩子的学习方法。
          </p>
        </motion.div>

        <div className="flex flex-col">
          {articles.map((article, index) => (
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
                {article.slug !== '#' ? (
                  <Link href={`/essays/${article.slug}`} className="block group-hover:opacity-80 transition-opacity">
                    <h2 className="font-serif text-xl md:text-2xl font-bold text-neutral-900 mb-4 leading-[1.4]">
                      {article.title}
                    </h2>
                    <div className="bg-neutral-50/80 rounded-r-lg border-l-[3px] border-neutral-200 p-4 mb-5 group-hover:border-neutral-400 transition-colors duration-300">
                      <p className="text-neutral-600 leading-[1.8] text-justify text-sm sm:text-base line-clamp-3">
                        {article.excerpt}
                      </p>
                    </div>
                  </Link>
                ) : (
                  <div className="block opacity-60 cursor-not-allowed">
                    <h2 className="font-serif text-xl md:text-2xl font-bold text-neutral-900 mb-4 leading-[1.4]">
                      {article.title}
                    </h2>
                    <div className="bg-neutral-50/80 rounded-r-lg border-l-[3px] border-neutral-200 p-4 mb-5">
                      <p className="text-neutral-600 leading-[1.8] text-justify text-sm sm:text-base line-clamp-3">
                        {article.excerpt}
                      </p>
                    </div>
                  </div>
                )}
                
                {article.slug !== '#' && (
                  <Link href={`/essays/${article.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-neutral-900 hover:underline underline-offset-4">
                    阅读全文 <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </motion.article>
          ))}
        </div>

        <div className="mt-16 bg-neutral-50 p-8 rounded-2xl border border-neutral-100 text-center">
          <h3 className="text-xl font-bold mb-4 text-neutral-900">准备好建立你的错题闭环了吗？</h3>
          <p className="mb-6 text-neutral-600 text-base">
            心法需要兵器来落地。Socrates 错题系统，帮你把这些方法论变成每天自动运转的闭环。
          </p>
          <a href="https://socrates.socra.cn" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full font-medium hover:bg-neutral-800 transition-colors text-base no-underline">
            开始使用 Socrates <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </>
  );
}


