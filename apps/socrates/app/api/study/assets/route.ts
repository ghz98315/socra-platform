import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const VALID_SUBJECTS = new Set(['math', 'chinese', 'english', 'physics', 'chemistry', 'generic']);
const VALID_QUESTION_TYPES = new Set([
  'choice',
  'fill',
  'solution',
  'proof',
  'calculation',
  'reading',
  'writing',
  'listening',
  'unknown',
]);
const VALID_STATUSES = new Set(['draft', 'active', 'completed', 'archived']);

interface AssetMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_key: string;
}

const STUDY_ASSETS_MIGRATION = 'supabase/migrations/20260316_add_study_assets_tables.sql';

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

function isMissingStudyAssetsMigrationError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const code = typeof (error as { code?: unknown }).code === 'string' ? (error as { code: string }).code : '';
  const message = readErrorMessage(error);
  const mentionsStudyAssets =
    message.includes('study_assets') ||
    message.includes('study_asset_messages') ||
    message.includes('could not find the table') ||
    message.includes('schema cache');
  const missingRelation =
    code === 'PGRST205' ||
    code === '42P01' ||
    message.includes('does not exist') ||
    message.includes('missing from the schema cache');

  return mentionsStudyAssets && missingRelation;
}

function buildMissingStudyAssetsMigrationResponse() {
  return NextResponse.json(
    {
      error: 'Study assets storage is not ready in Supabase',
      code: 'missing_study_assets_migration',
      action: `Apply ${STUDY_ASSETS_MIGRATION} to the target Supabase project, redeploy the current Socrates app, then retry the study-flow smoke.`,
      migration: STUDY_ASSETS_MIGRATION,
    },
    { status: 500 },
  );
}

function getEssayWorkspaceHref(essayId?: string | null) {
  const baseUrl = process.env.NEXT_PUBLIC_ESSAY_APP_URL || 'https://essay.socra.cn';
  if (!essayId) {
    return baseUrl;
  }

  try {
    const url = new URL(baseUrl);
    url.searchParams.set('essayId', essayId);
    return url.toString();
  } catch {
    return `${baseUrl}?essayId=${encodeURIComponent(essayId)}`;
  }
}

async function fetchLegacyEssayDetail(asset: any, studentId: string) {
  if (!asset?.source_id) {
    return null;
  }

  const { data, error } = await (supabase as any)
    .from('essays')
    .select('id, user_id, title, content, grade, images, analysis, created_at, updated_at')
    .eq('id', asset.source_id)
    .eq('user_id', studentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    kind: 'essay',
    record: data,
    links: {
      workspaceHref: getEssayWorkspaceHref(data.id),
    },
  };
}

async function fetchLegacyErrorSessionDetail(asset: any, studentId: string) {
  if (!asset?.source_id) {
    return null;
  }

  const { data: session, error: sessionError } = await (supabase as any)
    .from('error_sessions')
    .select(
      'id, subject, extracted_text, original_image_url, status, difficulty_rating, student_difficulty_rating, final_difficulty_rating, concept_tags, created_at',
    )
    .eq('id', asset.source_id)
    .eq('student_id', studentId)
    .maybeSingle();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    return null;
  }

  const { data: chatMessages, error: chatMessagesError } = await (supabase as any)
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('session_id', asset.source_id)
    .order('created_at', { ascending: true });

  if (chatMessagesError) {
    throw chatMessagesError;
  }

  const { data: review, error: reviewError } = await (supabase as any)
    .from('review_schedule')
    .select('id')
    .eq('session_id', asset.source_id)
    .maybeSingle();

  if (reviewError) {
    throw reviewError;
  }

  return {
    kind: 'error_session',
    record: session,
    messages:
      (chatMessages || []).map((message: any) => ({
        id: message.id,
        asset_id: asset.id,
        role: message.role,
        content: message.content,
        message_key: `legacy_chat_${message.id}`,
        created_at: message.created_at,
      })) || [],
    links: {
      errorBookHref: `/error-book/${session.id}`,
      continueStudyHref: `/study/${session.subject}/problem?session=${session.id}`,
      reviewHref: review?.id ? `/review/session/${review.id}` : undefined,
    },
  };
}

async function fetchStudyAssetDetail(assetId: string, studentId: string) {
  const { data: asset, error: assetError } = await (supabase as any)
    .from('study_assets')
    .select(
      'id, student_id, subject, module, source_type, input_type, question_type, title, summary, status, payload, created_at, updated_at',
    )
    .eq('id', assetId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (assetError) {
    throw assetError;
  }

  if (!asset) {
    return null;
  }

  const { data: messages, error: messagesError } = await (supabase as any)
    .from('study_asset_messages')
    .select('id, asset_id, role, content, message_key, created_at')
    .eq('asset_id', assetId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw messagesError;
  }

  let legacy: any = null;
  let resolvedMessages = messages || [];
  let messageSource: 'study_asset_messages' | 'legacy_chat_messages' = 'study_asset_messages';

  if (asset.source_type === 'essay') {
    legacy = await fetchLegacyEssayDetail(asset, studentId);
  } else if (asset.source_type === 'error_session') {
    legacy = await fetchLegacyErrorSessionDetail(asset, studentId);
    if (resolvedMessages.length === 0 && Array.isArray(legacy?.messages) && legacy.messages.length > 0) {
      resolvedMessages = legacy.messages;
      messageSource = 'legacy_chat_messages';
    }
  }

  return {
    asset,
    messages: resolvedMessages,
    message_source: messageSource,
    legacy: legacy
      ? {
          kind: legacy.kind,
          record: legacy.record,
          links: legacy.links,
        }
      : null,
  };
}

function normalizeMessages(messages: unknown): AssetMessageInput[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((item): item is AssetMessageInput => {
      return (
        !!item &&
        typeof item === 'object' &&
        'role' in item &&
        'content' in item &&
        'message_key' in item &&
        typeof item.role === 'string' &&
        typeof item.content === 'string' &&
        typeof item.message_key === 'string'
      );
    })
    .map((item) => ({
      role: item.role,
      content: item.content.trim(),
      message_key: item.message_key.trim(),
    }))
    .filter((item) => item.content && item.message_key);
}

async function upsertMessages(assetId: string, messages: AssetMessageInput[]) {
  if (messages.length === 0) {
    return;
  }

  const { error } = await (supabase as any)
    .from('study_asset_messages')
    .upsert(
      messages.map((message) => ({
        asset_id: assetId,
        role: message.role,
        content: message.content,
        message_key: message.message_key,
      })),
      { onConflict: 'message_key' },
    );

  if (error) {
    throw error;
  }
}

function buildLegacySummary(content: string | null | undefined, fallback: string) {
  const plain = (content || '').replace(/\s+/g, ' ').trim();
  if (!plain) {
    return fallback;
  }

  return plain.length <= 140 ? plain : `${plain.slice(0, 139)}...`;
}

async function syncLegacyEssayAssets(studentId: string) {
  const { data: essays, error: essaysError } = await (supabase as any)
    .from('essays')
    .select('id, title, content, grade, analysis, created_at, updated_at')
    .eq('user_id', studentId)
    .order('updated_at', { ascending: false })
    .limit(20);

  if (essaysError) {
    throw essaysError;
  }

  if (!essays?.length) {
    return;
  }

  const sourceIds = essays.map((essay: { id: string }) => essay.id);
  const { data: existing, error: existingError } = await (supabase as any)
    .from('study_assets')
    .select('source_id')
    .eq('student_id', studentId)
    .eq('source_type', 'essay')
    .in('source_id', sourceIds);

  if (existingError) {
    throw existingError;
  }

  const existingIds = new Set((existing || []).map((item: { source_id: string }) => item.source_id));
  const inserts = essays
    .filter((essay: { id: string }) => !existingIds.has(essay.id))
    .map((essay: any) => ({
      student_id: studentId,
      subject: 'chinese',
      module: 'composition-review',
      source_type: 'essay',
      source_id: essay.id,
      input_type: Array.isArray(essay.images) && essay.images.length > 0 ? 'image+text' : 'text',
      question_type: 'writing',
      title: essay.title || '作文批改记录',
      summary: buildLegacySummary(essay.analysis?.overallComment || essay.content, '已同步旧作文批改记录'),
      status: 'completed',
      payload: {
        legacy_source: 'essays',
        essay_title: essay.title,
        grade: essay.grade,
        analysis: essay.analysis,
        content_preview: typeof essay.content === 'string' ? essay.content.slice(0, 300) : '',
        created_at: essay.created_at,
      },
      created_at: essay.created_at,
      updated_at: essay.updated_at || essay.created_at,
    }));

  if (inserts.length > 0) {
    const { error } = await (supabase as any).from('study_assets').insert(inserts);
    if (error) {
      throw error;
    }
  }
}

async function syncLegacyErrorSessionAssets(studentId: string, subject: string) {
  const { data: sessions, error: sessionsError } = await (supabase as any)
    .from('error_sessions')
    .select('id, subject, extracted_text, original_image_url, difficulty_rating, concept_tags, status, created_at')
    .eq('student_id', studentId)
    .eq('subject', subject)
    .order('created_at', { ascending: false })
    .limit(30);

  if (sessionsError) {
    throw sessionsError;
  }

  if (!sessions?.length) {
    return;
  }

  const sourceIds = sessions.map((session: { id: string }) => session.id);
  const { data: existing, error: existingError } = await (supabase as any)
    .from('study_assets')
    .select('source_id')
    .eq('student_id', studentId)
    .eq('source_type', 'error_session')
    .in('source_id', sourceIds);

  if (existingError) {
    throw existingError;
  }

  const existingIds = new Set((existing || []).map((item: { source_id: string }) => item.source_id));
  const inserts = sessions
    .filter((session: { id: string }) => !existingIds.has(session.id))
    .map((session: any) => ({
      student_id: studentId,
      subject: session.subject,
      module: 'problem',
      source_type: 'error_session',
      source_id: session.id,
      input_type: session.original_image_url ? 'image' : 'text',
      question_type: 'unknown',
      title: `${session.subject === 'math' ? '数学' : session.subject === 'chinese' ? '语文' : session.subject === 'english' ? '英语' : session.subject}录题分析`,
      summary: buildLegacySummary(session.extracted_text, '已同步旧录题分析记录'),
      status: session.status === 'completed' ? 'completed' : 'active',
      payload: {
        legacy_source: 'error_sessions',
        error_session_id: session.id,
        extracted_text_preview: typeof session.extracted_text === 'string' ? session.extracted_text.slice(0, 300) : '',
        original_image_url: session.original_image_url,
        difficulty_rating: session.difficulty_rating,
        concept_tags: session.concept_tags,
        source_status: session.status,
      },
      created_at: session.created_at,
      updated_at: session.created_at,
    }));

  if (inserts.length > 0) {
    const { error } = await (supabase as any).from('study_assets').insert(inserts);
    if (error) {
      throw error;
    }
  }
}

async function syncLegacySources(studentId: string, subject?: string | null, module?: string | null) {
  if (subject === 'chinese' && module === 'composition-review') {
    await syncLegacyEssayAssets(studentId);
    return;
  }

  if (module === 'problem' && subject && VALID_SUBJECTS.has(subject)) {
    await syncLegacyErrorSessionAssets(studentId, subject);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const studentId = searchParams.get('student_id');
    const assetId = searchParams.get('asset_id');
    const subject = searchParams.get('subject');
    const module = searchParams.get('module');
    const includeLegacy = searchParams.get('include_legacy') !== '0';
    const limit = Math.min(Number.parseInt(searchParams.get('limit') || '6', 10) || 6, 20);

    if (!studentId) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    if (assetId) {
      const detail = await fetchStudyAssetDetail(assetId, studentId);

      if (!detail) {
        return NextResponse.json({ error: 'Study asset not found' }, { status: 404 });
      }

      return NextResponse.json({ data: detail });
    }

    if (includeLegacy) {
      await syncLegacySources(studentId, subject, module);
    }

    let query = (supabase as any)
      .from('study_assets')
      .select('id, student_id, subject, module, source_type, input_type, question_type, title, summary, status, payload, created_at, updated_at')
      .eq('student_id', studentId)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (subject) {
      query = query.eq('subject', subject);
    }

    if (module) {
      query = query.eq('module', module);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching study assets:', error);
      if (isMissingStudyAssetsMigrationError(error)) {
        return buildMissingStudyAssetsMigrationResponse();
      }
      return NextResponse.json({ error: '获取学习记录失败' }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] });
  } catch (error: any) {
    console.error('Study assets GET error:', error);
    if (isMissingStudyAssetsMigrationError(error)) {
      return buildMissingStudyAssetsMigrationResponse();
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      student_id,
      study_session_id,
      subject,
      module,
      source_type = 'study_module',
      source_id = null,
      input_type = 'text',
      question_type = 'unknown',
      title = null,
      summary = null,
      status = 'active',
      payload = {},
      messages,
    } = body;

    if (!student_id || !subject || !module) {
      return NextResponse.json({ error: 'student_id, subject and module are required' }, { status: 400 });
    }

    if (!VALID_SUBJECTS.has(subject)) {
      return NextResponse.json({ error: 'Invalid subject' }, { status: 400 });
    }

    if (!VALID_QUESTION_TYPES.has(question_type)) {
      return NextResponse.json({ error: 'Invalid question_type' }, { status: 400 });
    }

    if (!VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const normalizedMessages = normalizeMessages(messages);

    const { data, error } = await (supabase as any)
      .from('study_assets')
      .insert({
        student_id,
        study_session_id,
        subject,
        module,
        source_type,
        source_id,
        input_type,
        question_type,
        title,
        summary,
        status,
        payload,
      })
      .select('id, student_id, subject, module, title, summary, status, payload, created_at, updated_at')
      .single();

    if (error) {
      console.error('Error creating study asset:', error);
      if (isMissingStudyAssetsMigrationError(error)) {
        return buildMissingStudyAssetsMigrationResponse();
      }
      return NextResponse.json({ error: '创建学习记录失败' }, { status: 500 });
    }

    await upsertMessages(data.id, normalizedMessages);

    return NextResponse.json({
      data: {
        asset_id: data.id,
        asset: data,
      },
    });
  } catch (error: any) {
    console.error('Study assets POST error:', error);
    if (isMissingStudyAssetsMigrationError(error)) {
      return buildMissingStudyAssetsMigrationResponse();
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      asset_id,
      study_session_id,
      title,
      summary,
      status,
      payload,
      messages,
    } = body;

    if (!asset_id) {
      return NextResponse.json({ error: 'asset_id is required' }, { status: 400 });
    }

    if (status && !VALID_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};
    if (study_session_id !== undefined) updatePayload.study_session_id = study_session_id;
    if (title !== undefined) updatePayload.title = title;
    if (summary !== undefined) updatePayload.summary = summary;
    if (status !== undefined) updatePayload.status = status;
    if (payload !== undefined) updatePayload.payload = payload;

    const normalizedMessages = normalizeMessages(messages);

    if (Object.keys(updatePayload).length > 0) {
      const { error } = await (supabase as any)
        .from('study_assets')
        .update(updatePayload)
        .eq('id', asset_id);

      if (error) {
        console.error('Error updating study asset:', error);
        if (isMissingStudyAssetsMigrationError(error)) {
          return buildMissingStudyAssetsMigrationResponse();
        }
        return NextResponse.json({ error: '更新学习记录失败' }, { status: 500 });
      }
    }

    await upsertMessages(asset_id, normalizedMessages);

    const { data, error } = await (supabase as any)
      .from('study_assets')
      .select('id, student_id, subject, module, title, summary, status, payload, created_at, updated_at')
      .eq('id', asset_id)
      .single();

    if (error) {
      console.error('Error fetching updated study asset:', error);
      if (isMissingStudyAssetsMigrationError(error)) {
        return buildMissingStudyAssetsMigrationResponse();
      }
      return NextResponse.json({ error: '读取更新后的学习记录失败' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        asset_id,
        asset: data,
      },
    });
  } catch (error: any) {
    console.error('Study assets PATCH error:', error);
    if (isMissingStudyAssetsMigrationError(error)) {
      return buildMissingStudyAssetsMigrationResponse();
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
