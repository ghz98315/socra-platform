import { redirect } from 'next/navigation';

import type { SubjectType } from '@/lib/study/catalog';

export default async function StudyProblemBridgePage({
  params,
  searchParams,
}: {
  params: Promise<{ subject: SubjectType }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { subject } = await params;
  const resolvedSearchParams = await searchParams;
  const next = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        next.append(key, item);
      }
      continue;
    }

    if (typeof value === 'string') {
      next.set(key, value);
    }
  }

  next.set('subject', subject);
  redirect(`/workbench?${next.toString()}`);
}
