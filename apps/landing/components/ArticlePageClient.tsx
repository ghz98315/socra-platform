'use client';

import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { buildSocratesEntryUrl } from '../lib/socratesLinks';
import { useArticles } from '../lib/useArticles';

type ArticlePageClientProps = {
  slug: string;
};

export default function ArticlePageClient({ slug }: ArticlePageClientProps) {
  const { articles, isLoaded } = useArticles();
  const startToolHref = buildSocratesEntryUrl({
    source: 'landing-article',
    intent: 'start-tool',
    redirect: '/error-book',
  });

  if (!isLoaded) return null;

  const article = articles.find((item) => item.slug === slug);

  if (!article) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">文章未找到</h1>
        <Link href="/essays" className="text-neutral-500 hover:text-neutral-900 underline">
          返回系列目录
        </Link>
      </div>
    );
  }

  const currentIndex = articles.findIndex((item) => item.slug === slug);
  const nextArticle = articles.slice(currentIndex + 1).find((item) => item.slug !== '#');

  return (
    <article className="py-12 md:py-24 px-4 sm:px-6 max-w-3xl mx-auto">
      <Link href="/essays" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-8 md:mb-12 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回系列目录
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8 md:mb-12">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <span className="text-xs font-medium text-neutral-900 bg-neutral-100 px-2 py-1 rounded-sm">{article.category}</span>
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">{article.date}</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 leading-tight mb-6">
            {article.title}
          </h1>
          <div className="flex items-center gap-3">
            <img src="https://picsum.photos/seed/engineer/100/100" alt="关博" className="w-10 h-10 rounded-full object-cover" referrerPolicy="no-referrer" />
            <div>
              <p className="text-sm font-medium text-neutral-900">关博 / 工程爸</p>
              <p className="text-xs text-neutral-500">Socrates 创始人</p>
            </div>
          </div>
        </div>

        <div className="prose prose-neutral md:prose-lg max-w-none text-neutral-700">
          <p className="lead text-xl text-neutral-600 mb-8 font-medium">{article.excerpt}</p>

          <div className={`markdown-body ${article.format === 'html' ? 'socrates-reader' : ''} ${article.slug === 'two-years-later' ? 'epilogue-mode' : ''}`}>
            {article.format === 'html' ? (
              <div dangerouslySetInnerHTML={{ __html: article.content }} />
            ) : (
              <ReactMarkdown>{article.content}</ReactMarkdown>
            )}
          </div>

          <div className="bg-neutral-50 p-8 rounded-2xl my-12 border border-neutral-100">
            <h3 className="text-xl font-bold mb-4 text-neutral-900">准备好建立你的错题闭环了吗？</h3>
            <p className="mb-6 text-neutral-600 text-base">
              心法需要兵器来落地。Socrates 错题系统，帮你把这些方法论变成每天自动运转的闭环。
            </p>
            <a href={startToolHref} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-full font-medium hover:bg-neutral-800 transition-colors text-base no-underline">
              开始使用 Socrates <ArrowRight className="w-4 h-4" />
            </a>
          </div>

          <div className="mt-16 pt-8 border-t border-neutral-200 flex justify-between items-center gap-4">
            <div>
              <p className="text-sm text-neutral-500 mb-1">所属系列</p>
              <Link href="/essays" className="font-medium text-neutral-900 hover:underline flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> 从错误开始，闭环学习
              </Link>
            </div>
            {nextArticle && (
              <div className="text-right">
                <p className="text-sm text-neutral-500 mb-1">下一篇</p>
                <Link href={`/essays/${nextArticle.slug}`} className="font-medium text-neutral-900 hover:underline inline-flex items-center gap-1">
                  {nextArticle.title} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </article>
  );
}
