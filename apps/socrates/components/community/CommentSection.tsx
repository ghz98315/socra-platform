'use client';

import { useState } from 'react';
import { Send, Clock, Trash2, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  likes_count: number;
  created_at: string;
  profile?: {
    nickname: string;
    avatar_emoji: string;
    is_parent: boolean;
  };
  replies?: Comment[];
}

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  postId: string;
  onReply?: (commentId: string, nickname: string) => void;
  onDelete?: (commentId: string) => void;
  isReply?: boolean;
}

function CommentItem({
  comment,
  currentUserId,
  postId,
  onReply,
  onDelete,
  isReply = false,
}: CommentItemProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isOwner = currentUserId === comment.user_id;

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

  return (
    <div className={cn('flex gap-3', isReply && 'ml-10 mt-3')}>
      {/* 头像 */}
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center text-lg flex-shrink-0">
        {comment.profile?.avatar_emoji || '🐻'}
      </div>

      <div className="flex-1 min-w-0">
        {/* 用户名和时间 */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-slate-700 dark:text-slate-300">
            {comment.profile?.nickname || '小伙伴'}
          </span>
          {comment.profile?.is_parent && (
            <span className="px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px]">
              家长
            </span>
          )}
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(comment.created_at)}
          </span>
        </div>

        {/* 评论内容 */}
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          {comment.content}
        </p>

        {/* 操作按钮 */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => onReply?.(comment.id, comment.profile?.nickname || '小伙伴')}
            className="text-xs text-slate-400 hover:text-orange-500 transition-colors"
          >
            回复
          </button>
        </div>

        {/* 回复列表 */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-3 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUserId={currentUserId}
                postId={postId}
                onReply={onReply}
                onDelete={onDelete}
                isReply
              />
            ))}
          </div>
        )}
      </div>

      {/* 删除按钮 */}
      {isOwner && (
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <MoreHorizontal className="w-4 h-4 text-slate-400" />
          </button>
          {showMenu && (
            <button
              onClick={() => {
                onDelete?.(comment.id);
                setShowMenu(false);
              }}
              className="absolute right-0 top-full mt-1 px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 text-xs text-red-500 whitespace-nowrap"
            >
              删除
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface CommentSectionProps {
  postId: string;
  comments: Comment[];
  currentUserId?: string;
  onAddComment: (content: string, parentId?: string) => void;
  onDeleteComment: (commentId: string) => void;
  isLoading?: boolean;
}

export function CommentSection({
  postId,
  comments,
  currentUserId,
  onAddComment,
  onDeleteComment,
  isLoading,
}: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment.trim(), replyTo?.id);
      setNewComment('');
      setReplyTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId: string, nickname: string) => {
    setReplyTo({ id: commentId, nickname });
  };

  return (
    <div className="bg-slate-50/80 dark:bg-slate-800/50 rounded-2xl p-4">
      {/* 评论输入框 */}
      <div className="flex gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 flex items-center justify-center text-lg flex-shrink-0">
          🐻
        </div>
        <div className="flex-1 relative">
          {replyTo && (
            <div className="absolute -top-6 left-0 flex items-center gap-2 text-xs text-slate-500">
              <span>回复 @{replyTo.nickname}</span>
              <button
                onClick={() => setReplyTo(null)}
                className="text-orange-500 hover:underline"
              >
                取消
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value.slice(0, 200))}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSubmit()}
              placeholder={replyTo ? `回复 @${replyTo.nickname}...` : '写下你的评论...'}
              className="flex-1 px-4 py-2 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/50"
            />
            <button
              onClick={handleSubmit}
              disabled={!newComment.trim() || isSubmitting}
              className={cn(
                'p-2 rounded-xl transition-all',
                newComment.trim() && !isSubmitting
                  ? 'bg-orange-400 text-white hover:bg-orange-500'
                  : 'bg-slate-200 dark:bg-slate-600 text-slate-400 cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="text-xs text-slate-400 mt-1 text-right">
            {newComment.length}/200
          </div>
        </div>
      </div>

      {/* 评论列表 */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-sm text-slate-400">
            还没有评论，来说点什么吧~
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              postId={postId}
              onReply={handleReply}
              onDelete={onDeleteComment}
            />
          ))
        )}
      </div>
    </div>
  );
}
