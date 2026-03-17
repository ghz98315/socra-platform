'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { getStudySubject, type SubjectType } from '@/lib/study/catalog';

export default function StudyProblemBridgePage({
  params,
}: {
  params: { subject: SubjectType };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const targetHref = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('subject', params.subject);
    return `/workbench?${next.toString()}`;
  }, [params.subject, searchParams]);

  useEffect(() => {
    router.replace(targetHref);
  }, [router, targetHref]);

  const subject = getStudySubject(params.subject);

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Loader2 className="h-6 w-6 animate-spin text-slate-600" />
        </div>
        <h2 className="mt-4 text-xl font-semibold text-slate-900">
          正在进入{subject?.name || '当前学科'}录题分析
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-7 text-slate-500">
          当前版本仍复用已稳定的 workbench 链路，后续再把题目分析页面逐步拆回新的学习域结构。
        </p>
        <Link
          href={targetHref}
          className="mt-5 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
        >
          如果没有自动跳转，点这里继续
        </Link>
      </div>
    </div>
  );
}
