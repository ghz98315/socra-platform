'use client';

/* eslint-disable react/no-unescaped-entities */

import { useState, useEffect, use, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle,
  Clock,
  Download,
  MessageCircle,
  Play,
  Sparkles,
  Star,
  Tag,
  Target,
  User,
} from 'lucide-react';

import { AnalysisDialog } from '@/components/AnalysisDialog';
import { VariantPracticePanel } from '@/components/VariantPracticePanel';
import { DiagnosisPanel } from '@/components/error-loop/DiagnosisPanel';
import { GuidedReflectionPanel } from '@/components/error-loop/GuidedReflectionPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/contexts/AuthContext';
import { downloadErrorQuestionPDF } from '@/lib/pdf/ErrorQuestionPDF';
import { getClosureStateMeta, MASTERY_JUDGEMENT_META, type MasteryJudgement } from '@/lib/error-loop/review';
import type { RootCauseCategory, RootCauseSubtype, StructuredDiagnosis } from '@/lib/error-loop/taxonomy';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface ErrorSession {
  id: string;
  subject: 'math' | 'chinese' | 'english' | 'physics' | 'chemistry';
  extracted_text: string | null;
  original_image_url: string | null;
  geometry_data?: unknown;
  geometry_svg?: string | null;
  status: 'analyzing' | 'guided_learning' | 'mastered';
  difficulty_rating: number | null;
  concept_tags: string[] | null;
  primary_root_cause_category: RootCauseCategory | null;
  primary_root_cause_subtype: RootCauseSubtype | null;
  primary_root_cause_statement: string | null;
  closure_state: string | null;
  created_at: string;
}

interface ReviewSummary {
  id: string;
  review_stage: number;
  next_review_at: string | null;
  is_completed: boolean;
  mastery_state: string | null;
  last_judgement: MasteryJudgement | null;
  reopened_count: number | null;
}

interface VariantEvidenceSummary {
  total_variants: number;
  practiced_variants: number;
  successful_variants: number;
  independent_success_variants: number;
  latest_practiced_at: string | null;
  qualified_transfer_evidence: boolean;
  missing_reason: string | null;
  evidence_label: string;
  status_label: string;
  coach_summary: string;
  parent_summary: string;
  next_step: string;
}

const subjectLabels: Record<string, string> = {
  chinese: '语文',
  english: '英语',
  math: '数学',
  physics: '物理',
  chemistry: '化学',
};

const statusLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  analyzing: {
    label: '分析中',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    icon: Clock,
  },
  guided_learning: {
    label: '学习中',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    icon: AlertCircle,
  },
  mastered: {
    label: '已掌握',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: CheckCircle,
  },
};

const VARIANT_PRACTICE_SUBJECTS = new Set(['math', 'physics', 'chemistry']);

function formatReviewDate(dateStr: string | null) {
  if (!dateStr) {
    return '待系统安排';
  }

  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
  });
}

export default function ErrorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [errorSession, setErrorSession] = useState<ErrorSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [startingReviewLoop, setStartingReviewLoop] = useState(false);
  const [reviewActionMessage, setReviewActionMessage] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState<ReviewSummary | null>(null);
  const [variantEvidence, setVariantEvidence] = useState<VariantEvidenceSummary | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showVariants, setShowVariants] = useState(false);

  const variantSectionRef = useRef<HTMLDivElement | null>(null);
  const chatSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace(`/login?redirect=/error-book/${resolvedParams.id}`);
    }
  }, [authLoading, resolvedParams.id, router, user]);

  useEffect(() => {
    void loadErrorDetail();
  }, [profile?.id, resolvedParams.id]);

  if (authLoading || (!user && !profile)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/30" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="text-muted-foreground">正在检查登录状态...</p>
        </div>
      </div>
    );
  }

  async function loadErrorDetail() {
    setLoading(true);
    const supabase = createClient();

    const { data: sessionData, error: sessionError } = await supabase
      .from('error_sessions')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (sessionError || !sessionData) {
      console.error('Failed to load error session:', sessionError);
      setLoading(false);
      return;
    }

    setErrorSession(sessionData as ErrorSession);

    const { data: reviewData } = await supabase
      .from('review_schedule')
      .select('id, review_stage, next_review_at, is_completed, mastery_state, last_judgement, reopened_count')
      .eq('session_id', resolvedParams.id)
      .maybeSingle();

    const resolvedReviewData = reviewData as ReviewSummary | null;
    setReviewId(resolvedReviewData?.id || null);
    setReviewSummary(resolvedReviewData || null);

    if (resolvedReviewData?.id && profile?.id) {
      try {
        const response = await fetch(
          `/api/review/attempt?review_id=${encodeURIComponent(resolvedReviewData.id)}`,
        );
        const payload = await response.json();

        if (response.ok) {
          setVariantEvidence(payload.variant_evidence || null);
        } else {
          setVariantEvidence(null);
        }
      } catch (error) {
        console.error('Failed to load variant evidence:', error);
        setVariantEvidence(null);
      }
    } else {
      setVariantEvidence(null);
    }

    const { data: messagesData } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', resolvedParams.id)
      .order('created_at', { ascending: true });

    setMessages((messagesData || []) as Message[]);
    setLoading(false);
  }

  async function handleExportPDF() {
    if (!errorSession) {
      return;
    }

    setExporting(true);
    try {
      await downloadErrorQuestionPDF({
        subject: errorSession.subject,
        createdAt: errorSession.created_at,
        studentName: profile?.display_name || undefined,
        ocrText: errorSession.extracted_text || undefined,
        imageUrl: errorSession.original_image_url || undefined,
        conceptTags: errorSession.concept_tags || undefined,
        difficultyRating: errorSession.difficulty_rating || undefined,
        messages: messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setExporting(false);
    }
  }

  function handleContinueLearning() {
    router.push(`/study/${errorSession?.subject || 'math'}/problem?session=${resolvedParams.id}`);
  }

  function handleOpenReview() {
    if (!reviewId) {
      return;
    }

    router.push(`/review/session/${reviewId}`);
  }

  function handleDiagnosisSaved(diagnosis: StructuredDiagnosis) {
    setErrorSession((current) =>
      current
        ? {
            ...current,
            primary_root_cause_category: diagnosis.root_cause_category,
            primary_root_cause_subtype: diagnosis.root_cause_subtype,
            primary_root_cause_statement: diagnosis.root_cause_statement,
            closure_state: 'open',
          }
        : current,
    );
  }

  async function handleStartReviewLoop() {
    if (!errorSession || !profile?.id) {
      return;
    }

    setStartingReviewLoop(true);
    setReviewActionMessage(null);

    try {
      const response = await fetch('/api/error-session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: errorSession.id,
          student_id: profile.id,
        }),
      });
      const data = await response.json();

      if (response.ok && data.success) {
        if (data.review_id) {
          setReviewId(data.review_id);
        }
        await loadErrorDetail();
        setReviewActionMessage('已加入复习，接下来可以通过复习和变式练习继续确认是否真的会了。');
      } else {
        setReviewActionMessage(data.error || '加入复习失败，请稍后再试。');
      }
    } catch (error) {
      console.error('Failed to start review loop:', error);
      setReviewActionMessage('网络异常，加入复习失败，请稍后再试。');
    } finally {
      setStartingReviewLoop(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="relative mx-auto h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-primary/30" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!errorSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-4 text-muted-foreground">这道错题不存在，或已经被删除。</p>
            <Button onClick={() => router.push('/error-book')}>返回错题本</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusLabels[errorSession.status]?.icon || Clock;
  const supportsVariantPractice = VARIANT_PRACTICE_SUBJECTS.has(errorSession.subject);
  const closureMeta = getClosureStateMeta(reviewSummary?.mastery_state || errorSession.closure_state);
  const canContinueLearning = errorSession.status !== 'mastered';
  const canOpenReview = Boolean(reviewId);
  const canJoinReview = errorSession.status === 'guided_learning' && !reviewId;
  const reviewActionLabel = reviewSummary?.is_completed ? '查看复盘' : '继续复习';
  const primaryActionLabel = canContinueLearning ? '继续学习' : canOpenReview ? reviewActionLabel : '复习中心';
  const primaryActionDescription = canContinueLearning
    ? '先把这道题继续推进，再决定是否进入复习。'
    : canOpenReview
      ? '这道题已经进入复习链路，下一步可以直接回到复习。'
      : '这道题当前没有新的学习动作，先回到复习中心看下一题。';

  function handlePrimaryAction() {
    if (canContinueLearning) {
      handleContinueLearning();
      return;
    }

    if (canOpenReview) {
      handleOpenReview();
      return;
    }

    router.push('/review');
  }

  function handleSecondaryAction() {
    if (canOpenReview) {
      handleOpenReview();
      return;
    }

    if (canJoinReview) {
      void handleStartReviewLoop();
    }
  }

  const fromWrapUp = searchParams.get('from') === 'wrap-up';

  function handleOpenVariantPractice() {
    setShowVariants(true);
    window.setTimeout(() => {
      variantSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-slate-950 dark:via-slate-900 dark:to-orange-950/30',
        profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior',
      )}
    >
      <div className="sticky top-0 z-10 border-b border-border/50 bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.push('/error-book')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回
            </Button>
            <div>
              <h1 className="text-lg font-semibold">错题详情</h1>
              <p className="text-sm text-muted-foreground">{formatDate(errorSession.created_at)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {reviewActionMessage ? (
              <span
                className={cn(
                  'rounded px-2 py-1 text-xs',
                  reviewActionMessage.includes('失败') || reviewActionMessage.includes('异常')
                    ? 'bg-red-50 text-red-600'
                    : reviewActionMessage.includes('已加入')
                      ? 'bg-green-50 text-green-600'
                      : 'text-muted-foreground',
                )}
              >
                {reviewActionMessage}
              </span>
            ) : null}
            {messages.length >= 3 && profile?.role === 'parent' ? (
              <Button size="sm" onClick={() => setShowAnalysis(true)} className="gap-2 bg-purple-500 text-white hover:bg-purple-600">
                <MessageCircle className="h-4 w-4" />
                AI 分析对话
              </Button>
            ) : null}
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting} className="gap-2">
              <Download className="h-4 w-4" />
              {exporting ? '导出中...' : '导出 PDF'}
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{subjectLabels[errorSession.subject] || errorSession.subject}</CardTitle>
                  <CardDescription>原题内容</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn('gap-1', statusLabels[errorSession.status]?.color)}>
                  <StatusIcon className="h-3 w-3" />
                  {statusLabels[errorSession.status]?.label}
                </Badge>
                {errorSession.difficulty_rating ? (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    {errorSession.difficulty_rating}
                  </div>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {errorSession.concept_tags && errorSession.concept_tags.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {errorSession.concept_tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            ) : null}

            {errorSession.original_image_url ? (
              <div className="overflow-hidden rounded-xl bg-muted">
                <img
                  src={errorSession.original_image_url}
                  alt="原题图片"
                  className="max-h-80 w-full object-contain"
                />
              </div>
            ) : null}

            {errorSession.extracted_text ? (
              <div className="rounded-xl border border-border/50 bg-muted/50 p-4">
                <p className="mb-2 text-xs text-muted-foreground">题目内容：</p>
                <p className="whitespace-pre-wrap text-sm">{errorSession.extracted_text}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="border-warm-200/60 bg-white/90">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-warm-500">Next Step</p>
              <h2 className="mt-2 text-xl font-semibold text-warm-900">{primaryActionLabel}</h2>
              <p className="mt-1 text-sm text-warm-700">{primaryActionDescription}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={handlePrimaryAction} className="gap-2 rounded-full bg-warm-500 text-white hover:bg-warm-600">
                {canContinueLearning ? <Play className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                {primaryActionLabel}
              </Button>
              {canContinueLearning && (canOpenReview || canJoinReview) ? (
                <Button
                  variant="outline"
                  onClick={handleSecondaryAction}
                  disabled={startingReviewLoop}
                  className="gap-2 rounded-full border-warm-200"
                >
                  {canOpenReview ? <BookOpen className="h-4 w-4" /> : <Target className="h-4 w-4" />}
                  {canOpenReview ? reviewActionLabel : startingReviewLoop ? '加入中...' : '加入复习'}
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {fromWrapUp ? (
          <Card className="border-emerald-200 bg-emerald-50/80">
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-600">Chat Closed</p>
                <h2 className="mt-2 text-xl font-semibold text-emerald-900">本次对话已经收口，当前错题已进入错题本</h2>
                <p className="mt-1 text-sm text-emerald-800">
                  你现在可以继续做变式练习，或者回看这次学习记录。提交到错题库后，这一轮对话就视为结束。
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {supportsVariantPractice ? (
                  <Button
                    onClick={handleOpenVariantPractice}
                    className="gap-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Sparkles className="h-4 w-4" />
                    先做变式练习
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="gap-2 rounded-full border-emerald-200"
                >
                  <MessageCircle className="h-4 w-4" />
                  查看本次记录
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-primary" />
              收口状态 / 复习进度
            </CardTitle>
            <CardDescription>{closureMeta.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={closureMeta.badgeClassName}>{closureMeta.label}</Badge>
              {reviewSummary?.last_judgement ? (
                <Badge variant="outline">上次判定：{MASTERY_JUDGEMENT_META[reviewSummary.last_judgement].label}</Badge>
              ) : null}
              {reviewSummary?.reopened_count ? <Badge variant="outline">复开 {reviewSummary.reopened_count} 次</Badge> : null}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 px-4 py-3">
                <p className="text-xs text-muted-foreground">当前收口状态</p>
                <p className="mt-1 text-sm font-medium">{closureMeta.label}</p>
              </div>
              <div className="rounded-2xl border border-border/60 px-4 py-3">
                <p className="text-xs text-muted-foreground">当前复习轮次</p>
                <p className="mt-1 text-sm font-medium">{reviewSummary ? `第 ${reviewSummary.review_stage} 轮` : '尚未进入复习'}</p>
              </div>
              <div className="rounded-2xl border border-border/60 px-4 py-3">
                <p className="text-xs text-muted-foreground">下一次复习</p>
                <p className="mt-1 text-sm font-medium">
                  {reviewSummary?.is_completed ? '已关题' : formatReviewDate(reviewSummary?.next_review_at || null)}
                </p>
              </div>
            </div>

            {supportsVariantPractice && reviewSummary ? (
              <div
                className={cn(
                  'rounded-2xl border px-4 py-4',
                  variantEvidence?.qualified_transfer_evidence ? 'border-emerald-200 bg-emerald-50/70' : 'border-amber-200 bg-amber-50/70',
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">独立迁移证据</p>
                  <Badge className={variantEvidence?.qualified_transfer_evidence ? 'bg-emerald-500' : 'bg-amber-500'}>
                    {variantEvidence?.status_label || '待生成迁移证据'}
                  </Badge>
                  {variantEvidence ? <Badge variant="outline">总题数 {variantEvidence.total_variants}</Badge> : null}
                  {variantEvidence ? <Badge variant="outline">已练 {variantEvidence.practiced_variants}</Badge> : null}
                  {variantEvidence ? (
                    <Badge variant="outline">独立通过 {variantEvidence.independent_success_variants}</Badge>
                  ) : null}
                </div>
                <p className="mt-3 text-sm text-foreground">
                  {variantEvidence?.coach_summary || '这题还没有形成可用于关题的独立迁移证据，先做变式练习再看是否真的会。'}
                </p>
                {variantEvidence?.missing_reason ? (
                  <p className="mt-2 text-sm text-muted-foreground">{variantEvidence.missing_reason}</p>
                ) : null}
                <p className="mt-2 text-sm text-muted-foreground">
                  {variantEvidence?.next_step || '先打开变式练习，补做至少一道能独立完成的新题。'}
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Button variant="outline" onClick={handleOpenVariantPractice} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    打开变式练习
                  </Button>
                  {reviewId ? (
                    <Button variant="ghost" onClick={handleOpenReview} className="gap-2">
                      <BookOpen className="h-4 w-4" />
                      去复习
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {profile?.role === 'student' && profile?.id ? (
          <DiagnosisPanel
            sessionId={errorSession.id}
            studentId={profile.id}
            subject={errorSession.subject}
            closureState={errorSession.closure_state}
            initialCategory={errorSession.primary_root_cause_category}
            initialSubtype={errorSession.primary_root_cause_subtype}
            initialStatement={errorSession.primary_root_cause_statement}
            onSaved={handleDiagnosisSaved}
          />
        ) : null}

        {profile?.role === 'student' && profile?.id ? (
          <GuidedReflectionPanel
            sessionId={errorSession.id}
            studentId={profile.id}
            subject={errorSession.subject}
            rootCauseCategory={errorSession.primary_root_cause_category}
            rootCauseSubtype={errorSession.primary_root_cause_subtype}
            rootCauseStatement={errorSession.primary_root_cause_statement}
          />
        ) : null}

        {profile?.role === 'student' && errorSession.extracted_text && supportsVariantPractice ? (
          <div ref={variantSectionRef}>
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                      <Sparkles className="h-5 w-5 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">变式练习</CardTitle>
                      <CardDescription>AI 会基于这道题生成同考点变式题，帮助你验证是否真的完成迁移。</CardDescription>
                    </div>
                  </div>
                  <Button variant={showVariants ? 'default' : 'outline'} onClick={() => setShowVariants((current) => !current)} className="gap-2">
                    <Sparkles className="h-4 w-4" />
                    {showVariants ? '收起' : '开始练习'}
                  </Button>
                </div>
              </CardHeader>
              {showVariants ? (
                <CardContent>
                  <VariantPracticePanel
                    sessionId={errorSession.id}
                    studentId={profile.id}
                    subject={errorSession.subject as 'math' | 'physics' | 'chemistry'}
                    originalText={errorSession.extracted_text}
                    conceptTags={errorSession.concept_tags || undefined}
                    geometryData={errorSession.geometry_data}
                    geometrySvg={errorSession.geometry_svg || null}
                  />
                </CardContent>
              ) : null}
            </Card>
          </div>
        ) : null}

        <div ref={chatSectionRef}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5 text-primary" />
                学习对话记录
                <Badge variant="outline" className="ml-2">
                  {messages.length} 条
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {messages.length === 0 ? (
                <div className="py-8 text-center">
                  <Bot className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                  <p className="text-muted-foreground">暂无对话记录</p>
                  <p className="mt-1 text-sm text-muted-foreground">点击“继续学习”可以回到原题继续对话。</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn('flex gap-3', message.role === 'user' ? 'flex-row-reverse' : 'flex-row')}
                    >
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                          message.role === 'user' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-primary/10',
                        )}
                      >
                        {message.role === 'user' ? (
                          <User className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Bot className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div
                        className={cn(
                          'max-w-[80%] rounded-2xl px-4 py-3',
                          message.role === 'user'
                            ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-100'
                            : 'bg-muted',
                        )}
                      >
                        <p className="whitespace-pre-wrap text-sm">{message.content}</p>
                        <p className="mt-2 text-xs text-muted-foreground">{formatDate(message.created_at)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <AnalysisDialog open={showAnalysis} onOpenChange={setShowAnalysis} sessionId={resolvedParams.id} />
    </div>
  );
}
