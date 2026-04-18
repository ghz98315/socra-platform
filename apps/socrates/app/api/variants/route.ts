import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { summarizeVariantEvidence } from '@/lib/error-loop/variant-evidence';
import {
  createAuthorizedStudentErrorResponse,
  getAuthorizedStudentProfile,
} from '@/lib/server/route-auth';
import type {
  GenerateVariantRequest,
  VariantDifficulty,
  VariantGeometryMode,
  VariantQuestion,
} from '@/lib/variant-questions/types';

export const maxDuration = 90;

type VariantLogRow = {
  variant_id: string;
  is_correct: boolean | null;
  hints_used: number | null;
  created_at: string | null;
};

type ErrorSessionVariantContext = {
  geometry_data?: unknown;
  geometry_svg?: string | null;
  original_image_url?: string | null;
};

const AI_BASE_URL =
  process.env.AI_BASE_URL_LOGIC ||
  process.env.DASHSCOPE_BASE_URL ||
  'https://dashscope.aliyuncs.com/compatible-mode/v1';
const AI_API_KEY = process.env.AI_API_KEY_LOGIC || process.env.DASHSCOPE_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL_LOGIC || 'qwen-plus';
const MAX_VARIANT_COUNT = 3;
const VARIANT_MODEL_TIMEOUT_MS = 55000;
const VARIANT_MODEL_MAX_ATTEMPTS = 2;

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

function buildGeometryModeRule(mode: VariantGeometryMode) {
  switch (mode) {
    case 'preserve_figure':
      return 'If this is a geometry problem, keep the original figure unchanged and reuse it as the fixed figure for the variant. Only change the givens, target, wording, or local conditions in the text. Do not redesign the figure.';
    case 'change_figure':
      return 'If this is a geometry problem, keep the original figure unchanged and reuse it as the fixed figure for the variant. Do not change the figure.';
    default:
      return 'If this is a geometry problem, keep the original figure unchanged and reuse it as the fixed figure for the variant.';
  }
}

function buildVariantPrompt(params: {
  subject: 'math' | 'physics' | 'chemistry';
  originalText: string;
  conceptTags: string[];
  difficulty: VariantDifficulty;
  geometryMode: VariantGeometryMode;
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

Geometry variant mode:
${buildGeometryModeRule(params.geometryMode)}

Requirements:
1. Keep the same core concept as the original problem.
2. Each variant must be self-contained and solvable on its own.
3. Change the values, wording, givens, or setup enough that the student must transfer the method rather than recall the original answer.
4. For geometry, assume the original figure will be displayed together with the variant. Keep that figure unchanged, and only output the new question text that matches the same figure.
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
    .select('geometry_data, geometry_svg, original_image_url')
    .eq('id', sessionId)
    .maybeSingle();

  return (data || {}) as ErrorSessionVariantContext;
}

async function loadAuthorizedVariantSession(admin: any, sessionId: string) {
  const { data: session, error } = await (admin as any)
    .from('error_sessions')
    .select('id, student_id, subject, geometry_data, geometry_svg, original_image_url')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!session?.id) {
    return {
      response: NextResponse.json({ error: 'Error session not found' }, { status: 404 }),
    };
  }

  const authorizedStudent = await getAuthorizedStudentProfile(session.student_id);
  if ('error' in authorizedStudent) {
    return {
      response: createAuthorizedStudentErrorResponse(authorizedStudent.error),
    };
  }

  return {
    session,
    studentId: authorizedStudent.profile.id,
  };
}

async function loadAuthorizedVariant(admin: any, variantId: string) {
  const { data: variant, error } = await (admin as any)
    .from('variant_questions')
    .select('*')
    .eq('id', variantId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!variant?.id) {
    return {
      response: NextResponse.json({ error: 'Variant not found' }, { status: 404 }),
    };
  }

  const authorizedStudent = await getAuthorizedStudentProfile(variant.student_id);
  if ('error' in authorizedStudent) {
    return {
      response: createAuthorizedStudentErrorResponse(authorizedStudent.error),
    };
  }

  return {
    variant,
    studentId: authorizedStudent.profile.id,
  };
}

function buildFigureImageUrl(context: ErrorSessionVariantContext) {
  if (typeof context.geometry_svg === 'string' && context.geometry_svg.trim()) {
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(context.geometry_svg)}`;
  }

  if (typeof context.original_image_url === 'string' && context.original_image_url.trim()) {
    return context.original_image_url.trim();
  }

  return undefined;
}

async function callVariantModel(prompt: string, maxTokens: number) {
  if (!AI_API_KEY) {
    throw new Error('Missing AI API key for variant generation');
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= VARIANT_MODEL_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VARIANT_MODEL_TIMEOUT_MS);

    try {
      const response = await fetch(`${AI_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${AI_API_KEY}`,
        },
        signal: controller.signal,
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
        const retryable = response.status === 429 || response.status >= 500;
        if (retryable && attempt < VARIANT_MODEL_MAX_ATTEMPTS) {
          lastError = new Error(`AI API call failed: ${response.status}`);
          continue;
        }

        throw new Error(`AI API call failed: ${response.status}`);
      }

      const result = await response.json();
      return String(result?.choices?.[0]?.message?.content || '');
    } catch (error) {
      lastError = error;
      if (attempt >= VARIANT_MODEL_MAX_ATTEMPTS) {
        throw error;
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Variant model request failed');
}

function mapVariantGenerationError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '');
  const causeCode =
    error &&
    typeof error === 'object' &&
    'cause' in error &&
    error.cause &&
    typeof error.cause === 'object' &&
    'code' in error.cause
      ? String((error.cause as { code?: unknown }).code || '')
      : '';

  if (message.includes('Missing AI API key')) {
    return {
      status: 500,
      message: '变式生成服务未配置完成，请联系管理员检查模型配置。',
    };
  }

  if (message.includes('AbortError') || message.includes('aborted')) {
    return {
      status: 504,
      message: '变式生成服务响应超时，请稍后重试。',
    };
  }

  if (
    causeCode === 'ECONNRESET' ||
    causeCode === 'ETIMEDOUT' ||
    causeCode === 'ENOTFOUND' ||
    causeCode === 'EAI_AGAIN' ||
    message.includes('fetch failed')
  ) {
    return {
      status: 502,
      message: '变式生成服务连接异常，请稍后重试。',
    };
  }

  if (message.includes('AI API call failed: 429')) {
    return {
      status: 429,
      message: '变式生成请求较多，请稍后再试。',
    };
  }

  return {
    status: 502,
    message: '变式生成服务暂时不可用，请稍后重试。',
  };
}

function parseVariantResponse(params: {
  content: string;
  sessionId: string;
  studentId: string;
  subject: 'math' | 'physics' | 'chemistry';
  difficulty: VariantDifficulty;
  fallbackConceptTags: string[];
  figureImageUrl?: string;
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
      question_image_url: params.figureImageUrl,
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
  geometryMode: VariantGeometryMode;
  count: number;
  geometryContext?: string;
  figureImageUrl?: string;
}) {
  const generationStartedAt = Date.now();
  const firstPrompt = buildVariantPrompt({
    subject: params.subject,
    originalText: params.originalText,
    conceptTags: params.conceptTags,
    difficulty: params.difficulty,
    geometryMode: params.geometryMode,
    count: params.count,
    geometryContext: params.geometryContext,
  });

  let variants: VariantQuestion[] = [];
  let warning: string | null = null;
  let fatalError: { status: number; message: string } | null = null;

  try {
    const firstMaxTokens =
      params.count <= 1
        ? params.geometryContext
          ? 3200
          : 2600
        : 2600;
    const firstContent = await callVariantModel(firstPrompt, firstMaxTokens);
    variants = parseVariantResponse({
      content: firstContent,
      sessionId: params.sessionId,
      studentId: params.studentId,
      subject: params.subject,
      difficulty: params.difficulty,
      fallbackConceptTags: params.conceptTags,
      figureImageUrl: params.figureImageUrl,
    });

    if (variants.length < params.count) {
      const retryPrompt = buildVariantPrompt({
        subject: params.subject,
        originalText: params.originalText,
        conceptTags: params.conceptTags,
        difficulty: params.difficulty,
        geometryMode: params.geometryMode,
        count: params.count - variants.length,
        geometryContext: params.geometryContext,
        retry: true,
      });

      const retryMaxTokens =
        params.count - variants.length <= 1
          ? params.geometryContext
            ? 2400
            : 1800
          : 2000;
      const retryContent = await callVariantModel(retryPrompt, retryMaxTokens);
      const retryVariants = parseVariantResponse({
        content: retryContent,
        sessionId: params.sessionId,
        studentId: params.studentId,
        subject: params.subject,
        difficulty: params.difficulty,
        fallbackConceptTags: params.conceptTags,
        figureImageUrl: params.figureImageUrl,
      });
      variants = [...variants, ...retryVariants].slice(0, params.count);
    }
  } catch (error) {
    console.error('AI generation error:', error);
    fatalError = mapVariantGenerationError(error);
  }

  console.log('[variants] generation finished', {
    sessionId: params.sessionId,
    requestedCount: params.count,
    generatedCount: variants.length,
    durationMs: Date.now() - generationStartedAt,
    geometryMode: params.geometryMode,
    hasGeometryContext: Boolean(params.geometryContext),
  });

  if (variants.length < params.count) {
    warning =
      variants.length > 0
        ? `本次只生成了 ${variants.length}/${params.count} 道完整变式题，系统已经自动过滤掉不完整内容。可以再次点击“生成变式题”补齐。`
        : '暂时没有生成出完整的变式题，请稍后再试。';
  }

  return {
    variants: variants.slice(0, params.count),
    warning,
    fatalError,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const session_id = searchParams.get('session_id');
    const status = searchParams.get('status');

    const authorizedStudent = await getAuthorizedStudentProfile(searchParams.get('student_id'));
    if ('error' in authorizedStudent) {
      return createAuthorizedStudentErrorResponse(authorizedStudent.error);
    }
    const studentId = authorizedStudent.profile.id;

    const admin = getSupabaseAdmin();
    let query = (admin as any)
      .from('variant_questions')
      .select('*')
      .eq('student_id', studentId)
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

    if (!body.session_id || !sanitizeText(body.original_text)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const authorizedSession = await loadAuthorizedVariantSession(admin, body.session_id);
    if ('response' in authorizedSession) {
      return authorizedSession.response;
    }

    const sessionContext =
      body.geometry_data || body.geometry_svg !== undefined
        ? {
            geometry_data: body.geometry_data,
            geometry_svg: body.geometry_svg,
            original_image_url: authorizedSession.session.original_image_url,
          }
        : await loadVariantContext(admin, body.session_id);

    const geometryContext = buildGeometryContext(sessionContext);
    const figureImageUrl = buildFigureImageUrl(sessionContext);
    const requestedSubject = body.subject || authorizedSession.session.subject || 'math';
    const subject =
      requestedSubject === 'physics' || requestedSubject === 'chemistry' ? requestedSubject : 'math';
    const normalizedGeometryMode =
      subject === 'math' && (sessionContext.geometry_data || sessionContext.geometry_svg)
        ? 'preserve_figure'
        : body.geometry_mode || 'auto';
    const result = await generateVariantsWithAI({
      sessionId: body.session_id,
      studentId: authorizedSession.studentId,
      subject: subject || 'math',
      originalText: sanitizeText(body.original_text),
      conceptTags: body.concept_tags || [],
      difficulty: body.difficulty || 'medium',
      geometryMode: normalizedGeometryMode,
      count: normalizedCount,
      geometryContext,
      figureImageUrl,
    });

    if (result.variants.length === 0 && result.fatalError) {
      return NextResponse.json({ error: result.fatalError.message }, { status: result.fatalError.status });
    }

    if (result.variants.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        warning: result.warning || '暂时没有生成出完整的变式题，请稍后再试。',
      });
    }

    const { data, error } = await (admin as any).from('variant_questions').insert(result.variants).select();

    if (error) {
      return NextResponse.json({
        success: true,
        data: result.variants,
        warning: result.warning || '变式题已生成，但写入数据库失败，本次先返回临时结果。',
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
    const { variant_id, is_correct, student_answer, time_spent, hints_used } = body;

    if (!variant_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const authorizedVariant = await loadAuthorizedVariant(admin, variant_id);
    if ('response' in authorizedVariant) {
      return authorizedVariant.response;
    }

    const { error: logError } = await (admin as any).from('variant_practice_logs').insert({
      variant_id,
      student_id: authorizedVariant.studentId,
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
      .eq('student_id', authorizedVariant.studentId)
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
