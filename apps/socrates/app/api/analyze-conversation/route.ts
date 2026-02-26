// =====================================================
// Project Socrates - Conversation Analysis API
// AI对话分析：分析学生与AI的对话，给家长提供洞察和建议
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// AI分析提示词
function buildAnalysisPrompt(
  subject: string,
  gradeLevel: number | undefined,
  questionText: string,
  messages: Array<{ role: string; content: string }>,
  analysisType: 'single' | 'comprehensive'
): string {
  const subjectName: Record<string, string> = {
    math: '数学',
    physics: '物理',
    chemistry: '化学',
  };

  const gradeText = gradeLevel ? `${gradeLevel}年级` : '初中';

  const conversationText = messages
    .map(m => `${m.role === 'assistant' ? 'AI老师' : '学生'}: ${m.content}`)
    .join('\n\n');

  if (analysisType === 'single') {
    return `你是一位资深的教育专家和家庭教育顾问，擅长分析学生的学习状态并给家长提供实用的沟通建议。

【分析任务】
请分析以下学生与AI老师的对话记录，从多个维度评估学生的学习状态，并给家长提供具体、可操作的建议。

【基本信息】
- 科目：${subjectName[subject] || subject}
- 年级：${gradeText}
- 题目内容：
${questionText}

【对话记录】
${conversationText}

【分析要求】
请按以下JSON格式输出分析结果，确保所有字段都有内容：

{
  "overallAssessment": {
    "learningScore": 1-5的数字,
    "engagement": "高/中/低",
    "status": "有效/需关注/需干预"
  },
  "knowledgeAnalysis": {
    "mastered": ["已掌握的知识点"],
    "understanding": ["理解中的知识点"],
    "needsWork": ["需要加强的知识点"]
  },
  "thinkingStyle": {
    "activeThinking": { "score": 1-5, "comment": "简短评价" },
    "logicalReasoning": { "score": 1-5, "comment": "简短评价" },
    "answerDependence": { "score": 1-5, "comment": "分数越低越好" },
    "errorCorrection": { "score": 1-5, "comment": "简短评价" }
  },
  "highlights": [
    { "text": "对话中的亮点描述", "meaning": "为什么这是亮点" }
  ],
  "concerns": [
    { "text": "需要关注的问题", "meaning": "为什么需要关注" }
  ],
  "communicationAdvice": {
    "approach": "沟通角度的建议，如何切入话题",
    "keyPoints": ["沟通要点1", "沟通要点2"],
    "scripts": {
      "opening": { "scene": "开场场景", "script": "推荐话术" },
      "guiding": { "scene": "引导场景", "script": "推荐话术" },
      "encouraging": { "scene": "鼓励场景", "script": "推荐话术" },
      "casual": { "scene": "日常交流场景", "script": "推荐话术" }
    },
    "doList": ["建议做的事1", "建议做的事2", "建议做的事3"],
    "dontList": ["避免做的事1", "避免做的事2", "避免做的事3"]
  },
  "practiceSuggestions": ["练习建议1", "练习建议2"]
}

【注意事项】
1. 评分要客观，基于对话内容，不要过于宽松或严厉
2. 沟通话术要自然、亲切，符合中国家长的说话习惯
3. 建议要具体可操作，不要空泛
4. 如果对话轮数较少，在overallAssessment.status中标注"需关注"
5. 所有文本使用中文

请直接输出JSON，不要有其他说明文字。`;
  }

  // 综合分析提示词（多题）
  return `你是一位资深的教育专家和家庭教育顾问，擅长综合分析学生的学习状态并给家长提供实用的沟通建议。

【分析任务】
请综合分析以下多道题目的学习情况，给出整体评估和针对性的沟通建议。

【基本信息】
- 年级：${gradeText}

【题目和对话记录】
${conversationText}

【分析要求】
请按以下JSON格式输出综合分析结果：

{
  "overallAssessment": {
    "totalProblems": 题目总数,
    "avgScore": 1-5的平均分,
    "masteryRate": 掌握率百分比,
    "trend": "上升中/稳定/下降"
  },
  "subjectPerformance": [
    {
      "subject": "科目名",
      "mastery": 掌握百分比,
      "status": "良好/需关注/建议加强",
      "comment": "简短评价"
    }
  ],
  "thinkingPatterns": {
    "strengths": ["思维优势1", "思维优势2"],
    "patterns": ["学习模式1", "学习模式2"],
    "challenges": ["遇到的挑战"]
  },
  "weeklyTrend": [
    { "day": "周几", "event": "发生的学习事件", "note": "备注" }
  ],
  "communicationAdvice": {
    "weeklyFocus": "本周沟通重点",
    "subjectScripts": [
      {
        "subject": "科目",
        "situation": "情况描述",
        "approach": "沟通方式",
        "script": "推荐话术"
      }
    ]
  },
  "nextWeekPlan": {
    "suggestions": ["下周建议1", "下周建议2"],
    "recommendedOrder": "推荐学习顺序",
    "focusAreas": ["重点关注领域"]
  }
}

请直接输出JSON，不要有其他说明文字。`;
}

// 调用AI API进行分析
async function callAnalysisAPI(prompt: string): Promise<any> {
  const apiKey = process.env.DASHSCOPE_API_KEY;

  if (!apiKey) {
    // 返回模拟数据用于开发测试
    return getMockAnalysis();
  }

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的教育分析师，擅长分析学生学习状态并给出实用的家长建议。请始终以JSON格式输出分析结果。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    // 尝试解析JSON
    try {
      // 移除可能的markdown代码块标记
      const jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(jsonStr);
    } catch {
      console.error('Failed to parse AI response as JSON:', content);
      return getMockAnalysis();
    }
  } catch (error) {
    console.error('AI API Error:', error);
    return getMockAnalysis();
  }
}

// 模拟分析数据（开发测试用）
function getMockAnalysis() {
  return {
    overallAssessment: {
      learningScore: 4,
      engagement: "中",
      status: "有效"
    },
    knowledgeAnalysis: {
      mastered: ["一元二次方程求根公式"],
      understanding: ["判别式的应用"],
      needsWork: ["复杂情况下的符号判断"]
    },
    thinkingStyle: {
      activeThinking: { score: 4, comment: "能主动尝试，有思考过程" },
      logicalReasoning: { score: 3, comment: "基本正确，偶尔跳步" },
      answerDependence: { score: 2, comment: "有时希望直接得到答案" },
      errorCorrection: { score: 4, comment: "能根据提示修正错误" }
    },
    highlights: [
      { text: "学生尝试用公式法求解", meaning: "主动运用所学知识" },
      { text: "学生发现计算错误并修正", meaning: "有自我检查意识" }
    ],
    concerns: [
      { text: "学生两次询问答案", meaning: "可能缺乏耐心" },
      { text: "跳过了中间步骤", meaning: "需要培养严谨性" }
    ],
    communicationAdvice: {
      approach: "孩子对一元二次方程掌握不错，但有时会急于求成。建议从'肯定努力'的角度切入，避免直接指出问题。",
      keyPoints: ["先肯定努力", "再引导发现问题", "最后给予鼓励"],
      scripts: {
        opening: {
          scene: "开场 - 肯定努力",
          script: "我看到你今天做了一元二次方程的题，能感觉到你在认真思考，特别是用公式法那一步，做得很好！"
        },
        guiding: {
          scene: "引导 - 发现问题",
          script: "这道题中间有一步比较难，你是怎么想的？能给我讲讲你的思路吗？"
        },
        encouraging: {
          scene: "鼓励 - 建立信心",
          script: "我觉得你完全能掌握这类题，只是需要再多一点耐心。下次遇到不会的，先自己想想，实在想不出来再问，这样进步会更快！"
        },
        casual: {
          scene: "日常 - 轻松交流",
          script: "今天数学学得怎么样？有没有哪道题特别有意思？"
        }
      },
      doList: [
        "选择孩子心情好的时候聊",
        "用'我看到...'而不是'你应该...'",
        "多问'你怎么想'少说'你应该这样'",
        "每次只聊1-2个点，不要一次说太多"
      ],
      dontList: [
        "不要在孩子疲劳时提学习问题",
        "不要拿别人家孩子比较",
        "不要一次性指出太多问题"
      ]
    },
    practiceSuggestions: [
      "判别式为正/负/零的三种情况各练2道",
      "含参数的一元二次方程（进阶，建议下周尝试）"
    ]
  };
}

// POST - 分析对话
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, student_id, date_range, subjects } = body;

    // 单题分析模式
    if (session_id) {
      // 获取错题信息
      const { data: session, error: sessionError } = await supabase
        .from('error_sessions')
        .select(`
          id,
          subject,
          extracted_text,
          student_id,
          profiles!error_sessions_student_id_fkey(grade_level)
        `)
        .eq('id', session_id)
        .single();

      if (sessionError || !session) {
        return NextResponse.json({ error: '错题不存在' }, { status: 404 });
      }

      // 获取对话记录
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        return NextResponse.json({ error: '获取对话记录失败' }, { status: 500 });
      }

      // 检查对话轮数（至少3轮）
      const userMessages = messages?.filter(m => m.role === 'user') || [];
      if (userMessages.length < 3) {
        return NextResponse.json({
          error: '对话轮数不足',
          message: '需要至少3轮对话才能进行分析',
          currentRounds: userMessages.length
        }, { status: 400 });
      }

      // 构建分析提示词
      const prompt = buildAnalysisPrompt(
        (session as any).subject,
        (session as any).profiles?.grade_level,
        (session as any).extracted_text || '题目内容未识别',
        messages || [],
        'single'
      );

      // 调用AI分析
      const analysis = await callAnalysisAPI(prompt);

      return NextResponse.json({
        success: true,
        analysis,
        meta: {
          sessionId: session_id,
          subject: (session as any).subject,
          messageCount: messages?.length || 0,
          analyzedAt: new Date().toISOString()
        }
      });
    }

    // 综合分析模式
    if (student_id) {
      // 构建日期过滤条件
      let dateFilter = new Date();
      if (date_range === '7d') {
        dateFilter.setDate(dateFilter.getDate() - 7);
      } else if (date_range === '30d') {
        dateFilter.setDate(dateFilter.getDate() - 30);
      } else {
        dateFilter = new Date('2020-01-01'); // 全部
      }

      // 获取学生信息
      const { data: profile } = await supabase
        .from('profiles')
        .select('grade_level')
        .eq('id', student_id)
        .single();

      // 获取错题列表
      let sessionsQuery = supabase
        .from('error_sessions')
        .select('id, subject, extracted_text, created_at')
        .eq('student_id', student_id)
        .gte('created_at', dateFilter.toISOString())
        .order('created_at', { ascending: true });

      if (subjects && subjects !== 'all') {
        sessionsQuery = sessionsQuery.in('subject', Array.isArray(subjects) ? subjects : [subjects]);
      }

      const { data: sessions } = await sessionsQuery;

      if (!sessions || sessions.length === 0) {
        return NextResponse.json({
          error: '没有学习记录',
          message: '选定范围内没有学习记录'
        }, { status: 400 });
      }

      // 获取所有对话
      const sessionIds = sessions.map(s => s.id);
      const { data: allMessages } = await supabase
        .from('chat_messages')
        .select('session_id, role, content')
        .in('session_id', sessionIds)
        .order('created_at', { ascending: true });

      // 按session分组对话
      const messagesBySession: Record<string, Array<{ role: string; content: string }>> = {};
      (allMessages || []).forEach(m => {
        if (!messagesBySession[m.session_id]) {
          messagesBySession[m.session_id] = [];
        }
        messagesBySession[m.session_id].push({
          role: m.role,
          content: m.content
        });
      });

      // 构建综合分析文本
      let combinedText = '';
      sessions.forEach((session: any) => {
        const msgs = messagesBySession[session.id] || [];
        if (msgs.length >= 3) {
          combinedText += `\n【题目${session.subject}】\n${session.extracted_text || '题目未识别'}\n\n对话：\n`;
          combinedText += msgs.map(m => `${m.role === 'assistant' ? 'AI' : '学生'}: ${m.content}`).join('\n');
          combinedText += '\n\n---\n';
        }
      });

      if (!combinedText) {
        return NextResponse.json({
          error: '对话不足',
          message: '有效对话记录不足，无法进行分析'
        }, { status: 400 });
      }

      // 构建分析提示词
      const prompt = buildAnalysisPrompt(
        '综合',
        (profile as any)?.grade_level,
        combinedText,
        [],
        'comprehensive'
      );

      // 调用AI分析
      const analysis = await callAnalysisAPI(prompt);

      return NextResponse.json({
        success: true,
        analysis,
        meta: {
          studentId: student_id,
          dateRange: date_range,
          subjects,
          sessionCount: sessions.length,
          analyzedAt: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
  } catch (error: any) {
    console.error('Analysis API error:', error);
    return NextResponse.json({ error: error.message || '分析失败' }, { status: 500 });
  }
}
