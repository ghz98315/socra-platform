import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  buildStudyModuleHref,
  getModuleStatusLabel,
  getStudySubject,
} from '@/lib/study/catalog';
import { cn } from '@/lib/utils';

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

export default async function StudySubjectOverviewPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  const config = getStudySubject(subject);

  if (!config || config.pro) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">模块概览</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          当前先把 {config.name} 的核心链路拆成独立模块，再逐步把数据、复习和报告统一回同一个学习域。
        </p>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {config.modules.map((module) => {
          const Icon = module.icon;

          return (
            <article
              key={module.id}
              className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={cn('rounded-2xl p-3', config.bgColor)}>
                    <Icon className={cn('h-5 w-5', config.color)} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{module.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{module.description}</p>
                  </div>
                </div>
                <span className={cn('rounded-full px-2 py-1 text-[11px] font-medium', getStatusClasses(module.status))}>
                  {getModuleStatusLabel(module.status)}
                </span>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={buildStudyModuleHref(config.id, module.id)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                >
                  查看模块
                </Link>
                {module.entryHref ? (
                  <Link
                    href={module.entryHref}
                    target={module.external ? '_blank' : undefined}
                    rel={module.external ? 'noreferrer' : undefined}
                    className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
                  >
                    {module.entryLabel ?? '进入当前版本'}
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}

