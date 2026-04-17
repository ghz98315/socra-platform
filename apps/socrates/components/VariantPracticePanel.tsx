'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Loader2,
  RefreshCw,
  Sparkles,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type {
  VariantDifficulty,
  VariantGeometryMode,
  VariantPracticeFeedback,
  VariantQuestion,
} from '@/lib/variant-questions/types';

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

interface VariantPracticePanelProps {
  sessionId: string;
  studentId: string;
  subject: 'math' | 'physics' | 'chemistry';
  originalText: string;
  conceptTags?: string[];
  geometryData?: unknown;
  geometrySvg?: string | null;
}

const difficultyConfig: Record<VariantDifficulty, { label: string; color: string }> = {
  easy: { label: '偏简单', color: 'text-green-600' },
  medium: { label: '中等', color: 'text-amber-600' },
  hard: { label: '偏难', color: 'text-red-600' },
};

const geometryModeConfig: Record<VariantGeometryMode, { label: string; description: string }> = {
  auto: {
    label: '自动判断',
    description: '系统根据题目判断更适合保留图形还是改变图形。',
  },
  preserve_figure: {
    label: '图形保持',
    description: '更适合先验证方法是否稳定，图形结构尽量不变。',
  },
  change_figure: {
    label: '图形变化',
    description: '更强调迁移，核心思路不变，但图形设置会变化。',
  },
};

const evaluationStrategyLabels: Record<string, string> = {
  exact: '完全匹配',
  assignment_rhs: '按等号右侧匹配',
  numeric: '按数值匹配',
  normalized_text: '按标准化文本匹配',
  unmatched: '未匹配',
};

const GEOMETRY_HINT_PATTERN =
  /[△▲▵三角形四边形平行四边形梯形菱形矩形正方形圆扇形弧切线直线射线线段中点垂线高线角平分线周长面积相似全等坐标点A点B点C点D点E点F点G点H点∠⊥∥圆心半径直径弦如图下图图中图形几何]/;

function hasGeometrySignals(input: string, geometryData?: unknown, geometrySvg?: string | null) {
  if (geometryData) {
    return true;
  }

  if (typeof geometrySvg === 'string' && geometrySvg.trim()) {
    return true;
  }

  return GEOMETRY_HINT_PATTERN.test(input.replace(/\s+/g, ''));
}

export function VariantPracticePanel({
  sessionId,
  studentId,
  subject,
  originalText,
  conceptTags = [],
  geometryData,
  geometrySvg,
}: VariantPracticePanelProps) {
  const [variants, setVariants] = useState<VariantQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<VariantDifficulty>('medium');
  const [selectedGeometryMode, setSelectedGeometryMode] = useState<VariantGeometryMode>('auto');
  const [activeVariant, setActiveVariant] = useState<VariantQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHints, setShowHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateWarning, setGenerateWarning] = useState<string | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<VariantPracticeFeedback | null>(null);
  const [variantSummary, setVariantSummary] = useState<VariantEvidenceSummary | null>(null);

  const supportsGeometryMode = subject === 'math' && hasGeometrySignals(originalText, geometryData, geometrySvg);

  useEffect(() => {
    void loadVariants();
  }, [sessionId, studentId]);

  async function loadVariants() {
    setLoading(true);
    try {
      const response = await fetch(`/api/variants?student_id=${studentId}&session_id=${sessionId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load variants');
      }

      setVariants(result.data || []);
      setVariantSummary(result.summary || null);
    } catch (error) {
      console.error('Failed to load variants:', error);
    } finally {
      setLoading(false);
    }
  }

  function resetPractice() {
    setActiveVariant(null);
    setUserAnswer('');
    setShowHints(0);
    setShowSolution(false);
    setSubmitted(false);
    setSubmitError(null);
    setSubmissionFeedback(null);
  }

  function openVariant(variant: VariantQuestion) {
    setActiveVariant(variant);
    setUserAnswer('');
    setShowHints(0);
    setShowSolution(false);
    setSubmitted(false);
    setSubmitError(null);
    setSubmissionFeedback(null);
  }

  async function generateVariants() {
    setGenerating(true);
    setGenerateError(null);
    setGenerateWarning(null);

    try {
      const response = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          student_id: studentId,
          subject,
          original_text: originalText,
          concept_tags: conceptTags,
          difficulty: selectedDifficulty,
          geometry_mode: supportsGeometryMode ? selectedGeometryMode : 'auto',
          count: 2,
          geometry_data: geometryData,
          geometry_svg: geometrySvg,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to generate variants');
      }

      if (typeof result.warning === 'string' && result.warning.trim()) {
        setGenerateWarning(result.warning);
      }

      await loadVariants();
    } catch (error) {
      console.error('Failed to generate variants:', error);
      setGenerateError(error instanceof Error ? error.message : '变式题生成失败，请稍后重试。');
    } finally {
      setGenerating(false);
    }
  }

  async function submitAnswer(variant: VariantQuestion) {
    if (!userAnswer.trim()) {
      setSubmitError('请先输入你的答案。');
      return;
    }

    setSubmitError(null);

    try {
      const response = await fetch('/api/variants/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: variant.id,
          student_id: studentId,
          student_answer: userAnswer,
          time_spent: 60,
          hints_used: showHints,
        }),
      });
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit answer');
      }

      setSubmitted(true);
      setSubmissionFeedback(result.practice_result || null);
      setVariantSummary(result.summary || null);

      if (result.data) {
        setVariants((current) => current.map((item) => (item.id === variant.id ? result.data : item)));
        setActiveVariant(result.data);
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setSubmitError(error instanceof Error ? error.message : '提交答案失败，请稍后重试。');
    }
  }

  function getVariantStatusBadge(variant: VariantQuestion) {
    switch (variant.status) {
      case 'mastered':
        return <Badge className="bg-emerald-500">已掌握</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">已完成</Badge>;
      case 'practicing':
        return <Badge className="bg-amber-500">练习中</Badge>;
      default:
        return <Badge variant="outline">待开始</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-warm-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-warm-500" />
            变式练习
          </CardTitle>
          <CardDescription>
            用两道新题验证这次理解是否稳定。系统会保留同一核心方法，但改变数值、条件或题目表述，避免只靠记忆原题答案。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-warm-700">难度</span>
              {(['easy', 'medium', 'hard'] as const).map((difficulty) => (
                <button
                  key={difficulty}
                  type="button"
                  onClick={() => setSelectedDifficulty(difficulty)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                    selectedDifficulty === difficulty ? 'bg-warm-500 text-white' : 'bg-warm-100/50 hover:bg-warm-100',
                  )}
                >
                  {difficultyConfig[difficulty].label}
                </button>
              ))}
            </div>
            <Button
              onClick={() => void generateVariants()}
              disabled={generating}
              className="gap-2 rounded-full bg-warm-500 hover:bg-warm-600"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              生成变式题
            </Button>
          </div>

          {supportsGeometryMode ? (
            <div className="space-y-2 rounded-2xl border border-warm-200/70 bg-warm-50/70 p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-warm-800">几何变式方式</span>
                <Badge variant="outline">仅几何题显示</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(geometryModeConfig) as VariantGeometryMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSelectedGeometryMode(mode)}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                      selectedGeometryMode === mode ? 'bg-warm-500 text-white' : 'bg-white text-warm-700 hover:bg-warm-100',
                    )}
                  >
                    {geometryModeConfig[mode].label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-warm-700">{geometryModeConfig[selectedGeometryMode].description}</p>
            </div>
          ) : null}

          {generateError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{generateError}</div>
          ) : null}

          {generateWarning ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              {generateWarning}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {variantSummary ? (
        <Card className="border-border/50 bg-slate-50/70">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={variantSummary.qualified_transfer_evidence ? 'bg-emerald-500' : 'bg-amber-500'}>
                {variantSummary.status_label}
              </Badge>
              <Badge variant="outline">总题数 {variantSummary.total_variants}</Badge>
              <Badge variant="outline">已练 {variantSummary.practiced_variants}</Badge>
              <Badge variant="outline">做对 {variantSummary.successful_variants}</Badge>
              <Badge variant="outline">独立通过 {variantSummary.independent_success_variants}</Badge>
            </div>
            <p className="text-sm text-slate-700">{variantSummary.coach_summary}</p>
            {variantSummary.missing_reason ? <p className="text-sm text-slate-500">{variantSummary.missing_reason}</p> : null}
            <p className="text-sm text-slate-600">{variantSummary.next_step}</p>
          </CardContent>
        </Card>
      ) : null}

      {variants.length > 0 ? (
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 font-semibold">
            <BookOpen className="h-4 w-4" />
            变式题目 ({variants.length})
          </h3>

          {variants.map((variant, index) => (
            <Card
              key={variant.id}
              className={cn('cursor-pointer border-warm-200 transition-all', activeVariant?.id === variant.id && 'ring-2 ring-warm-500')}
            >
              {activeVariant?.id === variant.id ? (
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">变式 {index + 1}</Badge>
                      <Badge className={cn('text-xs', difficultyConfig[variant.difficulty].color)}>
                        {difficultyConfig[variant.difficulty].label}
                      </Badge>
                      {getVariantStatusBadge(variant)}
                    </div>
                    <button type="button" onClick={resetPractice} className="text-sm text-warm-600 hover:text-warm-900">
                      收起
                    </button>
                  </div>

                  <div className="rounded-xl bg-warm-100/30 p-4">
                    <p className="whitespace-pre-wrap">{variant.question_text}</p>
                  </div>

                  {variant.concept_tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {variant.concept_tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {!submitted ? (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={() => setShowHints((current) => Math.min(current + 1, variant.hints.length))}
                        disabled={showHints >= variant.hints.length}
                        className="flex items-center gap-2 text-sm text-amber-700 hover:text-amber-800 disabled:opacity-50"
                      >
                        <Lightbulb className="h-4 w-4" />
                        {showHints >= variant.hints.length ? '提示已全部显示' : '查看下一条提示'}
                      </button>

                      {showHints > 0 ? (
                        <div className="space-y-2 pl-6">
                          {variant.hints.slice(0, showHints).map((hint, hintIndex) => (
                            <p key={`${variant.id}-hint-${hintIndex}`} className="text-sm text-warm-700">
                              提示 {hintIndex + 1}: {hint}
                            </p>
                          ))}
                        </div>
                      ) : null}

                      <div className="flex gap-2">
                        <Input
                          placeholder="输入你的答案"
                          value={userAnswer}
                          onChange={(event) => setUserAnswer(event.target.value)}
                          className="flex-1 border-warm-200"
                        />
                        <Button onClick={() => void submitAnswer(variant)} className="rounded-full bg-warm-500 hover:bg-warm-600">
                          提交答案
                        </Button>
                      </div>

                      {submitError ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div
                        className={cn(
                          'flex items-center gap-3 rounded-xl p-4',
                          submissionFeedback?.is_correct ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30',
                        )}
                      >
                        {submissionFeedback?.is_correct ? (
                          <>
                            <CheckCircle className="h-6 w-6 text-green-500" />
                            <div>
                              <p className="font-medium text-green-700 dark:text-green-400">
                                {submissionFeedback.independent_success ? '回答正确，而且是独立完成。' : '回答正确。'}
                              </p>
                              <p className="text-sm text-green-700 dark:text-green-400">{submissionFeedback.evidence_label}</p>
                              <p className="text-sm text-green-600 dark:text-green-500">参考答案：{variant.answer}</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <XCircle className="h-6 w-6 text-red-500" />
                            <div>
                              <p className="font-medium text-red-700 dark:text-red-400">这道变式还没有做对。</p>
                              <p className="text-sm text-red-700 dark:text-red-400">
                                你的答案：{userAnswer} | 参考答案：{variant.answer}
                              </p>
                              {submissionFeedback?.evidence_label ? (
                                <p className="text-sm text-red-700 dark:text-red-400">{submissionFeedback.evidence_label}</p>
                              ) : null}
                            </div>
                          </>
                        )}
                      </div>

                      {submissionFeedback ? (
                        <div className="rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                          <p>判定方式：{evaluationStrategyLabels[submissionFeedback.evaluation.strategy] || submissionFeedback.evaluation.strategy}</p>
                          <p className="mt-1">
                            已使用提示 {submissionFeedback.hints_used} 次。
                            {submissionFeedback.hints_used > 0
                              ? ' 这次算完成练习，但独立迁移证据会偏弱。'
                              : ' 这次更能作为独立迁移证据。'}
                          </p>
                        </div>
                      ) : null}

                      <div>
                        <button
                          type="button"
                          onClick={() => setShowSolution((current) => !current)}
                          className="flex items-center gap-2 text-sm font-medium"
                        >
                          {showSolution ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          {showSolution ? '收起解析' : '查看解析'}
                        </button>

                        {showSolution ? (
                          <div className="mt-2 rounded-xl bg-warm-100/30 p-4">
                            <p className="whitespace-pre-wrap text-sm">{variant.solution}</p>
                          </div>
                        ) : null}
                      </div>

                      <Button variant="outline" onClick={resetPractice} className="rounded-full">
                        返回题目列表
                      </Button>
                    </div>
                  )}
                </CardContent>
              ) : (
                <CardContent className="cursor-pointer p-4 transition-colors hover:bg-warm-100/30" onClick={() => openVariant(variant)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">变式 {index + 1}</Badge>
                      <span className={cn('text-xs', difficultyConfig[variant.difficulty].color)}>
                        {difficultyConfig[variant.difficulty].label}
                      </span>
                      {getVariantStatusBadge(variant)}
                    </div>
                    <ChevronDown className="h-4 w-4 text-warm-600" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-warm-700">{variant.question_text}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-warm-600">
          <BookOpen className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>还没有生成变式题。</p>
          <p className="text-sm">先选择难度，然后点击“生成变式题”，系统会生成可直接练习的新题。</p>
        </div>
      )}
    </div>
  );
}
