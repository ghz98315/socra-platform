import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { summarizeVariantEvidence } from '@/lib/error-loop/variant-evidence';
import type { GenerateVariantRequest, VariantDifficulty, VariantQuestion } from '@/lib/variant-questions/types';

type VariantLogRow = {
  variant_id: string;
  is_correct: boolean | null;
  hints_used: number | null;
  created_at: string | null;
};

type ErrorSessionVariantContext = {
  geometry_data?: unknown;
  geometry_svg?: string | null;
};

const AI_BASE_URL =
  process.env.AI_BASE_URL_LOGIC ||
  process.env.DASHSCOPE_BASE_URL ||
  'https://dashscope.aliyuncs.com/compatible-mode/v1';
const AI_API_KEY = process.env.AI_API_KEY_LOGIC || process.env.DASHSCOPE_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL_LOGIC || 'qwen-plus';
const MAX_VARIANT_COUNT = 3;

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key);
}

function clampVariantCount(value: number | undefined) {
  const normalized = Number.isFinite(value) ? Math.round(Number(value)) : 2;
  return Math.min(MAX_VARIANT_COUNT, Math.max(1, normalized || 2));
}

function sanitizeText(value: unknown) {
  return typeof value === 'string' ? value.replace(/\r/g, '').trim() : '';
}

function sanitizeHints(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => sanitizeText(item))
    .filter(Boolean)
    .slice(0, 3);
}

function sanitizeConceptTags(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value.map((item) => sanitizeText(item)).filter(Boolean);
  return normalized.length > 0 ? normalized : fallback;
}

function isCompleteVariant(input: {
  question: string;
  solution: string;
  answer: string;
  hints: string[];
}) {
  return (
    input.question.length >= 12 &&
    input.solution.length >= 12 &&
    input.answer.length >= 1 &&
    input.hints.length >= 1
  );
}

function extractFirstJsonObject(content: string) {
  const trimmed = content.trim();
  const codeFenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = codeFenceMatch ? codeFenceMatch[1] : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return candidate.slice(start, end + 1);
}

function buildGeometryContext(context: ErrorSessionVariantContext) {
  const parts: string[] = [];

  if (context.geometry_data) {
    parts.push(`Geometry data: ${JSON.stringify(context.geometry_data).slice(0, 1800)}`);
  }

  if (typeof context.geometry_svg === 'string' && context.geometry_svg.trim()) {
    parts.push(`Geometry SVG excerpt: ${context.geometry_svg.trim().slice(0, 1800)}`);
  }

  return parts.join('\n');
}

function buildVariantPrompt(params: {
  subject: 'math' | 'physics' | 'chemistry';
  originalText: string;
  conceptTags: string[];
  difficulty: VariantDifficulty;
  count: number;
  geometryContext?: string;
  retry?: boolean;
}) {
  const subjectLabels: Record<string, string> = {
    math: 'mathematics',
    physics: 'physics',
    chemistry: 'chemistry',
  };

  const difficultyLabels: Record<VariantDifficulty, string> = {
    easy: 'Make the variant slightly easier than the original while keeping the same core concept.',
    medium: 'Keep roughly the same difficulty and same core concept, but change the setup enough to require transfer.',
    hard: 'Keep the same core concept, but increase transfer difficulty through changed conditions or combined steps.',
  };

  const geometrySection = params.geometryContext
    ? `Geometry context:\n${params.geometryContext}\nUse it to preserve meaningful geometric relationships when relevant.`
    : 'No extra geometry context was provided.';

  const retryRule = params.retry
    ? 'Previous output was incomplete. Every variant in this response must be fully complete.'
    : '';

  return `Generate ${params.count} complete ${subjectLabels[params.subject]} variant practice questions for a student.

${retryRule}

Original problem:
${params.originalText}

Concept tags:
${params.conceptTags.length > 0 ? params.conceptTags.join(', ') : 'None provided'}

Target difficulty:
${difficultyLabels[params.difficulty]}

${geometrySection}

Requirements:
1. Keep the same core concept as the original problem.
2. Each variant must be self-contained and solvable on its own.
3. Change the values, wording, givens, or setup enough that the student must transfer the method rather than recall the original answer.
4. For geometry, you may change the figure setup, but output text only. If the figure needs to change, describe the new figure clearly in the question text.
5. Provide 1 to 3 short hints.
6. Provide a full step-by-step solution.
7. Provide a concise final answer.
8. Return JSON only. No markdown, no commentary, no code fences.
9. Do not return partial or truncated variants.

Return exactly this schema:
{
  "variants": [
    {
      "question": "complete question text",
      "hints": ["hint 1", "hint 2"],
      "solution": "complete step-by-step solution",
      "answer": "final answer",
      "concepts": ["concept 1", "concept 2"]
    }
  ]
}`;
}

async function loadVariantContext(admin: any, sessionId: string) {
  const { data } = await (admin as any)
    .from('error_sessions')
    .select('geometry_data, geometry_svg')
    .eq('id', sessionId)
    .maybeSingle();

  return (data || {}) as ErrorSessionVariantContext;
}

async function callVariantModel(prompt: string, maxTokens: number) {
  if (!AI_API_KEY) {
    throw new Error('Missing AI API key for variant generation');
  }

  const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You generate complete practice variants. Return JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.4,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API call failed: ${response.status}`);
  }

  const result = await response.json();
  return String(result?.choices?.[0]?.message?.content || '');
}

function parseVariantResponse(params: {
  content: string;
  sessionId: string;
  studentId: string;
  subject: 'math' | 'physics' | 'chemistry';
  difficulty: VariantDifficulty;
  fallbackConceptTags: string[];
}) {
  const jsonText = extractFirstJsonObject(params.content);
  if (!jsonText) {
    return [] as VariantQuestion[];
  }

  const parsed = JSON.parse(jsonText) as {
    variants?: Array<{
      question?: unknown;
      hints?: unknown;
      solution?: unknown;
      answer?: unknown;
      concepts?: unknown;
    }>;
  };

  return (parsed.variants || []).reduce<VariantQuestion[]>((acc, item) => {
    const question = sanitizeText(item.question);
    const hints = sanitizeHints(item.hints);
    const solution = sanitizeText(item.solution);
    const answer = sanitizeText(item.answer);

    if (!isCompleteVariant({ question, hints, solution, answer })) {
      return acc;
    }

    acc.push({
      id: randomUUID(),
      original_session_id: params.sessionId,
      student_id: params.studentId,
      subject: params.subject,
      question_text: question,
      concept_tags: sanitizeConceptTags(item.concepts, params.fallbackConceptTags),
      difficulty: params.difficulty,
      hints,
      solution,
      answer,
      status: 'pending',
      attempts: 0,
      correct_attempts: 0,
      created_at: new Date().toISOString(),
    });

    return acc;
  }, []);
}

async function generateVariantsWithAI(params: {
  sessionId: string;
  studentId: string;
  subject: 'math' | 'physics' | 'chemistry';
  originalText: string;
  conceptTags: string[];
  difficulty: VariantDifficulty;
  count: number;
  geometryContext?: string;
}) {
  const firstPrompt = buildVariantPrompt({
    subject: params.subject,
    originalText: params.originalText,
    conceptTags: params.conceptTags,
    difficulty: params.difficulty,
    count: params.count,
    geometryContext: params.geometryContext,
  });

  let variants: VariantQuestion[] = [];
  let warning: string | null = null;

  try {
    const firstContent = await callVariantModel(firstPrompt, 3200);
    variants = parseVariantResponse({
      content: firstContent,
      sessionId: params.sessionId,
      studentId: params.studentId,
      subject: params.subject,
      difficulty: params.difficulty,
      fallbackConceptTags: params.conceptTags,
    });

    if (variants.length < params.count) {
      const retryPrompt = buildVariantPrompt({
        subject: params.subject,
        originalText: params.originalText,
        conceptTags: params.conceptTags,
        difficulty: params.difficulty,
        count: params.count - variants.length,
        geometryContext: params.geometryContext,
        retry: true,
      });

      const retryContent = await callVariantModel(retryPrompt, 2600);
      const retryVariants = parseVariantResponse({
        content: retryContent,
        sessionId: params.sessionId,
        studentId: params.studentId,
        subject: params.subject,
        difficulty: params.difficulty,
        fallbackConceptTags: params.conceptTags,
      });
      variants = [...variants, ...retryVariants].slice(0, params.count);
    }
  } catch (error) {
    console.error('AI generation error:', error);
  }

  if (variants.length < params.count) {
    warning =
      variants.length > 0
        ? `本次只生成了 ${variants.length}/${params.count} 道完整变式题，已自动过滤不完整内容。可以再次点击“生成变式题”补齐。`
        : '本次没有生成可用的完整变式题，请重试。';
  }

  return {
    variants: variants.slice(0, params.count),
    warning,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const student_id = searchParams.get('student_id');
    const session_id = searchParams.get('session_id');
    const status = searchParams.get('status');

    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    let query = (admin as any)
      .from('variant_questions')
      .select('*')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });

    if (session_id) {
      query = query.eq('original_session_id', session_id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const questions = (data || []) as VariantQuestion[];
    const variantIds = questions.map((question) => question.id).filter(Boolean);
    let summary = summarizeVariantEvidence({ questions: [], logs: [] });

    if (variantIds.length > 0) {
      const { data: logData, error: logError } = await (admin as any)
        .from('variant_practice_logs')
        .select('variant_id, is_correct, hints_used, created_at')
        .in('variant_id', variantIds);

      if (!logError) {
        summary = summarizeVariantEvidence({
          questions: questions.map((question) => ({
            id: question.id,
            status: question.status,
            attempts: question.attempts,
            correct_attempts: question.correct_attempts,
            last_practiced_at: question.last_practiced_at || null,
            completed_at: question.completed_at || null,
            created_at: question.created_at || null,
          })),
          logs: (logData || []) as VariantLogRow[],
        });
      }
    }

    return NextResponse.json({
      data: questions,
      total: questions.length,
      summary,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateVariantRequest = await req.json();
    const normalizedCount = clampVariantCount(body.count);

    if (!body.session_id || !body.student_id || !sanitizeText(body.original_text)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const sessionContext =
      body.geometry_data || body.geometry_svg !== undefined
        ? { geometry_data: body.geometry_data, geometry_svg: body.geometry_svg }
        : await loadVariantContext(admin, body.session_id);

    const geometryContext = buildGeometryContext(sessionContext);
    const result = await generateVariantsWithAI({
      sessionId: body.session_id,
      studentId: body.student_id,
      subject: body.subject || 'math',
      originalText: sanitizeText(body.original_text),
      conceptTags: body.concept_tags || [],
      difficulty: body.difficulty || 'medium',
      count: normalizedCount,
      geometryContext,
    });

    if (result.variants.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        warning: result.warning || '本次没有生成可用的完整变式题，请稍后重试。',
      });
    }

    const { data, error } = await (admin as any)
      .from('variant_questions')
      .insert(result.variants)
      .select();

    if (error) {
      return NextResponse.json({
        success: true,
        data: result.variants,
        warning: result.warning || '变式题已生成，但保存失败，请稍后重新生成。',
      });
    }

    return NextResponse.json({
      success: true,
      data: data || result.variants,
      warning: result.warning,
    });
  } catch (error: any) {
    console.error('Variant questions POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { variant_id, student_id, is_correct, student_answer, time_spent, hints_used } = body;

    if (!variant_id || !student_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    const { error: logError } = await (admin as any)
      .from('variant_practice_logs')
      .insert({
        variant_id,
        student_id,
        is_correct,
        student_answer,
        time_spent: time_spent || 0,
        hints_used: hints_used || 0,
      });

    if (logError) {
      console.error('Error saving practice log:', logError);
    }

    const { data: variant, error } = await (admin as any)
      .from('variant_questions')
      .select('*')
      .eq('id', variant_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: variant,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
