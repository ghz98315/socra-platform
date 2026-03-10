// =====================================================
// Project Socrates - Planner AI Optimize API
// AI 智能排期优化
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { callModelById } from '@/lib/ai-models/service';
import { getDefaultModel } from '@/lib/ai-models/config';

interface StudyTask {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  scheduled_time: string;
  status: string;
  difficulty: 'easy' | 'medium' | 'hard';
  priority: number;
  created_at?: string;
}

interface OptimizeRequest {
  tasks: StudyTask[];
  start_time: string;
  date: string;
}

interface OptimizedTask extends StudyTask {
  is_break?: boolean;
  reason?: string;
}

interface OptimizationResult {
  tasks: OptimizedTask[];
  total_time: number;
  break_count: number;
  suggestions: string[];
}

// 本地优化算法（后备方案）
function localOptimize(taskList: StudyTask[], startTime: string): OptimizationResult {
  const suggestions: string[] = [];
  const optimizedTasks: OptimizedTask[] = [];

  // 1. 按难度和优先级排序（要事优先：高难度任务放在精力最好的时段）
  const difficultyWeight = { hard: 3, medium: 2, easy: 1 };
  const sortedTasks = [...taskList].sort((a, b) => {
    // 先按优先级排序，再按难度
    const priorityDiff = (b.priority || 2) - (a.priority || 2);
    if (priorityDiff !== 0) return priorityDiff;

    const diffA = difficultyWeight[a.difficulty || 'medium'];
    const diffB = difficultyWeight[b.difficulty || 'medium'];
    return diffB - diffA;
  });

  // 2. 计算时间安排
  let currentTime = parseTime(startTime);
  let totalBreakTime = 0;

  sortedTasks.forEach((task, index) => {
    // 添加任务
    optimizedTasks.push({
      ...task,
      scheduled_time: formatTime(currentTime),
      reason: getTaskReason(task, index, sortedTasks.length),
    });

    // 更新时间
    currentTime = addMinutes(currentTime, task.duration_minutes);

    // 添加休息时间（除了最后一个任务）
    if (index < sortedTasks.length - 1) {
      const breakDuration = calculateBreakDuration(task, sortedTasks[index + 1]);
      optimizedTasks.push({
        id: `break_${index}`,
        title: '休息时间',
        subject: 'break',
        duration_minutes: breakDuration,
        scheduled_time: formatTime(currentTime),
        status: 'pending',
        difficulty: 'easy',
        priority: 0,
        created_at: new Date().toISOString(),
        is_break: true,
        reason: `建议休息${breakDuration}分钟，让大脑恢复精力`,
      });
      currentTime = addMinutes(currentTime, breakDuration);
      totalBreakTime += breakDuration;
    }
  });

  // 3. 生成建议
  const totalTime = taskList.reduce((sum, t) => sum + t.duration_minutes, 0) + totalBreakTime;
  suggestions.push(`根据"要事优先"原则，已将高难度任务安排在前段时段`);
  suggestions.push(`共安排了${totalBreakTime}分钟休息时间，帮助保持专注力`);
  suggestions.push(`预计总学习时长：${totalTime}分钟（含休息）`);

  const hardTasks = taskList.filter(t => t.difficulty === 'hard');
  if (hardTasks.length > 2) {
    suggestions.push(`今日有${hardTasks.length}个高难度任务，建议保持充足睡眠`);
  }

  return {
    tasks: optimizedTasks,
    total_time: totalTime,
    break_count: sortedTasks.length - 1,
    suggestions,
  };
}

// 辅助函数
function parseTime(timeStr: string) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return { hours, minutes };
}

function formatTime(time: { hours: number; minutes: number }) {
  return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
}

function addMinutes(time: { hours: number; minutes: number }, mins: number) {
  let totalMinutes = time.hours * 60 + time.minutes + mins;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

function calculateBreakDuration(currentTask: StudyTask, nextTask: StudyTask) {
  // 根据任务难度决定休息时长
  if (currentTask.difficulty === 'hard' || nextTask.difficulty === 'hard') {
    return 10; // 高难度后休息10分钟
  }
  return 5; // 默认休息5分钟
}

function getTaskReason(task: StudyTask, index: number, total: number): string {
  const reasons: string[] = [];
  if (index === 0) {
    reasons.push('安排在第一个，精力最充沛');
  }
  if (task.difficulty === 'hard') {
    reasons.push('高难度任务优先处理');
  }
  if (task.priority === 3) {
    reasons.push('重要任务，优先安排');
  }
  return reasons.join('；') || '按最优顺序安排';
}

export async function POST(request: NextRequest) {
  try {
    const body: OptimizeRequest = await request.json();
    const { tasks, start_time, date } = body;

    if (!tasks || tasks.length === 0) {
      return NextResponse.json(
        { error: '没有任务需要优化' },
        { status: 400 }
      );
    }

    // 构建优化提示词
    const systemPrompt = `你是一个学习计划优化助手。你的任务是根据以下原则优化学生的学习计划：

1. **要事优先原则**：高优先级和高难度的任务安排在精力最好的时段（通常是早上）
2. **番茄工作法**：每学习45-50分钟休息5-10分钟
3. **难度搭配**：高难度任务后安排中等或简单任务，避免连续高难度任务
4. **科目交替**：尽量让不同科目交替进行，避免疲劳
5. **考虑时长**：长任务可以拆分，短任务可以合并

请返回JSON格式的优化结果，包含：
- tasks: 优化后的任务列表，每个任务包含 id, title, subject, duration_minutes, scheduled_time, reason
- suggestions: 3-5条个性化学习建议

注意：
- 保持原有任务的总时长不变
- 合理安排休息时间
- scheduled_time 格式为 HH:MM
- reason 简短说明为什么这样安排`;

    const userPrompt = `请帮我优化今天的学习计划：

日期：${date}
开始时间：${start_time}

任务列表：
${tasks.map((t, i) => `${i + 1}. ${t.title} | 科目：${t.subject} | 时长：${t.duration_minutes}分钟 | 难度：${t.difficulty} | 优先级：${t.priority}`).join('\n')}

请返回优化后的JSON结果。`;

    try {
      // 尝试调用 AI 模型
      const defaultModel = getDefaultModel('chat');
      const result = await callModelById(
        defaultModel.id,
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        {
          temperature: 0.7,
          maxTokens: 2048,
        }
      );

      if (result.success && result.content) {
        // 尝试解析 AI 返回的 JSON
        try {
          // 提取 JSON 部分
          let jsonContent = result.content;
          const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            jsonContent = jsonMatch[0];
          }

          const aiResult = JSON.parse(jsonContent);

          // 验证返回的数据结构
          if (aiResult.tasks && Array.isArray(aiResult.tasks)) {
            return NextResponse.json({
              success: true,
              data: {
                tasks: aiResult.tasks,
                total_time: aiResult.tasks.reduce((sum: number, t: any) => sum + (t.duration_minutes || 0), 0),
                break_count: aiResult.tasks.filter((t: any) => t.is_break).length,
                suggestions: aiResult.suggestions || ['AI 优化完成'],
              },
              source: 'ai',
            });
          }
        } catch (parseError) {
          console.log('AI response parse error, falling back to local algorithm');
        }
      }
    } catch (aiError) {
      console.log('AI call failed, using local algorithm:', aiError);
    }

    // 使用本地优化算法作为后备
    const localResult = localOptimize(tasks, start_time);

    return NextResponse.json({
      success: true,
      data: localResult,
      source: 'local',
    });
  } catch (error) {
    console.error('Planner optimize API error:', error);
    return NextResponse.json(
      { error: '优化失败，请稍后重试' },
      { status: 500 }
    );
  }
}
