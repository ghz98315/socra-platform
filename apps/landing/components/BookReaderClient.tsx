'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, List, Lock, Moon, ScrollText, Settings, Sun } from 'lucide-react';
import { isFileBackedBookChapter } from '../lib/bookChapterRegistry';
import { useBookChapters } from '../lib/useBookChapters';

type BookReaderClientProps = {
  chapterId: string;
  chapterContentOverride?: string;
};

const DEFAULT_CHAPTER_CONTENT = '<p>本章暂无内容，作者正在努力撰写中...</p>';

function isPlaceholderChapterContent(content?: string): boolean {
  return !content || content.includes('本章内容正在撰写中');
}

export default function BookReaderClient({ chapterId, chapterContentOverride }: BookReaderClientProps) {
  const router = useRouter();
  const { chapters, isLoaded } = useBookChapters();

  const [progress, setProgress] = useState(0);
  const [layoutMode, setLayoutMode] = useState<'paged' | 'scroll'>('scroll');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showSettings, setShowSettings] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 768);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const calculatePages = useCallback(() => {
    if (layoutMode === 'paged' && contentRef.current && containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const gap = window.innerWidth >= 768 ? 64 : 32;
      const totalWidth = contentRef.current.scrollWidth;
      const pages = Math.round((totalWidth + gap) / (containerWidth + gap));
      setTotalPages(Math.max(1, pages));
      setCurrentPage((prev) => Math.min(prev, Math.max(0, pages - 1)));
    }
  }, [layoutMode]);

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
      calculatePages();
    };

    calculatePages();
    window.addEventListener('resize', handleResize);

    let observer: ResizeObserver | null = null;
    if (contentRef.current) {
      observer = new ResizeObserver(calculatePages);
      observer.observe(contentRef.current);
    }

    const timer = setTimeout(calculatePages, 500);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
      clearTimeout(timer);
    };
  }, [calculatePages, chapterId, fontSize, isLoaded, layoutMode]);

  useEffect(() => {
    setCurrentPage(0);
    window.scrollTo(0, 0);
  }, [chapterId]);

  useEffect(() => {
    if (layoutMode !== 'scroll') return;

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (windowHeight === 0) {
        setProgress(0);
        return;
      }
      setProgress((totalScroll / windowHeight) * 100);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [chapterId, layoutMode]);

  useEffect(() => {
    if (layoutMode === 'paged') {
      setProgress(((currentPage + 1) / totalPages) * 100);
    }
  }, [currentPage, layoutMode, totalPages]);

  const currentIndex = chapters.findIndex((chapter) => chapter.id === chapterId);
  const chapter = chapters[currentIndex];
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  const openChapter = useCallback((targetId: string) => {
    router.push(`/read/${targetId}`);
  }, [router]);

  const handlePrev = useCallback(() => {
    if (layoutMode !== 'paged') return;
    if (currentPage > 0) {
      setCurrentPage((page) => page - 1);
      return;
    }
    if (prevChapter) {
      if (prevChapter.isFree) openChapter(prevChapter.id);
      else router.push('/book');
    }
  }, [currentPage, layoutMode, openChapter, prevChapter, router]);

  const handleNext = useCallback(() => {
    if (layoutMode !== 'paged') return;
    if (currentPage < totalPages - 1) {
      setCurrentPage((page) => page + 1);
      return;
    }
    if (nextChapter) {
      if (nextChapter.isFree) openChapter(nextChapter.id);
      else router.push('/book');
    }
  }, [currentPage, layoutMode, nextChapter, openChapter, router, totalPages]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (layoutMode !== 'paged') return;
      if (event.key === 'ArrowLeft') handlePrev();
      if (event.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, layoutMode]);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.changedTouches[0].screenX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    const touchEndX = event.changedTouches[0].screenX;
    const swipeDistance = touchStartX.current - touchEndX;
    if (swipeDistance > 50) handleNext();
    if (swipeDistance < -50) handlePrev();
  };

  if (!isLoaded) return null;

  if (!chapter) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fafafa]">
        <h1 className="text-2xl font-bold mb-4 text-neutral-900">章节未找到</h1>
        <Link href="/book" className="text-neutral-500 hover:text-neutral-900 underline">
          返回书籍主页
        </Link>
      </div>
    );
  }

  const renderChapterLabel = () => {
    if (chapter.chapterNumber === 0) return '序言';
    if (chapter.chapterNumber === 13) return '附录';
    const numMap = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
    const numStr = chapter.chapterNumber && chapter.chapterNumber <= 12 ? numMap[chapter.chapterNumber] : chapter.chapterNumber;
    let label = `第${numStr}章`;
    if (chapter.partLabel) label += ` · ${chapter.partLabel}`;
    return label;
  };

  const renderTocLabel = (item: (typeof chapters)[number]) => {
    if (item.isPartCover) {
      return item.partLabel ?? item.title;
    }
    if (item.chapterNumber === 0) return '序言';
    if (item.chapterNumber === 13) return '附录';
    if (typeof item.chapterNumber === 'number') {
      return `第 ${item.chapterNumber} 章`;
    }
    return '';
  };

  const isEpilogueChapter = chapter.id === 'epilogue';
  const chapterContent = isFileBackedBookChapter(chapter.id)
    ? chapterContentOverride || chapter.content || DEFAULT_CHAPTER_CONTENT
    : !isPlaceholderChapterContent(chapter.content)
      ? chapter.content
      : chapterContentOverride || chapter.content || DEFAULT_CHAPTER_CONTENT;
  const hasEmbeddedHeader = /class=["'][^"']*(chapter-header|epilogue-section|appendix-section)[^"']*["']/.test(chapterContent);

  const chapterHeaderHtml = `
    <div class="mb-16 text-left" style="break-after: avoid;">
      <div class="w-1 h-6 bg-[#e8600a] mb-6"></div>
      <span class="text-sm font-bold text-[#e8600a] tracking-widest mb-4 block">${renderChapterLabel()}</span>
      <h1 class="text-3xl md:text-4xl font-serif font-bold leading-tight mb-8 ${theme === 'dark' ? 'text-[#f5f4f0]' : 'text-[#1a2744]'}">${chapter.title}</h1>
      ${chapter.summary ? `
        <div class="p-6 border-l-4 border-[#e8600a] ${theme === 'dark' ? 'bg-[#262626]' : 'bg-[#f5f5f5]'}">
          <p class="text-base italic leading-relaxed text-justify ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}">${chapter.summary}</p>
        </div>
      ` : ''}
    </div>
  `;

  const pagedChapterHtml = hasEmbeddedHeader ? chapterContent : `${chapterHeaderHtml}${chapterContent}`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-[#1a1a1a] text-[#e0ddd8] dark' : 'bg-[#fafafa] text-[#171717]'}`}>
      <header className={`fixed top-0 left-0 right-0 backdrop-blur-md border-b z-50 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#1a1a1a]/90 border-neutral-800' : 'bg-[#fafafa]/90 border-neutral-200'}`}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/book" className={`flex items-center gap-2 transition-colors ${theme === 'dark' ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-900'}`}>
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">返回目录</span>
          </Link>

          <div className="text-sm font-medium truncate max-w-[50%] text-center font-serif">{chapter.title}</div>

          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => {
                setShowToc((value) => !value);
                setShowSettings(false);
              }}
              className={`transition-colors ${theme === 'dark' ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-900'}`}
              title="目录"
            >
              <List className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setShowSettings((value) => !value);
                setShowToc(false);
              }}
              className={`transition-colors ${theme === 'dark' ? 'text-neutral-400 hover:text-neutral-200' : 'text-neutral-500 hover:text-neutral-900'}`}
              title="设置"
            >
              <Settings className="w-5 h-5" />
            </button>

            {showToc && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowToc(false)} />
                <div className={`absolute top-10 right-8 w-72 md:w-80 max-h-[70vh] overflow-y-auto border rounded-2xl shadow-xl p-2 z-50 ${theme === 'dark' ? 'bg-[#262626] border-neutral-700' : 'bg-white border-neutral-200'}`}>
                  <div className={`p-3 pb-2 text-xs font-bold uppercase tracking-wider sticky top-0 z-10 border-b mb-2 ${theme === 'dark' ? 'bg-[#262626] text-neutral-400 border-neutral-700' : 'bg-white text-neutral-400 border-neutral-100'}`}>
                    目录
                  </div>
                  <div className="flex flex-col gap-1">
                    {chapters.map((item) => {
                      const isActive = item.id === chapterId;
                      if (item.isFree) {
                        return (
                          <button
                            key={item.id}
                            onClick={() => {
                              openChapter(item.id);
                              setShowToc(false);
                            }}
                            className={`text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between transition-colors ${isActive ? (theme === 'dark' ? 'bg-[#e8600a]/20 text-[#e8600a]' : 'bg-[#fff5ee] text-[#e8600a]') : (theme === 'dark' ? 'text-neutral-300 hover:bg-neutral-800' : 'text-neutral-700 hover:bg-neutral-100')}`}
                          >
                            <span className="line-clamp-1">
                              {renderTocLabel(item) ? `${renderTocLabel(item)} · ${item.title}` : item.title}
                            </span>
                          </button>
                        );
                      }

                      return (
                        <div key={item.id} className={`text-left px-3 py-2.5 rounded-lg text-sm flex items-center justify-between ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-400'}`}>
                          <span className="line-clamp-1">
                            {renderTocLabel(item) ? `${renderTocLabel(item)} · ${item.title}` : item.title}
                          </span>
                          <Lock className="w-3.5 h-3.5 shrink-0 ml-2" />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {showSettings && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
                <div className={`absolute top-10 right-0 w-72 border rounded-2xl shadow-xl p-5 z-50 ${theme === 'dark' ? 'bg-[#262626] border-neutral-700' : 'bg-white border-neutral-200'}`}>
                  <div className="space-y-6">
                    <div>
                      <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">阅读主题</div>
                      <div className="flex gap-2">
                        <button onClick={() => setTheme('light')} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 border ${theme === 'light' ? 'border-[#e8600a] text-[#e8600a] bg-[#fff5ee] dark:bg-[#e8600a]/10' : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>
                          <Sun className="w-4 h-4" /> 白天
                        </button>
                        <button onClick={() => setTheme('dark')} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 border ${theme === 'dark' ? 'border-[#e8600a] text-[#e8600a] bg-[#fff5ee] dark:bg-[#e8600a]/10' : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>
                          <Moon className="w-4 h-4" /> 夜间
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">字号大小</div>
                      <div className="flex gap-2">
                        {(['small', 'medium', 'large'] as const).map((size) => (
                          <button key={size} onClick={() => setFontSize(size)} className={`flex-1 py-2 rounded-lg font-serif border ${fontSize === size ? 'border-[#e8600a] text-[#e8600a] bg-[#fff5ee] dark:bg-[#e8600a]/10' : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>
                            {size === 'small' ? '小' : size === 'medium' ? '中' : '大'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">翻页模式</div>
                      <div className="flex gap-2">
                        <button onClick={() => { setLayoutMode('paged'); setCurrentPage(0); }} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 border ${layoutMode === 'paged' ? 'border-[#e8600a] text-[#e8600a] bg-[#fff5ee] dark:bg-[#e8600a]/10' : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>
                          <BookOpen className="w-4 h-4" /> 仿真翻页
                        </button>
                        <button onClick={() => setLayoutMode('scroll')} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 border ${layoutMode === 'scroll' ? 'border-[#e8600a] text-[#e8600a] bg-[#fff5ee] dark:bg-[#e8600a]/10' : 'border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400'}`}>
                          <ScrollText className="w-4 h-4" /> 连续滚动
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className={`h-[2px] w-full absolute bottom-0 left-0 ${theme === 'dark' ? 'bg-neutral-800' : 'bg-neutral-100'}`}>
          <div className="h-full bg-[#e8600a] transition-all duration-150 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </header>

      <main
        className={`pt-14 ${layoutMode === 'paged' ? 'pb-16 h-[100dvh] overflow-hidden' : 'pb-32'} px-4 sm:px-6`}
        onTouchStart={layoutMode === 'paged' ? handleTouchStart : undefined}
        onTouchEnd={layoutMode === 'paged' ? handleTouchEnd : undefined}
      >
        {layoutMode === 'paged' && (
          <>
            <div className="fixed top-14 bottom-16 left-0 w-[15%] max-w-[150px] z-10 cursor-pointer" onClick={handlePrev} title="上一页" />
            <div className="fixed top-14 bottom-16 right-0 w-[15%] max-w-[150px] z-10 cursor-pointer" onClick={handleNext} title="下一页" />
          </>
        )}

        <article className={`${layoutMode === 'paged' ? 'max-w-5xl' : 'max-w-[680px]'} mx-auto h-full relative`} ref={containerRef}>
          {layoutMode === 'scroll' ? (
            <div className="py-12">
              {chapter.isPartCover ? (
                <div className="max-w-3xl mx-auto w-full py-12 md:py-24">
                  <div className="w-1 h-8 bg-[#e8600a] mb-8"></div>
                  <div className="text-[#e8600a] text-sm font-bold tracking-widest mb-6">{chapter.partLabel}</div>
                  <div className={`inline-flex items-center justify-center px-8 py-6 md:px-12 md:py-8 mb-8 ${theme === 'dark' ? 'bg-[#262626] text-[#f5f4f0]' : 'bg-[#1a1a1a] text-white'}`}>
                    <h1 className="text-6xl md:text-8xl font-serif font-bold">{chapter.partTitle}</h1>
                  </div>
                  <p className={`text-lg md:text-xl mb-12 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>{chapter.partSubtitle}</p>
                  <div className={`p-6 md:p-8 border-l-4 border-[#e8600a] ${theme === 'dark' ? 'bg-[#262626]' : 'bg-[#fff5ee]'}`}>
                    <p className={`text-base md:text-lg leading-relaxed text-justify ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>{chapter.partSummary}</p>
                  </div>
                </div>
              ) : (
                <>
                  {!hasEmbeddedHeader && (
                    <div className="mb-16 text-left">
                      <div className="w-1 h-6 bg-[#e8600a] mb-6"></div>
                      <span className="text-sm font-bold text-[#e8600a] tracking-widest mb-4 block">{renderChapterLabel()}</span>
                      <h1 className={`text-3xl md:text-4xl font-serif font-bold leading-tight mb-8 ${theme === 'dark' ? 'text-[#f5f4f0]' : 'text-[#1a2744]'}`}>{chapter.title}</h1>
                      {chapter.summary && (
                        <div className={`p-6 border-l-4 border-[#e8600a] ${theme === 'dark' ? 'bg-[#262626]' : 'bg-[#f5f5f5]'}`}>
                          <p className={`text-base italic leading-relaxed text-justify ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>{chapter.summary}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={`socrates-reader book-reader-content size-${fontSize} ${isEpilogueChapter ? 'epilogue-mode' : ''}`} dangerouslySetInnerHTML={{ __html: chapterContent }} />
                </>
              )}

              <div className={`mt-20 pt-8 border-t flex flex-col sm:flex-row justify-between items-center gap-4 ${theme === 'dark' ? 'border-neutral-800' : 'border-neutral-200'}`}>
                {prevChapter && prevChapter.isFree ? (
                  <Link href={`/read/${prevChapter.id}`} className={`flex items-center gap-3 transition-colors w-full sm:w-auto justify-center sm:justify-start p-4 sm:p-0 rounded-xl ${theme === 'dark' ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 sm:hover:bg-transparent' : 'text-neutral-500 hover:text-[#1a2744] hover:bg-neutral-100 sm:hover:bg-transparent'}`}>
                    <ChevronLeft className="w-5 h-5 shrink-0" />
                    <div className="text-left">
                      <div className="text-xs text-neutral-400 mb-1">上一章</div>
                      <div className="font-medium text-sm line-clamp-1">{prevChapter.title}</div>
                    </div>
                  </Link>
                ) : prevChapter ? (
                  <div className="flex items-center gap-3 text-neutral-400 w-full sm:w-auto justify-center sm:justify-start p-4 sm:p-0">
                    <ChevronLeft className="w-5 h-5 shrink-0" />
                    <div className="text-left">
                      <div className="text-xs text-neutral-400 mb-1">上一章</div>
                      <div className="font-medium text-sm line-clamp-1 flex items-center gap-1"><Lock className="w-3 h-3" /> {prevChapter.title}</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full sm:w-1/2" />
                )}

                {nextChapter && nextChapter.isFree ? (
                  <Link href={`/read/${nextChapter.id}`} className={`flex items-center gap-3 transition-colors w-full sm:w-auto justify-center sm:justify-end p-4 sm:p-0 rounded-xl text-right ${theme === 'dark' ? 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 sm:hover:bg-transparent' : 'text-neutral-500 hover:text-[#1a2744] hover:bg-neutral-100 sm:hover:bg-transparent'}`}>
                    <div className="text-right">
                      <div className="text-xs text-neutral-400 mb-1">下一章</div>
                      <div className="font-medium text-sm line-clamp-1">{nextChapter.title}</div>
                    </div>
                    <ChevronRight className="w-5 h-5 shrink-0" />
                  </Link>
                ) : nextChapter ? (
                  <div className="flex items-center gap-3 text-neutral-400 w-full sm:w-auto justify-center sm:justify-end p-4 sm:p-0 text-right">
                    <div className="text-right">
                      <div className="text-xs text-neutral-400 mb-1">下一章</div>
                      <div className="font-medium text-sm line-clamp-1 flex items-center justify-end gap-1">{nextChapter.title} <Lock className="w-3 h-3" /></div>
                    </div>
                    <ChevronRight className="w-5 h-5 shrink-0" />
                  </div>
                ) : (
                  <div className="w-full sm:w-1/2" />
                )}
              </div>
            </div>
          ) : (
            <div className="h-full w-full overflow-hidden py-8">
              {chapter.isPartCover ? (
                <div className="h-full w-full flex flex-col justify-center px-8 md:px-16">
                  <div className="max-w-3xl mx-auto w-full">
                    <div className="w-1 h-8 bg-[#e8600a] mb-8"></div>
                    <div className="text-[#e8600a] text-sm font-bold tracking-widest mb-6">{chapter.partLabel}</div>
                    <div className={`inline-flex items-center justify-center px-8 py-6 md:px-12 md:py-8 mb-8 ${theme === 'dark' ? 'bg-[#262626] text-[#f5f4f0]' : 'bg-[#1a1a1a] text-white'}`}>
                      <h1 className="text-6xl md:text-8xl font-serif font-bold">{chapter.partTitle}</h1>
                    </div>
                    <p className={`text-lg md:text-xl mb-12 ${theme === 'dark' ? 'text-neutral-400' : 'text-neutral-600'}`}>{chapter.partSubtitle}</p>
                    <div className={`p-6 md:p-8 border-l-4 border-[#e8600a] ${theme === 'dark' ? 'bg-[#262626]' : 'bg-[#fff5ee]'}`}>
                      <p className={`text-base md:text-lg leading-relaxed text-justify ${theme === 'dark' ? 'text-neutral-300' : 'text-neutral-700'}`}>{chapter.partSummary}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  ref={contentRef}
                  className={`socrates-reader book-reader-content size-${fontSize} book-paged-container ${isEpilogueChapter ? 'epilogue-mode' : ''}`}
                  style={{ transform: `translateX(calc(-${currentPage * 100}% - ${currentPage * (isDesktop ? 4 : 2)}rem))` }}
                  dangerouslySetInnerHTML={{ __html: pagedChapterHtml }}
                />
              )}
            </div>
          )}
        </article>
      </main>

      {layoutMode === 'paged' && (
        <footer className={`fixed bottom-0 left-0 right-0 h-16 backdrop-blur-md border-t z-50 flex items-center justify-between px-4 sm:px-8 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#1a1a1a]/90 border-neutral-800' : 'bg-[#fafafa]/90 border-neutral-200'}`}>
          <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
            <button onClick={handlePrev} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-neutral-100 text-neutral-600'}`}>
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{currentPage === 0 ? '上一章' : '上一页'}</span>
            </button>
            <span className="text-sm font-medium text-neutral-500 font-mono">{currentPage + 1} / {totalPages}</span>
            <button onClick={handleNext} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-neutral-100 text-neutral-600'}`}>
              <span className="hidden sm:inline">{currentPage === totalPages - 1 ? '下一章' : '下一页'}</span>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}

