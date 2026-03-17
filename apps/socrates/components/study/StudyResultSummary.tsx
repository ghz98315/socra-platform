import { Sparkles } from 'lucide-react';

import { buildStudyResultSections, type StudyResultSection } from '@/lib/study/result-summary';

interface StudyResultSummaryProps {
  module?: string;
  content?: string;
  sections?: StudyResultSection[];
  title?: string;
  description?: string;
}

export function StudyResultSummary({
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

  return (
    <section className="rounded-[24px] border border-red-200 bg-red-50/70 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
        <Sparkles className="h-4 w-4 text-red-600" />
        {title}
      </div>
      {description ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      ) : null}

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {normalizedSections.map((section) => (
          <article key={section.id} className="rounded-2xl border border-red-200 bg-white/85 p-4">
            <h3 className="text-sm font-medium text-slate-900">{section.title}</h3>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
              {section.content}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
