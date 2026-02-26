// =====================================================
// Project Socrates - Study Session API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 服务端客户端
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST endpoint - 管理学习会话 (开始/结束/心跳)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const student_id = body.student_id as string;
    const session_id = body.session_id as string | undefined;
    const session_type = body.session_type as 'error_analysis' | 'review' | undefined;

    // 从header获取action，默认为start
    const action = req.headers.get('x-action') || 'start';
    const now = new Date().toISOString();

    switch (action) {
      case 'start': {
        // 开始新的学习会话
        const { data, error } = await supabase
          .from('study_sessions')
          .insert({
            student_id,
            session_type: session_type || 'error_analysis',
            start_time: now,
            last_heartbeat: now,
          })
          .select()
          .single();

        if (error) {
          console.error('Error starting study session:', error);
          return NextResponse.json({ error: 'Failed to start session' }, { status: 500 });
        }

        return NextResponse.json({
          data: { session_id: data.id },
          message: 'Study session started',
        });
      }

      case 'end': {
        // 结束学习会话
        const end_time = now;

        // 如果提供了session_id，直接结束该会话
        if (session_id) {
          // 先获取会话开始时间计算时长
          const { data: session } = await supabase
            .from('study_sessions')
            .select('start_time')
            .eq('id', session_id)
            .single();

          if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 404 });
          }

          const duration = Math.floor(
            (new Date(end_time).getTime() - new Date(session.start_time).getTime()) / 1000
          );

          const { error } = await supabase
            .from('study_sessions')
            .update({
              end_time: end_time,
              duration_seconds: duration,
            })
            .eq('id', session_id);

          if (error) {
            console.error('Error ending study session:', error);
            return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
          }

          return NextResponse.json({
            data: { session_id, duration_seconds: duration },
            message: 'Study session ended',
          });
        }

        // 否则查找该学生的活跃会话
        const { data: activeSessions } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('student_id', student_id)
          .is('end_time', null)
          .order('start_time', { ascending: false })
          .limit(1);

        const activeSession = activeSessions?.[0];

        if (!activeSession) {
          return NextResponse.json({ error: 'No active session found' }, { status: 404 });
        }

        const duration = Math.floor(
          (new Date(end_time).getTime() - new Date(activeSession.start_time).getTime()) / 1000
        );

        const { error } = await supabase
          .from('study_sessions')
          .update({
            end_time: end_time,
            duration_seconds: duration,
          })
          .eq('id', activeSession.id);

        if (error) {
          console.error('Error ending study session:', error);
          return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
        }

        return NextResponse.json({
          data: { session_id: activeSession.id, duration_seconds: duration },
          message: 'Study session ended',
        });
      }

      case 'heartbeat': {
        // 心跳保持会话活跃
        if (!session_id) {
          return NextResponse.json({ error: 'session_id is required for heartbeat' }, { status: 400 });
        }

        const { error } = await supabase
          .from('study_sessions')
          .update({ last_heartbeat: now })
          .eq('id', session_id);

        if (error) {
          console.error('Error updating heartbeat:', error);
          return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
        }

        return NextResponse.json({
          data: { session_id },
          message: 'Heartbeat recorded',
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Study session API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint - 获取学习时长统计
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const student_id = searchParams.get('student_id');
    const start_date = searchParams.get('start_date');
    const end_date = searchParams.get('end_date');

    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    // 构建查询
    let query = supabase
      .from('study_sessions')
      .select('*')
      .eq('student_id', student_id);

    if (start_date) {
      query = query.gte('start_time', start_date);
    }
    if (end_date) {
      query = query.lte('start_time', end_date);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching study sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    // Helper function to check if a session is from today
    const isToday = (startTime: string): boolean => {
      const sessionDate = new Date(startTime);
      const today = new Date();
      return sessionDate.toDateString() === today.toDateString();
    };

    // 计算统计
    const totalSessions = sessions?.length || 0;
    const totalDurationSeconds = sessions?.reduce(
      (sum, s) => sum + (s.duration_seconds || 0),
      0
    ) || 0;
    const todaySessionsList = sessions?.filter(s => isToday(s.start_time)) || [];
    const todayDurationSeconds = todaySessionsList.reduce(
      (sum, s) => sum + (s.duration_seconds || 0),
      0
    );

    const stats = {
      total_sessions: totalSessions,
      total_duration_minutes: Math.round(totalDurationSeconds / 60),
      today_sessions: todaySessionsList.length,
      today_duration_minutes: Math.round(todayDurationSeconds / 60),
    };

    return NextResponse.json({
      data: stats,
    });
  } catch (error) {
    console.error('Study stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
