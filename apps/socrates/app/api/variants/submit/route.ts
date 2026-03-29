import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { summarizeVariantEvidence } from '@/lib/error-loop/variant-evidence';
import { evaluateVariantAnswer } from '@/lib/variant-questions/evaluate-answer';
import type { VariantQuestion } from '@/lib/variant-questions/types';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key);
}

async function buildSessionSummary(admin: any, studentId: string, sessionId: string) {
  const { data: sessionVariants, error: sessionVariantsError } = await (admin as any)
    .from('variant_questions')
    .select('*')
    .eq('student_id', studentId)
    .eq('original_session_id', sessionId)
    .order('created_at', { ascending: false });

  if (sessionVariantsError) {
    throw new Error(sessionVariantsError.message);
  }

  const questions = ((sessionVariants || []) as VariantQuestion[]).map((question) => ({
    id: question.id,
    status: question.status,
    attempts: question.attempts,
    correct_attempts: question.correct_attempts,
    last_practiced_at: question.last_practiced_at || null,
    completed_at: question.completed_at || null,
    created_at: question.created_at || null,
  }));
  const variantIds = questions.map((question) => question.id).filter(Boolean);

  if (variantIds.length === 0) {
    return summarizeVariantEvidence({ questions: [], logs: [] });
  }

  const { data: practiceLogs, error: practiceLogsError } = await (admin as any)
    .from('variant_practice_logs')
    .select('variant_id, is_correct, hints_used, created_at')
    .in('variant_id', variantIds);

  if (practiceLogsError) {
    throw new Error(practiceLogsError.message);
  }

  return summarizeVariantEvidence({
    questions,
    logs: (practiceLogs || []) as Array<{
      variant_id: string;
      is_correct: boolean | null;
      hints_used: number | null;
      created_at: string | null;
    }>,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { variant_id, student_id, student_answer, time_spent, hints_used } = body;

    if (!variant_id || !student_id || typeof student_answer !== 'string') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const normalizedHintsUsed = Math.max(0, Number(hints_used) || 0);
    const normalizedTimeSpent = Math.max(0, Number(time_spent) || 0);

    const { data: currentVariant, error: variantError } = await (admin as any)
      .from('variant_questions')
      .select('*')
      .eq('id', variant_id)
      .single();

    if (variantError || !currentVariant) {
      return NextResponse.json({ error: variantError?.message || 'Variant not found' }, { status: 404 });
    }

    if (currentVariant.student_id !== student_id) {
      return NextResponse.json({ error: 'Variant does not belong to student' }, { status: 403 });
    }

    const evaluation = evaluateVariantAnswer({
      expectedAnswer: currentVariant.answer || '',
      studentAnswer: student_answer,
    });
    const independentSuccess = evaluation.is_correct && normalizedHintsUsed === 0;

    const { error: logError } = await (admin as any)
      .from('variant_practice_logs')
      .insert({
        variant_id,
        student_id,
        is_correct: evaluation.is_correct,
        student_answer,
        time_spent: normalizedTimeSpent,
        hints_used: normalizedHintsUsed,
      });

    if (logError) {
      return NextResponse.json({ error: logError.message }, { status: 500 });
    }

    const { data: updatedVariant, error: updatedVariantError } = await (admin as any)
      .from('variant_questions')
      .select('*')
      .eq('id', variant_id)
      .single();

    if (updatedVariantError || !updatedVariant) {
      return NextResponse.json({ error: updatedVariantError?.message || 'Failed to load updated variant' }, { status: 500 });
    }

    const summary = await buildSessionSummary(admin, student_id, currentVariant.original_session_id);

    return NextResponse.json({
      success: true,
      data: updatedVariant,
      practice_result: {
        variant_id,
        student_answer,
        hints_used: normalizedHintsUsed,
        time_spent: normalizedTimeSpent,
        is_correct: evaluation.is_correct,
        independent_success: independentSuccess,
        counts_as_transfer_evidence: independentSuccess,
        evidence_label: independentSuccess
          ? '已形成独立迁移证据'
          : evaluation.is_correct
            ? `做对了，但用了 ${normalizedHintsUsed} 次提示，本次不算独立迁移证据`
            : '本次还没有形成迁移证据',
        evaluation,
      },
      summary,
    });
  } catch (error: any) {
    console.error('Variant submit error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
