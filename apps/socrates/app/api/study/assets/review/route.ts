import { randomUUID } from 'crypto';

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import {
  buildStudyAssetConceptTags,
  buildStudyAssetExtractedText,
  readStudyAssetReviewBridge,
} from '@/lib/study/bridges-v2';
import { getScheduledReviewDate } from '@/lib/error-loop/review';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

const REVIEWABLE_SUBJECTS = new Set(['math', 'chinese', 'english', 'physics', 'chemistry']);

function readObjectValue(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

async function ensureReviewSchedule(sessionId: string, studentId: string) {
  const { data: existing, error: existingError } = await (supabase as any)
    .from('review_schedule')
    .select('id')
    .eq('session_id', sessionId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing?.id) {
    return {
      reviewId: existing.id as string,
      existed: true,
    };
  }

  const firstReviewDate = getScheduledReviewDate(1);

  const { data: inserted, error: insertError } = await (supabase as any)
    .from('review_schedule')
    .insert({
      session_id: sessionId,
      student_id: studentId,
      review_stage: 1,
      next_review_at: firstReviewDate,
      is_completed: false,
    })
    .select('id')
    .single();

  if (insertError) {
    throw insertError;
  }

  return {
    reviewId: inserted.id as string,
    existed: false,
  };
}

async function resolveExistingSessionId(asset: any, studentId: string) {
  if (asset.source_type === 'error_session' && typeof asset.source_id === 'string' && asset.source_id.trim()) {
    const { data: session } = await (supabase as any)
      .from('error_sessions')
      .select('id')
      .eq('id', asset.source_id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (session?.id) {
      return session.id as string;
    }
  }

  const bridge = readStudyAssetReviewBridge(asset.payload || {});
  if (!bridge?.errorSessionId) {
    return null;
  }

  const { data: bridgedSession } = await (supabase as any)
    .from('error_sessions')
    .select('id')
    .eq('id', bridge.errorSessionId)
    .eq('student_id', studentId)
    .maybeSingle();

  return (bridgedSession?.id as string | undefined) || null;
}

async function createDerivedSession(asset: any) {
  if (!REVIEWABLE_SUBJECTS.has(asset.subject)) {
    throw new Error('study-asset-review-subject-unsupported');
  }

  const sessionId = randomUUID();
  const extractedText = buildStudyAssetExtractedText(asset);
  const conceptTags = buildStudyAssetConceptTags(asset);
  const payload = readObjectValue(asset.payload) || {};
  const originalImageUrl =
    typeof payload.original_image_url === 'string' && payload.original_image_url.trim()
      ? payload.original_image_url.trim()
      : null;

  const { error: insertError } = await (supabase as any)
    .from('error_sessions')
    .insert({
      id: sessionId,
      student_id: asset.student_id,
      subject: asset.subject,
      original_image_url: originalImageUrl,
      extracted_text: extractedText,
      status: 'guided_learning',
      difficulty_rating: null,
      concept_tags: conceptTags,
      theme_used: null,
      created_at: new Date().toISOString(),
    });

  if (insertError) {
    throw insertError;
  }

  const { data: messages, error: messagesError } = await (supabase as any)
    .from('study_asset_messages')
    .select('role, content')
    .eq('asset_id', asset.id)
    .order('created_at', { ascending: true })
    .limit(20);

  if (messagesError) {
    throw messagesError;
  }

  const chatRows = (messages || [])
    .filter((message: any) => message.role === 'user' || message.role === 'assistant')
    .map((message: any) => ({
      session_id: sessionId,
      role: message.role,
      content: message.content,
    }));

  if (chatRows.length > 0) {
    const { error: chatError } = await (supabase as any).from('chat_messages').insert(chatRows);
    if (chatError) {
      throw chatError;
    }
  }

  return sessionId;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const assetId = typeof body?.asset_id === 'string' ? body.asset_id.trim() : '';
    const studentId = typeof body?.student_id === 'string' ? body.student_id.trim() : '';

    if (!assetId || !studentId) {
      return NextResponse.json({ error: 'Missing required fields: asset_id, student_id' }, { status: 400 });
    }

    const { data: asset, error: assetError } = await (supabase as any)
      .from('study_assets')
      .select(
        'id, student_id, subject, module, source_type, source_id, title, summary, status, payload, created_at, updated_at',
      )
      .eq('id', assetId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (assetError) {
      console.error('[study/assets/review] Failed to load asset:', assetError);
      return NextResponse.json({ error: 'Failed to load study asset' }, { status: 500 });
    }

    if (!asset) {
      return NextResponse.json({ error: 'Study asset not found' }, { status: 404 });
    }

    let sessionId = await resolveExistingSessionId(asset, studentId);
    let createdSession = false;

    if (!sessionId) {
      sessionId = await createDerivedSession(asset);
      createdSession = true;
    }

    const review = await ensureReviewSchedule(sessionId, studentId);
    const reviewHref = `/review/session/${review.reviewId}`;
    const nextPayload = {
      ...(asset.payload || {}),
      reviewBridge: {
        errorSessionId: sessionId,
        reviewId: review.reviewId,
        reviewHref,
        addedAt: new Date().toISOString(),
      },
    };

    const { error: updateError } = await (supabase as any)
      .from('study_assets')
      .update({ payload: nextPayload })
      .eq('id', assetId)
      .eq('student_id', studentId);

    if (updateError) {
      console.error('[study/assets/review] Failed to update asset payload:', updateError);
    }

    return NextResponse.json({
      success: true,
      review_id: review.reviewId,
      review_href: reviewHref,
      error_session_id: sessionId,
      existed: review.existed,
      created_session: createdSession,
    });
  } catch (error: any) {
    console.error('[study/assets/review] API error:', error);

    if (error?.message === 'study-asset-review-subject-unsupported') {
      return NextResponse.json({ error: 'Current study asset does not support review yet' }, { status: 400 });
    }

    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
