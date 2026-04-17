// =====================================================
// Project Socrates - Error Detail Page
// 閿欓璇︽儏椤碉細鏌ョ湅閿欓鐨勫畬鏁村璇濆巻鍙?// =====================================================

'use client';

/* eslint-disable react/no-unescaped-entities */

import { useState, useEffect, use, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Tag,
  Star,
  Download,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  Bot,
  User,
  MessageCircle,
  Sparkles,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { downloadErrorQuestionPDF } from '@/lib/pdf/ErrorQuestionPDF';
import { AnalysisDialog } from '@/components/AnalysisDialog';
import { VariantPracticePanel } from '@/components/VariantPracticePanel';
import { DiagnosisPanel } from '@/components/error-loop/DiagnosisPanel';
import { GuidedReflectionPanel } from '@/components/error-loop/GuidedReflectionPanel';
import type { RootCauseCategory, RootCauseSubtype, StructuredDiagnosis } from '@/lib/error-loop/taxonomy';
import { getClosureStateMeta, MASTERY_JUDGEMENT_META, type MasteryJudgement } from '@/lib/error-loop/review';

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
  chinese: '璇枃',
  english: '鑻辫',
  math: '鏁板',
  physics: '鐗╃悊',
  chemistry: '鍖栧',
};

const statusLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  analyzing: { label: '分析中', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  guided_learning: { label: '学习中', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: AlertCircle },
  mastered: { label: '已掌握', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
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
      return;
    }
  }, [authLoading, resolvedParams.id, router, user]);

  useEffect(() => {
    loadErrorDetail();
  }, [profile?.id, resolvedParams.id]);

  if (authLoading || (!user && !profile)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground">姝ｅ湪妫€鏌ョ櫥褰曠姸鎬?..</p>
        </div>
      </div>
    );
  }

  const loadErrorDetail = async () => {
    setLoading(true);
    const supabase = createClient();

    // 鍔犺浇閿欓淇℃伅
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
          `/api/review/attempt?review_id=${encodeURIComponent(resolvedReviewData.id)}&student_id=${encodeURIComponent(profile.id)}`,
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

    // 鍔犺浇瀵硅瘽鍘嗗彶
    const { data: messagesData } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', resolvedParams.id)
      .order('created_at', { ascending: true });

    setMessages((messagesData || []) as Message[]);
    setLoading(false);
  };

  const handleExportPDF = async () => {
    if (!errorSession) return;
    setExporting(true);

    try {
      await downloadErrorQuestionPDF({
        subject: errorSession.subject,
        createdAt: errorSession.created_at,
        studentName: profile?.display_name,
        ocrText: errorSession.extracted_text || undefined,
        imageUrl: errorSession.original_image_url || undefined,
        conceptTags: errorSession.concept_tags || undefined,
        difficultyRating: errorSession.difficulty_rating || undefined,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleContinueLearning = () => {
    router.push(`/study/${errorSession?.subject || 'math'}/problem?session=${resolvedParams.id}`);
  };

  const handleOpenReview = () => {
    if (!reviewId) return;
    router.push(`/review/session/${reviewId}`);
  };

  const handleDiagnosisSaved = (diagnosis: StructuredDiagnosis) => {
    setErrorSession((current) =>
      current
        ? {
            ...current,
            primary_root_cause_category: diagnosis.root_cause_category,
            primary_root_cause_subtype: diagnosis.root_cause_subtype,
            primary_root_cause_statement: diagnosis.root_cause_statement,
            closure_state: 'open',
          }
        : current
    );
  };

  const handleStartReviewLoop = async () => {
    if (!errorSession || !profile?.id) return;

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
        void loadErrorDetail();
        setReviewActionMessage('已加入复习，接下来继续通过复习和变式练习来确认是否真的会。');
      } else {
        setReviewActionMessage(data.error || '鎿嶄綔澶辫触锛岃閲嶈瘯');
      }
    } catch (error) {
      console.error('Failed to start review loop:', error);
      setReviewActionMessage('缃戠粶閿欒锛岃閲嶈瘯');
    } finally {
      setStartingReviewLoop(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground">鍔犺浇涓?..</p>
        </div>
      </div>
    );
  }

  if (!errorSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">閿欓涓嶅瓨鍦ㄦ垨宸茶鍒犻櫎</p>
            <Button onClick={() => router.push('/error-book')}>
              杩斿洖閿欓鏈?            </Button>
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
  const reviewActionLabel = reviewSummary?.is_completed ? '看复盘' : '继续复习';
  const primaryActionLabel = canContinueLearning ? '继续学习' : canOpenReview ? reviewActionLabel : '复习中心';
  const primaryActionDescription = canContinueLearning
    ? '先把这道题继续推进，再决定是否进入复习。'
    : canOpenReview
      ? '这道题已经进入复习链路，下一步直接回到复习。'
      : '这道题当前没有新的学习动作，先回到复习中心看下一题。';

  const handlePrimaryAction = () => {
    if (canContinueLearning) {
      handleContinueLearning();
      return;
    }

    if (canOpenReview) {
      handleOpenReview();
      return;
    }

    router.push('/review');
  };

  const handleSecondaryAction = () => {
    if (canOpenReview) {
      handleOpenReview();
      return;
    }

    if (canJoinReview) {
      void handleStartReviewLoop();
    }
  };

  const fromWrapUp = searchParams.get('from') === 'wrap-up';

  const handleOpenVariantPractice = () => {
    setShowVariants(true);
    window.setTimeout(() => {
      variantSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-slate-950 dark:via-slate-900 dark:to-orange-950/30",
      profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior'
    )}>
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/error-book')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                杩斿洖
              </Button>
              <div>
                <h1 className="text-lg font-semibold">閿欓璇︽儏</h1>
                <p className="text-sm text-muted-foreground">
                  {formatDate(errorSession.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {reviewActionMessage && (
                <span className={cn(
                  "text-xs px-2 py-1 rounded",
                  reviewActionMessage.includes('澶辫触') || reviewActionMessage.includes('閿欒') ? "text-red-600 bg-red-50" :
                  reviewActionMessage.includes('已加入') ? "text-green-600 bg-green-50" :
                  "text-muted-foreground"
                )}>
                  {reviewActionMessage}
                </span>
              )}
              {messages.length >= 3 && profile?.role === 'parent' && (
                <Button
                  size="sm"
                  onClick={() => setShowAnalysis(true)}
                  className="gap-2 bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <MessageCircle className="w-4 h-4" />
                  AI鍒嗘瀽瀵硅瘽
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={exporting}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                {exporting ? '瀵煎嚭涓?..' : '瀵煎嚭PDF'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 閿欓淇℃伅鍗＄墖 */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {subjectLabels[errorSession.subject] || errorSession.subject}
                  </CardTitle>
                  <CardDescription>閿欓鍐呭</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn('gap-1', statusLabels[errorSession.status]?.color)}>
                  <StatusIcon className="w-3 h-3" />
                  {statusLabels[errorSession.status]?.label}
                </Badge>
                {errorSession.difficulty_rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {errorSession.difficulty_rating}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 鏍囩 */}
            {errorSession.concept_tags && errorSession.concept_tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {errorSession.concept_tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* 鍥剧墖 */}
            {errorSession.original_image_url && (
              <div className="rounded-xl overflow-hidden bg-muted">
                <img
                  src={errorSession.original_image_url}
                  alt="閿欓鍥剧墖"
                  className="w-full max-h-80 object-contain"
                />
              </div>
            )}

            {/* 璇嗗埆鏂囨湰 */}
            {errorSession.extracted_text && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">题目内容：</p>
                <p className="text-sm whitespace-pre-wrap">{errorSession.extracted_text}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 瀵硅瘽鍘嗗彶 */}
        <Card className="border-warm-200/60 bg-white/90">
          <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-warm-500">Next Step</p>
              <h2 className="mt-2 text-xl font-semibold text-warm-900">{primaryActionLabel}</h2>
              <p className="mt-1 text-sm text-warm-700">{primaryActionDescription}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={handlePrimaryAction} className="gap-2 rounded-full bg-warm-500 text-white hover:bg-warm-600">
                {canContinueLearning ? <Play className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                {primaryActionLabel}
              </Button>
              {(canContinueLearning && (canOpenReview || canJoinReview)) ? (
                <Button
                  variant="outline"
                  onClick={handleSecondaryAction}
                  disabled={startingReviewLoop}
                  className="gap-2 rounded-full border-warm-200"
                >
                  {canOpenReview ? <BookOpen className="w-4 h-4" /> : <Target className="w-4 h-4" />}
                  {canOpenReview ? reviewActionLabel : startingReviewLoop ? '鍔犲叆涓?..' : '鍔犲叆澶嶄範'}
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
                <h2 className="mt-2 text-xl font-semibold text-emerald-900">鏈瀵硅瘽宸叉敹鍙ｏ紝宸茶繘鍏ラ敊棰樺簱澶嶇洏</h2>
                <p className="mt-1 text-sm text-emerald-800">
                  杩欐鑱婂ぉ宸茬粡缁撴潫銆傚缓璁厛鍋氬彉寮忕粌涔狅紝鍐嶇粨鍚堜笅鏂瑰璇濊褰曞洖鐪嬭嚜宸辨槸鎬庝箞鍗′綇鐨勩€?                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                {supportsVariantPractice ? (
                  <Button
                    onClick={handleOpenVariantPractice}
                    className="gap-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    <Sparkles className="w-4 h-4" />
                    鍏堝仛鍙樺紡缁冧範
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className="gap-2 rounded-full border-emerald-200"
                >
                  <MessageCircle className="w-4 h-4" />
                  鏌ョ湅鏈璁板綍
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              鐪熶細 / 鍋囦細闂幆鐘舵€?            </CardTitle>
            <CardDescription>{closureMeta.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={closureMeta.badgeClassName}>{closureMeta.label}</Badge>
              {reviewSummary?.last_judgement ? (
                <Badge variant="outline">
                  涓婃鍒ゅ畾: {MASTERY_JUDGEMENT_META[reviewSummary.last_judgement].label}
                </Badge>
              ) : null}
              {reviewSummary?.reopened_count ? (
                <Badge variant="outline">复开 {reviewSummary.reopened_count} 次</Badge>
              ) : null}
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-border/60 px-4 py-3">
                <p className="text-xs text-muted-foreground">褰撳墠闂幆</p>
                <p className="mt-1 text-sm font-medium">{closureMeta.label}</p>
              </div>
              <div className="rounded-2xl border border-border/60 px-4 py-3">
                <p className="text-xs text-muted-foreground">褰撳墠杞</p>
                <p className="mt-1 text-sm font-medium">
                  {reviewSummary ? `第 ${reviewSummary.review_stage} 轮` : '尚未进入复习'}
                </p>
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
                  variantEvidence?.qualified_transfer_evidence
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-amber-200 bg-amber-50/70',
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">鐙珛杩佺Щ璇佹嵁</p>
                  <Badge
                    className={
                      variantEvidence?.qualified_transfer_evidence ? 'bg-emerald-500' : 'bg-amber-500'
                    }
                  >
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
                    <Sparkles className="w-4 h-4" />
                    鎵撳紑鍙樺紡缁冧範
                  </Button>
                  {reviewId ? (
                    <Button variant="ghost" onClick={handleOpenReview} className="gap-2">
                      <BookOpen className="w-4 h-4" />
                      鍘诲涔?                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {profile?.role === 'student' && profile?.id && (
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
        )}

        {profile?.role === 'student' && profile?.id && (
          <GuidedReflectionPanel
            sessionId={errorSession.id}
            studentId={profile.id}
            subject={errorSession.subject}
            rootCauseCategory={errorSession.primary_root_cause_category}
            rootCauseSubtype={errorSession.primary_root_cause_subtype}
            rootCauseStatement={errorSession.primary_root_cause_statement}
          />
        )}

        {/* 閸欐ê绱＄紒鍐х瘎閸忋儱褰?*/}
        {profile?.role === 'student' && errorSession.extracted_text && supportsVariantPractice && (
          <div ref={variantSectionRef}>
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">閸欐ê绱＄紒鍐х瘎</CardTitle>
                      <CardDescription>AI 閺嶈宓佹潻娆撲壕妫版鏁撻幋鎰祲娴艰偐绮屾稊鐘活暯閿涘奔濡囨稉鈧崣宥勭瑏</CardDescription>
                    </div>
                  </div>
                  <Button
                    variant={showVariants ? 'default' : 'outline'}
                    onClick={() => setShowVariants(!showVariants)}
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    {showVariants ? '收起' : '开始练习'}
                  </Button>
                </div>
              </CardHeader>
              {showVariants && (
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
              )}
            </Card>
          </div>
        )}

        <div ref={chatSectionRef}>
          <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              瀛︿範瀵硅瘽璁板綍
              <Badge variant="outline" className="ml-2">
                {messages.length} 鏉?              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">鏆傛棤瀵硅瘽璁板綍</p>
                <p className="text-sm text-muted-foreground mt-1">鐐瑰嚮"缁х画瀛︿範"寮€濮婣I瀵硅瘽</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      message.role === 'user'
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-primary/10"
                    )}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Bot className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === 'user'
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                        : "bg-muted"
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          </Card>
        </div>


        {/* 搴曢儴鎿嶄綔鏍?*/}
        <div className="hidden">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              鍒涘缓浜?{formatDate(errorSession.created_at)}
            </div>
            <div className="flex items-center gap-2">
              {messages.length >= 3 && profile?.role === 'parent' && (
                <Button
                  variant="outline"
                  onClick={() => setShowAnalysis(true)}
                  className="gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  AI鍒嗘瀽
                </Button>
              )}
              {reviewId && (
                <Button variant="outline" onClick={handleOpenReview} className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  缁х画澶嶄範
                </Button>
              )}
              <Button onClick={handleContinueLearning} className="gap-2">
                <Play className="w-4 h-4" />
                缁х画瀛︿範
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* AI鍒嗘瀽寮圭獥 */}
      <AnalysisDialog
        open={showAnalysis}
        onOpenChange={setShowAnalysis}
        sessionId={resolvedParams.id}
      />
    </div>
  );
}
