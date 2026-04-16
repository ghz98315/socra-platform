'use client';

import { AlertCircle, CheckCircle2, Loader2, MessageSquareMore, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  ROOT_CAUSE_CATEGORY_OPTIONS,
  getRootCauseSubtypeOptions,
  type RootCauseCategory,
  type RootCauseSubtype,
} from '@/lib/error-loop/taxonomy';

export interface WrapUpPreviewData {
  status: 'ongoing' | 'ready_to_wrap' | 'needs_more_clarification';
  title: string;
  summary: string;
  evidence_summary: string;
  suggested_root_cause_category: RootCauseCategory;
  suggested_root_cause_subtype: RootCauseSubtype;
  suggested_difficulty_rating: number;
  user_message_count: number;
  assistant_message_count: number;
}

interface ChatWrapUpCardProps {
  preview: WrapUpPreviewData | null;
  loading?: boolean;
  submitting?: boolean;
  submitError?: string | null;
  selectedCategory: RootCauseCategory;
  selectedSubtype: RootCauseSubtype;
  selectedDifficulty: number;
  onCategoryChange: (value: RootCauseCategory) => void;
  onSubtypeChange: (value: RootCauseSubtype) => void;
  onDifficultyChange: (value: number) => void;
  onContinue: () => void;
  onSubmit: () => void;
}

const STATUS_META: Record<
  WrapUpPreviewData['status'],
  { badge: string; icon: typeof CheckCircle2; cardClassName: string }
> = {
  ready_to_wrap: {
    badge: '可以收口',
    icon: CheckCircle2,
    cardClassName: 'border-emerald-200 bg-emerald-50/70',
  },
  ongoing: {
    badge: '可以准备收口',
    icon: MessageSquareMore,
    cardClassName: 'border-amber-200 bg-amber-50/70',
  },
  needs_more_clarification: {
    badge: '建议继续聊',
    icon: AlertCircle,
    cardClassName: 'border-orange-200 bg-orange-50/70',
  },
};

export function ChatWrapUpCard({
  preview,
  loading = false,
  submitting = false,
  submitError,
  selectedCategory,
  selectedSubtype,
  selectedDifficulty,
  onCategoryChange,
  onSubtypeChange,
  onDifficultyChange,
  onContinue,
  onSubmit,
}: ChatWrapUpCardProps) {
  const currentStatus = preview?.status || 'ongoing';
  const statusMeta = STATUS_META[currentStatus];
  const StatusIcon = statusMeta.icon;
  const subtypeOptions = getRootCauseSubtypeOptions(selectedCategory);

  return (
    <Card className={cn('border shadow-sm', statusMeta.cardClassName)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-warm-700">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <StatusIcon className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base text-slate-900">
                  {preview?.title || '正在整理本次对话'}
                </CardTitle>
                <Badge variant="outline" className="bg-white/70">
                  {statusMeta.badge}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-slate-700">
                {preview?.summary || '系统正在根据当前对话判断是否可以结束本题。'}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-sm text-slate-700">
          {preview?.evidence_summary || '会结合当前对话轮次、学生表达和卡点信号，给出收口建议。'}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-800">错因大类</span>
            <select
              value={selectedCategory}
              onChange={(event) => onCategoryChange(event.target.value as RootCauseCategory)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-warm-300 focus:ring-2 focus:ring-warm-400/10"
              disabled={loading || submitting}
            >
              {ROOT_CAUSE_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-800">具体细分</span>
            <select
              value={selectedSubtype}
              onChange={(event) => onSubtypeChange(event.target.value as RootCauseSubtype)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-warm-300 focus:ring-2 focus:ring-warm-400/10"
              disabled={loading || submitting}
            >
              {subtypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-800">本轮难度</span>
            <span className="text-sm text-slate-600">{selectedDifficulty} / 5</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => onDifficultyChange(value)}
                disabled={loading || submitting}
                className={cn(
                  'min-w-10 rounded-full border px-3 py-1.5 text-sm transition-colors',
                  value === selectedDifficulty
                    ? 'border-warm-500 bg-warm-500 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-warm-300 hover:bg-warm-50',
                )}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        {submitError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button type="button" variant="outline" onClick={onContinue} disabled={loading || submitting} className="gap-2">
            <MessageSquareMore className="h-4 w-4" />
            继续聊
          </Button>
          <Button type="button" onClick={onSubmit} disabled={loading || submitting} className="gap-2 bg-warm-500 hover:bg-warm-600">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            提交到错题库
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
