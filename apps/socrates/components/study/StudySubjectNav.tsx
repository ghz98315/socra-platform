'use client';

import Link from 'next/link';
import { useSelectedLayoutSegment } from 'next/navigation';

import {
  buildStudyModuleHref,
  buildStudySubjectHref,
  getModuleStatusLabel,
  getStudySubject,
  type SubjectType,
} from '@/lib/study/catalog';
import { cn } from '@/lib/utils';

interface StudySubjectNavProps {
  subject: SubjectType;
}

function getStatusClasses(status: 'live' | 'building' | 'planned') {
  switch (status) {
    case 'live':
      return 'bg-emerald-100 text-emerald-700';
    case 'building':
      return 'bg-amber-100 text-amber-700';
    case 'planned':
      return 'bg-slate-100 text-slate-600';
    default:
      return 'bg-slate-100 text-slate-600';
  }
}

export function StudySubjectNav({ subject }: StudySubjectNavProps) {
  const activeSegment = useSelectedLayoutSegment();
  const config = getStudySubject(subject);

  if (!config) {
    return null;
  }

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        <Link
          href={buildStudySubjectHref(subject)}
          className={cn(
            'rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors',
            activeSegment === null
              ? `${config.bgColor} ${config.borderColor} ${config.color}`
              : 'border-slate-200 bg-white text-slate-600'
          )}
        >
          概览
        </Link>
        {config.modules.map((module) => (
          <Link
            key={module.id}
            href={buildStudyModuleHref(subject, module.id)}
            className={cn(
              'rounded-full border px-4 py-2 text-sm whitespace-nowrap transition-colors',
              activeSegment === module.id
                ? `${config.bgColor} ${config.borderColor} ${config.color}`
                : 'border-slate-200 bg-white text-slate-600'
            )}
          >
            {module.shortTitle}
          </Link>
        ))}
      </div>

      <aside className="hidden rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm lg:block">
        <div className="mb-4">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Study</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">{config.name} 模块</h2>
          <p className="mt-1 text-sm leading-6 text-slate-500">{config.overview}</p>
        </div>

        <div className="space-y-2">
          <Link
            href={buildStudySubjectHref(subject)}
            className={cn(
              'block rounded-2xl border px-4 py-3 transition-colors',
              activeSegment === null
                ? `${config.bgColor} ${config.borderColor}`
                : 'border-slate-200 hover:bg-slate-50'
            )}
          >
            <div className="text-sm font-medium text-slate-900">概览</div>
            <div className="mt-1 text-xs text-slate-500">查看该学科的模块结构和当前建设重点。</div>
          </Link>

          {config.modules.map((module) => {
            const Icon = module.icon;
            const isActive = activeSegment === module.id;

            return (
              <Link
                key={module.id}
                href={buildStudyModuleHref(subject, module.id)}
                className={cn(
                  'block rounded-2xl border px-4 py-3 transition-colors',
                  isActive
                    ? `${config.bgColor} ${config.borderColor}`
                    : 'border-slate-200 hover:bg-slate-50'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className={cn('rounded-xl p-2', config.bgColor)}>
                      <Icon className={cn('h-4 w-4', config.color)} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-slate-900">{module.title}</div>
                      <div className="mt-1 text-xs leading-5 text-slate-500">{module.description}</div>
                    </div>
                  </div>
                  <span className={cn('rounded-full px-2 py-1 text-[11px] font-medium', getStatusClasses(module.status))}>
                    {getModuleStatusLabel(module.status)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </aside>
    </>
  );
}
