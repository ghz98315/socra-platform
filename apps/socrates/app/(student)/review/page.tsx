// =====================================================
// Project Socrates - Review List Page
// 方案二：分层卡片设计 + 苹果风格动画
// =====================================================

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  Filter,
  RefreshCw
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatReviewDate, getUrgencyLabel, REVIEW_STAGES } from '@/lib/review/utils';
import { PageHeader, StatCard, StatsRow } from '@/components/PageHeader';
import { cn } from '@/lib/utils';

// 滚动动画 Hook
function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

interface ReviewItem {
  id: string;
  sessionId: string;
  subject: 'math' | 'physics' | 'chemistry';
  conceptTags: string[] | null;
  difficultyRating: number | null;
  previewText: string | null;
  nextReviewAt: string;
  reviewStage: number;
  daysUntilDue: number;
  isOverdue: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export default function ReviewPage() {
  const { profile } = useAuth();
  const supabase = createClient() as SupabaseClient;

  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue'>('all');

  // 滚动动画 refs
  const filterAnimation = useScrollAnimation();
  const listAnimation = useScrollAnimation();

  const loadReviews = useCallback(async (isRefresh = false) => {
    if (!profile?.id) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      // 并行获取待复习和已完成数量
      const [pendingResult, completedResult] = await Promise.all([
        supabase
          .from('review_schedule')
          .select('*')
          .eq('student_id', profile.id)
          .eq('is_completed', false)
          .order('next_review_at', { ascending: true }),
        supabase
          .from('review_schedule')
          .select('id', { count: 'exact', head: true })
          .eq('student_id', profile.id)
          .eq('is_completed', true)
      ]);

      if (pendingResult.error) {
        console.error('Failed to load reviews:', pendingResult.error);
        return;
      }

      setCompletedCount(completedResult.count || 0);

      const reviewSchedules = pendingResult.data || [];

      // 关联错题会话信息
      const sessionIds = reviewSchedules.map((r: { session_id: string }) => r.session_id) || [];

      if (sessionIds.length > 0) {
        const { data: sessionData } = await supabase
          .from('error_sessions')
          .select('*')
          .in('id', sessionIds);

        const sessions = sessionData || [];

        // 组合数据
        const sessionMap = new Map(sessions.map((s: { id: string }) => [s.id, s]));

        const enrichedReviews: ReviewItem[] = reviewSchedules.map((review: { id: string; session_id: string; next_review_at: string; review_stage: number }) => {
          const session = sessionMap.get(review.session_id) as { subject?: string; concept_tags?: string[]; difficulty_rating?: number; extracted_text?: string | null } | undefined;
          const now = new Date();
          const nextReviewDate = new Date(review.next_review_at);
          const daysUntil = Math.ceil((nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          return {
            id: review.id,
            sessionId: review.session_id,
            subject: session?.subject || 'math',
            conceptTags: session?.concept_tags ?? null,
            difficultyRating: session?.difficulty_rating ?? null,
            previewText: session?.extracted_text ?? null,
            nextReviewAt: review.next_review_at,
            reviewStage: review.review_stage,
            daysUntilDue: daysUntil,
            isOverdue: daysUntil <= 0,
          };
        });

        setReviews(enrichedReviews);
      } else {
        setReviews([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id, supabase]);

  // 加载复习列表 - 确保 profile 存在后再加载
  useEffect(() => {
    if (profile?.id) {
      loadReviews();
    }
  }, [profile?.id, loadReviews]);

  const filteredReviews = reviews.filter(review => {
    if (filterStatus === 'pending') return !review.isOverdue;
    if (filterStatus === 'overdue') return review.isOverdue;
    return true;
  });

  const handleCompleteReview = async (reviewId: string) => {
    // 更新为下一阶段
    const { data: currentReview, error: fetchError } = await supabase
      .from('review_schedule')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (fetchError || !currentReview) {
      console.error('Failed to fetch review:', fetchError);
      return;
    }

    const reviewSchedule = currentReview as { review_stage: number; next_review_at: string };

    // 计算下一阶段
    const nextStage = Math.min(reviewSchedule.review_stage + 1, 4);
    const currentDate = new Date(reviewSchedule.next_review_at);
    const nextDays = REVIEW_STAGES.find(s => s.stage === nextStage)?.days || 30;
    currentDate.setDate(currentDate.getDate() + nextDays);

    // 更新
    const { error: updateError } = await supabase
      .from('review_schedule')
      .update({
        review_stage: nextStage,
        next_review_at: currentDate.toISOString(),
      })
      .eq('id', reviewId);

    if (updateError) {
      console.error('Failed to complete review:', updateError);
      return;
    }

    // 重新加载列表
    await loadReviews();
  };

  const getSubjectIcon = (subject: string) => {
    switch (subject) {
      case 'math': return '📐';
      case 'physics': return '🔬';
      case 'chemistry': return '🧪';
      default: return '📚';
    }
  };

  const getDifficultyStars = (rating: number | null) => {
    if (!rating) return '—';
    return '⭐'.repeat(rating);
  };

  const overdueCount = reviews.filter(r => r.isOverdue).length;
  const pendingCount = reviews.filter(r => !r.isOverdue).length;

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-warm-50 via-white to-warm-100",
      profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior'
    )}>
      {/* 页面标题卡片 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <PageHeader
          title="复习计划"
          description="基于艾宾浩斯遗忘曲线的智能复习安排"
          icon={FileText}
          iconColor="text-warm-500"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadReviews(true)}
                disabled={refreshing}
                className="transition-all duration-200 border-warm-200 hover:bg-warm-100 hover:border-warm-300 rounded-full"
              >
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = '/workbench'}
                className="transition-all duration-200 border-warm-200 hover:bg-warm-100 hover:border-warm-300 rounded-full"
              >
                返回工作台
              </Button>
            </div>
          }
        >
          {/* 统计卡片 */}
          <StatsRow>
            <StatCard
              label="总复习任务"
              value={reviews.length}
              icon={Calendar}
              color="text-blue-500"
              delay={0}
            />
            <StatCard
              label="待复习"
              value={pendingCount}
              icon={Clock}
              color="text-yellow-500"
              delay={0.1}
            />
            <StatCard
              label="已到期"
              value={overdueCount}
              icon={AlertCircle}
              color="text-red-500"
              delay={0.2}
            />
            <StatCard
              label="已完成"
              value={completedCount}
              icon={CheckCircle}
              color="text-green-500"
              delay={0.3}
            />
          </StatsRow>
        </PageHeader>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-32">
        {/* Filter Tabs Card - 带动画 */}
        <div
          ref={filterAnimation.ref}
          style={{
            opacity: filterAnimation.isVisible ? 1 : 0,
            transform: filterAnimation.isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          }}
        >
          <Card className="border-warm-200/50 mb-6 transition-all duration-300 hover:shadow-lg">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-warm-500" />
                <span className="text-sm text-warm-600 mr-2">筛选:</span>
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                    className={cn(
                      "transition-all duration-200 rounded-full",
                      filterStatus === 'all' ? 'bg-warm-500 hover:bg-warm-600 text-white shadow-lg shadow-warm-500/30' : 'text-warm-600 hover:bg-warm-100'
                    )}
                  >
                    全部 ({reviews.length})
                  </Button>
                  <Button
                    variant={filterStatus === 'pending' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterStatus('pending')}
                    className={cn(
                      "transition-all duration-200 rounded-full",
                      filterStatus === 'pending' && 'bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700 shadow-lg shadow-yellow-500/30'
                    )}
                  >
                    待复习 ({pendingCount})
                  </Button>
                  <Button
                    variant={filterStatus === 'overdue' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterStatus('overdue')}
                    className={cn(
                      "transition-all duration-200 rounded-full",
                      filterStatus === 'overdue' && 'bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700 shadow-lg shadow-red-500/30'
                    )}
                  >
                    已到期 ({overdueCount})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-warm-500" />
            <p className="mt-4 text-warm-600">加载复习列表...</p>
          </div>
        ) : filteredReviews.length === 0 ? (
          /* Empty State */
          <div
            style={{
              opacity: filterAnimation.isVisible ? 1 : 0,
              transform: filterAnimation.isVisible ? 'translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s',
            }}
          >
            <Card className="border-warm-200/50">
              <CardContent className="py-20">
                <div className="flex flex-col items-center justify-center text-center">
                  <div
                    className="w-20 h-20 rounded-full bg-warm-100 flex items-center justify-center mb-6"
                    style={{
                      animation: 'float 6s ease-in-out infinite',
                    }}
                  >
                    <Calendar className="w-10 h-10 text-warm-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-warm-900">
                    {filterStatus === 'all' && '暂无复习任务'}
                    {filterStatus === 'pending' && '太棒了！没有待复习任务'}
                    {filterStatus === 'overdue' && '没有过期的复习'}
                  </h3>
                  <p className="text-sm text-warm-600 max-w-sm">
                    完成错题学习后，系统会自动安排复习计划
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6 transition-all duration-200 border-warm-200 hover:bg-warm-100 hover:border-warm-300 rounded-full"
                    onClick={() => window.location.href = '/workbench'}
                  >
                    去学习错题
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Review List - 带动画 */
          <div
            ref={listAnimation.ref}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredReviews.map((review, index) => (
              <Card
                key={review.id}
                className={cn(
                  "border-warm-200/50 transition-all duration-300",
                  "hover:shadow-lg",
                  review.isOverdue && "border-l-4 border-l-red-500"
                )}
                style={{
                  opacity: listAnimation.isVisible ? 1 : 0,
                  transform: listAnimation.isVisible ? 'translateY(0)' : 'translateY(30px)',
                  transition: `opacity 0.5s ease-out ${index * 0.1}s, transform 0.5s ease-out ${index * 0.1}s`,
                }}
              >
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300",
                        review.isOverdue ? "bg-red-100 dark:bg-red-900/30" : "bg-warm-100"
                      )}>
                        <span className="text-lg">
                          {getSubjectIcon(review.subject)}
                        </span>
                      </div>
                      <Badge
                        variant={review.isOverdue ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {getUrgencyLabel(review.daysUntilDue)}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-warm-600">
                        {formatReviewDate(review.nextReviewAt)}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 text-sm mb-4">
                    <div className="flex items-center gap-2 text-warm-600">
                      <Clock className="w-4 h-4" />
                      <span>难度: {getDifficultyStars(review.difficultyRating)}</span>
                    </div>

                    {review.previewText ? (
                      <p className="text-sm text-warm-800 line-clamp-2">
                        {review.previewText}
                      </p>
                    ) : null}

                    <div className="flex flex-wrap gap-1.5">
                      {review.conceptTags?.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs font-normal border-warm-200 text-warm-700">
                          {tag}
                        </Badge>
                      ))}
                      {review.conceptTags && review.conceptTags.length > 2 && (
                        <span className="text-xs text-warm-600 self-center">
                          +{review.conceptTags.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-warm-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-warm-500 rounded-full transition-all duration-500"
                          style={{ width: `${(review.reviewStage / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-warm-600 whitespace-nowrap">
                        {REVIEW_STAGES.find(s => s.stage === review.reviewStage)?.name}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-warm-200/50">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `/review/session/${review.id}`}
                      className="flex-1 transition-all duration-200 border-warm-200 hover:bg-warm-100 hover:border-warm-300 rounded-full"
                    >
                      开始复习
                    </Button>
                    <Button
                      size="sm"
                      variant={review.isOverdue ? 'secondary' : 'default'}
                      onClick={() => handleCompleteReview(review.id)}
                      className={cn(
                        "flex-1 gap-2 transition-all duration-200 rounded-full",
                        !review.isOverdue && "bg-warm-500 hover:bg-warm-600 text-white shadow-lg shadow-warm-500/30 hover:shadow-lg hover:-translate-y-0.5"
                      )}
                      disabled={review.isOverdue}
                    >
                      {review.isOverdue ? '已过期' : '完成'}
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Development Notice */}
      <div className="fixed bottom-4 left-0 right-0 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto">
          <div className="mx-auto bg-white/80 backdrop-blur-xl rounded-full px-4 py-2 text-sm text-warm-600 shadow-sm border border-warm-200/50 w-fit">
            复习系统开发中...艾宾浩斯算法即将上线
          </div>
        </div>
      </div>
    </div>
  );
}
