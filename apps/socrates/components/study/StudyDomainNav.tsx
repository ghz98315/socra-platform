'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenCheck, Compass, Layers3 } from 'lucide-react';

import { buildStudySubjectHref, getSupportedSubjects } from '@/lib/study/catalog';
import { cn } from '@/lib/utils';

function getNavSummary(pathname: string) {
  if (pathname.startsWith('/study/history')) {
    return {
      eyebrow: 'Learning Records',
      title: '统一学习记录导航',
      description: '从这里切换学习中心、历史记录与各学科入口，降低内测阶段的跳转成本。',
    };
  }

  if (pathname === '/study') {
    return {
      eyebrow: 'Learning Domain',
      title: '学习域导航',
      description: '把学习中心首页、统一学习记录和各学科入口收在同一层，后续每个阶段都沿这条主导航继续扩展。',
    };
  }

  return {
    eyebrow: 'Study Domain',
    title: '学科与模块导航',
    description: '先保持统一学习域入口，再按学科进入模块侧边导航，逐步把旧链路能力并回到同一结构里。',
  };
}

export function StudyDomainNav() {
  const pathname = usePathname();
  const subjects = getSupportedSubjects();
  const summary = getNavSummary(pathname);

  return (
    <section className="rounded-[30px] border border-slate-200 bg-white/90 p-5 shadow-sm shadow-warm-100/40 lg:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-warm-500">{summary.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 lg:text-3xl">{summary.title}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">{summary.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600">
          <div>
            <div className="text-lg font-semibold text-slate-900">3</div>
            <div>核心学科</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">1</div>
            <div>统一记录中心</div>
          </div>
          <div>
            <div className="text-lg font-semibold text-slate-900">8+</div>
            <div>模块入口</div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/study"
          className={cn(
            'inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            pathname === '/study'
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
          )}
        >
          <Compass className="mr-2 h-4 w-4" />
          学习中心
        </Link>

        <Link
          href="/study/history"
          className={cn(
            'inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            pathname.startsWith('/study/history')
              ? 'border-slate-900 bg-slate-900 text-white'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
          )}
        >
          <BookOpenCheck className="mr-2 h-4 w-4" />
          学习记录
        </Link>

        {subjects.map((subject) => {
          const SubjectIcon = subject.icon;
          const subjectHref = buildStudySubjectHref(subject.id);
          const active = pathname === subjectHref || pathname.startsWith(`${subjectHref}/`);

          return (
            <Link
              key={subject.id}
              href={subjectHref}
              className={cn(
                'inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                active
                  ? `${subject.bgColor} ${subject.borderColor} ${subject.color}`
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
              )}
            >
              <SubjectIcon className="mr-2 h-4 w-4" />
              {subject.name}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Layers3 className="h-4 w-4 text-slate-400" />
        <span>顶层负责“学习中心 / 学习记录 / 学科切换”，学科内再进入模块级导航。</span>
      </div>
    </section>
  );
}
