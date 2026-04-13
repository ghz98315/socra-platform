// =====================================================
// Project Socrates - AI Chat API
// Integrated with Multi-Model Support & Prompt System v2.0
// =====================================================

import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callModelById } from '@/lib/ai-models/service';
import { normalizeModelSelection } from '@/lib/ai-models/config';
import {
  buildSystemPrompt,
  getDialogMode,
  hasImageInMessages,
} from '@/lib/prompts/builder';
import { getConversationHistoryStore } from '@/lib/chat/conversation-history';
import {
  buildConversationRiskSignal,
  shouldNotifyParentForRisk,
} from '@/lib/error-loop/conversation-risk';
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

async function maybeNotifyParentConversationRisk({
  sessionId,
  message,
}: {
  sessionId: string;
  message: string;
}) {
  const signal = buildConversationRiskSignal(message);
  if (!signal || !shouldNotifyParentForRisk(signal)) {
    return;
  }

  const supabase = getSupabaseAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sessionInfo, error: sessionError } = await (supabase as any)
    .from('error_sessions')
    .select(
      'id, student_id, extracted_text, profiles!error_sessions_student_id_fkey(display_name, parent_id)',
    )
    .eq('id', sessionId)
    .maybeSingle();

  if (sessionError || !sessionInfo?.student_id) {
    console.error('Failed to load session info for conversation risk notification:', sessionError);
    return;
  }

  const parentId = sessionInfo.profiles?.parent_id;
  if (!parentId) {
    return;
  }

  const dedupeSince = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentNotifications, error: recentNotificationsError } = await (supabase as any)
    .from('notifications')
    .select('id, data, created_at')
    .eq('user_id', parentId)
    .eq('type', 'conversation_risk')
    .gte('created_at', dedupeSince)
    .order('created_at', { ascending: false })
    .limit(20);

  if (recentNotificationsError) {
    console.error('Failed to load recent conversation risk notifications:', recentNotificationsError);
  }

  const isDuplicate = (recentNotifications || []).some((item: { data?: Record<string, unknown> | null }) => {
    const data = item.data || {};
    return data.session_id === sessionId && data.risk_category === signal.category;
  });

  if (isDuplicate) {
    return;
  }

  const studentName = sessionInfo.profiles?.display_name || '孩子';
  const questionExcerpt =
    typeof sessionInfo.extracted_text === 'string'
      ? sessionInfo.extracted_text.replace(/\s+/g, ' ').trim().slice(0, 36)
      : '当前题目';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: notificationError } = await (supabase as any).from('notifications').insert({
    user_id: parentId,
    type: 'conversation_risk',
    title: `${studentName}出现对话风险信号`,
    content: `${signal.title}：${questionExcerpt}`,
    data: {
      student_id: sessionInfo.student_id,
      session_id: sessionId,
      risk_category: signal.category,
      severity: signal.severity,
      score: signal.score,
      message_excerpt: message.slice(0, 120),
      parent_opening: signal.parentOpening,
      parent_actions: signal.parentActions,
    },
    action_url: `/controls?focus=conversation&student_id=${sessionInfo.student_id}&session_id=${sessionId}&risk_category=${signal.category}`,
    action_text: '查看家长洞察',
    is_read: false,
    priority: 2,
  });

  if (notificationError) {
    console.error('Failed to create conversation risk notification:', notificationError);
  }
}

const conversationHistory = getConversationHistoryStore();

// 通用 AI 模型调用
async function callAIModel(
  messages: Array<{ role: string; content: string }>,
  modelId?: string,
  isReasoning: boolean = false
): Promise<{ content: string; modelUsed: string }> {
  const purpose = isReasoning ? 'reasoning' : 'chat';
  const selectedModel = normalizeModelSelection(modelId, purpose);
  const targetModelId = selectedModel.id;

  console.log('callAIModel - targetModelId:', targetModelId, 'purpose:', purpose);

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
function isConfusionMessage(message: string): boolean {
  return /看不懂|不懂|不会|不知道|太难了|不明白|还是不懂|还是不会/u.test(message);
}

function getMockQuestionBySubject(params: {
  subject: SubjectType;
  questionType: QuestionType;
  repeatedConfusion: boolean;
  geometryData?: any;
}): string {
  const { subject, questionType, repeatedConfusion, geometryData } = params;

  if (subject === 'math') {
    if (repeatedConfusion) {
      if (geometryData && geometryData.type && geometryData.type !== 'unknown') {
        return '那我们先退一步。图里最关键的一个点、线或角是哪一个？';
      }

      return '那我们先退一步。题目最后要你求什么？';
    }

    if (geometryData && geometryData.type && geometryData.type !== 'unknown') {
      return '先别急着想方法。图里最关键的一个点、线或角是哪一个？';
    }

    return '先别急着算。题目已经明确告诉了你哪个条件？';
  }

  if (subject === 'chinese') {
    if (repeatedConfusion) {
      return '那我们先退一步。你觉得答案应该回原文哪一句或哪一段找？';
    }

    return '先别急着答。题干里最关键的词是哪一个？';
  }

  if (subject === 'english') {
    if (repeatedConfusion) {
      if (questionType === 'reading') {
        return '那我们先退一步。题干现在问的是细节、主旨，还是推断？';
      }

      return '那我们先退一步。这个空前后各是什么词？';
    }

    if (questionType === 'reading') {
      return '先别急着选。题干现在问的是细节、主旨，还是推断？';
    }

    return '先别急。你先看这个空前后各是什么词？';
  }

  if (repeatedConfusion) {
    return '那我们先退一步。你现在最清楚的一个已知条件是什么？';
  }

  return '先别急。题目最后要你求什么？';
}

function getNextStepQuestionBySubject(subject: SubjectType, questionType: QuestionType): string {
  if (subject === 'math') {
    return '下一步你想先确认哪个条件或关系？';
  }

  if (subject === 'chinese') {
    return '下一步你想先回题干，还是先回原文定位？';
  }

  if (subject === 'english') {
    if (questionType === 'reading') {
      return '下一步你想先看题干，还是先回原文定位？';
    }

    return '下一步你想先看词性、时态，还是固定搭配？';
  }

  return '下一步你想先确认哪个条件？';
}

function generateImprovedMockResponse(
  userMessage: string,
  grade: GradeLevel,
  history: Array<{ role: string; content: string }>,
  subject: SubjectType,
  questionType: QuestionType,
  questionContent?: string,
  geometryData?: any,
): string {
  const userMessageCount = history.filter((m) => m.role === 'user').length;
  const lowerMessage = userMessage.toLowerCase();
  const userMessages = history.filter((m) => m.role === 'user').map((m) => m.content);
  const previousUserMessage =
    userMessages.length >= 2 ? userMessages[userMessages.length - 2] : '';

  const askingForAnswer = /答案|结果|对不对|是多少|怎么做/.test(lowerMessage);
  const givingSolution =
    /我觉得|我认为|应该是|我想|第一步|首先|用.*?方法|先算|然后|最后/.test(
      lowerMessage
    );
  const confused = isConfusionMessage(userMessage);
  const repeatedConfusion = confused && isConfusionMessage(previousUserMessage);

  if (confused) {
    const question = getMockQuestionBySubject({
      subject,
      questionType,
      repeatedConfusion,
      geometryData,
    });

    return grade === 'junior'
      ? `没关系，我们先只抓最小一步。\n\n${question}`
      : `先不急着往下推。\n\n${question}`;
  }

  if (askingForAnswer) {
    return `我不直接给答案。\n\n先告诉我，题目已经明确给了你什么？`;
  }

  if (givingSolution) {
    return `${grade === 'junior' ? '这个切入点可以。' : '这个方向可以。'}\n\n${getNextStepQuestionBySubject(subject, questionType)}`;
  }

  // 根据对话轮次提供渐进式引导
  if (userMessageCount === 1) {
    return grade === 'junior'
      ? `我们先不急着整题往下做。\n\n${getMockQuestionBySubject({
          subject,
          questionType,
          repeatedConfusion: false,
          geometryData,
        })}`
      : `先做轻诊断。\n\n${getMockQuestionBySubject({
          subject,
          questionType,
          repeatedConfusion: false,
          geometryData,
        })}`;
  }

  // 后续轮次
  return `${grade === 'junior' ? '继续。' : '往前推进一小步。'}\n\n${getNextStepQuestionBySubject(subject, questionType)}${questionContent ? `\n题目提醒：${questionContent}` : ''}`;
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
      subjectConfidence
    );
    console.log('Chat API - dialogMode:', dialogMode);

    // 获取或创建对话历史（内存）
    const historySessionId = sessionId || session_id || randomUUID();
    const existingHistory = conversationHistory.get(historySessionId) || [];
    const previousUserMessageCount = existingHistory.filter(
      (entry) => entry.role === 'user'
    ).length;
    const isFirstTurn = previousUserMessageCount === 0;

    // 检测是否有图片
    const hasImage = hasImageInMessages(existingHistory);

    // 构建 System Prompt（三层架构）
    const systemPrompt = buildSystemPrompt({
      subject: actualSubject,
      grade: actualGrade,
      userLevel: actualUserLevel,
      subjectConfidence,
      questionContent,
      geometryData,
      hasImage,
      questionType: actualQuestionType,
      isFirstTurn,
    });

    if (!conversationHistory.has(historySessionId)) {
      // 首次创建对话历史
      conversationHistory.set(historySessionId, [
        { role: 'system', content: systemPrompt },
      ]);
      console.log('Chat API - System Prompt built (new session), length:', systemPrompt.length);
    } else {
      // 更新现有对话历史的 System Prompt（以保持几何数据最新）
      const history = conversationHistory.get(historySessionId)!;
      if (history.length > 0 && history[0].role === 'system') {
        history[0].content = systemPrompt;
        console.log('Chat API - System Prompt updated (geometry changed), length:', systemPrompt.length);
      }
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
      } catch (apiError: unknown) {
        console.error(
          'AI API Error, falling back to mock:',
          apiError instanceof Error ? apiError.message : apiError,
        );
        responseText = generateImprovedMockResponse(
          message,
          actualGrade,
          history,
          actualSubject,
          actualQuestionType,
          questionContent,
          geometryData,
        );
        modelUsed = 'mock (fallback)';
      }
    } else {
      console.log('Using fallback mock response mode - no API key configured');
      responseText = generateImprovedMockResponse(
        message,
        actualGrade,
        history,
        actualSubject,
        actualQuestionType,
        questionContent,
        geometryData,
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('chat_messages').insert({
          session_id: session_id,
          role: 'user',
          content: message,
          created_at: new Date().toISOString(),
        });

        // 保存助手消息
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase as any).from('chat_messages').insert({
          session_id: session_id,
          role: 'assistant',
          content: responseText,
          created_at: new Date().toISOString(),
        });

        await maybeNotifyParentConversationRisk({
          sessionId: session_id,
          message,
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
      sessionId: historySessionId,
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
  } catch (error: unknown) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI 对话失败' },
      { status: 500 }
    );
  }
}

// DELETE endpoint - 清除对话历史
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const sessionId = searchParams.get('sessionId') || searchParams.get('session_id');

    if (sessionId) {
      conversationHistory.delete(sessionId);
    } else {
      conversationHistory.clear();
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '清除历史失败' }, { status: 500 });
  }
}

// GET endpoint - 获取对话历史
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sessionId = searchParams.get('sessionId') || searchParams.get('session_id');

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
