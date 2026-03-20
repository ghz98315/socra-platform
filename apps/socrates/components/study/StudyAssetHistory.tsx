'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock3, FileText, Loader2 } from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';
import {
  bridgeStudyAssetToReview,
  buildStudyAssetDetailHref,
  fetchStudyAssets,
  getStudyAssetStatusLabel,
  type StudyAssetRecord,
  type StudyAssetSubject,
} from '@/lib/study/assets-v2';
import { readStudyAssetReviewBridge } from '@/lib/study/bridges-v2';

interface ReviewActionState {
  pending?: boolean;
  reviewHref?: string;
  message?: string;
  error?: string;
}

interface StudyAssetHistoryProps {
  subject: StudyAssetSubject;
  module: string;
  title: string;
  description: string;
  emptyText: string;
  refreshToken?: number;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function StudyAssetHistory({
  subject,
  module,
  title,
  description,
  emptyText,
  refreshToken,
}: StudyAssetHistoryProps) {
  const { profile } = useAuth();
  const [records, setRecords] = useState<StudyAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewActionStates, setReviewActionStates] = useState<Record<string, ReviewActionState>>({});

  useEffect(() => {
    let active = true;

    async function loadRecords() {
      if (!profile?.id) {
        setRecords([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const data = await fetchStudyAssets({
          studentId: profile.id,
          subject,
          module,
          limit: 6,
        });

        if (!active) {
          return;
        }

        setRecords(data);
        setReviewActionStates((current) => {
          const next: Record<string, ReviewActionState> = {};

          data.forEach((record) => {
            if (current[record.id]) {
              next[record.id] = current[record.id];
            }
          });

          return next;
        });
      } catch (error) {
        console.error('[StudyAssetHistory] Failed to load study assets:', error);
        if (active) {
          setRecords([]);
          setReviewActionStates({});
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadRecords();

    return () => {
      active = false;
    };
  }, [module, profile?.id, refreshToken, subject]);

  async function handleAddToReview(record: StudyAssetRecord) {
    if (!profile?.id || reviewActionStates[record.id]?.pending) {
      return;
    }

    setReviewActionStates((current) => ({
      ...current,
      [record.id]: {
        ...current[record.id],
        pending: true,
        message: '',
        error: '',
      },
    }));

    try {
      const result = await bridgeStudyAssetToReview({
        assetId: record.id,
        studentId: profile.id,
      });

      setReviewActionStates((current) => ({
        ...current,
        [record.id]: {
          pending: false,
          reviewHref: result.reviewHref,
          message: result.existed ? '该记录已在复习清单中。' : '已加入复习清单。',
          error: '',
        },
      }));
    } catch (error: any) {
      console.error('[StudyAssetHistory] Failed to add study asset to review:', error);
      setReviewActionStates((current) => ({
        ...current,
        [record.id]: {
          ...current[record.id],
          pending: false,
          message: '',
          error: error?.message || '加入复习失败，请稍后重试。',
        },
      }));
    }
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{description}</p>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在读取当前模块学习记录...
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
            {emptyText}
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {records.map((record) => {
              const reviewBridge = readStudyAssetReviewBridge(record.payload);
              const reviewActionState = reviewActionStates[record.id];
              const reviewHref = reviewActionState?.reviewHref || reviewBridge?.reviewHref || '';
              const reportHref = `/reports?focus_asset_id=${encodeURIComponent(record.id)}`;

              return (
                <article
                  key={record.id}
                  className="rounded-2xl border border-slate-200 px-4 py-4 transition-colors hover:bg-slate-50"
                >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-slate-100 p-2 text-slate-600">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {record.title?.trim() || '未命名学习记录'}
                        </div>
                        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                          <Clock3 className="h-3 w-3" />
                          {formatDate(record.updated_at)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {getStudyAssetStatusLabel(record)}
                  </span>
                </div>

                <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-600">
                  {record.summary?.trim() || '当前还没有生成摘要。'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={buildStudyAssetDetailHref(record.id)}
                    className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-white"
                  >
                    查看详情
                    </Link>
                    <Link
                      href={reportHref}
                      className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-white"
                    >
                      学习报告
                    </Link>
                    {reviewHref ? (
                      <Link
                        href={reviewHref}
                        className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-white"
                      >
                        复习页
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void handleAddToReview(record)}
                        disabled={!profile?.id || reviewActionState?.pending}
                        className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {reviewActionState?.pending ? '加入复习中' : '加入复习'}
                      </button>
                    )}
                </div>
                {reviewActionState?.message ? (
                  <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    {reviewActionState.message}
                  </div>
                ) : null}
                {reviewActionState?.error ? (
                  <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                    {reviewActionState.error}
                  </div>
                ) : null}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
