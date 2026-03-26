import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import {
  buildGuidedReflectionSteps,
  createEmptyGuidedReflectionState,
  type GuidedReflectionState,
} from '@/lib/error-loop/reflection';
import {
  ROOT_CAUSE_CATEGORY_LABELS,
  getRootCauseSubtypeOption,
  type RootCauseCategory,
  type RootCauseSubtype,
} from '@/lib/error-loop/taxonomy';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface DiagnosisRow {
  id: string;
  session_id: string;
  student_id: string;
  root_cause_category: RootCauseCategory;
  root_cause_subtype: RootCauseSubtype | null;
  root_cause_statement: string;
  fix_actions: string[] | null;
  guided_reflection: GuidedReflectionState | Record<string, unknown> | null;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Internal server error';
}

function normalizeGuidedReflection(value: DiagnosisRow['guided_reflection']): GuidedReflectionState {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return createEmptyGuidedReflectionState();
  }

  const raw = value as Record<string, unknown>;
  const steps = Array.isArray(raw.steps) ? raw.steps.filter((item) => item && typeof item === 'object') : [];

  return {
    current_step:
      Number.isFinite(raw.current_step) && Number(raw.current_step) >= 0 ? Number(raw.current_step) : 0,
    completed: raw.completed === true,
    steps: steps.map((item) => item as GuidedReflectionState['steps'][number]),
    student_summary: typeof raw.student_summary === 'string' ? raw.student_summary : null,
    updated_at: typeof raw.updated_at === 'string' ? raw.updated_at : undefined,
  };
}

function buildStudentSummary({
  rootCauseCategory,
  rootCauseSubtype,
  rootCauseStatement,
  reflection,
  fixActions,
}: {
  rootCauseCategory: RootCauseCategory;
  rootCauseSubtype: RootCauseSubtype | null;
  rootCauseStatement: string;
  reflection: GuidedReflectionState;
  fixActions: string[];
}) {
  const answerMap = new Map(reflection.steps.map((item) => [item.key, item.answer]));
  const replay = answerMap.get('replay_error_moment') || '我当时是按习惯直接下手的。';
  const breakpoint = answerMap.get('find_breakpoint') || '真正容易断掉的是关键条件或关键步骤。';
  const rootPattern = answerMap.get('locate_root_pattern') || rootCauseStatement;
  const nextAction = answerMap.get('commit_next_action') || fixActions.slice(0, 3).join('；');
  const subtypeLabel = rootCauseSubtype ? getRootCauseSubtypeOption(rootCauseSubtype)?.label ?? rootCauseSubtype : null;

  return [
    `这道题的问题不只是表面出错，我的核心根因更接近「${ROOT_CAUSE_CATEGORY_LABELS[rootCauseCategory]}」${
      subtypeLabel ? `里的「${subtypeLabel}」` : ''
    }。`,
    `回到当时，我的第一反应是：${replay}`,
    `真正会让我再次出错的断点是：${breakpoint}`,
    `更深一层的稳定模式是：${rootPattern}`,
    `下次遇到同类题，我先执行这些动作：${nextAction || '先圈条件，再复述问题，最后复核目标。'}`,
  ].join('\n');
}

async function loadDiagnosis(sessionId: string, studentId: string) {
  const { data, error } = await supabase
    .from('error_diagnoses')
    .select(
      'id, session_id, student_id, root_cause_category, root_cause_subtype, root_cause_statement, fix_actions, guided_reflection',
    )
    .eq('session_id', sessionId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as DiagnosisRow | null;
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id');
    const studentId = req.nextUrl.searchParams.get('student_id');

    if (!sessionId || !studentId) {
      return NextResponse.json({ error: 'Missing required query params: session_id, student_id' }, { status: 400 });
    }

    const diagnosis = await loadDiagnosis(sessionId, studentId);

    if (!diagnosis?.id) {
      return NextResponse.json({ error: 'Structured diagnosis is required before guided reflection' }, { status: 404 });
    }

    const reflection = normalizeGuidedReflection(diagnosis.guided_reflection);
    const stepDefinitions = buildGuidedReflectionSteps({
      category: diagnosis.root_cause_category,
      subtype: diagnosis.root_cause_subtype,
    });
    const nextStep =
      reflection.completed ? null : stepDefinitions[Math.min(reflection.current_step, stepDefinitions.length - 1)];

    return NextResponse.json({
      success: true,
      data: {
        guided_reflection: reflection,
        next_step: reflection.current_step,
        next_question: nextStep ?? null,
        is_ready_to_summarize: reflection.completed,
        student_summary: reflection.student_summary,
        diagnosis_snapshot: {
          root_cause_category: diagnosis.root_cause_category,
          root_cause_subtype: diagnosis.root_cause_subtype,
          root_cause_subtype_label: diagnosis.root_cause_subtype
            ? getRootCauseSubtypeOption(diagnosis.root_cause_subtype)?.label ?? null
            : null,
          root_cause_statement: diagnosis.root_cause_statement,
          fix_actions: diagnosis.fix_actions || [],
        },
      },
    });
  } catch (error: unknown) {
    console.error('[error-session/guided-reflection] GET API error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, student_id, current_step, student_answer } = body ?? {};

    if (!session_id || !student_id) {
      return NextResponse.json({ error: 'Missing required fields: session_id, student_id' }, { status: 400 });
    }

    const diagnosis = await loadDiagnosis(session_id, student_id);

    if (!diagnosis?.id) {
      return NextResponse.json({ error: 'Structured diagnosis is required before guided reflection' }, { status: 404 });
    }

    const reflection = normalizeGuidedReflection(diagnosis.guided_reflection);
    const stepDefinitions = buildGuidedReflectionSteps({
      category: diagnosis.root_cause_category,
      subtype: diagnosis.root_cause_subtype,
    });

    if (reflection.completed) {
      return NextResponse.json({
        success: true,
        data: {
          guided_reflection: reflection,
          next_step: null,
          next_question: null,
          is_ready_to_summarize: true,
          student_summary: reflection.student_summary,
        },
      });
    }

    const normalizedStep =
      Number.isFinite(current_step) && Number(current_step) >= 0
        ? Math.min(Number(current_step), stepDefinitions.length - 1)
        : Math.min(reflection.current_step, stepDefinitions.length - 1);

    if (typeof student_answer !== 'string' || !student_answer.trim()) {
      return NextResponse.json({ error: 'student_answer is required' }, { status: 400 });
    }

    const stepDefinition = stepDefinitions[normalizedStep];
    const nextSteps = [...reflection.steps];

    nextSteps[normalizedStep] = {
      key: stepDefinition.key,
      title: stepDefinition.title,
      question: stepDefinition.question,
      answer: student_answer.trim(),
      answered_at: new Date().toISOString(),
    };

    const nextStepIndex = normalizedStep + 1;
    const completed = nextStepIndex >= stepDefinitions.length;
    const updatedReflection: GuidedReflectionState = {
      current_step: completed ? stepDefinitions.length - 1 : nextStepIndex,
      completed,
      steps: nextSteps,
      student_summary: completed
        ? buildStudentSummary({
            rootCauseCategory: diagnosis.root_cause_category,
            rootCauseSubtype: diagnosis.root_cause_subtype,
            rootCauseStatement: diagnosis.root_cause_statement,
            reflection: {
              ...reflection,
              steps: nextSteps,
              completed: true,
            },
            fixActions: diagnosis.fix_actions || [],
          })
        : null,
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await supabase
      .from('error_diagnoses')
      .update({
        guided_reflection: updatedReflection,
      })
      .eq('id', diagnosis.id)
      .eq('student_id', student_id);

    if (updateError) {
      console.error('[error-session/guided-reflection] Failed to persist reflection state:', updateError);
      return NextResponse.json({ error: 'Failed to save guided reflection' }, { status: 500 });
    }

    const nextQuestion = completed ? null : stepDefinitions[nextStepIndex];

    return NextResponse.json({
      success: true,
      data: {
        guided_reflection: updatedReflection,
        next_step: completed ? null : nextStepIndex,
        next_question: nextQuestion,
        is_ready_to_summarize: completed,
        student_summary: updatedReflection.student_summary,
      },
    });
  } catch (error: unknown) {
    console.error('[error-session/guided-reflection] POST API error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
