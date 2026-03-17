'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, FileText, Loader2, Sparkles } from 'lucide-react';

import { createClient } from '@/lib/supabase/client';
import { getEssayAppUrl } from '@/lib/study/catalog';
import { cn } from '@/lib/utils';

interface EssayAnalysisSummary {
  highlights?: unknown[];
  corrections?: unknown[];
  overallComment?: string;
}

interface EssayRecord {
  id: string;
  title: string | null;
  content: string;
  grade: string;
  analysis: EssayAnalysisSummary | null;
  created_at: string;
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

function getGradeLabel(grade: string) {
  const gradeMap: Record<string, string> = {
    'grade-1': '小学 1 年级',
    'grade-2': '小学 2 年级',
    'grade-3': '小学 3 年级',
    'grade-4': '小学 4 年级',
    'grade-5': '小学 5 年级',
    'grade-6': '小学 6 年级',
    'grade-7': '初中 1 年级',
    'grade-8': '初中 2 年级',
    'grade-9': '初中 3 年级',
  };

  return gradeMap[grade] || grade;
}

export function EssayHistoryBridge() {
  const [records, setRecords] = useState<EssayRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadHistory() {
      setLoading(true);

      try {
        const supabase = createClient() as any;
        const { data } = await supabase
          .from('essays')
          .select('id, title, content, grade, analysis, created_at')
          .order('created_at', { ascending: false })
          .limit(6);

        if (!active) {
          return;
        }

        setRecords((data || []) as EssayRecord[]);
      } catch (error) {
        console.error('[EssayHistoryBridge] Failed to load essay history:', error);
        if (active) {
          setRecords([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadHistory();

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">已接入的作文历史</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">
            这里先读取现有 Essay 工作台保存的作文记录，后续再把批改结果更完整地并回 Socrates 的学习资产体系。
          </p>
        </div>

        <Link
          href={getEssayAppUrl()}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          打开作文工作台
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在读取作文历史...
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
            还没有读取到作文记录。你可以先进入作文工作台完成一次批改，后续这里会自动承接结果。
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {records.map((record) => {
              const highlightCount = Array.isArray(record.analysis?.highlights)
                ? record.analysis?.highlights.length
                : 0;
              const correctionCount = Array.isArray(record.analysis?.corrections)
                ? record.analysis?.corrections.length
                : 0;

              return (
                <article
                  key={record.id}
                  className="rounded-2xl border border-slate-200 px-4 py-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="rounded-xl bg-red-50 p-2 text-red-600">
                          <FileText className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-slate-900">
                            {record.title?.trim() || '未命名作文'}
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            {getGradeLabel(record.grade)} · {formatDate(record.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Link
                      href={getEssayAppUrl()}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-white"
                    >
                      去查看
                    </Link>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                    {record.content || '暂无作文正文'}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                      闪光点 {highlightCount}
                    </span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                      修改建议 {correctionCount}
                    </span>
                    {record.analysis?.overallComment ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                        <Sparkles className="h-3 w-3" />
                        已生成总评
                      </span>
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
