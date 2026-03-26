import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  ROOT_CAUSE_CATEGORY_OPTIONS,
  ROOT_CAUSE_PATTERN_HINT,
  VALID_ERROR_LOOP_SUBJECTS,
  getRootCauseSubtypeOption,
  isCarelessnessLike,
  isValidRootCauseSubtype,
} from '@/lib/error-loop/taxonomy';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const VALID_SUBJECTS = new Set(VALID_ERROR_LOOP_SUBJECTS);
const VALID_ROOT_CAUSE_CATEGORIES = new Set(ROOT_CAUSE_CATEGORY_OPTIONS.map((option) => option.value));
const SURFACE_ONLY_TERMS = new Set(['粗心', '马虎', '不认真', 'careless', 'carelessness']);

function normalizeStringList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

function normalizeObjectList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item) => item && typeof item === 'object');
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Internal server error';
}

function assertMeaningfulRootCause({
  surfaceLabels,
  rootCauseStatement,
  rootCauseDepth,
}: {
  surfaceLabels: string[];
  rootCauseStatement: string;
  rootCauseDepth: number;
}) {
  const normalizedStatement = rootCauseStatement.trim().toLowerCase();
  const containsSurfaceOnlyLabel =
    surfaceLabels.some((label) => SURFACE_ONLY_TERMS.has(label.trim().toLowerCase()) || isCarelessnessLike(label)) &&
    !ROOT_CAUSE_PATTERN_HINT.test(rootCauseStatement);
  const statementIsSurfaceOnly = SURFACE_ONLY_TERMS.has(normalizedStatement) || isCarelessnessLike(normalizedStatement);

  if (rootCauseDepth <= 1) {
    throw new Error('root_cause_depth must be greater than 1. Surface-level labels are not enough.');
  }

  if (statementIsSurfaceOnly) {
    throw new Error(
      'root_cause_statement cannot stop at a surface label like carelessness. It must describe the underlying pattern.',
    );
  }

  if (
    containsSurfaceOnlyLabel &&
    !/习惯|检查|策略|审题|概念|知识|注意力|焦虑|pattern|habit|strategy|reading|concept|knowledge|attention/i.test(
      rootCauseStatement,
    )
  ) {
    throw new Error(
      'When the surface label is carelessness, the root cause must continue down to a behavior, strategy, knowledge, or attention pattern.',
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id');
    const studentId = req.nextUrl.searchParams.get('student_id');

    if (!sessionId || !studentId) {
      return NextResponse.json({ error: 'Missing required query params: session_id, student_id' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('error_diagnoses')
      .select('*')
      .eq('session_id', sessionId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (error) {
      console.error('[error-session/diagnose] Failed to fetch diagnosis:', error);
      return NextResponse.json({ error: 'Failed to fetch structured diagnosis' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data
        ? {
            ...data,
            root_cause_subtype_label: getRootCauseSubtypeOption(data.root_cause_subtype)?.label ?? null,
          }
        : null,
    });
  } catch (error: unknown) {
    console.error('[error-session/diagnose] GET API error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      session_id,
      student_id,
      subject,
      surface_labels,
      surface_error,
      root_cause_category,
      root_cause_subtype,
      root_cause_statement,
      root_cause_depth,
      why_chain,
      evidence,
      fix_actions,
      knowledge_tags,
      habit_tags,
      risk_flags,
    } = body ?? {};

    if (
      !session_id ||
      !student_id ||
      !subject ||
      !surface_error ||
      !root_cause_category ||
      !root_cause_subtype ||
      !root_cause_statement
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: session_id, student_id, subject, surface_error, root_cause_category, root_cause_subtype, root_cause_statement',
        },
        { status: 400 },
      );
    }

    if (!VALID_SUBJECTS.has(subject)) {
      return NextResponse.json({ error: `Unsupported subject: ${subject}` }, { status: 400 });
    }

    if (!VALID_ROOT_CAUSE_CATEGORIES.has(root_cause_category)) {
      return NextResponse.json({ error: `Unsupported root_cause_category: ${root_cause_category}` }, { status: 400 });
    }

    if (!isValidRootCauseSubtype(root_cause_category, root_cause_subtype)) {
      return NextResponse.json(
        { error: `Unsupported root_cause_subtype for ${root_cause_category}: ${root_cause_subtype}` },
        { status: 400 },
      );
    }

    const normalizedSurfaceLabels = normalizeStringList(surface_labels);
    const normalizedWhyChain = normalizeObjectList(why_chain);
    const normalizedEvidence = normalizeStringList(evidence);
    const normalizedFixActions = normalizeStringList(fix_actions);
    const normalizedKnowledgeTags = normalizeStringList(knowledge_tags);
    const normalizedHabitTags = normalizeStringList(habit_tags);
    const normalizedRiskFlags = normalizeStringList(risk_flags);
    const normalizedDepth =
      Number.isFinite(root_cause_depth) && Number(root_cause_depth) >= 1 ? Number(root_cause_depth) : 1;

    if (normalizedWhyChain.length === 0) {
      return NextResponse.json({ error: 'why_chain must contain at least one structured reasoning step' }, { status: 400 });
    }

    assertMeaningfulRootCause({
      surfaceLabels: normalizedSurfaceLabels,
      rootCauseStatement: String(root_cause_statement),
      rootCauseDepth: normalizedDepth,
    });

    const { data: session, error: sessionError } = await supabase
      .from('error_sessions')
      .select('id, student_id, subject')
      .eq('id', session_id)
      .maybeSingle();

    if (sessionError) {
      console.error('[error-session/diagnose] Failed to load session:', sessionError);
      return NextResponse.json({ error: 'Failed to load error session' }, { status: 500 });
    }

    if (!session?.id || session.student_id !== student_id) {
      return NextResponse.json({ error: 'Error session not found for this student' }, { status: 404 });
    }

    const diagnosisPayload = {
      session_id,
      student_id,
      subject,
      surface_labels: normalizedSurfaceLabels,
      surface_error: String(surface_error).trim(),
      root_cause_category,
      root_cause_subtype,
      root_cause_statement: String(root_cause_statement).trim(),
      root_cause_depth: normalizedDepth,
      why_chain: normalizedWhyChain,
      evidence: normalizedEvidence,
      fix_actions: normalizedFixActions,
      knowledge_tags: normalizedKnowledgeTags,
      habit_tags: normalizedHabitTags,
      risk_flags: normalizedRiskFlags,
    };

    const { data: diagnosis, error: diagnosisError } = await supabase
      .from('error_diagnoses')
      .upsert(diagnosisPayload, { onConflict: 'session_id' })
      .select('*')
      .single();

    if (diagnosisError) {
      console.error('[error-session/diagnose] Failed to save diagnosis:', diagnosisError);
      return NextResponse.json({ error: 'Failed to save structured diagnosis' }, { status: 500 });
    }

    const { error: sessionUpdateError } = await supabase
      .from('error_sessions')
      .update({
        primary_root_cause_category: root_cause_category,
        primary_root_cause_subtype: root_cause_subtype,
        primary_root_cause_statement: String(root_cause_statement).trim(),
        closure_state: 'open',
      })
      .eq('id', session_id)
      .eq('student_id', student_id);

    if (sessionUpdateError) {
      console.error('[error-session/diagnose] Failed to update error session root cause fields:', sessionUpdateError);
      return NextResponse.json({ error: 'Diagnosis saved, but session root cause update failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...diagnosis,
        root_cause_subtype_label: getRootCauseSubtypeOption(diagnosis.root_cause_subtype)?.label ?? null,
      },
    });
  } catch (error: unknown) {
    console.error('[error-session/diagnose] API error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
