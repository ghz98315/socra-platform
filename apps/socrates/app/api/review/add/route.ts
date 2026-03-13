// =====================================================
// Project Socrates - Add To Review API
// Purpose: Allow students to manually add an error session into review_schedule.
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, student_id } = body ?? {};

    if (!session_id || !student_id) {
      return NextResponse.json(
        { error: 'Missing required fields: session_id, student_id' },
        { status: 400 }
      );
    }

    const { data: existing, error: existingError } = await supabase
      .from('review_schedule')
      .select('id')
      .eq('session_id', session_id)
      .eq('student_id', student_id)
      .maybeSingle();

    if (existingError) {
      console.error('[review/add] Error checking existing review schedule:', existingError);
      return NextResponse.json({ error: 'Failed to check review schedule' }, { status: 500 });
    }

    if (existing?.id) {
      return NextResponse.json({ success: true, exists: true, review_id: existing.id });
    }

    // Keep consistent with /api/error-session/complete: first review scheduled for tomorrow.
    const firstReviewDate = new Date();
    firstReviewDate.setDate(firstReviewDate.getDate() + 1);

    const { data: inserted, error: insertError } = await supabase
      .from('review_schedule')
      .insert({
        session_id,
        student_id,
        review_stage: 1,
        next_review_at: firstReviewDate.toISOString(),
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

