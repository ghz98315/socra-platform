import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight, Sparkles } from 'lucide-react';
import { essays, getEssayBySlug } from '../../../lib/essays';

type EssayPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return essays.filter((essay) => essay.status === 'published').map((essay) => ({ slug: essay.slug }));
}

export async function generateMetadata({ params }: EssayPageProps): Promise<Metadata> {
  const { slug } = await params;
  const essay = getEssayBySlug(slug);

  if (!essay || essay.status !== 'published') {
    return {
      title: '文章不存在 | Socrates',
    };
  }

  const url = `https://socra.cn/essays/${essay.slug}`;

  return {
    title: `${essay.seoTitle} | Socrates`,
    description: essay.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: essay.seoTitle,
      description: essay.metaDescription,
      url,
      type: 'article',
      siteName: 'Socrates',
      locale: 'zh_CN',
      publishedTime: essay.publishedAt,
      images: [
        {
          url: 'https://socra.cn/logo.png',
          width: 512,
          height: 512,
          alt: essay.title,
        },
      ],
    },
  };
}

export default async function EssayDetailPage({ params }: EssayPageProps) {
  const { slug } = await params;
  const essay = getEssayBySlug(slug);

  if (!essay || essay.status !== 'published' || !essay.body) {
    notFound();
  }

  const nextEssay = essay.nextSlug ? getEssayBySlug(essay.nextSlug) : undefined;

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: essay.title,
        description: essay.metaDescription,
        datePublished: essay.publishedAt,
        dateModified: essay.publishedAt,
        inLanguage: 'zh-CN',
        author: {
          '@type': 'Person',
          name: '工程师爸爸',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Socrates',
          logo: {
            '@type': 'ImageObject',
            url: 'https://socra.cn/logo.png',
          },
        },
        mainEntityOfPage: `https://socra.cn/essays/${essay.slug}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: '首页',
            item: 'https://socra.cn',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: '文章',
            item: 'https://socra.cn/essays',
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: essay.title,
            item: `https://socra.cn/essays/${essay.slug}`,
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff8ef_0%,#fffefb_42%,#fffaf4_100%)] text-stone-800">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <main className="px-5 pb-20 pt-16 sm:px-6 lg:px-8">
        <article className="mx-auto max-w-4xl">
          <header className="rounded-[2.4rem] border border-white/85 bg-[linear-gradient(135deg,rgba(255,251,245,0.97)_0%,rgba(255,245,234,0.95)_44%,rgba(255,252,247,0.98)_100%)] px-6 py-8 shadow-[0_28px_90px_rgba(45,30,20,0.08)] sm:px-8 sm:py-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/88 px-4 py-2 text-sm font-medium text-orange-700 shadow-[0_10px_28px_rgba(245,123,55,0.08)]">
              <Sparkles className="h-4 w-4" />
              {essay.series} · 连载文章
            </span>
            <h1 className="mt-5 text-[2.3rem] font-semibold leading-[1.06] tracking-[-0.03em] text-stone-950 sm:text-[3rem] [font-family:var(--font-display)]">
              {essay.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-stone-500">
              <span>{essay.readingTime}</span>
              {essay.publishedAt ? <span>{essay.publishedAt}</span> : null}
            </div>
          </header>

          <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white/92 px-6 py-7 shadow-[0_18px_48px_rgba(45,30,20,0.05)] sm:px-8">
            <p className="text-[1.15rem] leading-8 text-stone-800 sm:text-[1.25rem] sm:leading-9">{essay.heroQuote}</p>
          </section>

          <div className="mt-8 space-y-8 rounded-[2rem] border border-stone-200 bg-white/94 px-6 py-7 shadow-[0_18px_48px_rgba(45,30,20,0.05)] sm:px-8 sm:py-9">
            {essay.body.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-semibold leading-tight text-stone-950 [font-family:var(--font-display)]">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-[1rem] leading-8 text-stone-700 sm:text-[1.04rem]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white/92 px-6 py-7 shadow-[0_18px_48px_rgba(45,30,20,0.05)] sm:px-8">
            <p className="text-xs font-semibold tracking-[0.24em] text-stone-400">关键要点</p>
            <div className="mt-5 space-y-3">
              {essay.keyTakeaways.map((item, index) => (
                <div key={item} className="rounded-[1.35rem] bg-[#fffaf4] px-4 py-4">
                  <p className="text-sm leading-7 text-stone-700">
                    <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-700">
                      0{index + 1}
                    </span>
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {nextEssay ? (
            <section className="mt-8 rounded-[2rem] border border-stone-200 bg-white/92 px-6 py-7 shadow-[0_18px_48px_rgba(45,30,20,0.05)] sm:px-8">
              <p className="text-xs font-semibold tracking-[0.24em] text-stone-400">下一篇</p>
              <h2 className="mt-3 text-2xl font-semibold text-stone-950 [font-family:var(--font-display)]">{nextEssay.title}</h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">{nextEssay.summary}</p>
              {nextEssay.status === 'published' ? (
                <Link
                  href={`/essays/${nextEssay.slug}`}
                  className="mt-5 inline-flex items-center gap-2 font-medium text-orange-600 transition hover:text-orange-700"
                >
                  继续阅读
                  <ChevronRight className="h-4 w-4" />
                </Link>
              ) : (
                <p className="mt-5 text-sm text-stone-500">这篇内容正在写作中，会按计划继续加入连载。</p>
              )}
            </section>
          ) : null}

          <section className="mt-8 rounded-[2rem] border border-orange-100 bg-[linear-gradient(180deg,#fffdf9_0%,#fff7ef_100%)] px-6 py-7 shadow-[0_18px_48px_rgba(45,30,20,0.05)] sm:px-8">
            <p className="text-xs font-semibold tracking-[0.24em] text-orange-500">继续往下</p>
            <h2 className="mt-3 text-2xl font-semibold text-stone-950 [font-family:var(--font-display)]">
              如果你认同这套方法，下一步就是把它用起来
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-stone-600">
              文章负责把事情讲清楚，系统负责把事情做下去。从问题进入，到追问、验证、复习与反馈，整条路径都应该连起来。
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/start"
                className="inline-flex items-center justify-center rounded-full bg-stone-900 px-7 py-3 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                去看如何开始
              </Link>
              <Link
                href="/essays"
                className="inline-flex items-center justify-center rounded-full border border-stone-300 bg-white/85 px-7 py-3 text-sm font-medium text-stone-800 transition hover:bg-white"
              >
                回到文章列表
              </Link>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
