import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callModelById } from '@/lib/ai-models/service';
import { normalizeModelSelection } from '@/lib/ai-models/config';
import { isConfusionMessage } from '@/lib/chat/mock-response';
import {
  ROOT_CAUSE_CATEGORY_LABELS,
  ROOT_CAUSE_CATEGORY_OPTIONS,
  getRootCauseSubtypeOption,
  isValidRootCauseSubtype,
  type RootCauseCategory,
  type RootCauseSubtype,
} from '@/lib/error-loop/taxonomy';
import {
  buildMissingMathErrorLoopMigrationResponse,
  isMissingMathErrorLoopMigrationError,
} from '@/lib/error-loop/migration-guard';
import {
  buildStatusFromMessages,
  readLastUserMessage,
  selectHeuristicRootCause,
  showsIndependentReasoning,
  stripTranscript,
  type WrapUpStatus,
} from '@/lib/error-loop/wrap-up-heuristics';
import {
  createAuthorizedStudentErrorResponse,
  getAuthorizedStudentProfile,
} from '@/lib/server/route-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type ChatMessageRow = {
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
};

type ErrorSessionRow = {
  id: string;
  student_id: string;
  subject: string | null;
  extracted_text: string | null;
  difficulty_rating: number | null;
  concept_tags: string[] | null;
};

type WrapUpSuggestion = {
  status: WrapUpStatus;
  title: string;
  summary: string;
  evidence_summary: string;
  suggested_root_cause_category: RootCauseCategory;
  suggested_root_cause_subtype: RootCauseSubtype;
  suggested_difficulty_rating: number;
  user_message_count: number;
  assistant_message_count: number;
};

const WRAP_UP_MODEL_TIMEOUT_MS = 2500;

function clampDifficulty(value: number) {
  return Math.max(1, Math.min(5, Math.round(value)));
}

function calculateFinalDifficulty(aiRating: number | null, selectedRating: number) {
  const ai = aiRating || 3;
  return Math.round((ai * 0.6 + selectedRating * 0.4) * 2) / 2;
}

function buildHeuristicSuggestion(session: ErrorSessionRow, messages: ChatMessageRow[]): WrapUpSuggestion {
  const transcript = stripTranscript(messages.map((message) => `${message.role}: ${message.content}`).join('\n'));
  const lastUserMessage = readLastUserMessage(messages);
  const hasEarlierConfusion = messages
    .filter((message) => message.role === 'user')
    .slice(0, -1)
    .some((message) => isConfusionMessage(message.content));
  let rootCause = selectHeuristicRootCause(messages);
  const statusInfo = buildStatusFromMessages(messages);
  const userMessages = messages.filter((message) => message.role === 'user');
  const assistantMessages = messages.filter((message) => message.role === 'assistant');

  if (
    rootCause.category === 'pseudo_mastery' &&
    rootCause.subtype === 'prompt_dependency' &&
    showsIndependentReasoning(lastUserMessage)
  ) {
    rootCause = hasEarlierConfusion
      ? { category: 'strategy_gap', subtype: 'no_entry_strategy' }
      : { category: 'calculation_execution', subtype: 'sign_operation_slip' };
  }

  let suggestedDifficulty = session.difficulty_rating || 3;
  if (userMessages.filter((message) => isConfusionMessage(message.content)).length >= 2) {
    suggestedDifficulty += 1;
  }
  if (/(?:太难|卡住很久|完全不会)/u.test(transcript)) {
    suggestedDifficulty += 1;
  }
  if (/(?:会了|懂了|明白了)/u.test(lastUserMessage)) {
    suggestedDifficulty -= 1;
  }

  const subtypeLabel = getRootCauseSubtypeOption(rootCause.subtype)?.label || rootCause.subtype;

  return {
    ...statusInfo,
    evidence_summary: `本次对话共 ${userMessages.length} 轮学生输入，系统当前更倾向于“${ROOT_CAUSE_CATEGORY_LABELS[rootCause.category]} / ${subtypeLabel}”。`,
    suggested_root_cause_category: rootCause.category,
    suggested_root_cause_subtype: rootCause.subtype,
    suggested_difficulty_rating: clampDifficulty(suggestedDifficulty),
    user_message_count: userMessages.length,
    assistant_message_count: assistantMessages.length,
  };
}

function reconcileSuggestion(
  heuristicSuggestion: WrapUpSuggestion,
  modelSuggestion: WrapUpSuggestion | null,
  messages: ChatMessageRow[],
) {
  if (!modelSuggestion) {
    return heuristicSuggestion;
  }

  const lastUserMessage = readLastUserMessage(messages);
  const hasIndependentReasoning = showsIndependentReasoning(lastUserMessage);
  const modelLooksLikePromptDependency =
    modelSuggestion.suggested_root_cause_category === 'pseudo_mastery' &&
    modelSuggestion.suggested_root_cause_subtype === 'prompt_dependency';

  if (hasIndependentReasoning && modelLooksLikePromptDependency) {
    return {
      ...modelSuggestion,
      suggested_root_cause_category: heuristicSuggestion.suggested_root_cause_category,
      suggested_root_cause_subtype: heuristicSuggestion.suggested_root_cause_subtype,
      evidence_summary: heuristicSuggestion.evidence_summary,
    } satisfies WrapUpSuggestion;
  }

  if (
    hasIndependentReasoning &&
    heuristicSuggestion.status === 'ready_to_wrap' &&
    modelSuggestion.status !== 'ready_to_wrap'
  ) {
    return {
      ...modelSuggestion,
      status: heuristicSuggestion.status,
      title: heuristicSuggestion.title,
      summary: heuristicSuggestion.summary,
    } satisfies WrapUpSuggestion;
  }

  return modelSuggestion;
}

function buildWrapUpPrompt(session: ErrorSessionRow, messages: ChatMessageRow[]) {
  const categoryOptions = ROOT_CAUSE_CATEGORY_OPTIONS.map((option) => `${option.value}: ${option.label}`).join('\n');
  const transcript = messages
    .map((message) => `${message.role === 'assistant' ? 'Tutor' : 'Student'}: ${message.content}`)
    .join('\n');

  return `You are evaluating whether a tutoring chat can be wrapped up and what should be filed into an error book.

Return strict JSON with this schema:
{
  "status": "ongoing" | "ready_to_wrap" | "needs_more_clarification",
  "title": "short Chinese title",
  "summary": "short Chinese summary",
  "evidence_summary": "short Chinese evidence summary",
  "suggested_root_cause_category": "one category value",
  "suggested_root_cause_subtype": "one subtype value",
  "suggested_difficulty_rating": 1-5 integer
}

Rules:
- Prefer "needs_more_clarification" when the student is still explicitly confused.
- Prefer "ready_to_wrap" only when the student has already shown a concrete answer path, explanation, or their own summary of the solution.
- Do not mark "ready_to_wrap" just because the tutor asked the student to summarize.
- Root cause must reflect why the student got stuck, not just the surface symptom.
- Do not classify the student as "prompt_dependency" if the student independently writes a concrete equation chain, explanation, or answer path.
- Difficulty is the student's felt difficulty for this round, not just OCR difficulty.
- Keep all returned Chinese text concise.

Session subject: ${session.subject || 'generic'}
Question text: ${session.extracted_text || ''}
Existing AI difficulty: ${session.difficulty_rating || 3}
Root cause category options:
${categoryOptions}

Transcript:
${transcript}`;
}

async function maybeBuildModelSuggestion(session: ErrorSessionRow, messages: ChatMessageRow[]) {
  const modelId = normalizeModelSelection(undefined, 'reasoning').id;
  const result = await callModelById(
    modelId,
    [
      {
        role: 'system',
        content: 'Return valid JSON only.',
      },
      {
        role: 'user',
        content: buildWrapUpPrompt(session, messages),
      },
    ],
    {
      temperature: 0.2,
      maxTokens: 700,
    },
  );

  if (!result.success || !result.content) {
    return null;
  }

  try {
    const parsed = JSON.parse(String(result.content).replace(/```json|```/g, '').trim()) as Partial<WrapUpSuggestion>;
    if (
      (parsed.status === 'ongoing' ||
        parsed.status === 'ready_to_wrap' ||
        parsed.status === 'needs_more_clarification') &&
      typeof parsed.title === 'string' &&
      typeof parsed.summary === 'string' &&
      typeof parsed.evidence_summary === 'string' &&
      typeof parsed.suggested_root_cause_category === 'string' &&
      typeof parsed.suggested_root_cause_subtype === 'string' &&
      isValidRootCauseSubtype(
        parsed.suggested_root_cause_category as RootCauseCategory,
        parsed.suggested_root_cause_subtype,
      )
    ) {
      const userMessages = messages.filter((message) => message.role === 'user');
      const assistantMessages = messages.filter((message) => message.role === 'assistant');

      return {
        status: parsed.status,
        title: parsed.title,
        summary: parsed.summary,
        evidence_summary: parsed.evidence_summary,
        suggested_root_cause_category: parsed.suggested_root_cause_category as RootCauseCategory,
        suggested_root_cause_subtype: parsed.suggested_root_cause_subtype as RootCauseSubtype,
        suggested_difficulty_rating: clampDifficulty(
          Number(parsed.suggested_difficulty_rating || session.difficulty_rating || 3),
        ),
        user_message_count: userMessages.length,
        assistant_message_count: assistantMessages.length,
      } satisfies WrapUpSuggestion;
    }
  } catch (error) {
    console.error('[error-session/wrap-up] Failed to parse model suggestion:', error);
  }

  return null;
}

async function maybeBuildModelSuggestionWithTimeout(session: ErrorSessionRow, messages: ChatMessageRow[]) {
  try {
    return await Promise.race([
      maybeBuildModelSuggestion(session, messages),
      new Promise<null>((resolve) => {
        setTimeout(() => resolve(null), WRAP_UP_MODEL_TIMEOUT_MS);
      }),
    ]);
  } catch (error) {
    console.error('[error-session/wrap-up] Model suggestion timed out or failed:', error);
    return null;
  }
}

async function loadSessionWithMessages(sessionId: string) {
  // Database types in this repo lag behind the deployed schema for these fields.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: session, error: sessionError } = await (supabase as any)
    .from('error_sessions')
    .select('id, student_id, subject, extracted_text, difficulty_rating, concept_tags')
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError) {
    if (isMissingMathErrorLoopMigrationError(sessionError)) {
      return { migrationError: buildMissingMathErrorLoopMigrationResponse('error-session.wrap-up.load-session') };
    }

    throw sessionError;
  }

  if (!session) {
    return { notFound: true as const };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: messages, error: messagesError } = await (supabase as any)
    .from('chat_messages')
    .select('role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw messagesError;
  }

  return {
    session: session as ErrorSessionRow,
    messages: (messages || []) as ChatMessageRow[],
  };
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Internal server error';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mode = 'preview',
      session_id,
      root_cause_category,
      root_cause_subtype,
      difficulty_rating,
    } = body ?? {};

    if (!session_id) {
      return NextResponse.json({ error: 'Missing required field: session_id' }, { status: 400 });
    }

    const loaded = await loadSessionWithMessages(session_id);
    if ('migrationError' in loaded && loaded.migrationError) {
      return loaded.migrationError;
    }
    if ('notFound' in loaded) {
      return NextResponse.json({ error: 'Error session not found' }, { status: 404 });
    }

    const { session, messages } = loaded;
    const authorizedStudent = await getAuthorizedStudentProfile(session.student_id);
    if ('error' in authorizedStudent) {
      return createAuthorizedStudentErrorResponse(authorizedStudent.error);
    }
    const studentId = authorizedStudent.profile.id;

    if (mode === 'preview') {
      const heuristicSuggestion = buildHeuristicSuggestion(session, messages);
      const modelSuggestion = await maybeBuildModelSuggestionWithTimeout(session, messages);
      const finalSuggestion = reconcileSuggestion(heuristicSuggestion, modelSuggestion, messages);

      return NextResponse.json({
        success: true,
        data: finalSuggestion,
      });
    }

    if (!root_cause_category || !root_cause_subtype || !difficulty_rating) {
      return NextResponse.json(
        { error: 'Missing required fields for submit: root_cause_category, root_cause_subtype, difficulty_rating' },
        { status: 400 },
      );
    }

    if (!isValidRootCauseSubtype(root_cause_category as RootCauseCategory, root_cause_subtype)) {
      return NextResponse.json({ error: 'Invalid root cause subtype for selected category' }, { status: 400 });
    }

    const selectedDifficulty = clampDifficulty(Number(difficulty_rating));
    const finalDifficulty = calculateFinalDifficulty(session.difficulty_rating, selectedDifficulty);
    const subtypeMeta = getRootCauseSubtypeOption(root_cause_subtype as RootCauseSubtype);
    const suggestion = buildHeuristicSuggestion(session, messages);
    const rootCauseStatement = [
      `对话收口建议归因为“${ROOT_CAUSE_CATEGORY_LABELS[root_cause_category as RootCauseCategory]}”`,
      subtypeMeta?.label ? `细分表现为“${subtypeMeta.label}”` : '',
      suggestion.evidence_summary,
    ]
      .filter(Boolean)
      .join('；');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('error_sessions')
      .update({
        student_difficulty_rating: selectedDifficulty,
        final_difficulty_rating: finalDifficulty,
        primary_root_cause_category: root_cause_category,
        primary_root_cause_subtype: root_cause_subtype,
        primary_root_cause_statement: rootCauseStatement,
        closure_state: 'open',
      })
      .eq('id', session_id)
      .eq('student_id', studentId);

    if (updateError) {
      console.error('[error-session/wrap-up] Failed to update error session:', updateError);
      if (isMissingMathErrorLoopMigrationError(updateError)) {
        return buildMissingMathErrorLoopMigrationResponse('error-session.wrap-up.submit');
      }

      return NextResponse.json({ error: 'Failed to submit wrap-up result' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        session_id,
        student_difficulty_rating: selectedDifficulty,
        final_difficulty_rating: finalDifficulty,
        primary_root_cause_category: root_cause_category,
        primary_root_cause_subtype: root_cause_subtype,
        primary_root_cause_statement: rootCauseStatement,
      },
    });
  } catch (error: unknown) {
    console.error('[error-session/wrap-up] API error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
