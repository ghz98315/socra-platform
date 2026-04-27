import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedStudentProfile } from '@/lib/server/route-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const student = await getAuthenticatedStudentProfile();
    if (!student) {
      return NextResponse.json({ error: 'Only students can generate review reminders' }, { status: 403 });
    }

    const body = await req.json();
    const sessionId = typeof body?.session_id === 'string' ? body.session_id : '';

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const { data: session, error: sessionError } = await supabase
      .from('error_sessions')
      .select(`
        *,
        profiles!inner (
          display_name,
          grade_level
        )
      `)
      .eq('id', sessionId)
      .eq('student_id', student.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const { data: messages } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10);

    const prompt = buildReviewReminderPrompt(session, messages || []);
    const reminder = await callTongyiAPI(prompt);

    const { error: updateError } = await supabase
      .from('review_schedule')
      .update({
        variant_question_text: reminder,
      })
      .eq('session_id', sessionId)
      .eq('student_id', student.id)
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

function buildReviewReminderPrompt(session: any, history: any[]): string {
  const studentName = session.profiles?.display_name || '学生';
  const subject = getSubjectName(session.subject);
  const difficulty = session.difficulty_rating || 3;
  const tags = session.concept_tags?.join('、') || '未标注';

  const historyText = history
    .map((message) => `${message.role === 'assistant' ? '导师' : '学生'}: ${message.content}`)
    .join('\n');

  return `你是一名数学复习教练，请为${studentName}生成一条简短的复习提醒。

题目信息：
- 学科：${subject}
- 难度：${difficulty}/5
- 关联标签：${tags}
- 原题片段：${session.extracted_text?.slice(0, 200) || '无'}

对话摘录：
${historyText || '无'}

请输出 1 段 80-120 字的中文提醒，要求：
1. 点出本题最值得复习的关键点
2. 语气自然，适合学生阅读
3. 不要直接给出完整答案
4. 最后附一个可执行的小提醒`;
}

async function callTongyiAPI(prompt: string): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return '回看这道题时，先自己说出题目考查的知识点，再尝试不用提示重做一遍，最后总结这次最容易出错的一步。';
  }

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: '你是一名面向中学生的复习提醒助手，输出简洁、自然、可执行的中文提示。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content ||
      '回看这道题时，先自己说出题目考查的知识点，再尝试不用提示重做一遍，最后总结这次最容易出错的一步。';
  } catch (error) {
    console.error('Tongyi API Error:', error);
    return '回看这道题时，先自己说出题目考查的知识点，再尝试不用提示重做一遍，最后总结这次最容易出错的一步。';
  }
}

function getSubjectName(subject: string): string {
  const names: Record<string, string> = {
    math: '数学',
    physics: '物理',
    chemistry: '化学',
  };
  return names[subject] || subject;
}
