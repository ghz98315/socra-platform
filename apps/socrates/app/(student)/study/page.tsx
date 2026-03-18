import Link from 'next/link';
import { BookOpenCheck } from 'lucide-react';

import {
  buildStudyModuleHref,
  buildStudySubjectHref,
  getModuleStatusLabel,
  getStudySubjects,
} from '@/lib/study/catalog';
import { DevelopmentProgressSectionV2 } from '@/components/study/DevelopmentProgressSectionV2';
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
        <p className="text-xs font-medium uppercase tracking-[0.28em] text-warm-500">Learning Center</p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900 lg:text-4xl">Socrates 学习中心</h1>
            <p className="mt-3 text-sm leading-7 text-slate-600 lg:text-base">
              用统一学习入口承接数学、语文、英语三科，再按学科拆出各自的分析、写作、听力和复习模块。当前优先把三科的录题分析做稳，再逐步接入作文、阅读、听力和专项训练。
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/study/history"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              <BookOpenCheck className="h-4 w-4" />
              查看统一学习记录
            </Link>

            <div className="grid grid-cols-2 gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600 sm:grid-cols-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">3</div>
                <div>核心学科</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900">8+</div>
                <div>规划模块</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900">1</div>
                <div>统一入口</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900">N</div>
                <div>长期扩展</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">当前重点学科</h2>
            <p className="mt-1 text-sm text-slate-500">先把数学、语文、英语做成真正可持续使用的学习主入口。</p>
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
        <p className="mt-1 text-sm text-slate-500">等三科核心链路稳定后，再把扩展学科接入同一套学习域。</p>

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

      <DevelopmentProgressSectionV2 />
    </div>
  );
}
