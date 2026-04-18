import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import {
  createAuthorizedStudentErrorResponse,
  getAuthorizedStudentProfile,
} from '@/lib/server/route-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

async function loadAuthorizedStudySession(sessionId: string) {
  const { data: session, error } = await supabase
    .from('study_sessions')
    .select('id, student_id, start_time')
    .eq('id', sessionId)
    .maybeSingle();

  if (error) {
    console.error('Error loading study session:', error);
    return {
      response: NextResponse.json({ error: 'Failed to load session' }, { status: 500 }),
    };
  }

  if (!session?.id) {
    return {
      response: NextResponse.json({ error: 'Session not found' }, { status: 404 }),
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
    const requestedStudentId = typeof body?.student_id === 'string' ? body.student_id.trim() : undefined;
    const sessionId = typeof body?.session_id === 'string' ? body.session_id.trim() : '';
    const sessionType = body?.session_type as 'error_analysis' | 'review' | undefined;
    const action = req.headers.get('x-action') || 'start';
    const now = new Date().toISOString();

    switch (action) {
      case 'start': {
        const authorizedStudent = await getAuthorizedStudentProfile(requestedStudentId);
        if ('error' in authorizedStudent) {
          return createAuthorizedStudentErrorResponse(authorizedStudent.error);
        }
        const studentId = authorizedStudent.profile.id;

        const { data, error } = await supabase
          .from('study_sessions')
          .insert({
            student_id: studentId,
            session_type: sessionType || 'error_analysis',
            start_time: now,
            last_heartbeat: now,
          })
          .select()
          .single();

        if (error) {
          console.error('Error starting study session:', error);
          return NextResponse.json({ error: 'Failed to start session' }, { status: 500 });
        }

        await updateStreak(studentId);

        return NextResponse.json({
          data: { session_id: data.id },
          message: 'Study session started',
        });
      }

      case 'end': {
        const endTime = now;

        if (sessionId) {
          const authorizedSession = await loadAuthorizedStudySession(sessionId);
          if ('response' in authorizedSession) {
            return authorizedSession.response;
          }

          const duration = Math.floor(
            (new Date(endTime).getTime() - new Date(authorizedSession.session.start_time).getTime()) / 1000,
          );

          const { error } = await supabase
            .from('study_sessions')
            .update({
              end_time: endTime,
              duration_seconds: duration,
            })
            .eq('id', sessionId)
            .eq('student_id', authorizedSession.studentId);

          if (error) {
            console.error('Error ending study session:', error);
            return NextResponse.json({ error: 'Failed to end session' }, { status: 500 });
          }

          return NextResponse.json({
            data: { session_id: sessionId, duration_seconds: duration },
            message: 'Study session ended',
          });
        }

        const authorizedStudent = await getAuthorizedStudentProfile(requestedStudentId);
        if ('error' in authorizedStudent) {
          return createAuthorizedStudentErrorResponse(authorizedStudent.error);
        }
        const studentId = authorizedStudent.profile.id;

        const { data: activeSessions, error: activeSessionsError } = await supabase
          .from('study_sessions')
          .select('id, start_time')
          .eq('student_id', studentId)
          .is('end_time', null)
          .order('start_time', { ascending: false })
          .limit(1);

        if (activeSessionsError) {
          console.error('Error loading active study sessions:', activeSessionsError);
          return NextResponse.json({ error: 'Failed to load active session' }, { status: 500 });
        }

        const activeSession = activeSessions?.[0];
        if (!activeSession) {
          return NextResponse.json({ error: 'No active session found' }, { status: 404 });
        }

        const duration = Math.floor(
          (new Date(endTime).getTime() - new Date(activeSession.start_time).getTime()) / 1000,
        );

        const { error } = await supabase
          .from('study_sessions')
          .update({
            end_time: endTime,
            duration_seconds: duration,
          })
          .eq('id', activeSession.id)
          .eq('student_id', studentId);

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
        if (!sessionId) {
          return NextResponse.json({ error: 'session_id is required for heartbeat' }, { status: 400 });
        }

        const authorizedSession = await loadAuthorizedStudySession(sessionId);
        if ('response' in authorizedSession) {
          return authorizedSession.response;
        }

        const { error } = await supabase
          .from('study_sessions')
          .update({ last_heartbeat: now })
          .eq('id', sessionId)
          .eq('student_id', authorizedSession.studentId);

        if (error) {
          console.error('Error updating heartbeat:', error);
          return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
        }

        return NextResponse.json({
          data: { session_id: sessionId },
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const authorizedStudent = await getAuthorizedStudentProfile(searchParams.get('student_id'));

    if ('error' in authorizedStudent) {
      return createAuthorizedStudentErrorResponse(authorizedStudent.error);
    }
    const studentId = authorizedStudent.profile.id;

    let query = supabase.from('study_sessions').select('*').eq('student_id', studentId);

    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data: sessions, error } = await query;

    if (error) {
      console.error('Error fetching study sessions:', error);
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }

    const isToday = (startTime: string): boolean => {
      const sessionDate = new Date(startTime);
      const today = new Date();
      return sessionDate.toDateString() === today.toDateString();
    };

    const totalSessions = sessions?.length || 0;
    const totalDurationSeconds =
      sessions?.reduce((sum, session) => sum + (session.duration_seconds || 0), 0) || 0;
    const todaySessionsList = sessions?.filter((session) => isToday(session.start_time)) || [];
    const todayDurationSeconds = todaySessionsList.reduce(
      (sum, session) => sum + (session.duration_seconds || 0),
      0,
    );

    return NextResponse.json({
      data: {
        total_sessions: totalSessions,
        total_duration_minutes: Math.round(totalDurationSeconds / 60),
        today_sessions: todaySessionsList.length,
        today_duration_minutes: Math.round(todayDurationSeconds / 60),
      },
    });
  } catch (error) {
    console.error('Study stats API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function updateStreak(userId: string) {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data: levelData, error: fetchError } = await supabase
      .from('user_levels')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching user level:', fetchError);
      return;
    }

    const currentStreak = levelData?.current_streak || 0;
    const longestStreak = levelData?.longest_streak || 0;
    const lastActivityDate = levelData?.last_activity_date;

    let newStreak = 1;

    if (lastActivityDate) {
      const lastDate = new Date(lastActivityDate);
      const todayDate = new Date(today);
      const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return;
      }

      if (diffDays === 1) {
        newStreak = currentStreak + 1;
      }
    }

    const newLongestStreak = Math.max(longestStreak, newStreak);

    const { error: upsertError } = await supabase.from('user_levels').upsert(
      {
        user_id: userId,
        current_streak: newStreak,
        longest_streak: newLongestStreak,
        last_activity_date: today,
        level: levelData?.level || 1,
        xp: levelData?.xp || 0,
        total_xp: levelData?.total_xp || 0,
      },
      { onConflict: 'user_id' },
    );

    if (upsertError) {
      console.error('Error updating streak:', upsertError);
      return;
    }

    if (newStreak > currentStreak) {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL ||
          (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

        await fetch(`${baseUrl}/api/achievements`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            action: 'streak_updated',
            data: { streak: newStreak },
          }),
        });
      } catch (achievementError) {
        console.error('Failed to check streak achievements:', achievementError);
      }
    }

    console.log(`Streak updated for user ${userId}: ${currentStreak} -> ${newStreak}`);
  } catch (error) {
    console.error('updateStreak error:', error);
  }
}
