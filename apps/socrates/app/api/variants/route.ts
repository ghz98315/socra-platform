// =====================================================
// Project Socrates - Variant Questions API
// 变式题目生成 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { randomUUID } from 'crypto';
import type { VariantQuestion, GenerateVariantRequest, VariantDifficulty } from '@/lib/variant-questions/types';

// 模拟存储（实际应使用数据库）
const variantQuestions: Map<string, VariantQuestion[]> = new Map();

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

    let variants = variantQuestions.get(student_id) || [];

    // 按原错题筛选
    if (session_id) {
      variants = variants.filter(v => v.original_session_id === session_id);
    }

    // 按状态筛选
    if (status) {
      variants = variants.filter(v => v.status === status);
    }

    return NextResponse.json({
      data: variants,
      total: variants.length,
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
    const { session_id, student_id, subject, original_text, concept_tags, difficulty, count = 1 } = body;

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

    // 存储变式题目
    const existingVariants = variantQuestions.get(student_id) || [];
    variantQuestions.set(student_id, [...existingVariants, ...variants]);

    return NextResponse.json({
      success: true,
      data: variants,
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

    const variants = variantQuestions.get(student_id) || [];
    const variantIndex = variants.findIndex(v => v.id === variant_id);

    if (variantIndex === -1) {
      return NextResponse.json({ error: 'Variant question not found' }, { status: 404 });
    }

    const variant = variants[variantIndex];

    // 更新状态
    variant.attempts += 1;
    if (is_correct) {
      variant.correct_attempts += 1;
    }
    variant.last_practiced_at = new Date().toISOString();

    // 更新状态
    if (variant.correct_attempts >= 2) {
      variant.status = 'mastered';
      variant.completed_at = new Date().toISOString();
    } else if (variant.attempts >= 1) {
      variant.status = 'practicing';
    }

    variants[variantIndex] = variant;
    variantQuestions.set(student_id, variants);

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
    // 调用 AI API
    const response = await fetch(`${process.env.AI_BASE_URL_LOGIC || 'https://api.deepseek.com/v1'}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY_LOGIC}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
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
      throw new Error('AI API call failed');
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
      id: `variant_${Date.now()}_${index}`,
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
      id: `variant_${Date.now()}_${index}`,
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
