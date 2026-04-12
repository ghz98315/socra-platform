// =====================================================
// Project Socrates - Error Book Page (错题本)
// 错题本功能：筛选、排序、搜索、导出
// =====================================================

'use client';

import { useState, useEffect, useDeferredValue } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BookOpen,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  Calendar,
  Tag,
  Star,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { downloadErrorBookPDF } from '@/lib/pdf/ErrorBookPDF';
import { getClosureStateMeta, MASTERY_JUDGEMENT_META, type MasteryJudgement } from '@/lib/error-loop/review';

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

const subjectLabels: Record<string, string> = {
  chinese: '语文',
  english: '英语',
  math: '数学',
  physics: '物理',
  chemistry: '化学',
};

const statusLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  analyzing: { label: '分析中', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  guided_learning: { label: '学习中', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: AlertCircle },
  mastered: { label: '已掌握', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
};

const subjectColors: Record<string, string> = {
  chinese: 'text-rose-500',
  english: 'text-amber-500',
  math: 'text-blue-500',
  physics: 'text-purple-500',
  chemistry: 'text-green-500',
};

const subjectBorderColors: Record<string, string> = {
  chinese: 'border-l-rose-500',
  english: 'border-l-amber-500',
  math: 'border-l-blue-500',
  physics: 'border-l-purple-500',
  chemistry: 'border-l-green-500',
};

const subjectBgColors: Record<string, string> = {
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

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace('/login?redirect=/error-book');
      return;
    }
  }, [authLoading, router, user]);

  // Fetch error sessions
  useEffect(() => {
    if (profile?.id) {
      fetchErrors();
    }
  }, [profile?.id, deferredSearchQuery, selectedSubject, selectedStatus, sortBy, currentPage]);

  const fetchErrors = async () => {
    if (!profile?.id) return;
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
    } finally {
      setLoading(false);
    }
  };

  const handleAddToReview = async (sessionId: string) => {
    if (!profile?.id) return;
    if (reviewSessionMap[sessionId]) return;

    setAddingToReview(sessionId);
    setActionMessage(null);
    setActionError(null);

    try {
      const response = await fetch('/api/review/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, student_id: profile.id }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '加入复习失败');
      }

      if (data.review_id) {
        setReviewSessionMap((prev) => ({
          ...prev,
          [sessionId]: data.review_id,
        }));
      }
      setActionMessage('已加入复习。');
    } catch (e: any) {
      console.error('Failed to add to review:', e);
      setActionError(e?.message || '加入复习失败');
    } finally {
      setAddingToReview(null);
    }
  };

  const filteredErrors = errors;
  const nextReviewError = filteredErrors.find((error) => Boolean(reviewSessionMap[error.id]));
  const nextActionError = filteredErrors[0] ?? null;
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
      : '开始录题';
  const nextActionDescription = nextReviewError
    ? '先回到已经进入复习的题。'
    : nextActionError
      ? nextActionError.status === 'mastered'
        ? '先回看最近已经完成的题，再决定下一步。'
        : '先回到最近这道题，继续推进。'
      : '先录一道题，再开始沉淀错题。';

  // Toggle selection
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredErrors.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredErrors.map(e => e.id)));
    }
  };

  // Export selected
  const handleExport = async () => {
    if (selectedIds.size === 0) return;
    setExporting(true);

    try {
      const selectedErrors = errors.filter(e => selectedIds.has(e.id));
      await downloadErrorBookPDF({
        studentName: profile?.display_name,
        errors: selectedErrors.map(e => ({
          subject: e.subject,
          extractedText: e.extracted_text || '',
          difficultyRating: e.difficulty_rating,
          conceptTags: e.concept_tags,
          createdAt: e.created_at,
          imageUrl: e.original_image_url,
        })),
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  // Delete selected
  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`确定要删除 ${selectedIds.size} 条错题记录吗？`)) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('error_sessions')
        .delete()
        .in('id', Array.from(selectedIds));

      if (error) throw error;
      setErrors(errors.filter(e => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const themeClass = profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior';

  if (authLoading || (!user && !profile)) {
    return (
      <div className={cn('min-h-screen bg-gradient-to-br from-warm-50 via-white to-warm-100', themeClass)}>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="relative mx-auto mb-4 h-12 w-12">
              <div className="absolute inset-0 rounded-full border-4 border-warm-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-warm-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-warm-600">正在检查登录状态...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-warm-50 via-white to-warm-100', themeClass)}>
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-warm-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-warm-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-72 h-72 bg-warm-100/30 rounded-full blur-3xl" />
      </div>

      {/* Page Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <PageHeader
          title="错题本"
          description="管理和复习你的错题记录"
          icon={BookOpen}
          iconColor="text-warm-500"
          actions={
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="gap-1">
                <FileText className="w-3 h-3" />
                {totalCount} 条记录
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchErrors}
                className="gap-2 border-warm-200 hover:bg-warm-100 hover:border-warm-300 rounded-full"
              >
                <RefreshCw className="w-4 h-4" />
                刷新
              </Button>
            </div>
          }
        />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {actionError ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {actionError}
          </div>
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
                  录新题
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Stats Cards - 移到顶部 */}
        {!loading && stats.total > 0 && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-950/30 border border-blue-200/50 dark:border-blue-800/50">
              <p className="text-3xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-blue-600/70">总错题数</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-950/30 border border-yellow-200/50 dark:border-yellow-800/50">
              <p className="text-3xl font-bold text-yellow-600">{stats.analyzing}</p>
              <p className="text-xs text-yellow-600/70">分析中</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-950/30 border border-purple-200/50 dark:border-purple-800/50">
              <p className="text-3xl font-bold text-purple-600">{stats.guided_learning}</p>
              <p className="text-xs text-purple-600/70">学习中</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-950/30 border border-green-200/50 dark:border-green-800/50">
              <p className="text-3xl font-bold text-green-600">{stats.mastered}</p>
              <p className="text-xs text-green-600/70">已掌握 ✨</p>
            </div>
          </div>
        )}

        {/* Filters Bar - 胶囊按钮组 */}
        <div className="mb-6 space-y-3">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-warm-500" />
            <Input
              placeholder="搜索题目内容或标签..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-12 h-12 rounded-2xl bg-white/80 dark:bg-slate-900/80 border-warm-200 focus:border-warm-300"
            />
          </div>

          {/* 胶囊筛选按钮组 */}
          <div className="flex flex-wrap gap-2">
            {/* 科目筛选 */}
            <div className="flex items-center gap-1 p-1 bg-warm-100/50 rounded-full">
              {[
                { value: 'all', label: '📚 全部', color: '' },
                { value: 'math', label: '📐 数学', color: 'data-[active=true]:bg-blue-500 data-[active=true]:text-white' },
                { value: 'physics', label: '⚛️ 物理', color: 'data-[active=true]:bg-purple-500 data-[active=true]:text-white' },
                { value: 'chemistry', label: '🧪 化学', color: 'data-[active=true]:bg-green-500 data-[active=true]:text-white' },
                { value: 'chinese', label: '语文', color: 'data-[active=true]:bg-rose-500 data-[active=true]:text-white' },
                { value: 'english', label: '英语', color: 'data-[active=true]:bg-amber-500 data-[active=true]:text-white' },
              ].map((subject) => (
                <button
                  key={subject.value}
                  onClick={() => {
                    setSelectedSubject(subject.value);
                    setCurrentPage(1);
                  }}
                  data-active={selectedSubject === subject.value}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    selectedSubject === subject.value
                      ? "bg-warm-500 text-white shadow-lg shadow-warm-500/30"
                      : "hover:bg-warm-100 text-warm-600"
                  )}
                >
                  {subject.label}
                </button>
              ))}
            </div>

            {/* 状态筛选 */}
            <div className="flex items-center gap-1 p-1 bg-warm-100/50 rounded-full">
              {[
                { value: 'all', label: '📋 全部' },
                { value: 'analyzing', label: '⏳ 分析中' },
                { value: 'guided_learning', label: '📖 学习中' },
                { value: 'mastered', label: '✅ 已掌握' },
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={() => {
                    setSelectedStatus(status.value);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    selectedStatus === status.value
                      ? "bg-warm-500 text-white shadow-lg shadow-warm-500/30"
                      : "hover:bg-warm-100 text-warm-600"
                  )}
                >
                  {status.label}
                </button>
              ))}
            </div>

            {/* 排序 */}
            <div className="flex items-center gap-1 p-1 bg-warm-100/50 rounded-full">
              {[
                { value: 'newest', label: '🆕 最新' },
                { value: 'oldest', label: '📅 最早' },
                { value: 'difficulty', label: '⭐ 难度' },
              ].map((sort) => (
                <button
                  key={sort.value}
                  onClick={() => {
                    setSortBy(sort.value as any);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                    sortBy === sort.value
                      ? "bg-warm-500 text-white shadow-lg shadow-warm-500/30"
                      : "hover:bg-warm-100 text-warm-600"
                  )}
                >
                  {sort.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Bar */}
        {selectedIds.size > 0 && (
          <div className="mb-4 p-3 bg-warm-100 rounded-lg flex items-center justify-between border border-warm-200">
            <span className="text-sm font-medium text-warm-900">
              已选择 {selectedIds.size} 条记录
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={exporting}
                className="gap-2 border-warm-200 hover:bg-warm-100 hover:border-warm-300 rounded-full"
              >
                <Download className="w-4 h-4" />
                导出PDF
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="gap-2 rounded-full"
              >
                <Trash2 className="w-4 h-4" />
                删除
              </Button>
            </div>
          </div>
        )}

        {/* Error List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="relative w-12 h-12 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-warm-200"></div>
              <div className="absolute inset-0 rounded-full border-4 border-warm-500 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-warm-600">加载中...</p>
          </div>
        ) : filteredErrors.length === 0 ? (
          <Card className="border-warm-200/50">
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-warm-300" />
              <p className="text-warm-600 mb-4">
                {searchQuery || selectedSubject !== 'all' || selectedStatus !== 'all'
                  ? '没有找到匹配的错题记录'
                  : '还没有错题记录，快去上传吧！'}
              </p>
              <Button onClick={() => router.push('/study/math/problem')} className="bg-warm-500 hover:bg-warm-600 text-white rounded-full shadow-lg shadow-warm-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                去上传错题
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Select All */}
            <div className="flex items-center gap-3 px-2 text-xs text-warm-500">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredErrors.length && filteredErrors.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-warm-300"
              />
              <span>批量管理</span>
            </div>

            {/* Error Cards */}
            {filteredErrors.map((error) => {
              const StatusIcon = statusLabels[error.status]?.icon || Clock;
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
                    'border-warm-200/50 border-l-4 transition-all duration-300 hover:shadow-md',
                    subjectBorderColors[error.subject],
                    subjectBgColors[error.subject],
                    selectedIds.has(error.id) && 'ring-2 ring-warm-500'
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedIds.has(error.id)}
                        onChange={() => toggleSelect(error.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 rounded border-warm-300"
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          {/* Subject Badge */}
                          <Badge
                            variant="outline"
                            className={cn('gap-1', subjectColors[error.subject])}
                          >
                            {subjectLabels[error.subject]}
                          </Badge>

                          {/* Status Badge */}
                          <Badge className={cn('gap-1', statusLabels[error.status]?.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {statusLabels[error.status]?.label}
                          </Badge>
                          <Badge className={closureMeta.badgeClassName}>{closureMeta.compactLabel}</Badge>
                          {reviewMeta?.reopened_count ? (
                            <Badge variant="outline" className="border-red-200 text-red-700">
                              复开 {reviewMeta.reopened_count} 次
                            </Badge>
                          ) : null}

                          {/* Difficulty */}
                          {error.difficulty_rating && (
                            <div className="flex items-center gap-1 text-xs text-warm-600">
                              <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                              {error.difficulty_rating}
                            </div>
                          )}

                          {/* Date */}
                          <span className="text-xs text-warm-600 ml-auto flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(error.created_at)}
                          </span>
                        </div>

                        {/* Text Preview */}
                        <p className="text-sm line-clamp-2 mb-2 text-warm-900">
                          {error.extracted_text || '暂无题目内容'}
                        </p>
                        <p className="mb-2 text-xs font-medium text-warm-600">{primaryActionHint}</p>
                        {lastJudgementMeta ? (
                          <p className="mb-2 text-xs text-warm-700">上次判定: {lastJudgementMeta.label}</p>
                        ) : null}
                        {reviewMeta?.mastery_state === 'provisional_mastered' || reviewMeta?.mastery_state === 'reopened' ? (
                          <p className={cn('mb-2 text-xs', closureMeta.detailClassName)}>
                            {closureMeta.description}
                          </p>
                        ) : null}

                        {/* Tags */}
                        {error.concept_tags && error.concept_tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap">
                            <Tag className="w-3 h-3 text-warm-500" />
                            {error.concept_tags.slice(0, 4).map((tag, i) => (
                              <Badge key={i} variant="secondary" className="text-xs bg-warm-100 text-warm-700">
                                {tag}
                              </Badge>
                            ))}
                            {error.concept_tags.length > 4 && (
                              <span className="text-xs text-warm-600">
                                +{error.concept_tags.length - 4}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
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
                            <RefreshCw className={cn('w-4 h-4', addingToReview === error.id && 'animate-spin')} />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                          {primaryActionLabel}
                        </Button>
                        {error.status !== 'mastered' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              router.push(`/error-book/${error.id}`);
                            }}
                            className="gap-1 rounded-full text-warm-600 hover:bg-warm-100 hover:text-warm-900"
                          >
                            <Eye className="w-4 h-4" />
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
                当前第 {currentPage} / {totalPages} 页，共 {totalCount} 条错题记录
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
