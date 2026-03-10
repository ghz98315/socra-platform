// =====================================================
// Project Socrates - Task Progress API
// 任务进度更新 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - 更新任务进度
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, childId, progressCount, progressDuration, notes } = body;

    if (!taskId || !childId) {
      return NextResponse.json(
        { error: 'taskId and childId are required' },
        { status: 400 }
      );
    }

    // 获取任务信息
    const { data: task, error: taskError } = await supabase
      .from('parent_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // 检查任务进度记录是否存在
    const { data: existingProgress } = await supabase
      .from('task_completions')
      .select('*')
      .eq('task_id', taskId)
      .eq('child_id', childId)
      .single();

    const now = new Date().toISOString();
    let isCompleted = false;

    if (existingProgress) {
      // 更新进度
      const updateData: any = {
        progress_count: progressCount ?? existingProgress.progress_count,
        progress_duration: progressDuration ?? existingProgress.progress_duration,
        updated_at: now,
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { error: updateError } = await supabase
        .from('task_completions')
        .update(updateData)
        .eq('id', existingProgress.id);

      if (updateError) throw updateError;

      // 检查是否完成
      if (task.target_count > 0 && updateData.progress_count >= task.target_count) {
        isCompleted = true;
      } else if (task.target_duration && updateData.progress_duration >= task.target_duration) {
        isCompleted = true;
      }
    } else {
      // 创建进度记录
      const { error: insertError } = await supabase
        .from('task_completions')
        .insert({
          task_id: taskId,
          child_id: childId,
          progress_count: progressCount || 0,
          progress_duration: progressDuration || 0,
          notes: notes || null,
        });

      if (insertError) throw insertError;

      // 检查是否完成
      if (task.target_count > 0 && (progressCount || 0) >= task.target_count) {
        isCompleted = true;
      } else if (task.target_duration && (progressDuration || 0) >= task.target_duration) {
        isCompleted = true;
      }
    }

    // 如果完成，更新任务状态
    if (isCompleted) {
      await supabase
        .from('parent_tasks')
        .update({
          status: 'completed',
          completed_at: now,
        })
        .eq('id', taskId);

      // 发放积分奖励
      if (task.reward_points > 0) {
        // 获取当前积分
        const { data: currentPoints } = await supabase
          .from('user_points')
          .select('total_points')
          .eq('user_id', childId)
          .single();

        const newTotal = (currentPoints?.total_points || 0) + task.reward_points;

        await supabase
          .from('user_points')
          .upsert({
            user_id: childId,
            total_points: newTotal,
            updated_at: now,
          });

        // 添加积分记录
        await supabase.from('point_transactions').insert({
          user_id: childId,
          points: task.reward_points,
          transaction_type: 'task_reward',
          description: `完成任务: ${task.title}`,
          related_id: taskId,
        });
      }
    } else if (task.status === 'pending') {
      // 如果任务还没开始，更新为进行中
      await supabase
        .from('parent_tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskId);
    }

    return NextResponse.json({
      success: true,
      completed: isCompleted,
      rewardPoints: isCompleted ? task.reward_points : 0,
    });
  } catch (error: any) {
    console.error('[Task Progress API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - 获取任务进度
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get('task_id');
    const childId = searchParams.get('child_id');

    if (!taskId || !childId) {
      return NextResponse.json(
        { error: 'task_id and child_id are required' },
        { status: 400 }
      );
    }

    const { data: progress, error } = await supabase
      .from('task_completions')
      .select('*')
      .eq('task_id', taskId)
      .eq('child_id', childId)
      .single();

    if (error && error.code !== 'PGRST116') {
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
