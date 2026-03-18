import Link from 'next/link';
import { notFound } from 'next/navigation';

import { StudySubjectNav } from '@/components/study/StudySubjectNav';
import { buildStudySubjectHref, getDefaultStudyModule, getSubjectConfig, type SubjectType } from '@/lib/study/catalog';
import { getStudySubjectExperience } from '@/lib/study/module-registry-v2';
import { cn } from '@/lib/utils';

export default async function StudySubjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  const config = getSubjectConfig(subject);

  if (!config || config.pro) {
    notFound();
  }

  const defaultModule = getDefaultStudyModule(config.id);
  const SubjectIcon = config.icon;
  const experience = getStudySubjectExperience(config.id as SubjectType);
  const subjectOverview = experience.overview ?? '';

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/study" className="transition-colors hover:text-slate-700">
          学习中心
        </Link>
        <span>/</span>
        <span className="text-slate-700">{config.name}</span>
      </div>

      <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <div className={cn('rounded-2xl p-3', config.bgColor)}>
                <SubjectIcon className={cn('h-6 w-6', config.color)} />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Subject</p>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{config.name}</h1>
              </div>
            </div>
            <p className="mt-4 text-sm leading-7 text-slate-600 lg:text-base">{subjectOverview}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={buildStudySubjectHref(config.id as SubjectType)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              返回概览
            </Link>
            {defaultModule ? (
              <Link
                href={`/study/${config.id}/${defaultModule.id}`}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
              >
                进入首个模块
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <StudySubjectNav subject={config.id as SubjectType} />
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}

