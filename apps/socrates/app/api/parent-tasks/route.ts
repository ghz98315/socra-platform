// =====================================================
// Project Socrates - Parent Tasks API
// 家长任务布置 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseReviewInterventionTaskMarkers } from '@/lib/error-loop/review';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

function mapTaskWithProgress(task: any) {
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
  };
}

// GET - 获取任务列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parent_id');
    const childId = searchParams.get('child_id');
    const status = searchParams.get('status');

    if (parentId) {
      // 获取家长创建的任务
      const { data: tasks, error } = await supabase
        .from('parent_tasks')
        .select(`
          id,
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
          task_completions (
            progress_count,
            progress_duration,
            notes,
            completed_at
          )
        `)
        .eq('parent_id', parentId)
        .order('status', { ascending: true })
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false });

      if (error) throw error;

      // 获取孩子姓名
      const childIds = [...new Set(tasks?.map((t) => t.child_id) || [])];
      const { data: children } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', childIds);

      const childMap = new Map(children?.map((c) => [c.id, c.display_name]) || []);

      const tasksWithChildren = tasks?.map((task) => ({
        ...mapTaskWithProgress(task),
        child_name: childMap.get(task.child_id) || '未知',
      }));

      return NextResponse.json({ tasks: tasksWithChildren || [] });
    }

    if (childId) {
      // 获取孩子的任务
      let query = supabase
        .from('parent_tasks')
        .select(`
          id,
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
          task_completions (
            progress_count,
            progress_duration,
            notes,
            completed_at
          )
        `)
        .eq('child_id', childId)
        .not('task_type', 'in', '(conversation_intervention,review_intervention)')
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: tasks, error } = await query;

      if (error) throw error;

      const tasksWithProgress = tasks?.map((task) => mapTaskWithProgress(task));

      return NextResponse.json({ tasks: tasksWithProgress || [] });
    }

    return NextResponse.json({ error: 'parent_id or child_id is required' }, { status: 400 });
  } catch (error: any) {
    console.error('[Parent Tasks API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 创建任务
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      parentId,
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

    if (!parentId || !childId || !title) {
      return NextResponse.json(
        { error: 'parentId, childId and title are required' },
        { status: 400 }
      );
    }

    const { data: task, error } = await supabase
      .from('parent_tasks')
      .insert({
        parent_id: parentId,
        child_id: childId,
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

    if (error) throw error;

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error: any) {
    console.error('[Parent Tasks API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - 更新任务
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, updates } = body;

    if (!taskId || !updates) {
      return NextResponse.json(
        { error: 'taskId and updates are required' },
        { status: 400 }
      );
    }

    const { data: task, error } = await supabase
      .from('parent_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error: any) {
    console.error('[Parent Tasks API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - 删除任务
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('task_id');

    if (!taskId) {
      return NextResponse.json(
        { error: 'task_id is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('parent_tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Task deleted',
    });
  } catch (error: any) {
    console.error('[Parent Tasks API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
