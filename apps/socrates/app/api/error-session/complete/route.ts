import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  buildMissingMathErrorLoopMigrationResponse,
  isMissingMathErrorLoopMigrationError,
} from '@/lib/error-loop/migration-guard';
import { getScheduledReviewDate } from '@/lib/error-loop/review';
import {
  createAuthorizedStudentErrorResponse,
  getAuthorizedStudentProfile,
} from '@/lib/server/route-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const SUBJECT_NAMES: Record<string, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
  chinese: '语文',
  english: '英语',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: 'Missing required field: session_id' }, { status: 400 });
    }

    const { data: sessionInfo, error: sessionInfoError } = await supabase
      .from('error_sessions')
      .select('student_id, subject, extracted_text, closure_state')
      .eq('id', session_id)
      .maybeSingle();

    if (sessionInfoError) {
      console.error('Error loading error session:', sessionInfoError);
      if (isMissingMathErrorLoopMigrationError(sessionInfoError)) {
        return buildMissingMathErrorLoopMigrationResponse('error-session.complete.load-session');
      }

      return NextResponse.json({ error: 'Failed to load error session' }, { status: 500 });
    }

    if (!sessionInfo?.student_id) {
      return NextResponse.json({ error: 'Error session not found' }, { status: 404 });
    }

    const authorizedStudent = await getAuthorizedStudentProfile(sessionInfo.student_id);
    if ('error' in authorizedStudent) {
      return createAuthorizedStudentErrorResponse(authorizedStudent.error);
    }
    const studentId = authorizedStudent.profile.id;

    const { error: updateError } = await supabase
      .from('error_sessions')
      .update({
        status: 'guided_learning',
        closure_state: sessionInfo?.closure_state || 'open',
      })
      .eq('id', session_id)
      .eq('student_id', studentId);

    if (updateError) {
      console.error('Error updating session status:', updateError);
      if (isMissingMathErrorLoopMigrationError(updateError)) {
        return buildMissingMathErrorLoopMigrationResponse('error-session.complete.update-session');
      }

      return NextResponse.json({ error: 'Failed to update session status' }, { status: 500 });
    }

    const { data: existingReview, error: existingReviewError } = await supabase
      .from('review_schedule')
      .select('id')
      .eq('session_id', session_id)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingReviewError) {
      console.error('Error checking review schedule:', existingReviewError);
      if (isMissingMathErrorLoopMigrationError(existingReviewError)) {
        return buildMissingMathErrorLoopMigrationResponse('error-session.complete.load-review-schedule');
      }
    }

    if (existingReview) {
      return NextResponse.json({
        success: true,
        message: 'Review loop already exists',
        review_exists: true,
        review_id: existingReview.id,
        status: 'guided_learning',
        closure_state: sessionInfo?.closure_state || 'open',
      });
    }

    const firstReviewDate = getScheduledReviewDate(1);

    const { data: reviewData, error: reviewError } = await supabase
      .from('review_schedule')
      .insert({
        session_id,
        student_id: studentId,
        review_stage: 1,
        next_review_at: firstReviewDate,
        is_completed: false,
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review schedule:', reviewError);
      if (isMissingMathErrorLoopMigrationError(reviewError)) {
        return buildMissingMathErrorLoopMigrationResponse('error-session.complete.create-review-schedule');
      }

      return NextResponse.json({
        success: true,
        message: 'Review loop not created, but session remains in guided learning',
        review_created: false,
        status: 'guided_learning',
        closure_state: sessionInfo?.closure_state || 'open',
      });
    }

    await sendReviewLoopNotification(studentId, session_id, reviewData?.id, sessionInfo);

    return NextResponse.json({
      success: true,
      message: 'Review loop created',
      review_created: true,
      review_id: reviewData?.id,
      next_review_at: firstReviewDate,
      status: 'guided_learning',
      closure_state: sessionInfo?.closure_state || 'open',
    });
  } catch (error: any) {
    console.error('Complete error session API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

async function sendReviewLoopNotification(
  studentId: string,
  sessionId: string,
  reviewId: string | undefined,
  sessionInfo: any,
) {
  try {
    const { data: student } = await supabase
      .from('profiles')
      .select('display_name, parent_id')
      .eq('id', studentId)
      .maybeSingle();

    if (!student?.parent_id) {
      console.log('No parent found for student, skipping notification');
      return;
    }

    const subjectName = SUBJECT_NAMES[sessionInfo?.subject] || '学习';
    const studentName = student.display_name || '孩子';

    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: student.parent_id,
      type: 'review_reminder',
      title: `${studentName}进入${subjectName}错题复习闭环`,
      content: `${studentName}完成了首轮学习，接下来需要按节奏复习、独立作答和变式验证，暂时还不能按“已掌握”关闭。`,
      data: {
        session_id: sessionId,
        student_id: studentId,
        subject: sessionInfo?.subject,
        review_id: reviewId,
        closure_state: sessionInfo?.closure_state || 'open',
      },
      action_url: reviewId ? `/review/session/${reviewId}` : `/error-book/${sessionId}`,
      action_text: '查看复习闭环',
      is_read: false,
      priority: 1,
    });

    if (notificationError) {
      console.error('Error sending mastery notification:', notificationError);
    }
  } catch (error) {
    console.error('Error sending mastery notification:', error);
  }
}
