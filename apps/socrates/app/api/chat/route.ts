// =====================================================
// Project Socrates - AI Chat API
// Integrated with Multi-Model Support & Prompt System v2.0
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callModelById } from '@/lib/ai-models/service';
import { getDefaultModel } from '@/lib/ai-models/config';
import {
  buildSystemPrompt,
  getDialogMode,
  hasImageInMessages,
} from '@/lib/prompts/builder';
import type {
  SubjectType,
  GradeLevel,
  UserLevel,
  DialogMode,
  QuestionType,
} from '@/lib/prompts/types';

// 创建 Supabase 服务端客户端（使用 service_role 绕过 RLS）
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }
    supabaseAdminInstance = createClient(url, key);
  }
  return supabaseAdminInstance;
}

// 对话历史存储（开发环境使用内存存储）
const conversationHistory = new Map<
  string,
  Array<{ role: string; content: string }>
>();

// 通用 AI 模型调用
async function callAIModel(
  messages: Array<{ role: string; content: string }>,
  modelId?: string,
  isReasoning: boolean = false
): Promise<{ content: string; modelUsed: string }> {
  // 确定使用的模型
  let targetModelId = modelId;

  if (!targetModelId) {
    // 根据是否需要推理选择默认模型
    const defaultModel = getDefaultModel(isReasoning ? 'reasoning' : 'chat');
    targetModelId = defaultModel.id;
    console.log(
      'getDefaultModel result:',
      defaultModel.id,
      defaultModel.name,
      'enabled:',
      defaultModel.enabled
    );
  }

  console.log('callAIModel - targetModelId:', targetModelId);

  // 使用模型服务调用
  const result = await callModelById(targetModelId, messages, {
    temperature: isReasoning ? 0.3 : 0.7,
    maxTokens: isReasoning ? 4096 : 2048,
  });

  console.log(
    'callModelById result - success:',
    result.success,
    'error:',
    result.error,
    'model:',
    result.model
  );

  if (!result.success) {
    throw new Error(result.error || 'AI 模型调用失败');
  }

  return {
    content: result.content || '',
    modelUsed: result.model || targetModelId,
  };
}

// 改进的预设回应逻辑（fallback 用）
function generateImprovedMockResponse(
  userMessage: string,
  grade: GradeLevel,
  history: Array<{ role: string; content: string }>,
  questionContent?: string
): string {
  const userMessageCount = history.filter((m) => m.role === 'user').length;
  const lowerMessage = userMessage.toLowerCase();

  const askingForAnswer = /答案|结果|对不对|是多少|怎么做/.test(lowerMessage);
  const givingSolution =
    /我觉得|我认为|应该是|我想|第一步|首先|用.*?方法|先算|然后|最后/.test(
      lowerMessage
    );
  const confused = /不懂|不会|不知道|太难了|不明白/.test(lowerMessage);

  if (confused) {
    if (grade === 'junior') {
      return `没关系，让我帮你拆解这道题！😊

第一步：先告诉我题目在问什么？哪怕只说出一句话也行~`;
    }
    return `理解题目是关键。请告诉我：题目给了哪些条件？要求解决什么？`;
  }

  if (askingForAnswer) {
    return `不能直接给答案哦！但我可以引导你：

告诉我你的思路，我们一起推导。第一步，题目告诉了我们什么？`;
  }

  if (givingSolution) {
    return `${grade === 'junior' ? `很好的想法！✨` : `思路清晰。`}

继续：下一步你打算怎么做？`;
  }

  // 根据对话轮次提供渐进式引导
  if (userMessageCount === 1) {
    return `你好！${grade === 'junior' ? `🌟` : ``}

我们来看看这道题。题目告诉了我们什么？要求我们做什么？`;
  }

  // 后续轮次
  return `${
    grade === 'junior' ? `继续加油！💪` : `继续。`
  }

你觉得下一步应该怎么做？`;
}

// POST endpoint - AI 对话
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      sessionId,
      session_id,
      theme = 'junior', // 兼容旧参数名
      grade, // 新参数名
      subject = 'generic', // 科目
      userLevel = 'free', // 用户等级
      subjectConfidence = 1, // 科目识别置信度
      questionContent,
      geometryData,
      questionType, // 题型
      modelId,
      useReasoning,
      userId,
    } = body;

    if (!message) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }

    // 参数标准化
    const actualGrade: GradeLevel = grade || theme || 'junior';
    const actualSubject: SubjectType = subject || 'generic';
    const actualUserLevel: UserLevel = userLevel || 'free';
    const actualQuestionType: QuestionType = questionType || 'unknown';

    // 检查是否配置了任意 API Key
    const hasApiKey =
      (process.env.AI_API_KEY_LOGIC &&
        process.env.AI_API_KEY_LOGIC !== 'your-api-key-here') ||
      (process.env.AI_API_KEY_VISION &&
        process.env.AI_API_KEY_VISION !== 'your-api-key-here') ||
      (process.env.DASHSCOPE_API_KEY &&
        process.env.DASHSCOPE_API_KEY !== 'your-api-key-here');

    console.log('Chat API - hasApiKey:', hasApiKey);
    console.log('Chat API - subject:', actualSubject, 'confidence:', subjectConfidence);
    console.log('Chat API - userLevel:', actualUserLevel);
    console.log('Chat API - grade:', actualGrade);

    // 计算对话模式
    const dialogMode: DialogMode = getDialogMode(
      actualSubject,
      actualUserLevel,
      subjectConfidence
    );
    console.log('Chat API - dialogMode:', dialogMode);

    // 获取或创建对话历史（内存）
    const historySessionId = sessionId || session_id;

    // 检测是否有图片
    const hasImage = hasImageInMessages(
      conversationHistory.get(historySessionId) || []
    );

    if (!conversationHistory.has(historySessionId)) {
      // 构建 System Prompt（三层架构）
      const systemPrompt = buildSystemPrompt({
        subject: actualSubject,
        grade: actualGrade,
        userLevel: actualUserLevel,
        questionContent,
        geometryData,
        hasImage,
        questionType: actualQuestionType,
      });

      conversationHistory.set(historySessionId, [
        { role: 'system', content: systemPrompt },
      ]);

      console.log('Chat API - System Prompt built, length:', systemPrompt.length);
    }

    const history = conversationHistory.get(historySessionId)!;
    history.push({ role: 'user', content: message });

    let responseText: string;
    let modelUsed: string = 'mock';

    if (hasApiKey) {
      console.log('Using AI Model Service, modelId:', modelId || 'default');
      try {
        const aiResult = await callAIModel(history, modelId, useReasoning);
        responseText = aiResult.content;
        modelUsed = aiResult.modelUsed;
        console.log('AI Model call successful, modelUsed:', modelUsed);
      } catch (apiError: any) {
        console.error('AI API Error, falling back to mock:', apiError.message);
        responseText = generateImprovedMockResponse(
          message,
          actualGrade,
          history,
          questionContent
        );
        modelUsed = 'mock (fallback)';
      }
    } else {
      console.log('Using fallback mock response mode - no API key configured');
      responseText = generateImprovedMockResponse(
        message,
        actualGrade,
        history,
        questionContent
      );
      modelUsed = 'mock';
    }

    // 添加助手响应到历史（内存）
    history.push({ role: 'assistant', content: responseText });

    // 保存对话消息到 Supabase（如果提供了 session_id）
    if (session_id) {
      try {
        const supabase = getSupabaseAdmin();
        // 保存用户消息
        await (supabase as any).from('chat_messages').insert({
          session_id: session_id,
          role: 'user',
          content: message,
          created_at: new Date().toISOString(),
        });

        // 保存助手消息
        await (supabase as any).from('chat_messages').insert({
          session_id: session_id,
          role: 'assistant',
          content: responseText,
          created_at: new Date().toISOString(),
        });

        console.log('Chat messages saved to Supabase, session:', session_id);
      } catch (error) {
        console.error('Failed to save chat to Supabase:', error);
        // 不影响主流程，继续返回
      }
    }

    return NextResponse.json({
      content: responseText,
      done: true,
      dialogMode, // 新增：对话模式（Logic / Socra）
      modelUsed,
      // 调试信息
      _debug: {
        subject: actualSubject,
        grade: actualGrade,
        userLevel: actualUserLevel,
        subjectConfidence,
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'AI 对话失败' },
      { status: 500 }
    );
  }
}

// DELETE endpoint - 清除对话历史
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      conversationHistory.delete(sessionId);
    } else {
      conversationHistory.clear();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '清除历史失败' }, { status: 500 });
  }
}

// GET endpoint - 获取对话历史
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'sessionId is required' },
      { status: 400 }
    );
  }

  const history = conversationHistory.get(sessionId) || [];

  return NextResponse.json({
    history: history.filter((msg) => msg.role !== 'system'),
  });
}
