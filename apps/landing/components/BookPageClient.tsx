'use client';

import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Lock } from 'lucide-react';
import Link from 'next/link';
import BookCoverMockup from './BookCoverMockup';
import { useBookChapters, type BookChapter } from '../lib/useBookChapters';

type TocPart = {
  partId: string;
  badge: string;
  name: string;
  description?: string;
  chapters: BookChapter[];
};

function buildTocParts(chapters: BookChapter[]): TocPart[] {
  const parts: TocPart[] = [];
  let currentPart: TocPart | null = null;

  for (const chapter of chapters) {
    if (chapter.id === 'prologue' || chapter.id === 'epilogue' || chapter.id === 'appendix') {
      continue;
    }

    if (chapter.isPartCover) {
      currentPart = {
        partId: chapter.partId ?? chapter.id,
        badge: chapter.partTitle ?? chapter.title,
        name: [chapter.partLabel, chapter.partSubtitle].filter(Boolean).join('：') || chapter.title,
        description: chapter.partSummary,
        chapters: [],
      };
      parts.push(currentPart);
      continue;
    }

    if (!currentPart || (chapter.partId && currentPart.partId !== chapter.partId)) {
      currentPart = {
        partId: chapter.partId ?? chapter.id,
        badge: chapter.partTitle ?? chapter.title,
        name: [chapter.partLabel, chapter.partSubtitle].filter(Boolean).join('：') || chapter.title,
        description: chapter.partSummary,
        chapters: [],
      };
      parts.push(currentPart);
    }

    currentPart.chapters.push(chapter);
  }

  return parts;
}

function ChapterLink({ chapter, compact = false }: { chapter: BookChapter; compact?: boolean }) {
  const href = chapter.isFree ? `/read/${chapter.id}` : '/book-purchase';
  const chapterNumber =
    !compact &&
    typeof chapter.chapterNumber === 'number' &&
    chapter.chapterNumber > 0 &&
    chapter.chapterNumber < 12
      ? chapter.chapterNumber.toString().padStart(2, '0')
      : null;

  return (
    <Link href={href} className="block group no-underline">
      <div className={`flex items-start gap-3 ${compact ? 'py-6 md:py-7' : 'py-4 md:py-5'}`}>
        {chapterNumber && (
          <span className="toc-chapter-num mt-0.5 shrink-0 text-xs font-bold text-[#e8600a] md:text-sm">
            {chapterNumber}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <span
              className={`font-serif text-neutral-800 transition-colors group-hover:text-[#e8600a] ${
                compact ? 'text-[1rem] md:text-[1.06rem]' : 'text-[0.98rem] md:text-[1.03rem]'
              }`}
            >
              {chapter.title}
            </span>

            {chapter.isFree ? (
              <span className="mt-0.5 shrink-0 rounded-sm bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                试读
              </span>
            ) : (
              <Lock className="mt-1 h-3.5 w-3.5 shrink-0 text-neutral-300" />
            )}
          </div>

          {chapter.summary && (
            <p
              className={`font-sans italic leading-relaxed text-neutral-500 ${
                compact ? 'mt-2 text-sm' : 'mt-2 text-[0.82rem] md:pl-7'
              }`}
            >
              {chapter.summary}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function BookPage() {
  const { chapters, isLoaded } = useBookChapters();

  if (!isLoaded) {
    return null;
  }

  const orderedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const prefaceChapter = orderedChapters.find((chapter) => chapter.id === 'prologue');
  const epilogueChapter = orderedChapters.find((chapter) => chapter.id === 'epilogue');
  const appendixChapter = orderedChapters.find((chapter) => chapter.id === 'appendix');
  const tocParts = buildTocParts(orderedChapters);

  return (
    <>
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 md:py-24">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 md:mb-12"
        >
          <ArrowLeft className="h-4 w-4" />
          返回首页
        </Link>

        <div className="flex flex-col items-start gap-12 md:flex-row lg:gap-18">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto w-full max-w-[18.5rem] shrink-0 sm:max-w-[21rem] md:w-[42%] md:max-w-none lg:w-[38%]"
          >
            <BookCoverMockup variant="detail" className="w-full" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full md:w-[56%] lg:w-[60%]"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
              <BookOpen className="h-4 w-4" />
              <span>电子书首发</span>
            </div>

            <h2 className="mb-4 max-w-[11ch] font-serif text-2xl font-bold leading-[1.12] tracking-tight text-neutral-900 sm:mb-5 sm:text-3xl md:text-[2.75rem] lg:text-[3.2rem]">
              从错误开始：
              <br />
              <span>一套真正能</span>
              <span className="whitespace-nowrap">闭环</span>
              <span>的</span>
              <br />
              学习系统
            </h2>
            <p className="mb-8 max-w-[26rem] border-l-2 border-[#e8600a]/45 pl-4 text-[1.02rem] font-normal leading-[1.9] text-neutral-400 sm:text-[1.16rem]">
              不是提分技巧，不是管理工具，而是一种面对错误的
              <span className="whitespace-nowrap">方式。</span>
            </p>

            <div className="mb-10 space-y-6 text-[1.02rem] leading-[1.85] text-neutral-600 text-justify sm:text-[1.08rem]">
              <p className="text-neutral-800 font-medium">大宝做几何题，正弦用成余弦。你问他为什么错，他说“粗心了”。</p>
              <p>
                但在工厂里，没有任何一份合格的质量报告会把“粗心”写成根因。因为这两个字一旦落下，追问就结束了，错误也只会换个时间再出现一次。
              </p>
              <p className="text-neutral-800">这本书，就是从那个下午开始写的。</p>
              <p>
                它把工程管理里的 5 Why、费曼学习法、艾宾浩斯复习节奏和 PDCA 闭环，迁移到孩子每天都会遇到的错题场景里，重新回答一件事：一道题做错之后，到底怎样才算真的结束。
              </p>
            </div>

            <div className="mb-10 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 sm:p-6">
              <p className="text-sm leading-loose text-neutral-600 sm:text-base">
                <strong className="text-neutral-900">购书须知：</strong>
                首发特惠套装 ¥39.9，包含《从错误开始》电子书永久阅读权益，以及
                <strong> Socrates </strong>
                错题系统 1 个月使用权益。电子书负责把逻辑讲清楚，系统负责把流程跑起来。
              </p>
            </div>

            <div className="mb-10 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-8">
              <h3 className="mb-5 text-lg font-bold text-neutral-900 sm:text-xl">你将在这本书中获得</h3>
              <ul className="space-y-4 text-base leading-relaxed sm:text-lg">
                {[
                  '为什么“粗心”“订正”“错题本”常常解决不了重复出错。',
                  '如何用 5 Why 和费曼学习法，把一道题从做错追到真正学会。',
                  '怎样把复习节点、迁移验证和家庭执行串成一条完整闭环。',
                  '尾声与附录里的真实落地经验，以及可直接拿来用的配套工具模板。',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-neutral-600">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-neutral-900" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div id="preview" className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/book-purchase"
                className="rounded-full bg-neutral-900 px-8 py-4 text-center font-medium text-white shadow-lg shadow-neutral-900/20 transition-colors hover:bg-neutral-800"
              >
                购买「书 + 工具」套装（¥39.9）
              </Link>
              <Link
                href="/read/prologue"
                className="rounded-full border border-neutral-200 bg-white px-8 py-4 text-center font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
              >
                开始免费试读
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      <div id="toc-section" className="border-t border-[#d4cfc8] bg-[#f5f4f0] py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="mb-12 md:mb-14">
            <h3 className="mb-3 font-sans text-[0.72rem] font-bold tracking-[0.2em] text-[#e8600a]">目 录</h3>
            <h2 className="mb-4 font-serif text-3xl font-normal text-[#1a2744] md:text-4xl">这本书讲什么</h2>
            <p className="max-w-3xl font-sans text-[0.95rem] leading-[1.75] text-neutral-500 md:text-base">
              这不是一本“学习技巧大全”，也不是一份 App 使用说明。它是一个做了十年工厂管理的工程师爸爸，在看着孩子说出“粗心了”然后翻页的那个下午，突然意识到一件事之后写下来的。全书分为道、法、术、器四个部分，最后以尾声收束，再把附录工具包作为最后一章落到执行层。
            </p>
          </div>

          <div className="space-y-0">
            {prefaceChapter && (
              <div className="border-t border-[#d4cfc8]">
                <ChapterLink chapter={prefaceChapter} compact />
              </div>
            )}

            {tocParts.map((part) => (
              <div key={part.partId} className="border-t border-[#d4cfc8]">
                <div className="flex items-start gap-4 px-0 pb-3 pt-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-[#1a2744] font-sans text-sm font-bold text-white">
                    {part.badge}
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 font-sans text-[1rem] font-bold leading-[1.45] text-[#1a2744] md:text-[1.05rem]">
                      {part.name}
                    </div>
                    {part.description && (
                      <p className="font-sans text-[0.8rem] leading-[1.65] text-neutral-500 md:text-[0.84rem]">
                        {part.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pb-5 pl-0 md:pl-14">
                  {part.chapters.map((chapter) => (
                    <div key={chapter.id} className="border-t border-dashed border-[#d4cfc8] first:border-t">
                      <ChapterLink chapter={chapter} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {epilogueChapter && (
              <div className="border-t border-[#d4cfc8]">
                <ChapterLink chapter={epilogueChapter} compact />
              </div>
            )}

            {appendixChapter && (
              <div className="border-t border-[#d4cfc8]">
                <ChapterLink chapter={appendixChapter} compact />
              </div>
            )}
          </div>

          <div className="mt-20 rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <h4 className="mb-3 text-lg font-bold text-neutral-900">准备好把这套系统真正跑起来了吗？</h4>
            <p className="mb-8 text-neutral-600">
              购买完整版电子书，解锁全书章节、尾声与附录模板，并获得 Socrates 错题系统 1 个月使用权益。
            </p>
            <Link
              href="/book-purchase"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-neutral-900 px-8 py-4 font-medium text-white no-underline shadow-lg shadow-neutral-900/20 transition-colors hover:bg-neutral-800"
            >
              前往购买套装（¥39.9）
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
