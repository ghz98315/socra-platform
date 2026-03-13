// =====================================================
// Project Socrates - Error Book Page (错题本)
// 错题本功能：筛选、排序、搜索、导出
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
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

type ErrorSession = {
  id: string;
  student_id: string;
  subject: 'math' | 'physics' | 'chemistry';
  original_image_url: string | null;
  extracted_text: string | null;
  status: 'analyzing' | 'guided_learning' | 'mastered';
  difficulty_rating: number | null;
  concept_tags: string[] | null;
  created_at: string;
};

const subjectLabels: Record<string, string> = {
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
  math: 'text-blue-500',
  physics: 'text-purple-500',
  chemistry: 'text-green-500',
};

const subjectBorderColors: Record<string, string> = {
  math: 'border-l-blue-500',
  physics: 'border-l-purple-500',
  chemistry: 'border-l-green-500',
};

const subjectBgColors: Record<string, string> = {
  math: 'bg-blue-50 dark:bg-blue-950/30',
  physics: 'bg-purple-50 dark:bg-purple-950/30',
  chemistry: 'bg-green-50 dark:bg-green-950/30',
};

export default function ErrorBookPage() {
  const { profile } = useAuth();
  const router = useRouter();
  const [errors, setErrors] = useState<ErrorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'difficulty'>('newest');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);
  const [reviewSessionIds, setReviewSessionIds] = useState<Set<string>>(new Set());
  const [addingToReview, setAddingToReview] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch error sessions
  useEffect(() => {
    if (profile?.id) {
      fetchErrors();
    }
  }, [profile?.id]);

  const fetchErrors = async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      const supabase = createClient();
      const [errorsResult, reviewResult] = await Promise.all([
        supabase
          .from('error_sessions')
          .select('*')
          .eq('student_id', profile.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('review_schedule')
          .select('session_id')
          .eq('student_id', profile.id),
      ]);

      if (errorsResult.error) throw errorsResult.error;
      setErrors(errorsResult.data || []);

      if (reviewResult.error) {
        console.error('Failed to load review schedule:', reviewResult.error);
      } else {
        const ids = new Set(
          (reviewResult.data || []).map((row: { session_id: string }) => row.session_id)
        );
        setReviewSessionIds(ids);
      }
    } catch (error) {
      console.error('Failed to fetch errors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToReview = async (sessionId: string) => {
    if (!profile?.id) return;
    if (reviewSessionIds.has(sessionId)) return;

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

      setReviewSessionIds((prev) => {
        const next = new Set(prev);
        next.add(sessionId);
        return next;
      });
      setActionMessage('已加入复习清单。');
    } catch (e: any) {
      console.error('Failed to add to review:', e);
      setActionError(e?.message || '加入复习失败');
    } finally {
      setAddingToReview(null);
    }
  };

  // Filter and sort errors
  const filteredErrors = errors
    .filter((err) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const textMatch = err.extracted_text?.toLowerCase().includes(query);
        const tagsMatch = err.concept_tags?.some(tag => tag.toLowerCase().includes(query));
        if (!textMatch && !tagsMatch) return false;
      }
      // Subject filter
      if (selectedSubject !== 'all' && err.subject !== selectedSubject) return false;
      // Status filter
      if (selectedStatus !== 'all' && err.status !== selectedStatus) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'difficulty':
          return (b.difficulty_rating || 0) - (a.difficulty_rating || 0);
        default:
          return 0;
      }
    });

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
                {errors.length} 条记录
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
        {/* Stats Cards - 移到顶部 */}
        {!loading && errors.length > 0 && (
          <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-950/30 border border-blue-200/50 dark:border-blue-800/50">
              <p className="text-3xl font-bold text-blue-600">{errors.length}</p>
              <p className="text-xs text-blue-600/70">总错题数</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-100 to-yellow-50 dark:from-yellow-900/30 dark:to-yellow-950/30 border border-yellow-200/50 dark:border-yellow-800/50">
              <p className="text-3xl font-bold text-yellow-600">
                {errors.filter(e => e.status === 'analyzing').length}
              </p>
              <p className="text-xs text-yellow-600/70">分析中</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/30 dark:to-purple-950/30 border border-purple-200/50 dark:border-purple-800/50">
              <p className="text-3xl font-bold text-purple-600">
                {errors.filter(e => e.status === 'guided_learning').length}
              </p>
              <p className="text-xs text-purple-600/70">学习中</p>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/30 dark:to-green-950/30 border border-green-200/50 dark:border-green-800/50">
              <p className="text-3xl font-bold text-green-600">
                {errors.filter(e => e.status === 'mastered').length}
              </p>
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
              ].map((subject) => (
                <button
                  key={subject.value}
                  onClick={() => setSelectedSubject(subject.value)}
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
                  onClick={() => setSelectedStatus(status.value)}
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
                  onClick={() => setSortBy(sort.value as any)}
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
              <Button onClick={() => router.push('/workbench')} className="bg-warm-500 hover:bg-warm-600 text-white rounded-full shadow-lg shadow-warm-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                去上传错题
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Select All */}
            <div className="flex items-center gap-3 px-2">
              <input
                type="checkbox"
                checked={selectedIds.size === filteredErrors.length && filteredErrors.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded border-warm-300"
              />
              <span className="text-sm text-warm-600">全选</span>
            </div>

            {/* Error Cards */}
            {filteredErrors.map((error) => {
              const StatusIcon = statusLabels[error.status]?.icon || Clock;
              return (
                <Card
                  key={error.id}
                  className={cn(
                    'border-warm-200/50 border-l-4 transition-all duration-300 hover:shadow-md cursor-pointer',
                    subjectBorderColors[error.subject],
                    subjectBgColors[error.subject],
                    selectedIds.has(error.id) && 'ring-2 ring-warm-500'
                  )}
                  onClick={() => toggleSelect(error.id)}
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
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/error-book/${error.id}`);
                          }}
                          className="gap-1 text-warm-600 hover:text-warm-900 hover:bg-warm-100 rounded-full"
                        >
                          <Eye className="w-4 h-4" />
                          查看
                        </Button>
                        <Button
                          variant={reviewSessionIds.has(error.id) ? 'secondary' : 'outline'}
                          size="sm"
                          disabled={reviewSessionIds.has(error.id) || addingToReview === error.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleAddToReview(error.id);
                          }}
                          className={cn(
                            'gap-1 border-warm-200 hover:bg-warm-100 hover:border-warm-300 rounded-full',
                            reviewSessionIds.has(error.id) && 'bg-warm-100 text-warm-700 hover:bg-warm-100'
                          )}
                        >
                          <RefreshCw className={cn('w-4 h-4', addingToReview === error.id && 'animate-spin')} />
                          {reviewSessionIds.has(error.id)
                            ? '已加入复习'
                            : addingToReview === error.id
                              ? '加入中...'
                              : '加入复习'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {!loading && errors.length > 0 && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-warm-200/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-warm-500">{errors.length}</p>
                <p className="text-xs text-warm-600">总错题数</p>
              </CardContent>
            </Card>
            <Card className="border-warm-200/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-yellow-500">
                  {errors.filter(e => e.status === 'analyzing').length}
                </p>
                <p className="text-xs text-warm-600">分析中</p>
              </CardContent>
            </Card>
            <Card className="border-warm-200/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-blue-500">
                  {errors.filter(e => e.status === 'guided_learning').length}
                </p>
                <p className="text-xs text-warm-600">学习中</p>
              </CardContent>
            </Card>
            <Card className="border-warm-200/50">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-green-500">
                  {errors.filter(e => e.status === 'mastered').length}
                </p>
                <p className="text-xs text-warm-600">已掌握</p>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
