// =====================================================
// Project Socrates - Review List Page
// 方案二：分层卡片设计 + 苹果风格动画
// =====================================================

'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StarRating } from '@/components/DifficultyRating';
import {
  Loader2,
  Calendar,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle,
  Filter,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Sparkles,
  Target
} from 'lucide-react';
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

interface ReviewHubItem {
  id: string;
  sessionId: string;
  subject: string;
  conceptTags: string[] | null;
  previewText: string | null;
  nextReviewAt: string;
  reviewStage: number;
  daysUntilDue: number;
  isOverdue: boolean;
  difficultyRating: number | null;
  studentDifficultyRating: number | null;
  finalDifficultyRating: number | null;
}

interface ReviewHubSummary {
  total_count: number;
  pending_count: number;
  due_today_count: number;
  overdue_count: number;
  upcoming_count: number;
  completed_count: number;
}

const HUB_SUBJECT_LABELS: Record<string, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
  chinese: '语文',
  english: '英语',
};

const HUB_SUBJECT_STYLES: Record<string, string> = {
  math: 'border-blue-200 bg-blue-50 text-blue-700',
  physics: 'border-violet-200 bg-violet-50 text-violet-700',
  chemistry: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  chinese: 'border-rose-200 bg-rose-50 text-rose-700',
  english: 'border-amber-200 bg-amber-50 text-amber-700',
};

function mapHubReview(review: any): ReviewHubItem {
  const session = review.error_session ?? review.error_sessions ?? null;

  return {
    id: review.id,
    sessionId: review.session_id,
    subject: session?.subject || 'math',
    conceptTags: session?.concept_tags ?? null,
    previewText: session?.extracted_text ?? null,
    nextReviewAt: review.next_review_at,
    reviewStage: review.review_stage,
    daysUntilDue: review.days_until_due,
    isOverdue: review.is_overdue,
    difficultyRating: session?.difficulty_rating ?? null,
    studentDifficultyRating: session?.student_difficulty_rating ?? null,
    finalDifficultyRating: session?.final_difficulty_rating ?? null,
  };
}

function getHubDifficulty(review: ReviewHubItem) {
  if (review.finalDifficultyRating) return { label: '综合难度', value: review.finalDifficultyRating };
  if (review.studentDifficultyRating) return { label: '自评难度', value: review.studentDifficultyRating };
  if (review.difficultyRating) return { label: 'AI 预估', value: review.difficultyRating };
  return { label: '难度待评估', value: null };
}

function getHubStageName(stage: number) {
  return REVIEW_STAGES.find((item) => item.stage === stage)?.name || `第 ${stage} 轮复习`;
}

function ReviewHubCard({
  review,
  completed = false,
  onOpenReview,
  onOpenSource,
}: {
  review: ReviewHubItem;
  completed?: boolean;
  onOpenReview: (reviewId: string) => void;
  onOpenSource: (sessionId: string) => void;
}) {
  const difficulty = getHubDifficulty(review);

  return (
    <Card className={cn('border-warm-200/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md', review.isOverdue && !completed && 'border-red-200')}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className={cn('font-normal', HUB_SUBJECT_STYLES[review.subject] || 'border-warm-200 bg-warm-50 text-warm-700')}>
                {HUB_SUBJECT_LABELS[review.subject] || '学科'}
              </Badge>
              <Badge variant="secondary" className={cn(review.isOverdue && !completed ? 'bg-red-100 text-red-700' : 'bg-warm-100 text-warm-700')}>
                {completed ? '已完成' : getUrgencyLabel(review.daysUntilDue)}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-semibold text-warm-900">{getHubStageName(review.reviewStage)}</p>
              <p className="text-xs text-warm-600">{completed ? '最近完成' : '计划时间'}：{formatReviewDate(review.nextReviewAt)}</p>
            </div>
          </div>

          <div className="rounded-xl bg-warm-50 px-3 py-2 text-right">
            <p className="text-[11px] text-warm-500">{difficulty.label}</p>
            {difficulty.value ? (
              <StarRating rating={difficulty.value} size="sm" showValue className="justify-end" />
            ) : (
              <p className="text-xs text-warm-700">进入复习后补充</p>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-3">
          <p className="line-clamp-3 min-h-[60px] text-sm leading-6 text-warm-800">
            {review.previewText || '该题暂无文字预览，进入复习后可查看完整题目内容。'}
          </p>
          <div className="flex flex-wrap gap-2">
            {(review.conceptTags || []).slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="border-warm-200 text-warm-700">
                {tag}
              </Badge>
            ))}
            {review.conceptTags && review.conceptTags.length > 3 ? <span className="text-xs text-warm-500">+{review.conceptTags.length - 3}</span> : null}
          </div>
        </div>

        <div className="mt-5 flex gap-2 border-t border-warm-100 pt-4">
          <Button className="flex-1 gap-2 rounded-full bg-warm-500 hover:bg-warm-600" onClick={() => onOpenReview(review.id)}>
            {completed ? '查看复盘' : '进入复习'}
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="flex-1 rounded-full border-warm-200 hover:bg-warm-50" onClick={() => onOpenSource(review.sessionId)}>
            查看原题
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReviewSection({
  title,
  description,
  emptyTitle,
  emptyDescription,
  reviews,
  completed = false,
  onOpenReview,
  onOpenSource,
}: {
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  reviews: ReviewHubItem[];
  completed?: boolean;
  onOpenReview: (reviewId: string) => void;
  onOpenSource: (sessionId: string) => void;
}) {
  return (
    <Card className="border-warm-200/70 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-xl text-warm-900">{title}</CardTitle>
            <CardDescription className="mt-1 text-warm-600">{description}</CardDescription>
          </div>
          <Badge variant="secondary" className="bg-warm-100 text-warm-700">
            {reviews.length} 项
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {reviews.length > 0 ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {reviews.map((review) => (
              <ReviewHubCard
                key={review.id}
                review={review}
                completed={completed}
                onOpenReview={onOpenReview}
                onOpenSource={onOpenSource}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-warm-200 bg-warm-50/70 px-5 py-8 text-center">
            <p className="text-sm font-semibold text-warm-900">{emptyTitle}</p>
            <p className="mt-2 text-sm text-warm-600">{emptyDescription}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ReviewPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [pendingReviews, setPendingReviews] = useState<ReviewHubItem[]>([]);
  const [completedReviews, setCompletedReviews] = useState<ReviewHubItem[]>([]);
  const [summary, setSummary] = useState<ReviewHubSummary>({
    total_count: 0,
    pending_count: 0,
    due_today_count: 0,
    overdue_count: 0,
    upcoming_count: 0,
    completed_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReviews = useCallback(async (isRefresh = false) => {
    if (!profile?.id) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(`/api/review/schedule?student_id=${encodeURIComponent(profile.id)}&scope=all&include_counts=1`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load reviews');
      }

      setPendingReviews((payload.data || []).map(mapHubReview));
      setCompletedReviews((payload.completed_data || []).map(mapHubReview));
      setSummary(payload.summary || {
        total_count: (payload.data || []).length + (payload.completed_count || 0),
        pending_count: (payload.data || []).length,
        due_today_count: (payload.data || []).filter((item: any) => item.days_until_due <= 1).length,
        overdue_count: (payload.data || []).filter((item: any) => item.is_overdue).length,
        upcoming_count: (payload.data || []).filter((item: any) => item.days_until_due > 1).length,
        completed_count: payload.completed_count || 0,
      });
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setPendingReviews([]);
      setCompletedReviews([]);
      setSummary({
        total_count: 0,
        pending_count: 0,
        due_today_count: 0,
        overdue_count: 0,
        upcoming_count: 0,
        completed_count: 0,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (profile?.id) {
      loadReviews();
    }
  }, [profile?.id, loadReviews]);

  const dueNowReviews = useMemo(() => pendingReviews.filter((review) => review.isOverdue || review.daysUntilDue <= 1), [pendingReviews]);
  const upcomingReviews = useMemo(() => pendingReviews.filter((review) => !review.isOverdue && review.daysUntilDue > 1), [pendingReviews]);

  const openReview = (reviewId: string) => router.push(`/review/session/${reviewId}`);
  const openSource = (sessionId: string) => router.push(`/error-book/${sessionId}`);

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-warm-50 via-white to-warm-100", profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior')}>
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <PageHeader
          title="复习中心"
          description="先完成今天该复习的题，再查看后续计划和最近完成，整条复习链路集中在这里。"
          icon={BookOpen}
          iconColor="text-warm-500"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => loadReviews(true)} disabled={refreshing} className="rounded-full border border-warm-200 hover:bg-warm-100">
                <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/workbench')} className="rounded-full border-warm-200 hover:bg-warm-50">
                返回工作台
              </Button>
            </div>
          }
        >
          <StatsRow>
            <StatCard label="总任务数" value={summary.total_count} icon={Calendar} color="text-blue-500" delay={0} />
            <StatCard label="现在该复习" value={summary.due_today_count} icon={Clock} color="text-orange-500" delay={0.1} />
            <StatCard label="已逾期" value={summary.overdue_count} icon={AlertCircle} color="text-red-500" delay={0.2} />
            <StatCard label="最近已完成" value={summary.completed_count} icon={CheckCircle} color="text-green-500" delay={0.3} />
          </StatsRow>
        </PageHeader>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-20 sm:px-6">
        <Card className="border-warm-200/70 bg-white/95 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-warm-700">
                <Sparkles className="h-4 w-4" />
                学生复习闭环
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm text-warm-700">
                <Badge variant="secondary" className="bg-warm-100 text-warm-700">1. 今天先复习</Badge>
                <ArrowRight className="h-4 w-4 text-warm-400" />
                <Badge variant="secondary" className="bg-warm-100 text-warm-700">2. 进入复习模式</Badge>
                <ArrowRight className="h-4 w-4 text-warm-400" />
                <Badge variant="secondary" className="bg-warm-100 text-warm-700">3. 回看原题与错因</Badge>
                <ArrowRight className="h-4 w-4 text-warm-400" />
                <Badge variant="secondary" className="bg-warm-100 text-warm-700">4. 进入下一轮计划</Badge>
              </div>
              <p className="text-sm text-warm-600">从通知、错题本、工作台进入后，最终都应回到这个页面继续推进下一步。</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-full bg-warm-500 hover:bg-warm-600" onClick={() => dueNowReviews[0] ? openReview(dueNowReviews[0].id) : router.push('/workbench')}>
                {dueNowReviews[0] ? '开始今日复习' : '去工作台录入新题'}
              </Button>
              <Button variant="outline" className="rounded-full border-warm-200 hover:bg-warm-50" onClick={() => router.push('/error-book')}>
                查看错题本
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-warm-500" />
            <p className="mt-4 text-sm text-warm-600">正在整理你的复习清单...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <ReviewSection
              title="现在该复习"
              description="优先处理今天到期和已经逾期的题，先把复习节奏拉回正轨。"
              emptyTitle="今天的复习节奏很好"
              emptyDescription="当前没有到期任务，可以先去工作台学习新题，系统会自动安排下一轮复习。"
              reviews={dueNowReviews}
              onOpenReview={openReview}
              onOpenSource={openSource}
            />

            <ReviewSection
              title="后续计划"
              description="这里是接下来几天的复习安排，方便学生提前知道后面要做什么。"
              emptyTitle="暂时没有后续计划"
              emptyDescription="完成新的错题学习后，系统会在这里自动补充未来复习节点。"
              reviews={upcomingReviews}
              onOpenReview={openReview}
              onOpenSource={openSource}
            />

            <ReviewSection
              title="最近完成"
              description="最近做完的题保留在这里，方便回看综合难度、原题和复盘入口。"
              emptyTitle="还没有最近完成记录"
              emptyDescription="完成任意一轮复习后，这里会展示最近完成的题目。"
              reviews={completedReviews}
              completed
              onOpenReview={openReview}
              onOpenSource={openSource}
            />

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-warm-200/70 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-warm-900">
                    <Target className="h-5 w-5 text-warm-500" />
                    难度评估在哪里看
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-warm-700">
                  列表页优先显示综合难度，其次显示学生自评，最后回退到 AI 预估。进入复习详情页后仍可继续调整难度，更新后会同步回到这里。
                </CardContent>
              </Card>

              <Card className="border-warm-200/70 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-warm-900">
                    <FileText className="h-5 w-5 text-warm-500" />
                    任意节点都能回到主线
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm leading-6 text-warm-700">
                  通知进入看复盘，错题本进入看原题，工作台进入做新题，最后都回到复习中心继续下一步，避免学生做完一个动作后找不到后续入口。
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
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

function LegacyReviewPage() {
  const { profile } = useAuth();

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
      const response = await fetch(
        `/api/review/schedule?student_id=${encodeURIComponent(profile.id)}&scope=all&include_counts=1`
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load reviews');
      }

      setCompletedCount(payload.completed_count || 0);

      const enrichedReviews: ReviewItem[] = (payload.data || []).map((review: any) => ({
        id: review.id,
        sessionId: review.session_id,
        subject: review.error_session?.subject || 'math',
        conceptTags: review.error_session?.concept_tags ?? null,
        difficultyRating: review.error_session?.difficulty_rating ?? null,
        previewText: review.error_session?.extracted_text ?? null,
        nextReviewAt: review.next_review_at,
        reviewStage: review.review_stage,
        daysUntilDue: review.days_until_due,
        isOverdue: review.is_overdue,
      }));

      setReviews(enrichedReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile?.id]);

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
    try {
      const response = await fetch('/api/review/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: reviewId,
          student_id: profile?.id,
          result: 'correct',
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to complete review');
      }

      await loadReviews();
    } catch (error) {
      console.error('Failed to complete review:', error);
    }
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
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-warm-900">复习清单</h2>
            <p className="text-sm text-warm-600">按复习时间、紧急程度和题目难度统一查看。</p>
          </div>
          {!loading ? (
            <div className="text-sm text-warm-600">共 {filteredReviews.length} 条</div>
          ) : null}
        </div>

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

    </div>
  );
}
