'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock3, FileText, Loader2 } from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';
import {
  buildStudyAssetDetailHref,
  fetchStudyAssets,
  getStudyAssetStatusLabel,
  type StudyAssetRecord,
  type StudyAssetSubject,
} from '@/lib/study/assets';
import { readStudyAssetReviewBridge } from '@/lib/study/bridges';

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
      } catch (error) {
        console.error('[StudyAssetHistory] Failed to load study assets:', error);
        if (active) {
          setRecords([]);
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
              const reviewHref = reviewBridge?.reviewHref || '';
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
                    ) : null}
                </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
