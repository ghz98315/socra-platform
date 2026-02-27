// =====================================================
// Project Socrates - Community Page
// 社区页面 - 学习分享、互动交流
// =====================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { MessageSquare, TrendingUp, HelpCircle, Lightbulb, Target, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { PostList, PostComposer, type CommunityPost } from '@/components/community';
import { CommentSection, type Comment } from '@/components/community/CommentSection';
import { cn } from '@/lib/utils';

// 帖子类型过滤器
const TABS = [
  { id: 'all', label: '全部', icon: MessageSquare },
  { id: 'insight', label: '心得', icon: TrendingUp },
  { id: 'question', label: '求助', icon: HelpCircle },
  { id: 'tip', label: '技巧', icon: Lightbulb },
  { id: 'mastery', label: '成就', icon: Target },
];

export default function CommunityPage() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showComposer, setShowComposer] = useState(false);

  // 获取帖子列表
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('type', activeTab);
      }
      if (profile?.id) {
        params.append('current_user_id', profile.id);
      }

      const response = await fetch(`/api/community/posts?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        setPosts(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [activeTab, profile?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 获取评论
  const fetchComments = async (postId: string) => {
    setLoadingComments(true);
    try {
      const response = await fetch(`/api/community/comments?post_id=${postId}`);
      if (response.ok) {
        const result = await response.json();
        setComments(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // 处理点赞
  const handleLike = async (postId: string, currentLiked: boolean) => {
    if (!profile?.id) return;

    try {
      const response = await fetch('/api/community/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: postId,
          user_id: profile.id,
          action: currentLiked ? 'unlike' : 'like',
        }),
      });

      if (response.ok) {
        // 更新本地状态
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              is_liked: !currentLiked,
              likes_count: currentLiked ? post.likes_count - 1 : post.likes_count + 1,
            };
          }
          return post;
        }));

        if (selectedPost?.id === postId) {
          setSelectedPost(prev => prev ? {
            ...prev,
            is_liked: !currentLiked,
            likes_count: currentLiked ? prev.likes_count - 1 : prev.likes_count + 1,
          } : null);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // 处理评论
  const handleComment = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      setSelectedPost(post);
      fetchComments(postId);
    }
  };

  // 添加评论
  const handleAddComment = async (content: string, parentId?: string) => {
    if (!profile?.id || !selectedPost) return;

    try {
      const response = await fetch('/api/community/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: selectedPost.id,
          user_id: profile.id,
          content,
          parent_comment_id: parentId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // 重新获取评论
        fetchComments(selectedPost.id);
        // 更新帖子评论数
        setPosts(prev => prev.map(post => {
          if (post.id === selectedPost.id) {
            return { ...post, comments_count: post.comments_count + 1 };
          }
          return post;
        }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // 删除帖子
  const handleDeletePost = async (postId: string) => {
    if (!profile?.id) return;
    if (!confirm('确定要删除这条分享吗？')) return;

    try {
      const response = await fetch(`/api/community/posts?post_id=${postId}&user_id=${profile.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPosts(prev => prev.filter(p => p.id !== postId));
        if (selectedPost?.id === postId) {
          setSelectedPost(null);
        }
      }
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  // 新帖子发布成功
  const handlePostSuccess = (newPost: CommunityPost) => {
    setPosts(prev => [newPost, ...prev]);
    setShowComposer(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/50 to-amber-50/50 dark:from-slate-900 dark:to-slate-900">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* 页面标题 */}
        <PageHeader
          title="学习社区"
          subtitle="分享你的学习故事，和小伙伴们一起进步"
        />

        {/* 发帖入口 */}
        <div className="mb-6">
          {showComposer ? (
            <PostComposer
              userId={profile?.id || ''}
              onSuccess={handlePostSuccess}
              className="animate-in slide-in-from-top duration-300"
            />
          ) : (
            <button
              onClick={() => setShowComposer(true)}
              className="w-full p-4 bg-white/80 dark:bg-slate-800/80 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-left text-slate-400 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">✨</span>
                分享你的学习心得、提问或技巧...
              </span>
            </button>
          )}
        </div>

        {/* 类型过滤器 */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-md'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border border-slate-200/50 dark:border-slate-700/50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 帖子列表 */}
        <div className="space-y-4">
          <PostList
            posts={posts}
            currentUserId={profile?.id}
            onLike={handleLike}
            onComment={handleComment}
            onDelete={handleDeletePost}
            isLoading={loading}
          />
        </div>

        {/* 评论弹窗 */}
        {selectedPost && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
              {/* 弹窗头部 */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-medium text-slate-800 dark:text-slate-200">
                  评论 ({selectedPost.comments_count})
                </h3>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  ✕
                </button>
              </div>

              {/* 原帖内容 */}
              <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{selectedPost.profile?.avatar_emoji || '🐻'}</span>
                  <div className="flex-1">
                    <p className="font-medium text-sm text-slate-700 dark:text-slate-300">
                      {selectedPost.profile?.nickname || '小伙伴'}
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {selectedPost.content}
                    </p>
                  </div>
                </div>
              </div>

              {/* 评论列表 */}
              <div className="flex-1 overflow-y-auto p-4">
                <CommentSection
                  postId={selectedPost.id}
                  comments={comments}
                  currentUserId={profile?.id}
                  onAddComment={handleAddComment}
                  onDeleteComment={() => {}}
                  isLoading={loadingComments}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
