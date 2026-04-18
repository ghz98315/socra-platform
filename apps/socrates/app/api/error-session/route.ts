// =====================================================
// Project Socrates - Error Session API
// =====================================================

import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import {
  createAuthorizedStudentErrorResponse,
  getAuthorizedStudentProfile,
} from '@/lib/server/route-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type InitialMessageInput = {
  role: 'user' | 'assistant';
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      student_id,
      subject,
      original_image_url,
      extracted_text,
      difficulty_rating,
      concept_tags,
      theme_used,
      geometry_data,
      geometry_svg,
      initial_messages,
    } = body;

    if (!subject || !extracted_text) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, extracted_text' },
        { status: 400 },
      );
    }

    const authorizedStudent = await getAuthorizedStudentProfile(student_id);
    if ('error' in authorizedStudent) {
      return createAuthorizedStudentErrorResponse(authorizedStudent.error);
    }
    const resolvedStudentId = authorizedStudent.profile.id;

    const { data, error } = await supabase
      .from('error_sessions')
      .insert({
        id: randomUUID(),
        student_id: resolvedStudentId,
        subject,
        original_image_url,
        extracted_text,
        status: 'guided_learning',
        difficulty_rating: difficulty_rating || null,
        concept_tags: concept_tags || null,
        theme_used: theme_used || null,
        geometry_data: geometry_data || null,
        geometry_svg: geometry_svg || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating error session:', error);
      return NextResponse.json({ error: 'Failed to create error session' }, { status: 500 });
    }

    const normalizedInitialMessages: InitialMessageInput[] = Array.isArray(initial_messages)
      ? initial_messages.filter(
          (message): message is InitialMessageInput =>
            message &&
            (message.role === 'user' || message.role === 'assistant') &&
            typeof message.content === 'string' &&
            message.content.trim().length > 0,
        )
      : [];

    if (normalizedInitialMessages.length > 0) {
      const { error: messageInsertError } = await supabase.from('chat_messages').insert(
        normalizedInitialMessages.map((message) => ({
          session_id: data.id,
          role: message.role,
          content: message.content.trim(),
          created_at: new Date().toISOString(),
        })),
      );

      if (messageInsertError) {
        console.error('Error creating initial chat messages:', messageInsertError);
      }
    }

    const { count: errorCount, error: countError } = await supabase
      .from('error_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', resolvedStudentId);

    console.log('[Error Session] Total error count for user:', resolvedStudentId, 'is:', errorCount);
    if (countError) {
      console.error('[Error Session] Failed to count errors:', countError);
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const achievementUrl = `${baseUrl}/api/achievements`;
    console.log('[Error Session] Triggering achievement check at:', achievementUrl);

    try {
      const achievementResponse = await fetch(achievementUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: resolvedStudentId,
          action: 'error_uploaded',
          data: { count: errorCount || 1 },
        }),
      });

      const achievementResult = await achievementResponse.json();
      console.log('[Error Session] Achievement API response:', achievementResult);
    } catch (achievementError) {
      console.error('[Error Session] Failed to check upload achievements:', achievementError);
    }

    return NextResponse.json({
      data: {
        session_id: data.id,
        theme_used: data.theme_used,
        message: 'Error session created successfully',
      },
    });
  } catch (error: any) {
    console.error('Error session API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, geometry_data, geometry_svg } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    const updatePayload: Record<string, unknown> = {};

    if (geometry_data !== undefined) {
      updatePayload.geometry_data = geometry_data;
    }

    if (geometry_svg !== undefined) {
      updatePayload.geometry_svg = geometry_svg;
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ error: 'No updatable fields provided' }, { status: 400 });
    }

    const { data: session, error: sessionError } = await supabase
      .from('error_sessions')
      .select('id, student_id')
      .eq('id', session_id)
      .maybeSingle();

    if (sessionError) {
      console.error('Error loading error session before update:', sessionError);
      return NextResponse.json({ error: 'Failed to load error session' }, { status: 500 });
    }

    if (!session?.id) {
      return NextResponse.json({ error: 'Error session not found' }, { status: 404 });
    }

    const authorizedStudent = await getAuthorizedStudentProfile(session.student_id);
    if ('error' in authorizedStudent) {
      return createAuthorizedStudentErrorResponse(authorizedStudent.error);
    }

    const { data, error } = await supabase
      .from('error_sessions')
      .update(updatePayload)
      .eq('id', session_id)
      .eq('student_id', authorizedStudent.profile.id)
      .select('id')
      .single();

    if (error) {
      console.error('Error updating error session:', error);
      return NextResponse.json({ error: 'Failed to update error session' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        session_id: data.id,
        message: 'Error session updated successfully',
      },
    });
  } catch (error: any) {
    console.error('Error session PATCH API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const authorizedStudent = await getAuthorizedStudentProfile(searchParams.get('student_id'));
    if ('error' in authorizedStudent) {
      return createAuthorizedStudentErrorResponse(authorizedStudent.error);
    }
    const studentId = authorizedStudent.profile.id;

    let query = supabase
      .from('error_sessions')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching error sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch error sessions' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
    });
  } catch (error: any) {
    console.error('Error session GET API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
