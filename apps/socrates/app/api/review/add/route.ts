import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getScheduledReviewDate } from '@/lib/error-loop/review';
import { getAuthenticatedStudentProfile } from '@/lib/server/route-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const student = await getAuthenticatedStudentProfile();
    if (!student) {
      return NextResponse.json({ error: 'Only students can add reviews' }, { status: 403 });
    }

    const body = await req.json();
    const sessionId = typeof body?.session_id === 'string' ? body.session_id : '';

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing required field: session_id' },
        { status: 400 },
      );
    }

    const { data: session, error: sessionError } = await supabase
      .from('error_sessions')
      .select('id')
      .eq('id', sessionId)
      .eq('student_id', student.id)
      .maybeSingle();

    if (sessionError) {
      console.error('[review/add] Error checking session:', sessionError);
      return NextResponse.json({ error: 'Failed to verify error session' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'Error session not found' }, { status: 404 });
    }

    const { data: existing, error: existingError } = await supabase
      .from('review_schedule')
      .select('id')
      .eq('session_id', sessionId)
      .eq('student_id', student.id)
      .maybeSingle();

    if (existingError) {
      console.error('[review/add] Error checking existing review schedule:', existingError);
      return NextResponse.json({ error: 'Failed to check review schedule' }, { status: 500 });
    }

    if (existing?.id) {
      return NextResponse.json({ success: true, exists: true, review_id: existing.id });
    }

    const firstReviewDate = getScheduledReviewDate(1);

    const { data: inserted, error: insertError } = await supabase
      .from('review_schedule')
      .insert({
        session_id: sessionId,
        student_id: student.id,
        review_stage: 1,
        next_review_at: firstReviewDate,
        is_completed: false,
      })
      .select('id, next_review_at')
      .single();

    if (insertError) {
      console.error('[review/add] Error creating review schedule:', insertError);
      return NextResponse.json({ error: 'Failed to add to review' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      exists: false,
      review_id: inserted?.id,
      next_review_at: inserted?.next_review_at,
    });
  } catch (error: any) {
    console.error('[review/add] API error:', error);
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 });
  }
}
