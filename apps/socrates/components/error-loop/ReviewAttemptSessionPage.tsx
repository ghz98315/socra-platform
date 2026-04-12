'use client';

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  MessageSquare,
  Sparkles,
  Tag,
  Target,
} from 'lucide-react';

import { InteractiveStarRating } from '@/components/DifficultyRating';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  ATTEMPT_MODE_OPTIONS,
  buildClosureGateSummary,
  type ClosureGateAttemptEvidence,
  type ClosureGateItem,
  getClosureStateMeta,
  getClosureGateStatusMeta,
  getClosureOutcomeMeta,
  MASTERY_JUDGEMENT_META,
  MASTERY_TONE_STYLES,
  MIN_CLOSURE_REVIEW_STAGE,
  type AttemptMode,
  type MasteryJudgement,
  evaluateClosureGates,
} from '@/lib/error-loop/review';
import {
  ROOT_CAUSE_CATEGORY_LABELS,
  getRootCauseSubtypeOption,
  type RootCauseCategory,
  type RootCauseSubtype,
} from '@/lib/error-loop/taxonomy';
import { REVIEW_STAGES } from '@/lib/review/utils';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type ReviewStep = 'intro' | 'recall' | 'judge' | 'complete';

interface AttemptHistoryItem {
  id: string;
  attempt_no: number;
  attempt_mode: AttemptMode;
  mastery_judgement: MasteryJudgement;
  created_at: string;
  independent_first?: boolean | null;
  asked_ai?: boolean | null;
  ai_hint_count?: number | null;
  solved_correctly?: boolean | null;
  explained_correctly?: boolean | null;
  variant_passed?: boolean | null;
}

interface ReviewResultPayload {
  attempt: {
    id: string;
    attempt_no: number;
    mastery_judgement: MasteryJudgement;
    created_at: string;
  };
  review: {
    id: string;
    review_stage: number;
    next_review_at: string | null;
    mastery_state: string | null;
    last_judgement: MasteryJudgement | null;
    close_reason: string | null;
    reopened_count: number | null;
    next_interval_days: number | null;
    is_completed: boolean;
  };
  mastery_judgement: MasteryJudgement;
  closed: boolean;
  next_review_at: string | null;
  root_cause_label?: string | null;
  root_cause_subtype_label?: string | null;
  root_cause_display_label?: string | null;
  root_cause_statement?: string | null;
  judgement_summary?: string | null;
  next_actions?: string[];
  closure_gate_summary?: string | null;
  closure_gate_pending_keys?: string[];
  closure_gate_items?: ClosureGateItem[];
  variant_evidence?: {
    total_variants: number;
    practiced_variants: number;
    successful_variants: number;
    independent_success_variants: number;
    latest_practiced_at: string | null;
    qualified_transfer_evidence: boolean;
    recommended_attempt_mode: AttemptMode;
    missing_reason: string | null;
    evidence_label: string;
    status_label: string;
    coach_summary: string;
    parent_summary: string;
    next_step: string;
  };
}

interface VariantEvidenceSummary {
  total_variants: number;
  practiced_variants: number;
  successful_variants: number;
  independent_success_variants: number;
  latest_practiced_at: string | null;
  qualified_transfer_evidence: boolean;
  recommended_attempt_mode: AttemptMode;
  missing_reason: string | null;
  evidence_label: string;
  status_label: string;
  coach_summary: string;
  parent_summary: string;
  next_step: string;
}

interface ReviewSession {
  id: string;
  sessionId: string;
  review_stage: number;
  next_review_at: string | null;
  is_completed: boolean;
  mastery_state: string | null;
  last_judgement: MasteryJudgement | null;
  reopened_count: number | null;
  next_interval_days: number | null;
  error_session: {
    id: string;
    subject: 'math' | 'chinese' | 'english' | 'physics' | 'chemistry';
    extracted_text: string | null;
    original_image_url: string | null;
    status: string;
    closure_state: string | null;
    difficulty_rating: number | null;
    student_difficulty_rating: number | null;
    final_difficulty_rating: number | null;
    concept_tags: string[] | null;
    primary_root_cause_category: RootCauseCategory | null;
    primary_root_cause_subtype: RootCauseSubtype | null;
    primary_root_cause_statement: string | null;
    created_at: string;
  };
}

interface AttemptFormState {
  attemptMode: AttemptMode;
  independentFirst: boolean;
  askedAi: boolean;
  aiHintCount: number;
  solvedCorrectly: boolean | null;
  explainedCorrectly: boolean | null;
  variantPassed: boolean | null;
  confidenceScore: number;
  notes: string;
}

interface ReviewScheduleRow {
  id: string;
  session_id: string;
  review_stage: number;
  next_review_at: string | null;
  is_completed: boolean;
  mastery_state: string | null;
  last_judgement: MasteryJudgement | null;
  reopened_count: number | null;
  next_interval_days: number | null;
}

const subjectLabels: Record<string, string> = {
  chinese: '语文',
  english: '英语',
  math: '数学',
  physics: '物理',
  chemistry: '化学',
};

const subjectColors: Record<string, string> = {
  chinese: 'text-rose-500 bg-rose-50 dark:bg-rose-900/30',
  english: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
  math: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
  physics: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
  chemistry: 'text-green-500 bg-green-50 dark:bg-green-900/30',
};

const DEFAULT_ATTEMPT_FORM: AttemptFormState = {
  attemptMode: 'original',
  independentFirst: true,
  askedAi: false,
  aiHintCount: 0,
  solvedCorrectly: null,
  explainedCorrectly: null,
  variantPassed: null,
  confidenceScore: 3,
  notes: '',
};

function formatDate(dateStr: string | null) {
  if (!dateStr) {
    return '待系统安排';
  }

  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatDateTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function toClosureGateAttemptEvidence(attempt: AttemptHistoryItem): ClosureGateAttemptEvidence {
  return {
    attemptMode: attempt.attempt_mode,
    independentFirst: attempt.independent_first !== false,
    askedAi: attempt.asked_ai === true,
    aiHintCount: Number.isFinite(attempt.ai_hint_count) ? Number(attempt.ai_hint_count) : 0,
    solvedCorrectly: attempt.solved_correctly === true,
    explainedCorrectly: attempt.explained_correctly === true,
    variantPassed: attempt.variant_passed === true ? true : attempt.variant_passed === false ? false : null,
  };
}

function getCurrentClosureNextStep({
  isCompleted,
  hasCurrentPreview,
  eligibleForClosure,
  currentReviewStage,
  minClosureReviewStage,
  hasVariantEvidence,
  variantNextStep,
  pendingGateKeys,
}: {
  isCompleted: boolean;
  hasCurrentPreview: boolean;
  eligibleForClosure: boolean;
  currentReviewStage: number;
  minClosureReviewStage: number | null;
  hasVariantEvidence: boolean;
  variantNextStep: string | null;
  pendingGateKeys: string[];
}) {
  if (isCompleted) {
    return getClosureStateMeta('mastered_closed').description;
  }

  if (!hasCurrentPreview) {
    return '先独立回忆并提交这轮真实证据，系统会根据独立性、解释质量、迁移证据和间隔稳定性判断是否能继续关单。';
  }

  if (eligibleForClosure) {
    return '当前已经走到可关闭阶段。本轮只要继续独立完成、无提示并讲清思路，就可以进入关闭判定。';
  }

  if (pendingGateKeys.includes('variant_transfer') && hasVariantEvidence && variantNextStep) {
    return variantNextStep;
  }

  if (pendingGateKeys.includes('interval_stability') && minClosureReviewStage) {
    return `当前还在第 ${currentReviewStage} 轮，至少到第 ${minClosureReviewStage} 轮并继续保持独立完成，系统才会关单。`;
  }

  return '这轮先按真实表现提交，不要为了关单而美化结果。系统只认独立完成、无提示、讲清依据和跨间隔稳定。';
}

function ClosureGatePreviewCard({
  title,
  statusLabel,
  statusClassName,
  summary,
  nextStep,
  items,
}: {
  title: string;
  statusLabel: string;
  statusClassName: string;
  summary: string;
  nextStep: string;
  items: ClosureGateItem[];
}) {
  return (
    <section className="rounded-2xl border border-border/60 bg-white/90 px-4 py-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <Badge variant="outline" className={statusClassName}>
          {statusLabel}
        </Badge>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</p>
      <p className="mt-2 text-sm text-foreground">{nextStep}</p>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              'rounded-2xl border px-4 py-3',
              item.passed ? 'border-emerald-200 bg-emerald-50/70' : 'border-amber-200 bg-amber-50/70',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {item.passed ? (
                  <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  item.passed ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700',
                )}
              >
                {item.passed ? '已满足' : '待补足'}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
function AttemptToggle({
  active,
  label,
  description,
  onClick,
}: {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-2xl border px-4 py-4 text-left transition-colors',
        active
          ? 'border-warm-400 bg-warm-50 shadow-sm'
          : 'border-border/60 bg-background hover:border-warm-200 hover:bg-warm-50/50',
      )}
    >
      <p className={cn('text-sm font-semibold', active ? 'text-warm-800' : 'text-foreground')}>{label}</p>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

export default function ReviewAttemptSessionPage({ reviewId }: { reviewId: string }) {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<AttemptHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewStep, setReviewStep] = useState<ReviewStep>('intro');
  const [userRecall, setUserRecall] = useState('');
  const [attemptForm, setAttemptForm] = useState<AttemptFormState>(DEFAULT_ATTEMPT_FORM);
  const [studentDifficulty, setStudentDifficulty] = useState<number>(0);
  const [showDifficultySection, setShowDifficultySection] = useState(true);
  const [isRatingDifficulty, setIsRatingDifficulty] = useState(false);
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [reviewResult, setReviewResult] = useState<ReviewResultPayload | null>(null);
  const [variantEvidence, setVariantEvidence] = useState<VariantEvidenceSummary | null>(null);
  const [recallStartedAt, setRecallStartedAt] = useState<number | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace(`/login?redirect=/review/session/${reviewId}`);
      return;
    }
  }, [authLoading, reviewId, router, user]);

  useEffect(() => {
    async function loadReviewSession() {
      setLoading(true);

      try {
        const { data: reviewData, error: reviewError } = (await supabase
          .from('review_schedule')
          .select(
            `
              id,
              session_id,
              review_stage,
              next_review_at,
              is_completed,
              mastery_state,
              last_judgement,
              reopened_count,
              next_interval_days
            `,
          )
          .eq('id', reviewId)
          .single()) as { data: ReviewScheduleRow | null; error: unknown };

        if (reviewError || !reviewData) {
          throw reviewError || new Error('Review schedule not found');
        }

        const { data: errorData, error: errorSessionError } = await supabase
          .from('error_sessions')
          .select('*')
          .eq('id', reviewData.session_id)
          .single();

        if (errorSessionError || !errorData) {
          throw errorSessionError || new Error('Error session not found');
        }

        setReviewSession({
          id: reviewData.id,
          sessionId: reviewData.session_id,
          review_stage: reviewData.review_stage,
          next_review_at: reviewData.next_review_at,
          is_completed: reviewData.is_completed,
          mastery_state: reviewData.mastery_state,
          last_judgement: reviewData.last_judgement,
          reopened_count: reviewData.reopened_count,
          next_interval_days: reviewData.next_interval_days,
          error_session: errorData as ReviewSession['error_session'],
        });

        setStudentDifficulty((errorData as { student_difficulty_rating?: number }).student_difficulty_rating || 0);

        if (profile?.id) {
          const response = await fetch(
            `/api/review/attempt?review_id=${encodeURIComponent(reviewId)}&student_id=${encodeURIComponent(profile.id)}`,
          );
          const payload = await response.json();

          if (response.ok) {
            setAttemptHistory(payload.data || []);
            setVariantEvidence(payload.variant_evidence || null);
          }
        }
      } catch (error) {
        console.error('Failed to load review session:', error);
        setReviewSession(null);
      } finally {
        setLoading(false);
      }
    }

    void loadReviewSession();
  }, [profile?.id, reviewId, supabase]);

  const currentStage = useMemo(
    () => REVIEW_STAGES.find((stage) => stage.stage === (reviewSession?.review_stage || 1)),
    [reviewSession?.review_stage],
  );

  const progress = useMemo(() => {
    if (!reviewSession) {
      return 0;
    }

    return Math.min((reviewSession.review_stage / 4) * 100, 100);
  }, [reviewSession]);

  const currentJudgementMeta = reviewResult ? MASTERY_JUDGEMENT_META[reviewResult.mastery_judgement] : null;
  const currentClosureMeta = getClosureStateMeta(
    reviewSession?.mastery_state || reviewSession?.error_session.closure_state,
  );

  const latestAttempt = useMemo(
    () => (attemptHistory.length ? attemptHistory[attemptHistory.length - 1] : null),
    [attemptHistory],
  );
  const currentClosurePreview = useMemo(() => {
    if (!reviewSession || !latestAttempt) {
      return null;
    }

    return evaluateClosureGates({
      reviewStage: reviewSession.review_stage,
      currentAttempt: toClosureGateAttemptEvidence(latestAttempt),
      previousAttempts: attemptHistory.slice(0, -1).map(toClosureGateAttemptEvidence),
      externalVariantEvidencePassed: variantEvidence?.qualified_transfer_evidence === true,
    });
  }, [attemptHistory, latestAttempt, reviewSession, variantEvidence]);
  const currentClosurePreviewStatus = useMemo(
    () =>
      getClosureGateStatusMeta({
        isCompleted: reviewSession?.is_completed === true,
        eligibleForClosure: currentClosurePreview?.eligibleForClosure === true,
        closureState: reviewSession?.mastery_state || reviewSession?.error_session.closure_state,
      }),
    [currentClosurePreview?.eligibleForClosure, reviewSession?.error_session.closure_state, reviewSession?.is_completed, reviewSession?.mastery_state],
  );
  const currentClosureNextStep = useMemo(
    () =>
      getCurrentClosureNextStep({
        isCompleted: reviewSession?.is_completed === true,
        hasCurrentPreview: Boolean(currentClosurePreview),
        eligibleForClosure: currentClosurePreview?.eligibleForClosure === true,
        currentReviewStage: reviewSession?.review_stage || 1,
        minClosureReviewStage: currentClosurePreview?.minClosureReviewStage ?? null,
        hasVariantEvidence: Boolean(variantEvidence),
        variantNextStep: variantEvidence?.next_step ?? null,
        pendingGateKeys: currentClosurePreview?.pendingGateKeys || [],
      }),
    [currentClosurePreview, reviewSession?.is_completed, reviewSession?.review_stage, variantEvidence],
  );
  const completionPendingItems = useMemo(
    () => (reviewResult?.closure_gate_items || []).filter((item) => !item.passed),
    [reviewResult],
  );
  const completionPendingLabels = useMemo(
    () => completionPendingItems.map((item) => item.shortLabel || item.label),
    [completionPendingItems],
  );
  const completionOutcomeMeta = useMemo(
    () =>
      reviewResult
        ? getClosureOutcomeMeta({
            closed: reviewResult.closed,
            pendingLabels: completionPendingLabels,
          })
        : null,
    [completionPendingLabels, reviewResult],
  );
  const completionNextStep = useMemo(() => {
    if (!reviewResult) {
      return '';
    }

    return getCurrentClosureNextStep({
      isCompleted: reviewResult.closed,
      hasCurrentPreview: true,
      eligibleForClosure: reviewResult.closed,
      currentReviewStage: reviewResult.review.review_stage || 1,
      minClosureReviewStage: MIN_CLOSURE_REVIEW_STAGE,
      hasVariantEvidence: Boolean(reviewResult.variant_evidence),
      variantNextStep: reviewResult.variant_evidence?.next_step ?? null,
      pendingGateKeys: reviewResult.closure_gate_pending_keys || [],
    });
  }, [reviewResult]);
  const openSourceQuestion = () => router.push(`/error-book/${reviewSession?.sessionId}`);
  const returnToReviewHub = () => router.push('/review');
  const continueStudy = () => {
    if (!reviewSession) {
      return;
    }

    router.push(`/study/${reviewSession.error_session.subject}/problem?session=${reviewSession.sessionId}`);
  };

  const handleStartRecall = () => {
    setRecallStartedAt(Date.now());
    setReviewStep('recall');
  };

  const handleDifficultyRating = async () => {
    if (!reviewSession || studentDifficulty === 0 || !profile?.id) {
      return;
    }

    setIsRatingDifficulty(true);

    try {
      const response = await fetch('/api/error-session/difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: reviewSession.sessionId,
          student_id: profile.id,
          difficulty_rating: studentDifficulty,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update difficulty');
      }

      setReviewSession((current) =>
        current
          ? {
              ...current,
              error_session: {
                ...current.error_session,
                student_difficulty_rating: studentDifficulty,
                final_difficulty_rating: data.data.final_difficulty_rating,
              },
            }
          : current,
      );
      setShowDifficultySection(false);
    } catch (error) {
      console.error('Failed to submit difficulty rating:', error);
    } finally {
      setIsRatingDifficulty(false);
    }
  };

  const handleSubmitAttempt = async () => {
    if (!reviewSession || !profile?.id) {
      return;
    }

    setSubmitError(null);

    if (attemptForm.solvedCorrectly === null) {
      setSubmitError('先判断这次是否真的做对了。');
      return;
    }

    if (attemptForm.solvedCorrectly && attemptForm.explainedCorrectly === null) {
      setSubmitError('如果做对了，还要说明你能不能把思路讲清楚。');
      return;
    }

    if (attemptForm.askedAi && attemptForm.aiHintCount <= 0) {
      setSubmitError('既然求助了 AI，请补上大致提示次数。');
      return;
    }

    if ((attemptForm.attemptMode === 'variant' || attemptForm.attemptMode === 'mixed') && attemptForm.variantPassed === null) {
      setSubmitError('做了变式复习时，需要明确变式是否通过。');
      return;
    }

    setIsSubmittingAttempt(true);

    try {
      const durationSeconds = recallStartedAt ? Math.max(0, Math.round((Date.now() - recallStartedAt) / 1000)) : null;
      const response = await fetch('/api/review/attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          review_id: reviewSession.id,
          student_id: profile.id,
          attempt_mode: attemptForm.attemptMode,
          independent_first: attemptForm.independentFirst,
          asked_ai: attemptForm.askedAi,
          ai_hint_count: attemptForm.askedAi ? attemptForm.aiHintCount : 0,
          solved_correctly: attemptForm.solvedCorrectly,
          explained_correctly: attemptForm.solvedCorrectly ? attemptForm.explainedCorrectly : false,
          confidence_score: attemptForm.confidenceScore,
          duration_seconds: durationSeconds,
          variant_passed: attemptForm.attemptMode === 'original' ? null : attemptForm.variantPassed,
          notes: attemptForm.notes.trim() || null,
          metadata: {
            recall_summary: userRecall.trim() || null,
            current_root_cause_category: reviewSession.error_session.primary_root_cause_category,
            current_root_cause_subtype: reviewSession.error_session.primary_root_cause_subtype,
            current_root_cause_statement: reviewSession.error_session.primary_root_cause_statement,
            student_difficulty_rating: studentDifficulty || null,
          },
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Failed to submit review attempt');
      }

      setReviewResult(payload.data);
      setVariantEvidence(payload.data.variant_evidence || null);
      setReviewSession((current) =>
        current
          ? {
              ...current,
              review_stage: payload.data.review.review_stage,
              next_review_at: payload.data.review.next_review_at,
              is_completed: payload.data.review.is_completed,
              mastery_state: payload.data.review.mastery_state,
              last_judgement: payload.data.review.last_judgement,
              reopened_count: payload.data.review.reopened_count,
              next_interval_days: payload.data.review.next_interval_days,
              error_session: {
                ...current.error_session,
                status: payload.data.closed ? 'mastered' : 'guided_learning',
                closure_state: payload.data.review.mastery_state,
              },
            }
          : current,
      );
      setAttemptHistory((current) => [
        ...current,
        {
          id: payload.data.attempt.id,
          attempt_no: payload.data.attempt.attempt_no,
          attempt_mode: attemptForm.attemptMode,
          mastery_judgement: payload.data.mastery_judgement,
          created_at: payload.data.attempt.created_at,
          independent_first: attemptForm.independentFirst,
          asked_ai: attemptForm.askedAi,
          ai_hint_count: attemptForm.askedAi ? attemptForm.aiHintCount : 0,
          solved_correctly: attemptForm.solvedCorrectly,
          explained_correctly: attemptForm.solvedCorrectly ? attemptForm.explainedCorrectly : false,
          variant_passed: attemptForm.attemptMode === 'original' ? null : attemptForm.variantPassed,
        },
      ]);
      setReviewStep('complete');
    } catch (error) {
      console.error('Failed to submit review attempt:', error);
      setSubmitError(getErrorMessage(error, '提交复习结果失败'));
    } finally {
      setIsSubmittingAttempt(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground">正在加载复习内容...</p>
        </div>
      </div>
    );
  }

  if (authLoading || (!user && !profile)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground">正在检查登录状态...</p>
        </div>
      </div>
    );
  }

  if (!reviewSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">复习任务不存在</p>
            <Button onClick={() => router.push('/review')}>返回复习列表</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-orange-950/30',
        profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior',
      )}
    >
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/review')} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
              <div>
                <h1 className="text-lg font-semibold">复习判定</h1>
                <p className="text-sm text-muted-foreground">
                  {currentStage?.name || '复习中'} · 第 {reviewSession.review_stage} 轮
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={openSourceQuestion} className="gap-2">
                <FileText className="w-4 h-4" />
                看原题
              </Button>
              <Badge className={cn('gap-1', subjectColors[reviewSession.error_session.subject])}>
                {subjectLabels[reviewSession.error_session.subject]}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Card className="border-border/50">
          <CardContent className="py-4 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={currentClosureMeta.badgeClassName}>{currentClosureMeta.label}</Badge>
              {reviewSession.last_judgement ? (
                <Badge variant="outline">
                  上次判定: {MASTERY_JUDGEMENT_META[reviewSession.last_judgement].label}
                </Badge>
              ) : null}
              {reviewSession.reopened_count ? (
                <Badge variant="outline">复开 {reviewSession.reopened_count} 次</Badge>
              ) : null}
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">复习闭环进度</p>
                <p className="text-xs text-muted-foreground">
                  当前状态: {reviewSession.mastery_state || reviewSession.error_session.closure_state || 'scheduled'}
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="font-medium">{Math.round(progress)}%</p>
                <p className="text-xs text-muted-foreground">下次复习: {formatDate(reviewSession.next_review_at)}</p>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between gap-2 text-xs text-muted-foreground">
              {REVIEW_STAGES.slice(0, 4).map((stage) => (
                <span
                  key={stage.stage}
                  className={cn(
                    stage.stage < reviewSession.review_stage && 'text-green-600',
                    stage.stage === reviewSession.review_stage && 'font-medium text-primary',
                  )}
                >
                  {stage.name}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="space-y-6">
            {reviewStep === 'intro' ? (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    继续复习
                  </CardTitle>
                  <CardDescription>先独立回忆，再提交判定。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {reviewSession.error_session.concept_tags?.length ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      {reviewSession.error_session.concept_tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {reviewSession.error_session.primary_root_cause_category &&
                  reviewSession.error_session.primary_root_cause_statement ? (
                    <div className="rounded-2xl border border-warm-200 bg-warm-50/80 px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-warm-100 text-warm-700">
                          本题主根因
                        </Badge>
                        <Badge variant="outline" className="border-warm-200 text-warm-700">
                          {ROOT_CAUSE_CATEGORY_LABELS[reviewSession.error_session.primary_root_cause_category]}
                        </Badge>
                        {reviewSession.error_session.primary_root_cause_subtype ? (
                          <Badge variant="outline" className="border-warm-200 text-warm-700">
                            {getRootCauseSubtypeOption(reviewSession.error_session.primary_root_cause_subtype)?.label}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-warm-900">
                        {reviewSession.error_session.primary_root_cause_statement}
                      </p>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4 text-sm text-blue-800">
                    先按真实情况做，再看 4 件事：是否独立开始、是否做对、能否讲清、变式能否通过。
                  </div>

                  {currentClosurePreview ? (
                    <ClosureGatePreviewCard
                      title="关单还差什么"
                      statusLabel={currentClosurePreviewStatus.label}
                      statusClassName={currentClosurePreviewStatus.className}
                      summary={currentClosurePreview.summary}
                      nextStep={currentClosureNextStep}
                      items={currentClosurePreview.items}
                    />
                  ) : null}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={openSourceQuestion}
                      className="flex-1 gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      看原题
                    </Button>
                    <Button onClick={handleStartRecall} className="flex-1 gap-2">
                      继续复习
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {reviewStep === 'recall' ? (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    独立回忆阶段
                  </CardTitle>
                  <CardDescription>先自己做，再进入判定。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {reviewSession.error_session.original_image_url ? (
                    <div className="rounded-xl overflow-hidden bg-muted">
                      <img
                        src={reviewSession.error_session.original_image_url}
                        alt="错题图片"
                        className="w-full max-h-96 object-contain"
                      />
                    </div>
                  ) : null}

                  {reviewSession.error_session.extracted_text ? (
                    <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                      <p className="text-xs text-muted-foreground mb-2">原题内容</p>
                      <p className="text-sm whitespace-pre-wrap">{reviewSession.error_session.extracted_text}</p>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">写下你这次回忆出的解题思路</label>
                    <textarea
                      value={userRecall}
                      onChange={(event) => setUserRecall(event.target.value)}
                      placeholder="先写你怎么想、怎么列式、卡在哪里。这段会作为后续复盘证据。"
                      className="min-h-36 w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-warm-300 focus:ring-2 focus:ring-warm-400/10"
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setReviewStep('intro')} className="gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      返回
                    </Button>
                    <Button onClick={() => setReviewStep('judge')} className="flex-1 gap-2">
                      提交判定
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {reviewStep === 'judge' ? (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    提交判定
                  </CardTitle>
                  <CardDescription>按真实情况填写这次复习结果。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {userRecall ? (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
                      <p className="text-xs text-blue-600 mb-2">你的回忆记录</p>
                      <p className="text-sm whitespace-pre-wrap text-blue-900">{userRecall}</p>
                    </div>
                  ) : null}

                  {currentClosurePreview ? (
                    <ClosureGatePreviewCard
                      title="提交前确认"
                      statusLabel={currentClosurePreviewStatus.label}
                      statusClassName={currentClosurePreviewStatus.className}
                      summary={currentClosurePreview.summary}
                      nextStep={currentClosureNextStep}
                      items={currentClosurePreview.items}
                    />
                  ) : null}
                  <section className="space-y-3">
                    <p className="text-sm font-medium">这轮复习模式</p>
                    <div className="grid gap-3 md:grid-cols-3">
                      {ATTEMPT_MODE_OPTIONS.map((option) => (
                        <AttemptToggle
                          key={option.value}
                          active={attemptForm.attemptMode === option.value}
                          label={option.label}
                          description={option.description}
                          onClick={() =>
                            setAttemptForm((current) => ({
                              ...current,
                              attemptMode: option.value,
                              variantPassed: option.value === 'original' ? null : current.variantPassed,
                            }))
                          }
                        />
                      ))}
                    </div>
                  </section>

                  <section className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">你是先独立开始的吗？</p>
                      <div className="grid grid-cols-2 gap-3">
                        <AttemptToggle
                          active={attemptForm.independentFirst}
                          label="是"
                          description="先自己做，再看是否需要帮助。"
                          onClick={() => setAttemptForm((current) => ({ ...current, independentFirst: true }))}
                        />
                        <AttemptToggle
                          active={!attemptForm.independentFirst}
                          label="否"
                          description="一开始就依赖提示或外部帮助。"
                          onClick={() => setAttemptForm((current) => ({ ...current, independentFirst: false }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium">你这次最终做对了吗？</p>
                      <div className="grid grid-cols-2 gap-3">
                        <AttemptToggle
                          active={attemptForm.solvedCorrectly === true}
                          label="做对了"
                          description="结果和关键过程都成立。"
                          onClick={() => setAttemptForm((current) => ({ ...current, solvedCorrectly: true }))}
                        />
                        <AttemptToggle
                          active={attemptForm.solvedCorrectly === false}
                          label="没做对"
                          description="结果不对，或关键链路仍然断掉。"
                          onClick={() =>
                            setAttemptForm((current) => ({
                              ...current,
                              solvedCorrectly: false,
                              explainedCorrectly: false,
                              variantPassed: current.attemptMode === 'original' ? null : current.variantPassed,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </section>

                  <section className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">这次是否求助过 AI？</p>
                      <div className="grid grid-cols-2 gap-3">
                        <AttemptToggle
                          active={!attemptForm.askedAi}
                          label="没有"
                          description="全程没有向 AI 要提示。"
                          onClick={() => setAttemptForm((current) => ({ ...current, askedAi: false, aiHintCount: 0 }))}
                        />
                        <AttemptToggle
                          active={attemptForm.askedAi}
                          label="有"
                          description="过程中向 AI 要过提示。"
                          onClick={() =>
                            setAttemptForm((current) => ({
                              ...current,
                              askedAi: true,
                              aiHintCount: Math.max(1, current.aiHintCount),
                            }))
                          }
                        />
                      </div>
                      {attemptForm.askedAi ? (
                        <div className="space-y-2">
                          <label className="text-xs text-muted-foreground">大致提示次数</label>
                          <input
                            type="number"
                            min={1}
                            value={attemptForm.aiHintCount}
                            onChange={(event) =>
                              setAttemptForm((current) => ({
                                ...current,
                                aiHintCount: Math.max(1, Number(event.target.value) || 1),
                              }))
                            }
                            className="flex h-11 w-full rounded-xl border-2 border-warm-200 bg-warm-50 px-4 py-2 text-base text-warm-900 focus:border-warm-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-warm-400/20 md:text-sm"
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium">如果做对了，你能把思路讲清楚吗？</p>
                      <div className="grid grid-cols-2 gap-3">
                        <AttemptToggle
                          active={attemptForm.explainedCorrectly === true}
                          label="能讲清"
                          description="关键步骤、为什么这么做，都能说明白。"
                          onClick={() => setAttemptForm((current) => ({ ...current, explainedCorrectly: true }))}
                        />
                        <AttemptToggle
                          active={attemptForm.explainedCorrectly === false}
                          label="讲不清"
                          description="答案可能对，但解释链路还不完整。"
                          onClick={() => setAttemptForm((current) => ({ ...current, explainedCorrectly: false }))}
                        />
                      </div>
                    </div>
                  </section>

                  {variantEvidence ? (
                    <section
                      className={cn(
                        'rounded-2xl border px-4 py-4',
                        variantEvidence.qualified_transfer_evidence
                          ? 'border-emerald-200 bg-emerald-50/70'
                          : 'border-blue-200 bg-blue-50/70',
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">真实变式证据</p>
                        <Badge
                          variant="outline"
                          className={
                            variantEvidence.qualified_transfer_evidence
                              ? 'border-emerald-200 text-emerald-700'
                              : 'border-blue-200 text-blue-700'
                          }
                        >
                          {variantEvidence.status_label}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{variantEvidence.coach_summary}</p>
                      {variantEvidence.latest_practiced_at ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          最近练习: {formatDateTime(variantEvidence.latest_practiced_at)}
                        </p>
                      ) : null}
                      {variantEvidence.missing_reason ? (
                        <p className="mt-2 text-sm text-blue-800">{variantEvidence.missing_reason}</p>
                      ) : null}
                      <p className="mt-2 text-sm text-foreground">{variantEvidence.next_step}</p>
                      {!variantEvidence.qualified_transfer_evidence ? (
                        <div className="mt-3">
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/error-book/${reviewSession.sessionId}`)}
                            className="gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            先去做变式练习
                          </Button>
                        </div>
                      ) : null}
                    </section>
                  ) : null}

                  {(attemptForm.attemptMode === 'variant' || attemptForm.attemptMode === 'mixed') ? (
                    <section className="space-y-3">
                      <p className="text-sm font-medium">变式题是否也通过？</p>
                      <div className="grid grid-cols-2 gap-3">
                        <AttemptToggle
                          active={attemptForm.variantPassed === true}
                          label="通过"
                          description="换法、换条件后，仍能独立完成。"
                          onClick={() => setAttemptForm((current) => ({ ...current, variantPassed: true }))}
                        />
                        <AttemptToggle
                          active={attemptForm.variantPassed === false}
                          label="没通过"
                          description="一换法就不会，说明迁移还没建立。"
                          onClick={() => setAttemptForm((current) => ({ ...current, variantPassed: false }))}
                        />
                      </div>
                    </section>
                  ) : null}

                  <section className="space-y-3">
                    <p className="text-sm font-medium">你现在对自己的把握程度</p>
                    <div className="flex flex-wrap gap-2">
                      {[1, 2, 3, 4, 5].map((score) => (
                        <button
                          key={score}
                          type="button"
                          onClick={() => setAttemptForm((current) => ({ ...current, confidenceScore: score }))}
                          className={cn(
                            'rounded-full border px-4 py-2 text-sm transition-colors',
                            attemptForm.confidenceScore === score
                              ? 'border-warm-400 bg-warm-500 text-white'
                              : 'border-warm-200 bg-white text-warm-700 hover:bg-warm-50',
                          )}
                        >
                          {score} 分
                        </button>
                      ))}
                    </div>
                  </section>

                  {showDifficultySection ? (
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-amber-800">难度再评估</p>
                          <p className="text-xs text-amber-700">复习后重新打分，可以帮助后续安排节奏。</p>
                        </div>
                        {reviewSession.error_session.final_difficulty_rating ? (
                          <Badge variant="outline" className="border-amber-300 text-amber-700">
                            当前综合难度 {reviewSession.error_session.final_difficulty_rating}
                          </Badge>
                        ) : null}
                      </div>
                      <InteractiveStarRating value={studentDifficulty} onChange={setStudentDifficulty} size="md" />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDifficultySection(false)}
                          disabled={isRatingDifficulty}
                        >
                          跳过
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleDifficultyRating}
                          disabled={studentDifficulty === 0 || isRatingDifficulty}
                          className="bg-amber-500 hover:bg-amber-600 text-white"
                        >
                          {isRatingDifficulty ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              提交中...
                            </>
                          ) : (
                            '提交难度'
                          )}
                        </Button>
                      </div>
                    </section>
                  ) : null}

                  <section className="space-y-2">
                    <label className="text-sm font-medium">补充说明</label>
                    <textarea
                      value={attemptForm.notes}
                      onChange={(event) => setAttemptForm((current) => ({ ...current, notes: event.target.value }))}
                      placeholder="例如：哪一步最不稳、为什么求助 AI、变式卡在哪里。"
                      className="min-h-28 w-full rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-warm-300 focus:ring-2 focus:ring-warm-400/10"
                    />
                  </section>

                  {submitError ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {submitError}
                    </div>
                  ) : null}

                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setReviewStep('recall')}>
                      返回修改
                    </Button>
                    <Button onClick={handleSubmitAttempt} disabled={isSubmittingAttempt} className="flex-1 gap-2">
                      {isSubmittingAttempt ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      提交判定
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {reviewStep === 'complete' && reviewResult && currentJudgementMeta ? (
              <Card className="border-border/50">
                <CardContent className="py-10 text-center">
                  <div
                    className={cn(
                      'w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6',
                      currentJudgementMeta.tone === 'green'
                        ? 'bg-emerald-100'
                        : currentJudgementMeta.tone === 'blue'
                          ? 'bg-blue-100'
                          : currentJudgementMeta.tone === 'amber'
                            ? 'bg-amber-100'
                            : 'bg-red-100',
                    )}
                  >
                    <CheckCircle
                      className={cn(
                        'w-10 h-10',
                        currentJudgementMeta.tone === 'green'
                          ? 'text-emerald-600'
                          : currentJudgementMeta.tone === 'blue'
                            ? 'text-blue-600'
                            : currentJudgementMeta.tone === 'amber'
                              ? 'text-amber-600'
                              : 'text-red-600',
                      )}
                    />
                  </div>
                  <Badge className={cn('mb-4', MASTERY_TONE_STYLES[currentJudgementMeta.tone].badge)}>
                    {currentJudgementMeta.label}
                  </Badge>
                  <h2 className="text-2xl font-semibold">{currentJudgementMeta.label}</h2>
                  <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{currentJudgementMeta.description}</p>

                  <div
                    className={cn(
                      'mt-6 rounded-2xl border px-4 py-4 text-left',
                      MASTERY_TONE_STYLES[currentJudgementMeta.tone].panel,
                    )}
                  >
                    <p className="text-sm font-medium">系统结论</p>
                    <p className="mt-2 text-sm">本次判定: {currentJudgementMeta.label}</p>
                    <div className="mt-2">
                      <Badge className={getClosureStateMeta(reviewResult.review.mastery_state).badgeClassName}>
                        {getClosureStateMeta(reviewResult.review.mastery_state).label}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm">
                      {reviewResult.closed ? '该题已进入关闭状态。' : `下次复习时间: ${formatDate(reviewResult.next_review_at)}`}
                    </p>
                    {reviewResult.review.reopened_count ? (
                      <p className="mt-1 text-sm">累计重开次数: {reviewResult.review.reopened_count}</p>
                    ) : null}
                  </div>

                  <div
                    className={cn(
                      'mx-auto mt-6 max-w-3xl rounded-2xl border px-5 py-4 text-left',
                      reviewResult.closed
                        ? 'border-emerald-200 bg-emerald-50/80'
                        : 'border-amber-200 bg-amber-50/80',
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">下一步</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          reviewResult.closed
                            ? 'border-emerald-200 text-emerald-700'
                            : 'border-amber-200 text-amber-700',
                        )}
                      >
                        {completionOutcomeMeta?.badgeLabel}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-foreground">
                      {completionOutcomeMeta?.summary || buildClosureGateSummary(completionPendingLabels)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{completionNextStep}</p>
                    {!reviewResult.closed && completionPendingLabels.length ? (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {completionPendingLabels.map((label) => (
                          <Badge key={label} variant="secondary" className="bg-white text-amber-800">
                            {label}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  {reviewResult.judgement_summary ? (
                    <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-warm-200 bg-warm-50/80 px-5 py-4 text-left">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-warm-900">这次为什么这样判定</p>
                        {reviewResult.root_cause_display_label ? (
                          <Badge variant="outline" className="border-warm-200 text-warm-700">
                            {reviewResult.root_cause_display_label}
                          </Badge>
                        ) : null}
                        {reviewResult.root_cause_subtype_label && reviewResult.root_cause_label ? (
                          <Badge variant="outline" className="border-warm-200 text-warm-700">
                            归属: {reviewResult.root_cause_label}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-3 text-sm leading-6 text-warm-900">{reviewResult.judgement_summary}</p>
                      {reviewResult.next_actions?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {reviewResult.next_actions.map((action) => (
                            <Badge key={action} variant="secondary" className="bg-white text-warm-800">
                              {action}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {reviewResult.closure_gate_items?.length ? (
                    <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-border/60 bg-white/90 px-5 py-4 text-left shadow-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">真会关门条件</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            reviewResult.closed
                              ? 'border-emerald-200 text-emerald-700'
                              : 'border-amber-200 text-amber-700',
                          )}
                        >
                          {completionOutcomeMeta?.gateBadgeLabel}
                        </Badge>
                      </div>
                      {reviewResult.closure_gate_summary ? (
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">{reviewResult.closure_gate_summary}</p>
                      ) : null}
                      <div className="mt-4 grid gap-3">
                        {reviewResult.closure_gate_items.map((item) => (
                          <div
                            key={item.key}
                            className={cn(
                              'rounded-2xl border px-4 py-3',
                              item.passed ? 'border-emerald-200 bg-emerald-50/70' : 'border-amber-200 bg-amber-50/70',
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                {item.passed ? (
                                  <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-600" />
                                ) : (
                                  <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600" />
                                )}
                                <div>
                                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                                  <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={cn(
                                  item.passed ? 'border-emerald-200 text-emerald-700' : 'border-amber-200 text-amber-700',
                                )}
                              >
                                {item.passed ? '已满足' : '待补足'}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="mt-8 flex flex-wrap justify-center gap-3">
                    {!reviewResult.closed ? (
                      <Button
                        onClick={continueStudy}
                        className="gap-2"
                      >
                        <MessageSquare className="w-4 h-4" />
                        继续学习
                      </Button>
                    ) : null}
                    <Button variant={reviewResult.closed ? 'default' : 'outline'} onClick={returnToReviewHub}>
                      复习中心
                    </Button>
                    {reviewResult.closed ? (
                      <Button variant="outline" onClick={openSourceQuestion}>
                        看原题
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-warm-600" />
                  本题概览
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">首次学习</span>
                  <span>{formatDate(reviewSession.error_session.created_at)}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">当前轮次</span>
                  <span>{reviewSession.review_stage}</span>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">当前闭环状态</span>
                  <Badge className={currentClosureMeta.badgeClassName}>{currentClosureMeta.label}</Badge>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <span className="text-muted-foreground">上次判定</span>
                  <span>
                    {reviewSession.last_judgement ? MASTERY_JUDGEMENT_META[reviewSession.last_judgement].label : '暂无'}
                  </span>
                </div>
                {reviewSession.error_session.final_difficulty_rating ? (
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-muted-foreground">综合难度</span>
                    <span>{reviewSession.error_session.final_difficulty_rating}</span>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-warm-600" />
                  最近复习记录
                </CardTitle>
                <CardDescription>不是点一下“会了”就结束，而是看证据轨迹。</CardDescription>
              </CardHeader>
              <CardContent>
                {attemptHistory.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
                    还没有复习判定记录，这次提交后会生成第一条证据。
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attemptHistory
                      .slice()
                      .reverse()
                      .slice(0, 4)
                      .map((attempt) => {
                        const meta = MASTERY_JUDGEMENT_META[attempt.mastery_judgement];

                        return (
                          <div key={attempt.id} className="rounded-2xl border border-border/60 px-4 py-3">
                            <div className="flex items-center justify-between gap-3">
                              <Badge className={MASTERY_TONE_STYLES[meta.tone].badge}>{meta.label}</Badge>
                              <span className="text-xs text-muted-foreground">{formatDateTime(attempt.created_at)}</span>
                            </div>
                            <p className="mt-2 text-sm text-foreground">
                              第 {attempt.attempt_no} 次 · {ATTEMPT_MODE_OPTIONS.find((item) => item.value === attempt.attempt_mode)?.label}
                            </p>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
