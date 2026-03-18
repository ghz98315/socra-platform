import { Sparkles } from 'lucide-react';

import {
  buildStudyResultSections,
  type StudyResultSection,
} from '@/lib/study/result-summary-clean';
import { cn } from '@/lib/utils';

interface StudyResultSummaryProps {
  module?: string;
  content?: string;
  sections?: StudyResultSection[];
  title?: string;
  description?: string;
}

const summaryThemes: Record<
  string,
  {
    shell: string;
    badge: string;
    leadCard: string;
    card: string;
    icon: string;
  }
> = {
  reading: {
    shell: 'border-red-200 bg-gradient-to-br from-red-50 via-white to-orange-50',
    badge: 'bg-red-100 text-red-700',
    leadCard: 'border-red-200 bg-white/95',
    card: 'border-red-100 bg-white/90',
    icon: 'text-red-600',
  },
  foundation: {
    shell: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50',
    badge: 'bg-amber-100 text-amber-700',
    leadCard: 'border-amber-200 bg-white/95',
    card: 'border-amber-100 bg-white/90',
    icon: 'text-amber-600',
  },
  listening: {
    shell: 'border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50',
    badge: 'bg-sky-100 text-sky-700',
    leadCard: 'border-sky-200 bg-white/95',
    card: 'border-sky-100 bg-white/90',
    icon: 'text-sky-600',
  },
  default: {
    shell: 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-slate-100',
    badge: 'bg-slate-100 text-slate-700',
    leadCard: 'border-slate-200 bg-white/95',
    card: 'border-slate-200 bg-white/90',
    icon: 'text-slate-700',
  },
};

function getTheme(module?: string) {
  if (!module) {
    return summaryThemes.default;
  }

  return summaryThemes[module] || summaryThemes.default;
}

export function StudyResultSummaryV2({
  module,
  content,
  sections,
  title = '结果摘要',
  description,
}: StudyResultSummaryProps) {
  const normalizedSections =
    sections && sections.length > 0
      ? sections
      : module && content
        ? buildStudyResultSections(module, content)
        : [];

  if (normalizedSections.length === 0) {
    return null;
  }

  const theme = getTheme(module);
  const [leadSection, ...restSections] = normalizedSections;

  return (
    <section className={cn('rounded-[28px] border p-5 shadow-sm', theme.shell)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <Sparkles className={cn('h-4 w-4', theme.icon)} />
            {title}
          </div>
          {description ? (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
          ) : null}
        </div>
        <div className={cn('rounded-full px-3 py-1 text-xs font-medium', theme.badge)}>
          结构化结果
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <article className={cn('rounded-[24px] border p-5', theme.leadCard)}>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            首要结论
          </div>
          <h3 className="mt-2 text-lg font-semibold text-slate-900">{leadSection.title}</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {leadSection.content}
          </p>
        </article>

        {restSections.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {restSections.map((section) => (
              <article key={section.id} className={cn('rounded-[22px] border p-4', theme.card)}>
                <h3 className="text-sm font-medium text-slate-900">{section.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                  {section.content}
                </p>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
