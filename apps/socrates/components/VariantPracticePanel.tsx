'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { GeometryRenderer, type GeometryData } from '@/components/GeometryRenderer';
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

const difficultyConfig: Record<VariantDifficulty, { label: string; textClassName: string }> = {
  easy: { label: '基础版', textClassName: 'text-emerald-600' },
  medium: { label: '标准版', textClassName: 'text-amber-600' },
  hard: { label: '提升版', textClassName: 'text-rose-600' },
};

const geometryModeConfig: Record<VariantGeometryMode, { label: string; description: string }> = {
  auto: {
    label: '自动判断',
    description: '由系统根据原题内容自动决定是否保留原图，适合大多数情况。',
  },
  preserve_figure: {
    label: '保留原图',
    description: '尽量沿用当前图形，只改条件、数据或设问，适合做同图迁移训练。',
  },
  change_figure: {
    label: '更换图形',
    description: '在同考点下尝试替换图形结构，适合检验是否真正完成迁移。',
  },
};

const evaluationStrategyLabels: Record<string, string> = {
  exact: '完全匹配',
  assignment_rhs: '等式右侧匹配',
  numeric: '数值匹配',
  normalized_text: '文本标准化匹配',
  unmatched: '未命中自动判定规则',
};

const GEOMETRY_HINT_PATTERN =
  /(?:三角形|四边形|平行四边形|梯形|菱形|矩形|正方形|圆|弧|切线|垂线|平行|相似|全等|角平分线|中点|高|中线|半径|直径|圆心|坐标|抛物线|几何|△|∠|⊥|∥)/u;

const API_TIMEOUT_MS = 12000;
const GENERATE_TIMEOUT_MS = 45000;
const VARIANT_GEOMETRY_TIMEOUT_MS = 20000;

type VariantGeometryState = {
  status: 'idle' | 'loading' | 'ready' | 'error';
  data: GeometryData | null;
  message?: string | null;
};

function hasGeometrySignals(input: string, geometryData?: unknown, geometrySvg?: string | null) {
  if (geometryData) {
    return true;
  }

  if (typeof geometrySvg === 'string' && geometrySvg.trim()) {
    return true;
  }

  return GEOMETRY_HINT_PATTERN.test(input.replace(/\s+/g, ''));
}

function mergeVariants(current: VariantQuestion[], incoming: VariantQuestion[]) {
  if (incoming.length === 0) {
    return current;
  }

  const incomingIds = new Set(incoming.map((item) => item.id));
  return [...incoming, ...current.filter((item) => !incomingIds.has(item.id))];
}

function isGeometryData(value: unknown): value is GeometryData {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Partial<GeometryData>;
  return (
    typeof candidate.type === 'string' &&
    Array.isArray(candidate.points) &&
    Array.isArray(candidate.lines) &&
    Array.isArray(candidate.circles) &&
    Array.isArray(candidate.curves) &&
    Array.isArray(candidate.angles) &&
    Array.isArray(candidate.labels) &&
    Array.isArray(candidate.relations)
  );
}

function hasRenderableGeometry(data: GeometryData | null) {
  if (!data || data.type === 'unknown') {
    return false;
  }

  return (
    data.points.length > 0 ||
    data.lines.length > 0 ||
    data.circles.length > 0 ||
    data.curves.length > 0 ||
    data.angles.length > 0
  );
}

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit, timeoutMs = API_TIMEOUT_MS) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function readApiPayload(response: Response, nonJsonMessage: string) {
  const raw = await response.text();

  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    const contentType = response.headers.get('content-type') || '';
    const looksLikeHtml = raw.trimStart().startsWith('<') || contentType.includes('text/html');
    throw new Error(looksLikeHtml ? nonJsonMessage : '接口返回的数据格式不正确，请稍后重试。');
  }
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
  const [submittingVariantId, setSubmittingVariantId] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<VariantDifficulty>('medium');
  const [selectedGeometryMode, setSelectedGeometryMode] = useState<VariantGeometryMode>('auto');
  const [activeVariantId, setActiveVariantId] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHints, setShowHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generateWarning, setGenerateWarning] = useState<string | null>(null);
  const [submissionFeedback, setSubmissionFeedback] = useState<VariantPracticeFeedback | null>(null);
  const [variantSummary, setVariantSummary] = useState<VariantEvidenceSummary | null>(null);
  const [variantGeometryMap, setVariantGeometryMap] = useState<Record<string, VariantGeometryState>>({});

  const supportsGeometryMode = subject === 'math' && hasGeometrySignals(originalText, geometryData, geometrySvg);
  const originalGeometry = isGeometryData(geometryData) ? geometryData : null;
  const activeVariant = useMemo(
    () => variants.find((variant) => variant.id === activeVariantId) || null,
    [activeVariantId, variants],
  );
  const activeVariantGeometry = activeVariant ? variantGeometryMap[activeVariant.id] || null : null;
  const showOriginalSvgFallback =
    Boolean(activeVariant) &&
    !hasRenderableGeometry(activeVariantGeometry?.data || null) &&
    selectedGeometryMode !== 'change_figure' &&
    typeof geometrySvg === 'string' &&
    geometrySvg.trim().length > 0;

  useEffect(() => {
    void loadVariants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, studentId]);

  useEffect(() => {
    if (!supportsGeometryMode || !activeVariant) {
      return;
    }

    const existingState = variantGeometryMap[activeVariant.id];
    if (existingState && (existingState.status === 'loading' || existingState.status === 'ready')) {
      return;
    }

    void ensureVariantGeometry(activeVariant);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeVariant, supportsGeometryMode]);

  useEffect(() => {
    setVariantGeometryMap((current) => {
      let changed = false;
      const next = { ...current };

      for (const variant of variants) {
        if (next[variant.id]) {
          continue;
        }

        if (isGeometryData(variant.geometry_data) && hasRenderableGeometry(variant.geometry_data)) {
          next[variant.id] = {
            status: 'ready',
            data: variant.geometry_data,
            message: null,
          };
          changed = true;
        }
      }

      return changed ? next : current;
    });
  }, [variants]);

  function resetPracticeState() {
    setUserAnswer('');
    setShowHints(0);
    setShowSolution(false);
    setSubmitted(false);
    setSubmitError(null);
    setSubmissionFeedback(null);
    setSubmittingVariantId(null);
  }

  function resetCurrentVariant() {
    setActiveVariantId(null);
    resetPracticeState();
  }

  function openVariant(variantId: string) {
    setActiveVariantId(variantId);
    resetPracticeState();
  }

  async function loadVariants(background = false) {
    if (!background) {
      setLoading(true);
      setLoadError(null);
    }

    try {
      const response = await fetchWithTimeout(
        `/api/variants?student_id=${encodeURIComponent(studentId)}&session_id=${encodeURIComponent(sessionId)}`,
      );
      const result = await readApiPayload(
        response,
        '变式列表接口返回了非 JSON 响应，通常表示线上服务报错或当前部署还没有更新完成。请稍后重试。',
      );

      if (!response.ok) {
        throw new Error(result.error || '加载变式题失败，请稍后重试。');
      }

      const nextVariants = Array.isArray(result.data) ? (result.data as VariantQuestion[]) : [];
      setVariants(nextVariants);
      setVariantSummary(result.summary || null);

      if (activeVariantId && !nextVariants.some((variant) => variant.id === activeVariantId)) {
        setActiveVariantId(null);
        resetPracticeState();
      }
    } catch (error) {
      console.error('Failed to load variants:', error);
      if (!background) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          setLoadError('加载变式题超时，请稍后重试。');
        } else {
          setLoadError(error instanceof Error ? error.message : '加载变式题失败，请稍后重试。');
        }
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }

  async function generateVariants() {
    setGenerating(true);
    setGenerateError(null);
    setGenerateWarning(null);
    setLoadError(null);

    try {
      const response = await fetchWithTimeout(
        '/api/variants',
        {
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
            count: 1,
            geometry_data: geometryData,
            geometry_svg: geometrySvg,
          }),
        },
        GENERATE_TIMEOUT_MS,
      );
      const result = await readApiPayload(
        response,
        '变式接口返回了非 JSON 响应，通常表示线上服务报错或当前部署还没有更新完成。请稍后重试。',
      );

      if (!response.ok || !result.success) {
        throw new Error(result.error || '生成变式题失败，请稍后重试。');
      }

      const newVariants = Array.isArray(result.data) ? (result.data as VariantQuestion[]) : [];
      if (typeof result.warning === 'string' && result.warning.trim()) {
        setGenerateWarning(result.warning);
      }

      if (newVariants.length > 0) {
        setVariants((current) => mergeVariants(current, newVariants));
        openVariant(newVariants[0].id);
      }

      if (result.summary) {
        setVariantSummary(result.summary as VariantEvidenceSummary);
      }

      void loadVariants(true);
    } catch (error) {
      console.error('Failed to generate variants:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        setGenerateError('生成变式题超时。几何题或较复杂题目可能需要更久，请稍后重试。');
      } else {
        setGenerateError(error instanceof Error ? error.message : '生成变式题失败，请稍后重试。');
      }
    } finally {
      setGenerating(false);
    }
  }

  async function submitAnswer(variant: VariantQuestion) {
    if (!userAnswer.trim()) {
      setSubmitError('请先输入你的答案，再提交。');
      return;
    }

    setSubmittingVariantId(variant.id);
    setSubmitError(null);

    try {
      const response = await fetchWithTimeout('/api/variants/submit', {
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
      const result = await readApiPayload(
        response,
        '提交变式答案时服务返回了非 JSON 响应，请稍后重试。',
      );

      if (!response.ok || !result.success) {
        throw new Error(result.error || '提交答案失败，请稍后重试。');
      }

      setSubmitted(true);
      setSubmissionFeedback(result.practice_result || null);
      setVariantSummary(result.summary || null);

      if (result.data) {
        setVariants((current) =>
          current.map((item) => (item.id === variant.id ? (result.data as VariantQuestion) : item)),
        );
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        setSubmitError('提交答案超时，请稍后重试。');
      } else {
        setSubmitError(error instanceof Error ? error.message : '提交答案失败，请稍后重试。');
      }
    } finally {
      setSubmittingVariantId(null);
    }
  }

  async function ensureVariantGeometry(variant: VariantQuestion) {
    if (!supportsGeometryMode) {
      return;
    }

    setVariantGeometryMap((current) => ({
      ...current,
      [variant.id]: {
        status: 'loading',
        data: current[variant.id]?.data || null,
        message: null,
      },
    }));

    try {
      const response = await fetchWithTimeout(
        '/api/geometry',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: variant.question_text,
            subject,
          }),
        },
        VARIANT_GEOMETRY_TIMEOUT_MS,
      );
      const result = await readApiPayload(
        response,
        '变式图形解析接口返回了非 JSON 响应，请稍后重试。',
      );

      if (response.ok && result.success && isGeometryData(result.geometry) && hasRenderableGeometry(result.geometry)) {
        setVariantGeometryMap((current) => ({
          ...current,
          [variant.id]: {
            status: 'ready',
            data: result.geometry,
            message: '已按当前变式题干重新生成图形。',
          },
        }));
        return;
      }

      if (selectedGeometryMode !== 'change_figure' && hasRenderableGeometry(originalGeometry)) {
        setVariantGeometryMap((current) => ({
          ...current,
          [variant.id]: {
            status: 'ready',
            data: originalGeometry,
            message: '当前显示原题图形。若你选择了“更换图形”，请重新生成一次后再查看。',
          },
        }));
        return;
      }

      setVariantGeometryMap((current) => ({
        ...current,
        [variant.id]: {
          status: 'error',
          data: null,
          message: '这道变式题暂时没有生成可展示的图形。',
        },
      }));
    } catch (error) {
      console.error('Failed to parse variant geometry:', error);
      if (selectedGeometryMode !== 'change_figure' && hasRenderableGeometry(originalGeometry)) {
        setVariantGeometryMap((current) => ({
          ...current,
          [variant.id]: {
            status: 'ready',
            data: originalGeometry,
            message: '变式图形暂未重绘，当前先展示原题图形。',
          },
        }));
        return;
      }

      setVariantGeometryMap((current) => ({
        ...current,
        [variant.id]: {
          status: 'error',
          data: null,
          message:
            error instanceof DOMException && error.name === 'AbortError'
              ? '变式图形解析超时，请稍后重试。'
              : '变式图形解析失败，请稍后重试。',
        },
      }));
    }
  }

  function getVariantStatusBadge(variant: VariantQuestion) {
    switch (variant.status) {
      case 'mastered':
        return <Badge className="bg-emerald-500">已掌握</Badge>;
      case 'completed':
        return <Badge className="bg-sky-500">已完成</Badge>;
      case 'practicing':
        return <Badge className="bg-amber-500">练习中</Badge>;
      default:
        return <Badge variant="outline">待练习</Badge>;
    }
  }

  if (loading && variants.length === 0) {
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
            当前改为每次先稳定生成 1 道，支持连续重复生成。生成成功后会立即加入当前列表，后台再静默同步最新状态。
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
              {variants.length > 0 ? '重新生成变式题' : '生成变式题'}
            </Button>

            <Badge variant="outline">每次 1 道，可重复生成</Badge>
          </div>

          {supportsGeometryMode ? (
            <div className="space-y-3 rounded-2xl border border-warm-200/70 bg-warm-50/70 p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-warm-800">几何题图形处理方式</span>
                <Badge variant="outline">可切换后再次生成</Badge>
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

          {loadError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{loadError}</div>
          ) : null}

          {generateError ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {generateError}
            </div>
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
              <Badge variant="outline">总变式 {variantSummary.total_variants}</Badge>
              <Badge variant="outline">已练习 {variantSummary.practiced_variants}</Badge>
              <Badge variant="outline">答对 {variantSummary.successful_variants}</Badge>
              <Badge variant="outline">独立答对 {variantSummary.independent_success_variants}</Badge>
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
            变式题列表（{variants.length}）
          </h3>

          {variants.map((variant, index) => {
            const isActive = activeVariant?.id === variant.id;
            const isSubmitting = submittingVariantId === variant.id;

            return (
              <Card
                key={variant.id}
                className={cn('border-warm-200 transition-all', isActive && 'ring-2 ring-warm-500')}
              >
                {isActive ? (
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">变式 {index + 1}</Badge>
                        <Badge className={cn('bg-transparent text-xs', difficultyConfig[variant.difficulty].textClassName)}>
                          {difficultyConfig[variant.difficulty].label}
                        </Badge>
                        {getVariantStatusBadge(variant)}
                      </div>

                      <button
                        type="button"
                        onClick={resetCurrentVariant}
                        className="text-sm text-warm-600 transition-colors hover:text-warm-900"
                      >
                        收起
                      </button>
                    </div>

                    <div className="rounded-xl bg-warm-100/30 p-4">
                      <p className="whitespace-pre-wrap">{variant.question_text}</p>
                    </div>

                    {supportsGeometryMode ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-slate-900">变式图形</p>
                            <p className="text-xs text-slate-500">
                              {activeVariantGeometry?.message || '打开变式后会自动解析并展示对应图形。'}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void ensureVariantGeometry(variant)}
                            disabled={activeVariantGeometry?.status === 'loading'}
                          >
                            {activeVariantGeometry?.status === 'loading' ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              '重新解析图形'
                            )}
                          </Button>
                        </div>

                        {activeVariantGeometry?.status === 'loading' ? (
                          <div className="rounded-xl border border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500">
                            正在解析这道变式题的图形...
                          </div>
                        ) : null}

                        {hasRenderableGeometry(activeVariantGeometry?.data || null) ? (
                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <GeometryRenderer geometryData={activeVariantGeometry?.data || null} size={360} />
                          </div>
                        ) : null}

                        {showOriginalSvgFallback ? (
                          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <div
                              className="max-h-[360px] overflow-auto p-3 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-h-[320px] [&_svg]:w-full [&_svg]:max-w-full"
                              dangerouslySetInnerHTML={{ __html: geometrySvg || '' }}
                            />
                          </div>
                        ) : null}

                        {activeVariantGeometry?.status === 'error' ? (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            {activeVariantGeometry.message}
                          </div>
                        ) : null}
                      </div>
                    ) : null}

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
                          {showHints >= variant.hints.length ? '已展示全部提示' : '查看下一条提示'}
                        </button>

                        {showHints > 0 ? (
                          <div className="space-y-2 pl-6">
                            {variant.hints.slice(0, showHints).map((hint, hintIndex) => (
                              <p key={`${variant.id}-hint-${hintIndex}`} className="text-sm text-warm-700">
                                提示 {hintIndex + 1}：{hint}
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
                          <Button
                            onClick={() => void submitAnswer(variant)}
                            disabled={isSubmitting}
                            className="rounded-full bg-warm-500 hover:bg-warm-600"
                          >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '提交答案'}
                          </Button>
                        </div>

                        {submitError ? (
                          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {submitError}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div
                          className={cn(
                            'flex items-center gap-3 rounded-xl p-4',
                            submissionFeedback?.is_correct ? 'bg-green-100' : 'bg-red-100',
                          )}
                        >
                          {submissionFeedback?.is_correct ? (
                            <>
                              <CheckCircle className="h-6 w-6 text-green-500" />
                              <div>
                                <p className="font-medium text-green-700">
                                  {submissionFeedback.independent_success ? '独立作答正确' : '答案正确'}
                                </p>
                                <p className="text-sm text-green-700">{submissionFeedback.evidence_label}</p>
                                <p className="text-sm text-green-600">标准答案：{variant.answer}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <XCircle className="h-6 w-6 text-red-500" />
                              <div>
                                <p className="font-medium text-red-700">这道变式题还没有答对</p>
                                <p className="text-sm text-red-700">
                                  你的答案：{userAnswer}｜标准答案：{variant.answer}
                                </p>
                                {submissionFeedback?.evidence_label ? (
                                  <p className="text-sm text-red-700">{submissionFeedback.evidence_label}</p>
                                ) : null}
                              </div>
                            </>
                          )}
                        </div>

                        {submissionFeedback ? (
                          <div className="rounded-xl border border-border/60 bg-background/70 px-4 py-3 text-sm text-muted-foreground">
                            <p>
                              判定方式：
                              {evaluationStrategyLabels[submissionFeedback.evaluation.strategy] ||
                                submissionFeedback.evaluation.strategy}
                            </p>
                            <p className="mt-1">
                              本次使用提示 {submissionFeedback.hints_used} 次。
                              {submissionFeedback.hints_used > 0
                                ? ' 本次答对不计入独立迁移证据。'
                                : ' 本次作答可计入独立迁移证据。'}
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

                        <Button variant="outline" onClick={resetCurrentVariant} className="rounded-full">
                          返回变式列表
                        </Button>
                      </div>
                    )}
                  </CardContent>
                ) : (
                  <CardContent
                    className="cursor-pointer p-4 transition-colors hover:bg-warm-100/30"
                    onClick={() => openVariant(variant.id)}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <Badge variant="outline">变式 {index + 1}</Badge>
                        <span className={cn('text-xs', difficultyConfig[variant.difficulty].textClassName)}>
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
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-warm-600">
          <BookOpen className="mx-auto mb-3 h-12 w-12 opacity-50" />
          <p>当前还没有生成变式题。</p>
          <p className="text-sm">可以先选择难度，再点击“生成变式题”；之后也可以切换图形方式继续重新生成。</p>
        </div>
      )}
    </div>
  );
}
