'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Clock3, FileText, Filter, Loader2, Sparkles } from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';
import {
  buildStudyAssetDetailHref,
  fetchStudyAssets,
  getStudyAssetModuleLabel,
  getStudyAssetStatusLabel,
  type StudyAssetRecord,
} from '@/lib/study/assets-v2';
import { getStudySubjects, type SubjectType } from '@/lib/study/catalog';

type SubjectFilter = 'all' | SubjectType;

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

export function StudyAssetCenter() {
  const { profile } = useAuth();
  const [records, setRecords] = useState<StudyAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');

  const subjects = getStudySubjects({ includePro: false });

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
          limit: 40,
        });

        if (!active) {
          return;
        }

        setRecords(data);
      } catch (error) {
        console.error('[StudyAssetCenter] Failed to load records:', error);
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
  }, [profile?.id]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (subjectFilter !== 'all' && record.subject !== subjectFilter) {
        return false;
      }

      if (moduleFilter !== 'all' && record.module !== moduleFilter) {
        return false;
      }

      return true;
    });
  }, [moduleFilter, records, subjectFilter]);

  const availableModules = useMemo(() => {
    const moduleMap = new Map<string, string>();
    records.forEach((record) => {
      if (subjectFilter !== 'all' && record.subject !== subjectFilter) {
        return;
      }

      moduleMap.set(record.module, getStudyAssetModuleLabel(record.module));
    });

    return Array.from(moduleMap.entries());
  }, [records, subjectFilter]);

  useEffect(() => {
    if (moduleFilter === 'all') {
      return;
    }

    const exists = availableModules.some(([module]) => module === moduleFilter);
    if (!exists) {
      setModuleFilter('all');
    }
  }, [availableModules, moduleFilter]);

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Study Assets</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">统一学习记录中心</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 lg:text-base">
              这里先汇总新的写作、语文分析、英语听力记录，并通过懒同步接入旧作文和旧录题数据。后续再继续并入复习、报告和更完整的学习资产体系。
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-600">
            <div className="flex items-center gap-2 text-slate-900">
              <Sparkles className="h-4 w-4 text-warm-500" />
              <span className="font-medium">当前阶段</span>
            </div>
            <p className="mt-2">
              新模块记录直写，旧作文和旧录题懒同步接入。
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <Filter className="h-4 w-4 text-slate-500" />
          筛选
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubjectFilter('all')}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              subjectFilter === 'all' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            全部学科
          </button>
          {subjects.map((subject) => (
            <button
              key={subject.id}
              type="button"
              onClick={() => setSubjectFilter(subject.id)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                subjectFilter === subject.id ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'
              }`}
            >
              {subject.name}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setModuleFilter('all')}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              moduleFilter === 'all' ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'
            }`}
          >
            全部模块
          </button>
          {availableModules.map(([module, label]) => (
            <button
              key={module}
              type="button"
              onClick={() => setModuleFilter(module)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                moduleFilter === module ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
        {loading ? (
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在汇总学习记录...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-8 text-center text-sm text-slate-500">
            当前筛选下还没有学习记录。可以先进入任意学习模块完成一轮分析。
          </div>
        ) : (
          <div className="grid gap-3 xl:grid-cols-2">
            {filteredRecords.map((record) => (
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
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>{subjects.find((subject) => subject.id === record.subject)?.name || record.subject}</span>
                          <span>·</span>
                          <span>{getStudyAssetModuleLabel(record.module)}</span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="h-3 w-3" />
                            {formatDate(record.updated_at)}
                          </span>
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
                    className="rounded-full bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    查看详情
                  </Link>
                  {record.module === 'problem' ? (
                    <Link
                      href={`/study/${record.subject}/problem`}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-white"
                    >
                      返回录题入口
                    </Link>
                  ) : (
                    <Link
                      href={`/study/${record.subject}/${record.module}`}
                      className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-white"
                    >
                      打开对应模块
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-blue-200 bg-blue-50/80 p-5">
        <h2 className="text-base font-semibold text-slate-900">当前读侧边界</h2>
        <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          <div className="flex items-start gap-2">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <span>当前先做统一学习记录浏览，不直接改写错题本、复习页和报告页。</span>
          </div>
          <div className="flex items-start gap-2">
            <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <span>旧作文和旧录题通过懒同步出现，后续再继续补消息详情和更细的回看能力。</span>
          </div>
        </div>
      </section>
    </div>
  );
}
