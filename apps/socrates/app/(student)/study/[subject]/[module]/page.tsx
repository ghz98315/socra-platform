import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  getModuleStatusLabel,
  getStudyModule,
  getStudySubject,
  type StudyModuleStatus,
} from '@/lib/study/catalog';
import { getStudyModuleExperience } from '@/lib/study/module-registry-v2';
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

export default async function StudyModulePage({
  params,
}: {
  params: Promise<{ subject: string; module: string }>;
}) {
  const { subject, module } = await params;
  const subjectConfig = getStudySubject(subject);

  if (!subjectConfig || subjectConfig.pro) {
    notFound();
  }

  const moduleConfig = getStudyModule(subjectConfig.id, module);
  if (!moduleConfig) {
    notFound();
  }

  const Icon = moduleConfig.icon;
  const experience = getStudyModuleExperience(subjectConfig.id, moduleConfig.id);
  const moduleWorkspace = experience.renderWorkspace?.() || null;
  const supplemental = experience.renderSupplemental?.() || null;
  const moduleTitle = experience.heroTitle ?? moduleConfig.title;
  const moduleDescription = experience.heroDescription ?? moduleConfig.description;
  const statusTone: StudyModuleStatus = experience.heroStatus ?? moduleConfig.status;
  const statusLabel = experience.heroStatusLabel ?? getModuleStatusLabel(statusTone);
  const entryHref = experience.hideEntry ? undefined : experience.entryHref ?? moduleConfig.entryHref;
  const entryLabel = experience.entryLabel ?? moduleConfig.entryLabel ?? '进入当前版本';
  const entryExternal = experience.external ?? moduleConfig.external;

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3">
            <div className={cn('rounded-2xl p-3', subjectConfig.bgColor)}>
              <Icon className={cn('h-5 w-5', subjectConfig.color)} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold text-slate-900">{moduleTitle}</h2>
                <span className={cn('rounded-full px-2 py-1 text-[11px] font-medium', getStatusClasses(statusTone))}>
                  {statusLabel}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">{moduleDescription}</p>
            </div>
          </div>

          {entryHref ? (
            <Link
              href={entryHref}
              target={entryExternal ? '_blank' : undefined}
              rel={entryExternal ? 'noreferrer' : undefined}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              {entryLabel}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">{experience.phaseTitle}</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">{experience.phaseCopy}</p>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
        <h3 className="text-base font-semibold text-slate-900">{experience.principlesTitle}</h3>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
          {experience.principles?.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {moduleWorkspace}
      {supplemental}
    </div>
  );
}

