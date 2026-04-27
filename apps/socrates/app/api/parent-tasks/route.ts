import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  evaluateReviewInterventionEffect,
  parseReviewInterventionTaskMarkers,
} from '@/lib/error-loop/review';
import { getAuthenticatedProfile } from '@/lib/server/route-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type AuthenticatedActor = {
  id: string;
  role: 'parent' | 'student' | 'admin';
};

type ParentTaskRecord = {
  id: string;
  parent_id: string;
  child_id: string;
  title: string;
  description: string | null;
  task_type: string | null;
  subject: string | null;
  target_count: number | null;
  target_duration: number | null;
  priority: number | null;
  status: string | null;
  due_date: string | null;
  reward_points: number | null;
  created_at: string;
  completed_at: string | null;
  updated_at?: string | null;
  task_completions?: Array<{
    progress_count: number | null;
    progress_duration: number | null;
    notes: string | null;
    completed_at: string | null;
  }> | null;
};

type ParentTaskView = ParentTaskRecord & {
  progress_count: number;
  progress_duration: number;
  completion_notes: string | null;
  completion_completed_at: string | null;
  is_conversation_intervention: boolean;
  is_review_intervention: boolean;
  intervention_session_id: string | null;
  intervention_risk_category: string | null;
  intervention_review_judgement: string | null;
  intervention_review_reason: string | null;
  intervention_effect: 'pending' | 'risk_lowered' | 'risk_persisting' | null;
  post_intervention_repeat_count: number;
};

const parentTaskSelect = `
  id,
  parent_id,
  child_id,
  title,
  description,
  task_type,
  subject,
  target_count,
  target_duration,
  priority,
  status,
  due_date,
  reward_points,
  created_at,
  completed_at,
  updated_at,
  task_completions (
    progress_count,
    progress_duration,
    notes,
    completed_at
  )
`;

function parseConversationTaskMarkers(description: string | null | undefined) {
  const content = description || '';
  const sessionMatch = content.match(/\[conversation-session:([^\]]+)\]/);
  const categoryMatch = content.match(/\[conversation-risk:([^\]]+)\]/);

  if (!sessionMatch || !categoryMatch) {
    return null;
  }

  return {
    session_id: sessionMatch[1],
    risk_category: categoryMatch[1],
  };
}

function mapTaskWithProgress(task: ParentTaskRecord): ParentTaskView {
  const conversationMarkers = parseConversationTaskMarkers(task.description);
  const reviewMarkers = parseReviewInterventionTaskMarkers(task.description);
  const completion = Array.isArray(task.task_completions) ? task.task_completions[0] : null;

  return {
    ...task,
    progress_count: completion?.progress_count || 0,
    progress_duration: completion?.progress_duration || 0,
    completion_notes: completion?.notes || null,
    completion_completed_at: completion?.completed_at || null,
    is_conversation_intervention:
      task.task_type === 'conversation_intervention' || Boolean(conversationMarkers),
    is_review_intervention:
      task.task_type === 'review_intervention' || Boolean(reviewMarkers),
    intervention_session_id: conversationMarkers?.session_id || reviewMarkers?.session_id || null,
    intervention_risk_category: conversationMarkers?.risk_category || null,
    intervention_review_judgement: reviewMarkers?.judgement || null,
    intervention_review_reason: reviewMarkers?.reason || null,
    intervention_effect: null,
    post_intervention_repeat_count: 0,
  };
}

async function getAuthorizedActor() {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }
  if (profile.role !== 'parent' && profile.role !== 'student') {
    return { error: NextResponse.json({ error: 'Unsupported role' }, { status: 403 }) };
  }

  return { actor: profile as AuthenticatedActor };
}

async function getOwnedStudent(parentId: string, childId: string) {
  const { data: child, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', childId)
    .eq('role', 'student')
    .eq('parent_id', parentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return child;
}

async function getAuthorizedTask(taskId: string, actor: AuthenticatedActor) {
  const { data: task, error } = await supabase
    .from('parent_tasks')
    .select('id, parent_id, child_id, status, task_type, title, target_count, target_duration, reward_points, completed_at')
    .eq('id', taskId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!task) {
    return { error: NextResponse.json({ error: 'Task not found' }, { status: 404 }) };
  }

  if (actor.role === 'parent' && task.parent_id !== actor.id) {
    return { error: NextResponse.json({ error: 'Task not found' }, { status: 404 }) };
  }

  if (actor.role === 'student' && task.child_id !== actor.id) {
    return { error: NextResponse.json({ error: 'Task not found' }, { status: 404 }) };
  }

  return { task };
}

function pickParentTaskUpdates(updates: Record<string, unknown>) {
  const next: Record<string, unknown> = {};

  if (typeof updates.title === 'string') next.title = updates.title;
  if (updates.description === null || typeof updates.description === 'string') next.description = updates.description;
  if (typeof updates.task_type === 'string') next.task_type = updates.task_type;
  if (updates.subject === null || typeof updates.subject === 'string') next.subject = updates.subject;
  if (typeof updates.target_count === 'number') next.target_count = updates.target_count;
  if (updates.target_duration === null || typeof updates.target_duration === 'number') {
    next.target_duration = updates.target_duration;
  }
  if (typeof updates.priority === 'number') next.priority = updates.priority;
  if (typeof updates.status === 'string') next.status = updates.status;
  if (updates.due_date === null || typeof updates.due_date === 'string') next.due_date = updates.due_date;
  if (typeof updates.reward_points === 'number') next.reward_points = updates.reward_points;

  return next;
}

function pickStudentTaskUpdates(updates: Record<string, unknown>) {
  if (updates.status === 'in_progress') {
    return { status: 'in_progress' };
  }

  return {};
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthorizedActor();
    if (auth.error) {
      return auth.error;
    }

    const { actor } = auth;
    const { searchParams } = new URL(req.url);
    const childId = searchParams.get('child_id');
    const status = searchParams.get('status');

    if (actor.role === 'parent') {
      let scopedChildId: string | null = null;

      if (childId) {
        const child = await getOwnedStudent(actor.id, childId);
        if (!child) {
          return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }
        scopedChildId = child.id;
      }

      let query = supabase
        .from('parent_tasks')
        .select(parentTaskSelect)
        .eq('parent_id', actor.id);

      if (scopedChildId) {
        query = query.eq('child_id', scopedChildId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data: tasks, error } = await query
        .order('status', { ascending: true })
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) {
        throw error;
      }

      const childIds = [...new Set((tasks ?? []).map((task) => task.child_id).filter(Boolean))];
      const { data: children, error: childrenError } = childIds.length
        ? await supabase.from('profiles').select('id, display_name').in('id', childIds)
        : { data: [], error: null };

      if (childrenError) {
        throw childrenError;
      }

      const childMap = new Map((children ?? []).map((child) => [child.id, child.display_name]));
      let tasksWithChildren: Array<ParentTaskView & { child_name: string }> = (tasks ?? []).map((task) => ({
        ...mapTaskWithProgress(task as ParentTaskRecord),
        child_name: childMap.get(task.child_id) || 'Unknown',
      }));

      const reviewInterventionTasks = tasksWithChildren.filter(
        (task) =>
          task.is_review_intervention &&
          task.intervention_session_id &&
          task.intervention_review_judgement,
      );

      if (reviewInterventionTasks.length > 0) {
        const reviewSessionIds = Array.from(
          new Set(reviewInterventionTasks.map((task) => task.intervention_session_id).filter(Boolean)),
        ) as string[];

        const { data: reviewAttempts, error: reviewAttemptsError } = await supabase
          .from('review_attempts')
          .select('session_id, mastery_judgement, created_at')
          .in('session_id', reviewSessionIds);

        if (reviewAttemptsError) {
          throw reviewAttemptsError;
        }

        const attemptsBySession = new Map<
          string,
          Array<{ session_id: string; mastery_judgement: string; created_at: string }>
        >();

        for (const attempt of reviewAttempts || []) {
          const current = attemptsBySession.get(attempt.session_id) ?? [];
          current.push(attempt);
          attemptsBySession.set(attempt.session_id, current);
        }

        tasksWithChildren = tasksWithChildren.map((task) => {
          if (
            !task.is_review_intervention ||
            !task.intervention_session_id ||
            !task.intervention_review_judgement
          ) {
            return task;
          }

          const completedAt = task.completion_completed_at || task.completed_at || null;
          const { effect, postInterventionRepeatCount } = evaluateReviewInterventionEffect({
            status: task.status,
            completedAt,
            judgement: task.intervention_review_judgement,
            reason: task.intervention_review_reason,
            followupAttempts: attemptsBySession.get(task.intervention_session_id) ?? [],
          });

          return {
            ...task,
            intervention_effect: effect,
            post_intervention_repeat_count: postInterventionRepeatCount,
          };
        });
      }

      return NextResponse.json({ tasks: tasksWithChildren });
    }

    let query = supabase
      .from('parent_tasks')
      .select(parentTaskSelect)
      .eq('child_id', actor.id)
      .not('task_type', 'in', '(conversation_intervention,review_intervention)');

    if (status) {
      query = query.eq('status', status);
    }

    const { data: tasks, error } = await query
      .order('priority', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      tasks: (tasks ?? []).map((task) => mapTaskWithProgress(task as ParentTaskRecord)),
    });
  } catch (error: any) {
    console.error('[Parent Tasks API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthorizedActor();
    if (auth.error) {
      return auth.error;
    }

    const { actor } = auth;
    if (actor.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can create tasks' }, { status: 403 });
    }

    const body = await req.json();
    const {
      childId,
      title,
      description,
      taskType,
      subject,
      targetCount,
      targetDuration,
      priority,
      dueDate,
      rewardPoints,
    } = body;

    if (!childId || !title) {
      return NextResponse.json(
        { error: 'childId and title are required' },
        { status: 400 },
      );
    }

    const child = await getOwnedStudent(actor.id, childId);
    if (!child) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { data: task, error } = await supabase
      .from('parent_tasks')
      .insert({
        parent_id: actor.id,
        child_id: child.id,
        title,
        description: description || null,
        task_type: taskType || 'practice',
        subject: subject || null,
        target_count: targetCount || 1,
        target_duration: targetDuration || null,
        priority: priority || 2,
        due_date: dueDate || null,
        reward_points: rewardPoints || 0,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error: any) {
    console.error('[Parent Tasks API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthorizedActor();
    if (auth.error) {
      return auth.error;
    }

    const { actor } = auth;
    const body = await req.json();
    const taskId = typeof body.taskId === 'string' ? body.taskId : '';
    const updates = body.updates && typeof body.updates === 'object' ? body.updates : null;

    if (!taskId || !updates) {
      return NextResponse.json(
        { error: 'taskId and updates are required' },
        { status: 400 },
      );
    }

    const authorizedTask = await getAuthorizedTask(taskId, actor);
    if (authorizedTask.error) {
      return authorizedTask.error;
    }

    const safeUpdates: Record<string, unknown> =
      actor.role === 'parent'
        ? pickParentTaskUpdates(updates as Record<string, unknown>)
        : pickStudentTaskUpdates(updates as Record<string, unknown>);

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 });
    }

    safeUpdates.updated_at = new Date().toISOString();

    const { data: task, error } = await supabase
      .from('parent_tasks')
      .update(safeUpdates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error: any) {
    console.error('[Parent Tasks API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthorizedActor();
    if (auth.error) {
      return auth.error;
    }

    const { actor } = auth;
    if (actor.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can delete tasks' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json(
        { error: 'task_id is required' },
        { status: 400 },
      );
    }

    const authorizedTask = await getAuthorizedTask(taskId, actor);
    if (authorizedTask.error) {
      return authorizedTask.error;
    }

    const { error } = await supabase
      .from('parent_tasks')
      .delete()
      .eq('id', taskId)
      .eq('parent_id', actor.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Task deleted',
    });
  } catch (error: any) {
    console.error('[Parent Tasks API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
