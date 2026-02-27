'use client';

import { useState } from 'react';
import { Heart, MessageCircle, Share2, Clock, MoreHorizontal, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// 帖子类型配置
const POST_TYPE_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  insight: { label: '学习心得', emoji: '😊', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  question: { label: '求助问题', emoji: '❓', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  tip: { label: '技巧分享', emoji: '💡', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  mastery: { label: '这题我懂了', emoji: '🎯', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  error_share: { label: '错题分享', emoji: '📝', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
};

// 学科配置
const SUBJECT_CONFIG: Record<string, { label: string; emoji: string }> = {
  math: { label: '数学', emoji: '📐' },
  chinese: { label: '语文', emoji: '📖' },
  english: { label: '英语', emoji: '🔤' },
  physics: { label: '物理', emoji: '⚡' },
  chemistry: { label: '化学', emoji: '🧪' },
  biology: { label: '生物', emoji: '🌱' },
  history: { label: '历史', emoji: '📜' },
  geography: { label: '地理', emoji: '🌍' },
  other: { label: '其他', emoji: '📚' },
};

export interface CommunityPost {
  id: string;
  user_id: string;
  post_type: string;
  content: string;
  subject?: string;
  grade_level?: string;
  image_url?: string;
  is_anonymous: boolean;
  is_featured: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  profile?: {
    nickname: string;
    avatar_emoji: string;
    is_parent: boolean;
  };
  is_liked?: boolean;
}

interface PostCardProps {
  post: CommunityPost;
  currentUserId?: string;
  onLike?: (postId: string, liked: boolean) => void;
  onComment?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  compact?: boolean;
}

export function PostCard({
  post,
  currentUserId,
  onLike,
  onComment,
  onDelete,
  compact = false,
}: PostCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  const typeConfig = POST_TYPE_CONFIG[post.post_type] || POST_TYPE_CONFIG.insight;
  const subjectConfig = post.subject ? SUBJECT_CONFIG[post.subject] : null;

  const isOwner = currentUserId === post.user_id;

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      onLike?.(post.id, !post.is_liked);
    } finally {
      setIsLiking(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (compact) {
    return (
      <div className="bg-white/80 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{post.profile?.avatar_emoji || '🐻'}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{post.content}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
              <span>{post.profile?.nickname || '匿名小伙伴'}</span>
              {post.is_featured && <span className="text-amber-500">⭐</span>}
              <span>·</span>
              <span className="flex items-center gap-0.5"><Heart className="w-3 h-3" /> {post.likes_count}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-lg transition-all duration-300">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* 头像 */}
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center text-2xl shadow-sm">
            {post.is_anonymous ? '🎭' : (post.profile?.avatar_emoji || '🐻')}
          </div>

          {/* 用户信息 */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {post.is_anonymous ? '匿名小伙伴' : (post.profile?.nickname || '小伙伴')}
              </span>
              {post.profile?.is_parent && (
                <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-medium">
                  家长
                </span>
              )}
              {post.is_featured && (
                <span className="text-amber-500 text-sm">⭐ 精华</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <Clock className="w-3 h-3" />
              <span>{formatTime(post.created_at)}</span>
              {post.grade_level && (
                <>
                  <span>·</span>
                  <span>{post.grade_level}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 菜单 */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-400" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-10 min-w-[100px]">
                <button
                  onClick={() => {
                    onDelete?.(post.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  删除
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 类型标签 */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn('px-3 py-1 rounded-full text-xs font-medium', typeConfig.color)}>
          {typeConfig.emoji} {typeConfig.label}
        </span>
        {subjectConfig && (
          <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs">
            {subjectConfig.emoji} {subjectConfig.label}
          </span>
        )}
      </div>

      {/* 内容 */}
      <p className="text-slate-700 dark:text-slate-300 leading-relaxed mb-4">{post.content}</p>

      {/* 图片 */}
      {post.image_url && (
        <div className="mb-4 rounded-2xl overflow-hidden">
          <img
            src={post.image_url}
            alt="分享图片"
            className="w-full max-h-64 object-cover"
          />
        </div>
      )}

      {/* 底部操作栏 */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-4">
          {/* 点赞 */}
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all duration-200',
              post.is_liked
                ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400'
            )}
          >
            <Heart className={cn('w-4 h-4', post.is_liked && 'fill-current')} />
            <span className="text-sm">{post.likes_count || 0}</span>
          </button>

          {/* 评论 */}
          <button
            onClick={() => onComment?.(post.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">{post.comments_count || 0}</span>
          </button>

          {/* 分享 */}
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors">
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// 帖子列表组件
interface PostListProps {
  posts: CommunityPost[];
  currentUserId?: string;
  onLike?: (postId: string, liked: boolean) => void;
  onComment?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  isLoading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
}

export function PostList({
  posts,
  currentUserId,
  onLike,
  onComment,
  onDelete,
  isLoading,
  hasMore,
  onLoadMore,
}: PostListProps) {
  if (posts.length === 0 && !isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center text-4xl">
          🌟
        </div>
        <p className="text-slate-600 dark:text-slate-400 font-medium">还没有人分享哦</p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">来做第一个分享的小伙伴吧！</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={currentUserId}
          onLike={onLike}
          onComment={onComment}
          onDelete={onDelete}
        />
      ))}

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2 text-slate-500">
            <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">加载中...</span>
          </div>
        </div>
      )}

      {hasMore && !isLoading && (
        <div className="flex justify-center py-4">
          <button
            onClick={onLoadMore}
            className="px-6 py-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 text-sm font-medium hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            加载更多
          </button>
        </div>
      )}
    </div>
  );
}
