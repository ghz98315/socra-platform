// =====================================================
// Project Socrates - AI Review Reminder Generator
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST - 生成个性化复习提醒
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_id, session_id } = body;

    if (!student_id || !session_id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 获取错题信息
    const { data: session, error: sessionError } = await supabase
      .from('error_sessions')
      .select(`
        *,
        profiles!inner (
          display_name,
          grade_level
        )
      `)
      .eq('id', session_id)
      .eq('student_id', student_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 获取历史对话（用于个性化提醒）
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(10);

    // 构建 AI 提示词
    const prompt = buildReviewReminderPrompt(session, messages || []);

    // 调用通义千问 API 生成复习提醒
    const reminder = await callTongyiAPI(prompt);

    // 保存提醒内容
    const { error: updateError } = await supabase
      .from('review_schedule')
      .update({
        variant_question_text: reminder,
      })
      .eq('session_id', session_id)
      .eq('student_id', student_id)
      .eq('is_completed', false);

    if (updateError) {
      console.error('Error saving reminder:', updateError);
    }

    return NextResponse.json({
      success: true,
      reminder,
    });
  } catch (error: any) {
    console.error('Review reminder API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 构建复习提醒提示词
function buildReviewReminderPrompt(session: any, history: any[]): string {
  const studentName = session.profiles?.display_name || '同学';
  const subject = getSubjectName(session.subject);
  const difficulty = session.difficulty_rating || 3;
  const tags = session.concept_tags?.join('、') || '';

  const historyText = history
    .map(m => `${m.role === 'assistant' ? '老师' : '学生'}: ${m.content}`)
    .join('\n');

  return `你是苏格拉底AI学习助手，正在为${studentName}生成错题复习提醒。

【错题信息】
科目：${subject}
难度：${difficulty}/5
知识点：${tags}
原题内容：${session.extracted_text?.slice(0, 200)}...

【历史对话】
${historyText}

【复习阶段】
这是第 1 次复习，需要帮助学生巩固记忆。

【任务】
生成一段温馨、鼓励性的复习提醒（50-100字），要求：
1. 提及具体的知识点
2. 用苏格拉底式的引导提问
3. 鼓励学生主动思考
4. 语气亲切自然

请直接输出提醒内容，不要有其他说明。`;
}

// 调用通义千问 API
async function callTongyiAPI(prompt: string): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return '💡 该题需要复习巩固了。你还记得这道题的解题思路吗？';
  }

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: '你是苏格拉底AI学习助手，擅长用引导式提问帮助学生思考。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '💡 该题需要复习巩固了，来试试看吧！';
  } catch (error) {
    console.error('Tongyi API Error:', error);
    return '💡 该题需要复习巩固了，来试试看吧！';
  }
}

// 科目名称映射
function getSubjectName(subject: string): string {
  const names: Record<string, string> = {
    'math': '数学',
    'physics': '物理',
    'chemistry': '化学',
  };
  return names[subject] || subject;
}
