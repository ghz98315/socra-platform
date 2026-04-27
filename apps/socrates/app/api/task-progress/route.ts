import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedProfile } from '@/lib/server/route-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type AuthenticatedActor = {
  id: string;
  role: 'parent' | 'student' | 'admin';
};

type ParentTask = {
  id: string;
  parent_id: string;
  child_id: string;
  title: string;
  target_count: number | null;
  target_duration: number | null;
  reward_points: number | null;
  status: string | null;
  completed_at: string | null;
};

function isTaskCompleted(task: ParentTask, progressCount: number, progressDuration: number) {
  if ((task.target_count ?? 0) > 0 && progressCount >= (task.target_count ?? 0)) {
    return true;
  }

  if (task.target_duration && progressDuration >= task.target_duration) {
    return true;
  }

  return false;
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

async function getAuthorizedTask(taskId: string, actor: AuthenticatedActor) {
  const { data: task, error } = await supabase
    .from('parent_tasks')
    .select('id, parent_id, child_id, title, target_count, target_duration, reward_points, status, completed_at')
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

  return { task: task as ParentTask };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthorizedActor();
    if (auth.error) {
      return auth.error;
    }

    const body = await req.json();
    const taskId = typeof body.taskId === 'string' ? body.taskId : '';
    const progressCount = typeof body.progressCount === 'number' ? body.progressCount : undefined;
    const progressDuration = typeof body.progressDuration === 'number' ? body.progressDuration : undefined;
    const notes =
      body.notes === null || typeof body.notes === 'string'
        ? body.notes
        : undefined;

    if (!taskId) {
      return NextResponse.json(
        { error: 'taskId is required' },
        { status: 400 },
      );
    }

    const authorizedTask = await getAuthorizedTask(taskId, auth.actor);
    if (authorizedTask.error) {
      return authorizedTask.error;
    }

    const task = authorizedTask.task;
    const childId = task.child_id;

    const { data: existingProgress, error: progressError } = await supabase
      .from('task_completions')
      .select('*')
      .eq('task_id', taskId)
      .eq('child_id', childId)
      .maybeSingle();

    if (progressError) {
      throw progressError;
    }

    const now = new Date().toISOString();
    const nextProgressCount = progressCount ?? existingProgress?.progress_count ?? 0;
    const nextProgressDuration = progressDuration ?? existingProgress?.progress_duration ?? 0;
    const completed = isTaskCompleted(task, nextProgressCount, nextProgressDuration);

    let completionId = existingProgress?.id as string | undefined;
    let alreadyRewarded = Boolean(existingProgress?.rewarded_at);

    if (existingProgress) {
      const updateData: Record<string, unknown> = {
        progress_count: nextProgressCount,
        progress_duration: nextProgressDuration,
        updated_at: now,
      };

      if (notes !== undefined) {
        updateData.notes = notes;
      }

      if (completed && !existingProgress.completed_at) {
        updateData.completed_at = now;
      }

      const { data: updatedProgress, error: updateError } = await supabase
        .from('task_completions')
        .update(updateData)
        .eq('id', existingProgress.id)
        .select('id, rewarded_at')
        .single();

      if (updateError) {
        throw updateError;
      }

      completionId = updatedProgress.id;
      alreadyRewarded = Boolean(updatedProgress.rewarded_at);
    } else {
      const { data: insertedProgress, error: insertError } = await supabase
        .from('task_completions')
        .insert({
          task_id: taskId,
          child_id: childId,
          progress_count: nextProgressCount,
          progress_duration: nextProgressDuration,
          notes: notes ?? null,
          completed_at: completed ? now : null,
        })
        .select('id')
        .single();

      if (insertError) {
        throw insertError;
      }

      completionId = insertedProgress.id;
    }

    let rewardPoints = 0;

    if (completed) {
      const { error: taskUpdateError } = await supabase
        .from('parent_tasks')
        .update({
          status: 'completed',
          completed_at: task.completed_at ?? now,
          updated_at: now,
        })
        .eq('id', taskId);

      if (taskUpdateError) {
        throw taskUpdateError;
      }

      if ((task.reward_points ?? 0) > 0 && completionId && !alreadyRewarded) {
        const addPointsResult = await supabase.rpc('add_points', {
          p_user_id: childId,
          p_amount: task.reward_points,
          p_source: 'task',
          p_transaction_type: 'reward',
          p_related_id: taskId,
          p_related_type: 'parent_task',
          p_description: `Task reward: ${task.title}`,
          p_metadata: {
            task_id: taskId,
            completion_id: completionId,
          },
        });

        if (addPointsResult.error) {
          throw addPointsResult.error;
        }

        const { error: rewardMarkError } = await supabase
          .from('task_completions')
          .update({ rewarded_at: now, updated_at: now })
          .eq('id', completionId);

        if (rewardMarkError) {
          throw rewardMarkError;
        }

        rewardPoints = task.reward_points ?? 0;
      }
    } else if (task.status === 'pending') {
      const { error: taskUpdateError } = await supabase
        .from('parent_tasks')
        .update({ status: 'in_progress', updated_at: now })
        .eq('id', taskId);

      if (taskUpdateError) {
        throw taskUpdateError;
      }
    }

    return NextResponse.json({
      success: true,
      completed,
      rewardPoints,
    });
  } catch (error: any) {
    console.error('[Task Progress API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthorizedActor();
    if (auth.error) {
      return auth.error;
    }

    const taskId = req.nextUrl.searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json(
        { error: 'task_id is required' },
        { status: 400 },
      );
    }

    const authorizedTask = await getAuthorizedTask(taskId, auth.actor);
    if (authorizedTask.error) {
      return authorizedTask.error;
    }

    const { data: progress, error } = await supabase
      .from('task_completions')
      .select('*')
      .eq('task_id', taskId)
      .eq('child_id', authorizedTask.task.child_id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      progress: progress || {
        progress_count: 0,
        progress_duration: 0,
        notes: null,
      },
    });
  } catch (error: any) {
    console.error('[Task Progress API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
