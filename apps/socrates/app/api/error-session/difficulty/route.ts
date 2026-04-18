import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import {
  createAuthorizedStudentErrorResponse,
  getAuthorizedStudentProfile,
} from '@/lib/server/route-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

function calculateFinalDifficulty(aiRating: number | null, studentRating: number): number {
  const ai = aiRating || 3;
  return Math.round((ai * 0.6 + studentRating * 0.4) * 2) / 2;
}

async function loadAuthorizedSession(sessionId: string) {
  const { data: session, error } = await supabase
    .from('error_sessions')
    .select('id, student_id, difficulty_rating, student_difficulty_rating, final_difficulty_rating')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) {
    console.error('[Difficulty API] Failed to load session:', error);
    return {
      response: NextResponse.json({ error: 'Failed to load error session' }, { status: 500 }),
    };
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionId = typeof body?.session_id === 'string' ? body.session_id.trim() : '';
    const difficultyRating = Number(body?.difficulty_rating);

    if (!sessionId || !Number.isFinite(difficultyRating)) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, difficulty_rating' },
        { status: 400 },
      );
    }

    if (difficultyRating < 1 || difficultyRating > 5) {
      return NextResponse.json({ error: 'difficulty_rating must be between 1 and 5' }, { status: 400 });
    }

    const authorizedSession = await loadAuthorizedSession(sessionId);
    if ('response' in authorizedSession) {
      return authorizedSession.response;
    }

    const finalDifficulty = calculateFinalDifficulty(
      authorizedSession.session.difficulty_rating,
      difficultyRating,
    );

    const { error: updateError } = await supabase
      .from('error_sessions')
      .update({
        student_difficulty_rating: difficultyRating,
        final_difficulty_rating: finalDifficulty,
        student_rated_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .eq('student_id', authorizedSession.studentId);

    if (updateError) {
      console.error('[Difficulty API] Update error:', updateError);
      return NextResponse.json({ error: 'Failed to update difficulty rating' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        student_difficulty_rating: difficultyRating,
        final_difficulty_rating: finalDifficulty,
      },
    });
  } catch (error: any) {
    console.error('[Difficulty API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('session_id')?.trim() || '';

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    const authorizedSession = await loadAuthorizedSession(sessionId);
    if ('response' in authorizedSession) {
      return authorizedSession.response;
    }

    return NextResponse.json({
      success: true,
      data: {
        difficulty_rating: authorizedSession.session.difficulty_rating,
        student_difficulty_rating: authorizedSession.session.student_difficulty_rating,
        final_difficulty_rating: authorizedSession.session.final_difficulty_rating,
      },
    });
  } catch (error: any) {
    console.error('[Difficulty API] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
