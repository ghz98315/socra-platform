import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const REVIEW_INTERVALS = [1, 3, 7, 30];

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
    const { session_id, student_id } = body;

    if (!session_id || !student_id) {
      return NextResponse.json({ error: 'Missing required fields: session_id, student_id' }, { status: 400 });
    }

    const { data: sessionInfo } = await supabase
      .from('error_sessions')
      .select('subject, extracted_text')
      .eq('id', session_id)
      .maybeSingle();

    const { error: updateError } = await supabase
      .from('error_sessions')
      .update({ status: 'mastered' })
      .eq('id', session_id)
      .eq('student_id', student_id);

    if (updateError) {
      console.error('Error updating session status:', updateError);
      return NextResponse.json({ error: 'Failed to update session status' }, { status: 500 });
    }

    const { data: existingReview, error: existingReviewError } = await supabase
      .from('review_schedule')
      .select('id')
      .eq('session_id', session_id)
      .eq('student_id', student_id)
      .maybeSingle();

    if (existingReviewError) {
      console.error('Error checking review schedule:', existingReviewError);
    }

    if (existingReview) {
      await sendMasteryNotification(student_id, session_id, existingReview.id, sessionInfo);

      return NextResponse.json({
        success: true,
        message: 'Error session marked as mastered',
        review_exists: true,
        can_analyze: true,
      });
    }

    const firstReviewDate = new Date();
    firstReviewDate.setDate(firstReviewDate.getDate() + REVIEW_INTERVALS[0]);

    const { data: reviewData, error: reviewError } = await supabase
      .from('review_schedule')
      .insert({
        session_id,
        student_id,
        review_stage: 1,
        next_review_at: firstReviewDate.toISOString(),
        is_completed: false,
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Error creating review schedule:', reviewError);
      return NextResponse.json({
        success: true,
        message: 'Error session marked as mastered, but review schedule creation failed',
        review_created: false,
        can_analyze: true,
      });
    }

    await sendMasteryNotification(student_id, session_id, reviewData?.id, sessionInfo);

    try {
      const baseUrl =
        process.env.NEXT_PUBLIC_SITE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

      await fetch(`${baseUrl}/api/achievements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: student_id,
          action: 'error_mastered',
          data: { count: 1 },
        }),
      });
    } catch (achievementError) {
      console.error('Failed to update achievements:', achievementError);
    }

    return NextResponse.json({
      success: true,
      message: 'Error session mastered and review schedule created',
      review_created: true,
      review_id: reviewData?.id,
      next_review_at: firstReviewDate.toISOString(),
      can_analyze: true,
    });
  } catch (error: any) {
    console.error('Complete error session API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

async function sendMasteryNotification(studentId: string, sessionId: string, reviewId: string | undefined, sessionInfo: any) {
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
      type: 'mastery_update',
      title: `${studentName}完成了一道${subjectName}题目`,
      content: `${studentName}刚刚完成了一道${subjectName}错题的学习，点击查看 AI 分析报告，了解孩子的学习状态和沟通建议。`,
      data: {
        session_id: sessionId,
        student_id: studentId,
        subject: sessionInfo?.subject,
        can_analyze: true,
      },
      action_url: reviewId ? `/review/session/${reviewId}` : `/error-book/${sessionId}`,
      action_text: '查看分析',
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
