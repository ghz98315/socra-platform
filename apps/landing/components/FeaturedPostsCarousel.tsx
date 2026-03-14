'use client';

import { useState, useEffect, useCallback } from 'react';
import { Heart, MessageCircle, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { cn } from '@socra/ui';

interface FeaturedPost {
  id: string;
  content: string;
  type: string;
  subject: string | null;
  grade: string | null;
  likes: number;
  comments: number;
  author: {
    nickname: string;
    avatar: string;
    isParent: boolean;
  };
}

// 示例数据（当API不可用时使用）
const samplePosts: FeaturedPost[] = [
  {
    id: '1',
    content: '今天终于理解了分数除法！原来就是问"有多少个"的问题，AI老师讲得比课本清楚多了~',
    type: 'insight',
    subject: 'math',
    grade: '六年级',
    likes: 128,
    comments: 23,
    author: { nickname: '快乐小熊88', avatar: '🐻', isParent: false },
  },
  {
    id: '2',
    content: '坚持使用苏格拉底30天，数学从70分提到了95分！感谢AI老师的耐心引导！',
    type: 'mastery',
    subject: 'math',
    grade: '初二',
    likes: 89,
    comments: 15,
    author: { nickname: '聪明小兔56', avatar: '🐰', isParent: false },
  },
  {
    id: '3',
    content: '孩子以前不敢问问题，现在每天都主动找AI老师讨论，学习兴趣明显提高了！',
    type: 'insight',
    subject: null,
    grade: null,
    likes: 156,
    comments: 42,
    author: { nickname: '阳光家长', avatar: '🌟', isParent: true },
  },
  {
    id: '4',
    content: '分享一个小技巧：背英语单词的时候，先用AI造3个句子，记忆效果超级好！',
    type: 'tip',
    subject: 'english',
    grade: '初一',
    likes: 67,
    comments: 18,
    author: { nickname: '机智小狐23', avatar: '🦊', isParent: false },
  },
  {
    id: '5',
    content: '物理终于开窍了！原来摩擦力和生活关系这么大，今天特意观察了刹车痕迹~',
    type: 'mastery',
    subject: 'physics',
    grade: '初三',
    likes: 45,
    comments: 12,
    author: { nickname: '勇敢小虎91', avatar: '🐯', isParent: false },
  },
  {
    id: '6',
    content: '作为家长，最喜欢看AI和孩子对话的过程，能看到孩子是怎么一步步思考的！',
    type: 'insight',
    subject: null,
    grade: null,
    likes: 203,
    comments: 56,
    author: { nickname: '暖心妈妈', avatar: '🌈', isParent: true },
  },
];

interface FeaturedPostsCarouselProps {
  className?: string;
}

export function FeaturedPostsCarousel({ className }: FeaturedPostsCarouselProps) {
  const [posts, setPosts] = useState<FeaturedPost[]>(samplePosts);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 获取精华帖子
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await fetch('https://socrates.socra.cn/api/community/featured?limit=10');
        if (response.ok) {
          const result = await response.json();
          if (result.data && result.data.length > 0 && !result.isSample) {
            setPosts(result.data);
          }
        }
      } catch (error) {
        // 使用示例数据
        console.log('Using sample data for featured posts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  // 自动轮播 - 3秒切换一次
  useEffect(() => {
    if (isPaused || posts.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % posts.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPaused, posts.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + posts.length) % posts.length);
  }, [posts.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % posts.length);
  }, [posts.length]);

  if (isLoading) {
    return (
      <div className={cn('px-6 py-12', className)}>
        <div className="max-w-4xl mx-auto">
          <div className="h-40 rounded-[1.75rem] bg-white/50 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <section className={cn('px-6 py-12 bg-gradient-to-r from-orange-50 to-amber-50', className)}>
      <div className="max-w-4xl mx-auto">
        {/* 标题 */}
        <div className="mb-7 text-center">
          <h2 className="mb-2 text-2xl font-semibold text-stone-900 md:text-[2rem]">
            <span className="text-amber-500">⭐</span> 社区精选
          </h2>
          <p className="text-sm text-stone-600 md:text-base">来自真实用户的学习故事</p>
        </div>

        {/* 轮播容器 */}
        <div
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* 主卡片 */}
          <div className="overflow-hidden rounded-[1.9rem] bg-white p-6 shadow-[0_18px_45px_rgba(45,30,20,0.055)] md:p-8">
            <div className="flex items-start gap-4">
              {/* 引号装饰 */}
              <Quote className="h-9 w-9 shrink-0 -ml-1 -mt-1 text-orange-200" />

              <div className="flex-1">
                {/* 内容 */}
                <p className="mb-5 min-h-[4rem] text-base leading-8 text-stone-700 md:text-[1.05rem]">
                  {posts[currentIndex]?.content}
                </p>

                {/* 作者信息 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{posts[currentIndex]?.author.avatar}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-800">
                          {posts[currentIndex]?.author.nickname}
                        </span>
                        {posts[currentIndex]?.author.isParent && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs rounded-full">
                            家长
                          </span>
                        )}
                      </div>
                      {posts[currentIndex]?.grade && (
                        <span className="text-sm text-stone-500">{posts[currentIndex].grade}</span>
                      )}
                    </div>
                  </div>

                  {/* 互动数据 */}
                  <div className="flex items-center gap-4 text-stone-500">
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4 text-red-400" />
                      {posts[currentIndex]?.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      {posts[currentIndex]?.comments}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 导航按钮 */}
          {posts.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-0 top-1/2 -translate-x-3 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-stone-600 shadow-lg transition-all hover:scale-110 hover:text-orange-500"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-0 top-1/2 flex h-9 w-9 translate-x-3 -translate-y-1/2 items-center justify-center rounded-full bg-white text-stone-600 shadow-lg transition-all hover:scale-110 hover:text-orange-500"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* 指示器 */}
          {posts.length > 1 && (
            <div className="mt-5 flex justify-center gap-2">
              {posts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    'w-2 h-2 rounded-full transition-all',
                    index === currentIndex
                      ? 'w-6 bg-orange-400'
                      : 'bg-gray-300 hover:bg-gray-400'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-6 text-center">
          <a
            href="https://socrates.socra.cn"
            className="inline-flex items-center gap-2 font-medium text-orange-500 transition hover:text-orange-600"
          >
            加入社区，分享你的故事
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
