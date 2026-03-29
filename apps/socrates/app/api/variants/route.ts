// =====================================================
// Project Socrates - Variant Questions API
// 变式题目生成 API (Supabase 版本)
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import type { VariantQuestion, GenerateVariantRequest, VariantDifficulty } from '@/lib/variant-questions/types';
import { summarizeVariantEvidence } from '@/lib/error-loop/variant-evidence';
import { evaluateVariantAnswer } from '@/lib/variant-questions/evaluate-answer';

// 创建 Supabase Admin 客户端
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(url, key);
}

// GET - 获取变式题目列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const student_id = searchParams.get('student_id');
    const session_id = searchParams.get('session_id');
    const status = searchParams.get('status');

    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    let query = (admin as any)
      .from('variant_questions')
      .select('*')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });

    // 按原错题筛选
    if (session_id) {
      query = query.eq('original_session_id', session_id);
    }

    // 按状态筛选
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching variants:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const questions = (data || []) as VariantQuestion[];
    const variantIds = questions.map((question) => question.id).filter(Boolean);
    let summary = summarizeVariantEvidence({ questions: [], logs: [] });

    if (variantIds.length > 0) {
      const { data: logData, error: logError } = await (admin as any)
        .from('variant_practice_logs')
        .select('variant_id, is_correct, hints_used, created_at')
        .in('variant_id', variantIds);

      if (logError) {
        console.error('Error fetching variant practice logs:', logError);
      } else {
        summary = summarizeVariantEvidence({
          questions: questions.map((question) => ({
            id: question.id,
            status: question.status,
            attempts: question.attempts,
            correct_attempts: question.correct_attempts,
            last_practiced_at: question.last_practiced_at || null,
            completed_at: question.completed_at || null,
            created_at: question.created_at || null,
          })),
          logs: (logData || []) as Array<{
            variant_id: string;
            is_correct: boolean | null;
            hints_used: number | null;
            created_at: string | null;
          }>,
        });
      }
    }

    return NextResponse.json({
      data: questions,
      total: questions.length,
      summary,
    });
  } catch (error: any) {
    console.error('Variant questions GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 生成变式题目
export async function POST(req: NextRequest) {
  try {
    const body: GenerateVariantRequest = await req.json();
    const { session_id, student_id, subject, original_text, concept_tags, difficulty, count = 2 } = body;

    if (!session_id || !student_id || !original_text) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 使用 AI 生成变式题目
    const variants = await generateVariantsWithAI({
      session_id,
      student_id,
      subject: subject || 'math',
      original_text,
      concept_tags: concept_tags || [],
      difficulty: difficulty || 'medium',
      count,
    });

    // 存储到数据库
    const admin = getSupabaseAdmin();
    const { data, error } = await (admin as any)
      .from('variant_questions')
      .insert(variants)
      .select();

    if (error) {
      console.error('Error saving variants:', error);
      // 即使保存失败，也返回生成的变式题（降级方案）
      return NextResponse.json({
        success: true,
        data: variants,
        warning: 'Failed to save to database',
      });
    }

    return NextResponse.json({
      success: true,
      data: data || variants,
    });
  } catch (error: any) {
    console.error('Variant questions POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - 更新变式题目状态（练习结果）
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { variant_id, student_id, is_correct, student_answer, time_spent, hints_used } = body;

    if (!variant_id || !student_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // 插入练习记录（触发器会自动更新变式题目状态）
    const { error: logError } = await (admin as any)
      .from('variant_practice_logs')
      .insert({
        variant_id,
        student_id,
        is_correct,
        student_answer,
        time_spent: time_spent || 0,
        hints_used: hints_used || 0,
      });

    if (logError) {
      console.error('Error saving practice log:', logError);
    }

    // 获取更新后的变式题目
    const { data: variant, error } = await (admin as any)
      .from('variant_questions')
      .select('*')
      .eq('id', variant_id)
      .single();

    if (error) {
      console.error('Error fetching updated variant:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: variant,
    });
  } catch (error: any) {
    console.error('Variant questions PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 使用 AI 生成变式题目
async function generateVariantsWithAI(params: {
  session_id: string;
  student_id: string;
  subject: 'math' | 'physics' | 'chemistry';
  original_text: string;
  concept_tags: string[];
  difficulty: VariantDifficulty;
  count: number;
}): Promise<VariantQuestion[]> {
  const { session_id, student_id, subject, original_text, concept_tags, difficulty, count } = params;

  // 构建 AI prompt
  const subjectLabels: Record<string, string> = {
    math: '数学',
    physics: '物理',
    chemistry: '化学',
  };

  const difficultyLabels: Record<string, string> = {
    easy: '简单（数字变化，结构相同）',
    medium: '中等（条件变化，解法相似）',
    hard: '困难（情境变化，需要灵活应用）',
  };

  const prompt = `你是一位${subjectLabels[subject]}老师。请根据以下原题，生成${count}道变式练习题。

【原题】
${original_text}

【涉及知识点】
${concept_tags.length > 0 ? concept_tags.join('、') : '请自行分析'}

【难度要求】
${difficultyLabels[difficulty]}

【要求】
1. 保持相同的知识点和解题思路
2. 改变数字、条件或情境
3. 每道题提供2-3个递进提示
4. 提供详细解析和答案
5. 答案要简洁明了（如：42、x=5、30°等）

请按以下JSON格式返回（仅返回JSON，不要其他内容）：
{
  "variants": [
    {
      "question": "题目内容",
      "hints": ["提示1", "提示2"],
      "solution": "详细解析",
      "answer": "答案",
      "concepts": ["知识点1", "知识点2"]
    }
  ]
}`;

  try {
    // 优先使用 DeepSeek，降级到通义千问
    const aiBaseUrl = process.env.AI_BASE_URL_LOGIC || process.env.DASHSCOPE_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
    const aiApiKey = process.env.AI_API_KEY_LOGIC || process.env.DASHSCOPE_API_KEY;
    const aiModel = process.env.AI_MODEL_LOGIC || 'qwen-plus';

    const response = await fetch(`${aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aiApiKey}`,
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的题目设计专家，擅长根据原题设计变式练习题。请只返回JSON格式的结果。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI API call failed: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices[0]?.message?.content || '';

    // 解析 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const variants: VariantQuestion[] = (parsed.variants || []).map((v: any, index: number) => ({
      id: randomUUID(),
      original_session_id: session_id,
      student_id,
      subject,
      question_text: v.question,
      concept_tags: v.concepts || concept_tags,
      difficulty,
      hints: v.hints || [],
      solution: v.solution,
      answer: v.answer,
      status: 'pending' as const,
      attempts: 0,
      correct_attempts: 0,
      created_at: new Date().toISOString(),
    }));

    return variants.slice(0, count);
  } catch (error) {
    console.error('AI generation error:', error);

    // 返回模拟数据作为降级方案
    return Array.from({ length: count }, (_, index) => ({
      id: randomUUID(),
      original_session_id: session_id,
      student_id,
      subject,
      question_text: `【变式${index + 1}】基于原题的变式练习题。请根据 "${original_text.slice(0, 50)}..." 进行变化练习。`,
      concept_tags: concept_tags.length > 0 ? concept_tags : ['综合知识点'],
      difficulty,
      hints: ['提示1：仔细审题', '提示2：回顾相关公式', '提示3：分步求解'],
      solution: '这是变式题的详细解析...',
      answer: '答案',
      status: 'pending' as const,
      attempts: 0,
      correct_attempts: 0,
      created_at: new Date().toISOString(),
    }));
  }
}
