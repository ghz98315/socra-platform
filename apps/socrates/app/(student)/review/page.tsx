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
  Filter
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
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'overdue'>('all');

  // 滚动动画 refs
  const filterAnimation = useScrollAnimation();
  const listAnimation = useScrollAnimation();

  const loadReviews = useCallback(async () => {
    setLoading(true);

    const { data: reviewData, error: reviewError } = await supabase
      .from('review_schedule')
      .select('*')
      .eq('student_id', profile?.id || '')
      .eq('is_completed', false)
      .order('next_review_at', { ascending: true });

    if (reviewError) {
      console.error('Failed to load reviews:', reviewError);
      setLoading(false);
      return;
    }

    const reviewSchedules = reviewData || [];

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
        const session = sessionMap.get(review.session_id) as { subject?: string; concept_tags?: string[]; difficulty_rating?: number } | undefined;
        const now = new Date();
        const nextReviewDate = new Date(review.next_review_at);
        const daysUntil = Math.ceil((nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: review.id,
          sessionId: review.session_id,
          subject: session?.subject || 'math',
          conceptTags: session?.concept_tags ?? null,
          difficultyRating: session?.difficulty_rating ?? null,
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

    setLoading(false);
  }, [profile?.id, supabase]);

  // 加载复习列表
  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

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
      "min-h-screen bg-background",
      profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior'
    )}>
      {/* 页面标题卡片 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <PageHeader
          title="复习计划"
          description="基于艾宾浩斯遗忘曲线的智能复习安排"
          icon={FileText}
          iconColor="text-orange-500"
          actions={
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/workbench'}
              className="transition-all duration-200"
            >
              返回工作台
            </Button>
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
              label="完成率"
              value="0%"
              icon={CheckCircle}
              color="text-green-500"
              delay={0.3}
            />
          </StatsRow>
        </PageHeader>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {/* Filter Tabs Card - 带动画 */}
        <div
          ref={filterAnimation.ref}
          style={{
            opacity: filterAnimation.isVisible ? 1 : 0,
            transform: filterAnimation.isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          }}
        >
          <Card className="border-border/50 mb-6 transition-all duration-300 hover:shadow-lg">
            <CardContent className="py-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground mr-2">筛选:</span>
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                    className="transition-all duration-200"
                  >
                    全部 ({reviews.length})
                  </Button>
                  <Button
                    variant={filterStatus === 'pending' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterStatus('pending')}
                    className={cn(
                      "transition-all duration-200",
                      filterStatus === 'pending' && 'bg-yellow-500 hover:bg-yellow-600 text-white dark:bg-yellow-600 dark:hover:bg-yellow-700'
                    )}
                  >
                    待复习 ({pendingCount})
                  </Button>
                  <Button
                    variant={filterStatus === 'overdue' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setFilterStatus('overdue')}
                    className={cn(
                      "transition-all duration-200",
                      filterStatus === 'overdue' && 'bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700'
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
            <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">加载复习列表...</p>
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
            <Card className="border-border/50">
              <CardContent className="py-20">
                <div className="flex flex-col items-center justify-center text-center">
                  <div
                    className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6"
                    style={{
                      animation: 'float 6s ease-in-out infinite',
                    }}
                  >
                    <Calendar className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {filterStatus === 'all' && '暂无复习任务'}
                    {filterStatus === 'pending' && '太棒了！没有待复习任务'}
                    {filterStatus === 'overdue' && '没有过期的复习'}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    完成错题学习后，系统会自动安排复习计划
                  </p>
                  <Button
                    variant="outline"
                    className="mt-6 transition-all duration-200"
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
                  "border-border/50 transition-all duration-300",
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
                        review.isOverdue ? "bg-red-100 dark:bg-red-900/30" : "bg-muted"
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
                      <span className="text-xs text-muted-foreground">
                        {formatReviewDate(review.nextReviewAt)}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-3 text-sm mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>难度: {getDifficultyStars(review.difficultyRating)}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {review.conceptTags?.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs font-normal">
                          {tag}
                        </Badge>
                      ))}
                      {review.conceptTags && review.conceptTags.length > 2 && (
                        <span className="text-xs text-muted-foreground self-center">
                          +{review.conceptTags.length - 2}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${(review.reviewStage / 4) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {REVIEW_STAGES.find(s => s.stage === review.reviewStage)?.name}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t border-border/50">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.location.href = `/workbench?review=${review.sessionId}`}
                      className="flex-1 transition-all duration-200"
                    >
                      开始复习
                    </Button>
                    <Button
                      size="sm"
                      variant={review.isOverdue ? 'secondary' : 'default'}
                      onClick={() => handleCompleteReview(review.id)}
                      className="flex-1 gap-2 transition-all duration-200"
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
          <div className="mx-auto bg-card/80 backdrop-blur-xl rounded-full px-4 py-2 text-sm text-muted-foreground shadow-sm border border-border/50 w-fit">
            复习系统开发中...艾宾浩斯算法即将上线
          </div>
        </div>
      </div>
    </div>
  );
}
