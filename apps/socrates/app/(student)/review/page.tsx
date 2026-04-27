'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
} from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';
import { StarRating } from '@/components/DifficultyRating';
import { PageHeader, StatCard, StatsRow } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getClosureStateMeta, MASTERY_JUDGEMENT_META, type MasteryJudgement } from '@/lib/error-loop/review';
import { cn } from '@/lib/utils';
import { formatReviewDate, getUrgencyLabel, REVIEW_STAGES } from '@/lib/review/utils';

interface ReviewHubItem {
  id: string;
  sessionId: string;
  subject: string;
  conceptTags: string[] | null;
  previewText: string | null;
  nextReviewAt: string;
  reviewStage: number;
  masteryState: string | null;
  lastJudgement: MasteryJudgement | null;
  reopenedCount: number;
  transferEvidenceReady: boolean;
  transferEvidenceStatusLabel: string;
  transferEvidenceNextStep: string;
  transferEvidenceSummary: string;
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

const SUBJECT_LABELS: Record<string, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
  chinese: '语文',
  english: '英语',
};

const SUBJECT_BADGE_STYLES: Record<string, string> = {
  math: 'border-blue-200 bg-blue-50 text-blue-700',
  physics: 'border-violet-200 bg-violet-50 text-violet-700',
  chemistry: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  chinese: 'border-rose-200 bg-rose-50 text-rose-700',
  english: 'border-amber-200 bg-amber-50 text-amber-700',
};

function mapReview(review: any): ReviewHubItem {
  const session = review.error_session ?? review.error_sessions ?? null;

  return {
    id: review.id,
    sessionId: review.session_id,
    subject: session?.subject || 'math',
    conceptTags: session?.concept_tags ?? null,
    previewText: session?.extracted_text ?? null,
    nextReviewAt: review.next_review_at,
    reviewStage: review.review_stage,
    masteryState: review.mastery_state ?? null,
    lastJudgement: review.last_judgement ?? null,
    reopenedCount: review.reopened_count ?? 0,
    transferEvidenceReady: review.transfer_evidence_ready === true,
    transferEvidenceStatusLabel: review.transfer_evidence_status_label ?? '迁移证据待验证',
    transferEvidenceNextStep: review.transfer_evidence_next_step ?? '下一步继续做变式题并跨间隔复习。',
    transferEvidenceSummary: review.transfer_evidence_summary ?? '系统仍在验证这题是否真正形成迁移能力。',
    daysUntilDue: review.days_until_due,
    isOverdue: review.is_overdue,
    difficultyRating: session?.difficulty_rating ?? null,
    studentDifficultyRating: session?.student_difficulty_rating ?? null,
    finalDifficultyRating: session?.final_difficulty_rating ?? null,
  };
}

function getDifficultyMeta(review: ReviewHubItem) {
  if (review.finalDifficultyRating) {
    return { label: '综合难度', value: review.finalDifficultyRating };
  }
  if (review.studentDifficultyRating) {
    return { label: '自评难度', value: review.studentDifficultyRating };
  }
  if (review.difficultyRating) {
    return { label: 'AI 预估', value: review.difficultyRating };
  }

  return { label: '难度待评估', value: null };
}

function getStageName(stage: number) {
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
  const difficulty = getDifficultyMeta(review);
  const closureMeta = getClosureStateMeta(review.masteryState);
  const judgementMeta = review.lastJudgement ? MASTERY_JUDGEMENT_META[review.lastJudgement] : null;

  return (
    <Card
      className={cn(
        'border-warm-200/70 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md',
        review.isOverdue && !completed && 'border-red-200'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'font-normal',
                  SUBJECT_BADGE_STYLES[review.subject] || 'border-warm-200 bg-warm-50 text-warm-700'
                )}
              >
                {SUBJECT_LABELS[review.subject] || '学科'}
              </Badge>
              <Badge
                variant="secondary"
                className={cn(
                  review.isOverdue && !completed ? 'bg-red-100 text-red-700' : 'bg-warm-100 text-warm-700'
                )}
              >
                {completed ? '已完成' : getUrgencyLabel(review.daysUntilDue)}
              </Badge>
              <Badge className={closureMeta.badgeClassName}>{closureMeta.compactLabel}</Badge>
              {review.reopenedCount > 0 ? (
                <Badge variant="outline" className="border-red-200 text-red-700">
                  复开 {review.reopenedCount} 次
                </Badge>
              ) : null}
            </div>
            <div>
              <p className="text-sm font-semibold text-warm-900">{getStageName(review.reviewStage)}</p>
              <p className="text-xs text-warm-600">
                {completed ? '最近完成' : '计划时间'}：{formatReviewDate(review.nextReviewAt)}
              </p>
              {judgementMeta ? (
                <p className="mt-1 text-xs text-warm-700">上次判定：{judgementMeta.label}</p>
              ) : null}
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
          {review.masteryState === 'provisional_mastered' || review.masteryState === 'reopened' ? (
            <div className={cn('rounded-2xl border px-3 py-3 text-sm', closureMeta.panelClassName)}>
              {closureMeta.description}
            </div>
          ) : null}
          <div
            className={cn(
              'rounded-2xl border px-3 py-3 text-sm',
              review.transferEvidenceReady
                ? 'border-emerald-200 bg-emerald-50/80 text-emerald-800'
                : 'border-amber-200 bg-amber-50/80 text-amber-800',
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={review.transferEvidenceReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}>
                {review.transferEvidenceStatusLabel}
              </Badge>
            </div>
            <p className="mt-2 leading-6">{review.transferEvidenceSummary}</p>
            <p className="mt-1 text-xs opacity-80">{review.transferEvidenceNextStep}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(review.conceptTags || []).slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="border-warm-200 text-warm-700">
                {tag}
              </Badge>
            ))}
            {review.conceptTags && review.conceptTags.length > 3 ? (
              <span className="text-xs text-warm-500">+{review.conceptTags.length - 3}</span>
            ) : null}
          </div>
        </div>

        <div className="mt-5 flex gap-2 border-t border-warm-100 pt-4">
          <Button className="flex-1 gap-2 rounded-full bg-warm-500 hover:bg-warm-600" onClick={() => onOpenReview(review.id)}>
            {completed ? '看复盘' : '继续复习'}
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-full border-warm-200 hover:bg-warm-50"
            onClick={() => onOpenSource(review.sessionId)}
          >
            看原题
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
  const { user, profile, loading: authLoading } = useAuth();
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

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace('/login?redirect=/review');
      return;
    }
  }, [authLoading, router, user]);

  const loadReviews = useCallback(async (isRefresh = false) => {
    if (!profile?.id) return;

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(
        '/api/review/schedule?scope=all&include_counts=1'
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load reviews');
      }

      setPendingReviews((payload.data || []).map(mapReview));
      setCompletedReviews((payload.completed_data || []).map(mapReview));
      setSummary(
        payload.summary || {
          total_count: (payload.data || []).length + (payload.completed_count || 0),
          pending_count: (payload.data || []).length,
          due_today_count: (payload.data || []).filter((item: any) => item.days_until_due <= 1).length,
          overdue_count: (payload.data || []).filter((item: any) => item.is_overdue).length,
          upcoming_count: (payload.data || []).filter((item: any) => item.days_until_due > 1).length,
          completed_count: payload.completed_count || 0,
        }
      );
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

  const dueNowReviews = useMemo(
    () => pendingReviews.filter((review) => review.isOverdue || review.daysUntilDue <= 1),
    [pendingReviews]
  );
  const upcomingReviews = useMemo(
    () => pendingReviews.filter((review) => !review.isOverdue && review.daysUntilDue > 1),
    [pendingReviews]
  );
  const transferGapCount = useMemo(
    () => pendingReviews.filter((review) => !review.transferEvidenceReady).length,
    [pendingReviews]
  );
  const nextReview = dueNowReviews[0] ?? upcomingReviews[0] ?? null;
  const latestCompletedReview = completedReviews[0] ?? null;
  const hasDueNowReview = Boolean(dueNowReviews[0]);
  const nextActionLabel = nextReview ? '继续复习' : latestCompletedReview ? '看复盘' : '继续学习';
  const nextActionDescription = nextReview
    ? hasDueNowReview
      ? '先做当前到期的题。'
      : '今天没有到期题，先看下一轮。'
    : latestCompletedReview
      ? '当前没有待复习题，先回看最近完成的一题。'
      : '当前没有复习任务，先去学习新题。';
  const secondaryActionLabel = nextReview ? '看原题' : latestCompletedReview ? '继续学习' : '错题本';

  const openReview = (reviewId: string) => router.push(`/review/session/${reviewId}`);
  const openSource = (sessionId: string) => router.push(`/error-book/${sessionId}`);
  const handleNextAction = () => {
    if (nextReview) {
      openReview(nextReview.id);
      return;
    }

    if (latestCompletedReview) {
      openReview(latestCompletedReview.id);
      return;
    }

    router.push('/study#quick-start');
  };

  const handleSecondaryAction = () => {
    if (nextReview) {
      openSource(nextReview.sessionId);
      return;
    }

    if (latestCompletedReview) {
      router.push('/study#quick-start');
      return;
    }

    router.push('/error-book');
  };

  if (authLoading || (!user && !profile)) {
    return (
      <div
        className={cn(
          'min-h-screen bg-gradient-to-br from-warm-50 via-white to-warm-100',
          profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior'
        )}
      >
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-warm-500" />
            <p className="mt-4 text-sm text-warm-600">正在检查登录状态...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-warm-50 via-white to-warm-100',
        profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior'
      )}
    >
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <PageHeader
          title="复习中心"
          description="先复习，再看下一步。"
          icon={BookOpen}
          iconColor="text-warm-500"
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => loadReviews(true)}
                disabled={refreshing}
                className="rounded-full border border-warm-200 hover:bg-warm-100"
              >
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/study#quick-start')}
                className="rounded-full border-warm-200 hover:bg-warm-50"
              >
                继续学习
              </Button>
            </div>
          }
        >
          <StatsRow>
            <StatCard label="总任务数" value={summary.total_count} icon={Calendar} color="text-blue-500" delay={0} />
            <StatCard label="现在该复习" value={summary.due_today_count} icon={Clock} color="text-orange-500" delay={0.1} />
            <StatCard label="已逾期" value={summary.overdue_count} icon={AlertCircle} color="text-red-500" delay={0.2} />
            <StatCard label="最近已完成" value={summary.completed_count} icon={CheckCircle} color="text-green-500" delay={0.3} />
            <StatCard label="迁移证据缺口" value={transferGapCount} icon={Target} color="text-amber-500" delay={0.3} />
          </StatsRow>
        </PageHeader>
      </div>

      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-20 sm:px-6">
        <Card className="border-warm-200/70 bg-white/95 shadow-sm">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-warm-700">
                <Sparkles className="h-4 w-4" />
                下一步
              </div>
              <h2 className="mt-2 text-xl font-semibold text-warm-900">{nextActionLabel}</h2>
              <p className="mt-1 text-sm text-warm-600">{nextActionDescription}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="rounded-full bg-warm-500 hover:bg-warm-600" onClick={handleNextAction}>
                {nextActionLabel}
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-warm-200 hover:bg-warm-50"
                onClick={handleSecondaryAction}
              >
                {secondaryActionLabel}
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
              description="先处理今天到期和逾期的题。"
              emptyTitle="今天的复习节奏很好"
              emptyDescription="当前没有到期任务，可以先去学习新题。"
              reviews={dueNowReviews}
              onOpenReview={openReview}
              onOpenSource={openSource}
            />

            <ReviewSection
              title="后续计划"
              description="这里看接下来几天的安排。"
              emptyTitle="暂时没有后续计划"
              emptyDescription="完成新的学习后，系统会自动补充。"
              reviews={upcomingReviews}
              onOpenReview={openReview}
              onOpenSource={openSource}
            />

            <ReviewSection
              title="最近完成"
              description="这里保留最近完成的题。"
              emptyTitle="还没有最近完成记录"
              emptyDescription="完成一轮复习后，这里就会出现。"
              reviews={completedReviews}
              completed
              onOpenReview={openReview}
              onOpenSource={openSource}
            />
          </div>
        )}
      </main>
    </div>
  );
}
