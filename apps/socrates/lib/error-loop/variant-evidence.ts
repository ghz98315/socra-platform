import type { AttemptMode } from '@/lib/error-loop/review';

export type VariantQuestionEvidenceRow = {
  id: string;
  status: string | null;
  attempts: number | null;
  correct_attempts: number | null;
  last_practiced_at: string | null;
  completed_at: string | null;
  created_at: string | null;
};

export type VariantPracticeLogEvidenceRow = {
  variant_id: string;
  is_correct: boolean | null;
  hints_used: number | null;
  created_at: string | null;
};

export type VariantEvidenceSummary = {
  total_variants: number;
  practiced_variants: number;
  successful_variants: number;
  independent_success_variants: number;
  latest_practiced_at: string | null;
  qualified_transfer_evidence: boolean;
  recommended_attempt_mode: AttemptMode;
  missing_reason: string | null;
  evidence_label: string;
};

function compareIsoDesc(left: string | null | undefined, right: string | null | undefined) {
  return new Date(right || 0).getTime() - new Date(left || 0).getTime();
}

export function summarizeVariantEvidence(input: {
  questions: VariantQuestionEvidenceRow[];
  logs: VariantPracticeLogEvidenceRow[];
}): VariantEvidenceSummary {
  const questions = input.questions || [];
  const logs = input.logs || [];
  const practicedVariantIds = new Set(
    questions
      .filter(
        (question) =>
          (question.attempts ?? 0) > 0 ||
          Boolean(question.last_practiced_at) ||
          (question.status && question.status !== 'pending'),
      )
      .map((question) => question.id),
  );
  const successfulVariantIds = new Set(
    questions.filter((question) => (question.correct_attempts ?? 0) > 0).map((question) => question.id),
  );
  const sortedLogs = [...logs].sort((left, right) => compareIsoDesc(left.created_at, right.created_at));
  const independentSuccessVariantIds = new Set(
    sortedLogs
      .filter((log) => log.is_correct === true && Math.max(0, Number(log.hints_used) || 0) === 0)
      .map((log) => log.variant_id),
  );

  for (const log of sortedLogs) {
    practicedVariantIds.add(log.variant_id);
    if (log.is_correct === true) {
      successfulVariantIds.add(log.variant_id);
    }
  }

  const latestPracticedAt = [...questions]
    .map((question) => question.last_practiced_at || question.completed_at || question.created_at)
    .concat(sortedLogs.map((log) => log.created_at))
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .sort(compareIsoDesc)[0] ?? null;

  const practicedVariants = practicedVariantIds.size;
  const successfulVariants = successfulVariantIds.size;
  const independentSuccessVariants = independentSuccessVariantIds.size;
  const qualifiedTransferEvidence = independentSuccessVariants > 0;
  const missingReason = qualifiedTransferEvidence
    ? null
    : practicedVariants === 0
      ? '系统还没有记录到真实变式练习。'
      : '已有变式练习，但还没有独立做对的证据。';

  return {
    total_variants: questions.length,
    practiced_variants: practicedVariants,
    successful_variants: successfulVariants,
    independent_success_variants: independentSuccessVariants,
    latest_practiced_at: latestPracticedAt,
    qualified_transfer_evidence: qualifiedTransferEvidence,
    recommended_attempt_mode: qualifiedTransferEvidence ? 'mixed' : 'variant',
    missing_reason: missingReason,
    evidence_label: qualifiedTransferEvidence
      ? `已记录 ${independentSuccessVariants} 道独立通过的变式题。`
      : practicedVariants > 0
        ? `已记录 ${practicedVariants} 道变式练习，但还没有独立通过证据。`
        : '暂无真实变式练习记录。',
  };
}
