import Link from 'next/link';
import { ArrowRight, BookOpenCheck, Clock3, Sparkles, Target } from 'lucide-react';

import {
  buildStudyModuleHref,
  buildStudySubjectHref,
  getModuleStatusLabel,
  getStudySubjects,
} from '@/lib/study/catalog';
import {
  getStudyModuleCardStatus,
  getStudyModuleCardStatusLabel,
  getStudyModuleExperience,
  getStudySubjectExperience,
} from '@/lib/study/module-registry-v2';
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

export default function StudyHomePage() {
  const subjects = getStudySubjects({ includePro: true });
  const coreSubjects = subjects.filter((subject) => !subject.pro);
  const futureSubjects = subjects.filter((subject) => subject.pro);

  return (
    <div>
      <section className="rounded-[32px] border border-warm-200 bg-white/90 p-6 shadow-sm shadow-warm-100/60 lg:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-warm-500">Study</p>
        <div className="mt-3 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">先开始学习</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 lg:text-base">
              先做一个动作就够了。录题、看错题本，或者回到上次学习记录。
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/study/history"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <BookOpenCheck className="h-4 w-4" />
              学习记录
            </Link>
          </div>
        </div>
      </section>

      <section
        id="quick-start"
        className="mt-8 rounded-[32px] border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-900 to-warm-900 p-6 text-white shadow-lg shadow-slate-900/10 lg:p-8"
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-warm-100">
              <Sparkles className="h-3.5 w-3.5" />
              Start
            </p>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight lg:text-3xl">先做一件事</h2>
            <p className="mt-3 text-sm leading-7 text-slate-200 lg:text-base">
              第一次用就先录题。做过题就回错题本或学习记录。
            </p>
          </div>

          <Link
            href="/study/math/problem"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-warm-50"
          >
            开始录题
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <Link
            href="/study/math/problem"
            className="rounded-[28px] border border-white/10 bg-white/10 p-5 transition-colors hover:bg-white/15"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Target className="h-5 w-5 text-warm-100" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">录一道题</h3>
                <p className="mt-1 text-sm text-slate-200">最快开始。</p>
              </div>
            </div>
          </Link>

          <Link
            href="/error-book"
            className="rounded-[28px] border border-white/10 bg-white/10 p-5 transition-colors hover:bg-white/15"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <BookOpenCheck className="h-5 w-5 text-warm-100" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">看错题本</h3>
                <p className="mt-1 text-sm text-slate-200">继续上次进度。</p>
              </div>
            </div>
          </Link>

          <Link
            href="/study/history"
            className="rounded-[28px] border border-white/10 bg-white/10 p-5 transition-colors hover:bg-white/15"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white/10 p-3">
                <Clock3 className="h-5 w-5 text-warm-100" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">看学习记录</h3>
                <p className="mt-1 text-sm text-slate-200">回到最近一次学习。</p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">当前重点学科</h2>
            <p className="mt-1 text-sm text-slate-500">先用最稳定的 3 科入口。</p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {coreSubjects.map((subject) => {
            const SubjectIcon = subject.icon;
            const experience = getStudySubjectExperience(subject.id);
            const subjectDescription = experience.description ?? subject.description;
            const subjectOverview = experience.overview ?? subject.overview;

            return (
              <article
                key={subject.id}
                className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm transition-transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('rounded-2xl p-3', subject.bgColor)}>
                      <SubjectIcon className={cn('h-6 w-6', subject.color)} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{subject.name}</h3>
                      <p className="text-sm text-slate-500">{subjectDescription}</p>
                    </div>
                  </div>

                  <Link
                    href={buildStudySubjectHref(subject.id)}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    查看
                  </Link>
                </div>

                <p className="mt-4 text-sm leading-6 text-slate-600">{subjectOverview}</p>

                <div className="mt-5 space-y-2">
                  {subject.modules.map((module) => {
                    const experience = getStudyModuleExperience(subject.id, module.id);
                    const cardDescription = experience.cardDescription ?? module.description;
                    const cardStatus = getStudyModuleCardStatus(subject.id, module.id, module.status);
                    const cardStatusLabel = getStudyModuleCardStatusLabel(
                      subject.id,
                      module.id,
                      module.status,
                      getModuleStatusLabel(module.status)
                    );

                    return (
                      <Link
                        key={module.id}
                        href={buildStudyModuleHref(subject.id, module.id)}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 transition-colors hover:bg-slate-50"
                      >
                        <div>
                          <div className="text-sm font-medium text-slate-900">{module.title}</div>
                          <div className="mt-1 text-xs text-slate-500">{cardDescription}</div>
                        </div>
                        <span className={cn('rounded-full px-2 py-1 text-[11px] font-medium', getStatusClasses(cardStatus))}>
                          {cardStatusLabel}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-slate-900">后续扩展学科</h2>
        <p className="mt-1 text-sm text-slate-500">核心链路稳定后再接入。</p>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {futureSubjects.map((subject) => {
            const SubjectIcon = subject.icon;
            const experience = getStudySubjectExperience(subject.id);
            const subjectDescription = experience.description ?? subject.description;

            return (
              <article
                key={subject.id}
                className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={cn('rounded-2xl p-3', subject.bgColor)}>
                      <SubjectIcon className={cn('h-6 w-6', subject.color)} />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">{subject.name}</h3>
                      <p className="text-sm text-slate-500">{subjectDescription}</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">后续接入</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

    </div>
  );
}
