import { NextResponse } from 'next/server';

export const MATH_ERROR_LOOP_MIGRATION = 'supabase/migrations/20260325_add_math_error_loop_v1_tables.sql';

const MATH_ERROR_LOOP_SCHEMA_MARKERS = [
  'review_attempts',
  'error_diagnoses',
  'closure_state',
  'primary_root_cause_category',
  'primary_root_cause_subtype',
  'primary_root_cause_statement',
  'mastery_state',
  'last_attempt_id',
  'last_judgement',
  'reopened_count',
  'next_interval_days',
];

function readErrorMessage(error: unknown) {
  if (!error || typeof error !== 'object') {
    return '';
  }

  const { message, details, hint } = error as {
    message?: unknown;
    details?: unknown;
    hint?: unknown;
  };

  return [message, details, hint]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join(' ')
    .toLowerCase();
}

export function isMissingMathErrorLoopMigrationError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = typeof (error as { code?: unknown }).code === 'string' ? (error as { code: string }).code : '';
  const message = readErrorMessage(error);
  const mentionsMathErrorLoopSchema = MATH_ERROR_LOOP_SCHEMA_MARKERS.some((marker) => message.includes(marker));
  const missingRelationOrColumn =
    code === 'PGRST204' ||
    code === 'PGRST205' ||
    code === '42703' ||
    code === '42P01' ||
    message.includes('schema cache') ||
    message.includes('could not find the table') ||
    message.includes('could not find the') ||
    message.includes('does not exist') ||
    message.includes('column') ||
    message.includes('relation');

  return mentionsMathErrorLoopSchema && missingRelationOrColumn;
}

export function buildMissingMathErrorLoopMigrationResponse(context: string) {
  return NextResponse.json(
    {
      error: 'Math error-loop storage is not ready in Supabase',
      code: 'missing_math_error_loop_migration',
      action: `Apply ${MATH_ERROR_LOOP_MIGRATION} to the target Supabase project, then retry the review-loop or transfer-evidence smoke.`,
      migration: MATH_ERROR_LOOP_MIGRATION,
      context,
    },
    { status: 500 },
  );
}
