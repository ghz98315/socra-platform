'use client';

import { useDeferredValue, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  RefreshCw,
  Search,
  Star,
  Tag,
  Trash2,
} from 'lucide-react';

import { PageHeader } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getClosureStateMeta, MASTERY_JUDGEMENT_META, type MasteryJudgement } from '@/lib/error-loop/review';
import { downloadErrorBookPDF } from '@/lib/pdf/ErrorBookPDF';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

type ErrorSession = {
  id: string;
  student_id: string;
  subject: 'math' | 'chinese' | 'english' | 'physics' | 'chemistry';
  original_image_url: string | null;
  extracted_text: string | null;
  status: 'analyzing' | 'guided_learning' | 'mastered';
  closure_state: string | null;
  difficulty_rating: number | null;
  concept_tags: string[] | null;
  created_at: string;
};

type ReviewSessionMeta = {
  mastery_state: string | null;
  last_judgement: MasteryJudgement | null;
  reopened_count: number;
};

type ErrorBookStats = {
  total: number;
  analyzing: number;
  guided_learning: number;
  mastered: number;
};

const PAGE_SIZE = 24;

const SUBJECT_LABELS: Record<ErrorSession['subject'], string> = {
  chinese: '语文',
  english: '英语',
  math: '数学',
  physics: '物理',
  chemistry: '化学',
};

const STATUS_META: Record<
  ErrorSession['status'],
  { label: string; color: string; icon: React.ElementType }
> = {
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

const SUBJECT_ACCENT: Record<ErrorSession['subject'], string> = {
  chinese: 'text-rose-500',
  english: 'text-amber-500',
  math: 'text-blue-500',
  physics: 'text-purple-500',
  chemistry: 'text-green-500',
};

const SUBJECT_BORDER: Record<ErrorSession['subject'], string> = {
  chinese: 'border-l-rose-500',
  english: 'border-l-amber-500',
  math: 'border-l-blue-500',
  physics: 'border-l-purple-500',
  chemistry: 'border-l-green-500',
};

const SUBJECT_BG: Record<ErrorSession['subject'], string> = {
  chinese: 'bg-rose-50 dark:bg-rose-950/30',
  english: 'bg-amber-50 dark:bg-amber-950/30',
  math: 'bg-blue-50 dark:bg-blue-950/30',
  physics: 'bg-purple-50 dark:bg-purple-950/30',
  chemistry: 'bg-green-50 dark:bg-green-950/30',
};

export default function ErrorBookPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [errors, setErrors] = useState<ErrorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'difficulty'>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [reviewSessionMap, setReviewSessionMap] = useState<Record<string, string>>({});
  const [reviewSessionMetaMap, setReviewSessionMetaMap] = useState<Record<string, ReviewSessionMeta>>({});
  const [addingToReview, setAddingToReview] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [stats, setStats] = useState<ErrorBookStats>({ total: 0, analyzing: 0, guided_learning: 0, mastered: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const deferredSearchQuery = useDeferredValue(searchQuery);
  const themeClass = profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior';

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace('/login?redirect=/error-book');
    }
  }, [authLoading, router, user]);

  useEffect(() => {
    if (!profile?.id) {
      return;
    }

    void fetchErrors();
  }, [profile?.id, deferredSearchQuery, selectedSubject, selectedStatus, sortBy, currentPage]);

  async function fetchErrors() {
    if (!profile?.id) {
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams({
        student_id: profile.id,
        page: String(currentPage),
        page_size: String(PAGE_SIZE),
        sort_by: sortBy,
      });

      if (deferredSearchQuery.trim()) {
        params.set('q', deferredSearchQuery.trim());
      }
      if (selectedSubject !== 'all') {
        params.set('subject', selectedSubject);
      }
      if (selectedStatus !== 'all') {
        params.set('status', selectedStatus);
      }

      const response = await fetch(`/api/error-book?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to fetch error book');
      }

      setErrors(payload.data || []);
      setReviewSessionMap(payload.review_session_map || {});
      setReviewSessionMetaMap(payload.review_session_meta_map || {});
      setStats(payload.stats || { total: 0, analyzing: 0, guided_learning: 0, mastered: 0 });
      setCurrentPage(payload.page || 1);
      setTotalPages(payload.total_pages || 1);
      setTotalCount(payload.count || 0);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Failed to fetch errors:', error);
      setActionError('加载错题本失败，请稍后再试。');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToReview(sessionId: string) {
    if (!profile?.id || reviewSessionMap[sessionId]) {
      return;
    }

    setAddingToReview(sessionId);
    setActionMessage(null);
    setActionError(null);

    try {
      const response = await fetch('/api/review/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '加入复习失败');
      }

      if (data.review_id) {
        setReviewSessionMap((current) => ({
          ...current,
          [sessionId]: data.review_id,
        }));
      }

      setActionMessage('已加入复习。');
    } catch (error: any) {
      console.error('Failed to add to review:', error);
      setActionError(error?.message || '加入复习失败');
    } finally {
      setAddingToReview(null);
    }
  }

  async function handleExport() {
    if (selectedIds.size === 0) {
      return;
    }

    setExporting(true);

    try {
      const selectedErrors = errors.filter((error) => selectedIds.has(error.id));
      await downloadErrorBookPDF({
        studentName: profile?.display_name || undefined,
        errors: selectedErrors.map((error) => ({
          subject: error.subject,
          extractedText: error.extracted_text || '',
          difficultyRating: error.difficulty_rating,
          conceptTags: error.concept_tags,
          createdAt: error.created_at,
          imageUrl: error.original_image_url,
        })),
      });
    } catch (error) {
      console.error('Export failed:', error);
      setActionError('导出 PDF 失败，请稍后再试。');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (selectedIds.size === 0) {
      return;
    }

    if (!confirm(`确定要删除 ${selectedIds.size} 条错题记录吗？`)) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase.from('error_sessions').delete().in('id', Array.from(selectedIds));

      if (error) {
        throw error;
      }

      setSelectedIds(new Set());
      setActionMessage('已删除所选错题记录。');
      await fetchErrors();
    } catch (error) {
      console.error('Delete failed:', error);
      setActionError('删除失败，请稍后再试。');
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === errors.length) {
      setSelectedIds(new Set());
      return;
    }

    setSelectedIds(new Set(errors.map((error) => error.id)));
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  }

  const nextReviewError = errors.find((error) => Boolean(reviewSessionMap[error.id]));
  const nextActionError = errors[0] ?? null;
  const nextActionHref = nextReviewError
    ? `/review/session/${reviewSessionMap[nextReviewError.id]}`
    : nextActionError
      ? nextActionError.status === 'mastered'
        ? `/error-book/${nextActionError.id}`
        : `/study/${nextActionError.subject}/problem?session=${nextActionError.id}`
      : '/study/math/problem';
  const nextActionLabel = nextReviewError
    ? '继续复习'
    : nextActionError
      ? nextActionError.status === 'mastered'
        ? '看原题'
        : '继续学习'
      : '开始新题';
  const nextActionDescription = nextReviewError
    ? '优先回到已经进入复习链路的题目。'
    : nextActionError
      ? nextActionError.status === 'mastered'
        ? '这道题已经完成当前学习，可以查看原题和本次记录。'
        : '继续当前题目的学习对话，推进到本次收口。'
      : '当前没有待处理错题，可以直接开始一道新题。';

  if (authLoading || (!user && !profile)) {
    return (
      <div className={cn('min-h-screen bg-gradient-to-br from-warm-50 via-white to-warm-100', themeClass)}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-warm-200" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-warm-500 border-t-transparent" />
            </div>
            <p className="text-warm-600">正在检查登录状态...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-warm-50 via-white to-warm-100', themeClass)}>
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-warm-200/40 blur-3xl" />
        <div className="absolute -right-40 top-1/3 h-96 w-96 rounded-full bg-warm-300/30 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-warm-100/30 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <PageHeader
          title="错题本"
          description="管理和复习你的错题记录"
          icon={BookOpen}
          iconColor="text-warm-500"
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <FileText className="h-3 w-3" />
                {totalCount} 条记录
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void fetchErrors()}
                className="gap-2 rounded-full border-warm-200 hover:border-warm-300 hover:bg-warm-100"
              >
                <RefreshCw className="h-4 w-4" />
                刷新
              </Button>
            </div>
          }
        />
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        {actionError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</div>
        ) : null}

        {actionMessage ? (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {actionMessage}
          </div>
        ) : null}

        {!loading ? (
          <Card className="mb-6 border-warm-200/60 bg-white/90">
            <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-warm-500">Next Step</p>
                <h2 className="mt-2 text-xl font-semibold text-warm-900">{nextActionLabel}</h2>
                <p className="mt-1 text-sm text-warm-700">{nextActionDescription}</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => router.push(nextActionHref)}
                  className="gap-2 rounded-full bg-warm-500 text-white hover:bg-warm-600"
                >
                  {nextActionLabel}
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push('/study/math/problem')}
                  className="rounded-full border-warm-200"
                >
                  继续做题
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!loading && stats.total > 0 ? (
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-blue-200/50 bg-gradient-to-br from-blue-100 to-blue-50 p-4 dark:border-blue-800/50 dark:from-blue-900/30 dark:to-blue-950/30">
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-blue-600/70">全部题目</p>
            </div>
            <div className="rounded-2xl border border-yellow-200/50 bg-gradient-to-br from-yellow-100 to-yellow-50 p-4 dark:border-yellow-800/50 dark:from-yellow-900/30 dark:to-yellow-950/30">
              <p className="text-3xl font-bold text-yellow-600">{stats.analyzing}</p>
              <p className="text-xs text-yellow-600/70">分析中</p>
            </div>
            <div className="rounded-2xl border border-purple-200/50 bg-gradient-to-br from-purple-100 to-purple-50 p-4 dark:border-purple-800/50 dark:from-purple-900/30 dark:to-purple-950/30">
              <p className="text-3xl font-bold text-purple-600">{stats.guided_learning}</p>
              <p className="text-xs text-purple-600/70">学习中</p>
            </div>
            <div className="rounded-2xl border border-green-200/50 bg-gradient-to-br from-green-100 to-green-50 p-4 dark:border-green-800/50 dark:from-green-900/30 dark:to-green-950/30">
              <p className="text-3xl font-bold text-green-600">{stats.mastered}</p>
              <p className="text-xs text-green-600/70">已掌握</p>
            </div>
          </div>
        ) : null}

        <div className="mb-6 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-warm-500" />
            <Input
              placeholder="搜索题目内容、标签或关键词..."
              value={searchQuery}
              onChange={(event) => {
                setSearchQuery(event.target.value);
                setCurrentPage(1);
              }}
              className="h-12 rounded-2xl border-warm-200 bg-white/80 pl-12 focus:border-warm-300 dark:bg-slate-900/80"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 rounded-full bg-warm-100/50 p-1">
              {[
                { value: 'all', label: '全部科目' },
                { value: 'math', label: '数学' },
                { value: 'physics', label: '物理' },
                { value: 'chemistry', label: '化学' },
                { value: 'chinese', label: '语文' },
                { value: 'english', label: '英语' },
              ].map((subject) => (
                <button
                  key={subject.value}
                  onClick={() => {
                    setSelectedSubject(subject.value);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                    selectedSubject === subject.value
                      ? 'bg-warm-500 text-white shadow-lg shadow-warm-500/30'
                      : 'text-warm-600 hover:bg-warm-100',
                  )}
                >
                  {subject.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-full bg-warm-100/50 p-1">
              {[
                { value: 'all', label: '全部状态' },
                { value: 'analyzing', label: '分析中' },
                { value: 'guided_learning', label: '学习中' },
                { value: 'mastered', label: '已掌握' },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    setSelectedStatus(status.value);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                    selectedStatus === status.value
                      ? 'bg-warm-500 text-white shadow-lg shadow-warm-500/30'
                      : 'text-warm-600 hover:bg-warm-100',
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 rounded-full bg-warm-100/50 p-1">
              {[
                { value: 'newest', label: '最新优先' },
                { value: 'oldest', label: '最早优先' },
                { value: 'difficulty', label: '难度优先' },
              ].map((sort) => (
                <button
                  key={sort.value}
                  onClick={() => {
                    setSortBy(sort.value as 'newest' | 'oldest' | 'difficulty');
                    setCurrentPage(1);
                  }}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-sm font-medium transition-all',
                    sortBy === sort.value
                      ? 'bg-warm-500 text-white shadow-lg shadow-warm-500/30'
                      : 'text-warm-600 hover:bg-warm-100',
                  )}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {selectedIds.size > 0 ? (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-warm-200 bg-warm-100 p-3">
            <span className="text-sm font-medium text-warm-900">已选中 {selectedIds.size} 条记录</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleExport()}
                disabled={exporting}
                className="gap-2 rounded-full border-warm-200 hover:border-warm-300 hover:bg-warm-100"
              >
                <Download className="h-4 w-4" />
                导出 PDF
              </Button>
              <Button variant="destructive" size="sm" onClick={() => void handleDelete()} className="gap-2 rounded-full">
                <Trash2 className="h-4 w-4" />
                删除
              </Button>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="py-12 text-center">
            <div className="relative mx-auto mb-4 h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-warm-200" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-warm-500 border-t-transparent" />
            </div>
            <p className="text-warm-600">加载中...</p>
          </div>
        ) : errors.length === 0 ? (
          <Card className="border-warm-200/50">
            <CardContent className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 h-12 w-12 text-warm-300" />
              <p className="mb-4 text-warm-600">
                {searchQuery || selectedSubject !== 'all' || selectedStatus !== 'all'
                  ? '没有找到符合条件的错题记录。'
                  : '还没有错题记录，去做一道题开始积累吧。'}
              </p>
              <Button
                onClick={() => router.push('/study/math/problem')}
                className="rounded-full bg-warm-500 text-white shadow-lg shadow-warm-500/30 transition-all hover:-translate-y-0.5 hover:bg-warm-600 hover:shadow-lg"
              >
                去做一道题
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2 text-xs text-warm-500">
              <input
                type="checkbox"
                checked={selectedIds.size === errors.length && errors.length > 0}
                onChange={toggleSelectAll}
                className="h-4 w-4 rounded border-warm-300"
              />
              <span>全选当前页</span>
            </div>

            {errors.map((error) => {
              const statusMeta = STATUS_META[error.status];
              const StatusIcon = statusMeta.icon;
              const reviewMeta = reviewSessionMetaMap[error.id] || null;
              const closureMeta = getClosureStateMeta(reviewMeta?.mastery_state || error.closure_state);
              const lastJudgementMeta =
                reviewMeta?.last_judgement ? MASTERY_JUDGEMENT_META[reviewMeta.last_judgement] : null;
              const hasReviewSession = Boolean(reviewSessionMap[error.id]);
              const primaryActionLabel = hasReviewSession
                ? '继续复习'
                : error.status === 'guided_learning'
                  ? addingToReview === error.id
                    ? '加入中...'
                    : '加入复习'
                  : error.status === 'mastered'
                    ? '看原题'
                    : '继续学习';
              const primaryActionHint = hasReviewSession
                ? '下一步：继续复习'
                : error.status === 'guided_learning'
                  ? '下一步：加入复习'
                  : error.status === 'mastered'
                    ? '下一步：看原题'
                    : '下一步：继续学习';

              return (
                <Card
                  key={error.id}
                  className={cn(
                    'border-l-4 border-warm-200/50 transition-all duration-300 hover:shadow-md',
                    SUBJECT_BORDER[error.subject],
                    SUBJECT_BG[error.subject],
                    selectedIds.has(error.id) && 'ring-2 ring-warm-500',
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(error.id)}
                        onChange={() => toggleSelect(error.id)}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-1 h-4 w-4 rounded border-warm-300"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <Badge variant="outline" className={cn('gap-1', SUBJECT_ACCENT[error.subject])}>
                            {SUBJECT_LABELS[error.subject]}
                          </Badge>

                          <Badge className={cn('gap-1', statusMeta.color)}>
                            <StatusIcon className="h-3 w-3" />
                            {statusMeta.label}
                          </Badge>

                          <Badge className={closureMeta.badgeClassName}>{closureMeta.compactLabel}</Badge>

                          {reviewMeta?.reopened_count ? (
                            <Badge variant="outline" className="border-red-200 text-red-700">
                              重开 {reviewMeta.reopened_count} 次
                            </Badge>
                          ) : null}

                          {error.difficulty_rating ? (
                            <div className="flex items-center gap-1 text-xs text-warm-600">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              {error.difficulty_rating}
                            </div>
                          ) : null}

                          <span className="ml-auto flex items-center gap-1 text-xs text-warm-600">
                            <Calendar className="h-3 w-3" />
                            {formatDate(error.created_at)}
                          </span>
                        </div>

                        <p className="mb-2 line-clamp-2 text-sm text-warm-900">
                          {error.extracted_text || '暂无题目文本'}
                        </p>

                        <p className="mb-2 text-xs font-medium text-warm-600">{primaryActionHint}</p>

                        {lastJudgementMeta ? (
                          <p className="mb-2 text-xs text-warm-700">最近判断：{lastJudgementMeta.label}</p>
                        ) : null}

                        {reviewMeta?.mastery_state === 'provisional_mastered' || reviewMeta?.mastery_state === 'reopened' ? (
                          <p className={cn('mb-2 text-xs', closureMeta.detailClassName)}>{closureMeta.description}</p>
                        ) : null}

                        {error.concept_tags && error.concept_tags.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1">
                            <Tag className="h-3 w-3 text-warm-500" />
                            {error.concept_tags.slice(0, 4).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="bg-warm-100 text-xs text-warm-700">
                                {tag}
                              </Badge>
                            ))}
                            {error.concept_tags.length > 4 ? (
                              <span className="text-xs text-warm-600">+{error.concept_tags.length - 4}</span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-stretch gap-2 sm:min-w-[140px]">
                        <Button
                          size="sm"
                          disabled={addingToReview === error.id}
                          onClick={() => {
                            if (hasReviewSession) {
                              router.push(`/review/session/${reviewSessionMap[error.id]}`);
                              return;
                            }

                            if (error.status === 'guided_learning') {
                              void handleAddToReview(error.id);
                              return;
                            }

                            if (error.status === 'mastered') {
                              router.push(`/error-book/${error.id}`);
                              return;
                            }

                            router.push(`/study/${error.subject}/problem?session=${error.id}`);
                          }}
                          className="gap-1 rounded-full bg-warm-500 text-white hover:bg-warm-600"
                        >
                          {error.status === 'guided_learning' ? (
                            <RefreshCw className={cn('h-4 w-4', addingToReview === error.id && 'animate-spin')} />
                          ) : (
                            <ArrowRight className="h-4 w-4" />
                          )}
                          {primaryActionLabel}
                        </Button>

                        {error.status !== 'mastered' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/error-book/${error.id}`)}
                            className="gap-1 rounded-full text-warm-600 hover:bg-warm-100 hover:text-warm-900"
                          >
                            <Eye className="h-4 w-4" />
                            看原题
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex flex-col gap-3 rounded-2xl border border-warm-200/60 bg-white/85 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-warm-700">
                第 {currentPage} / {totalPages} 页，共 {totalCount} 条记录
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  className="rounded-full border-warm-200"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                  className="rounded-full border-warm-200"
                >
                  下一页
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
