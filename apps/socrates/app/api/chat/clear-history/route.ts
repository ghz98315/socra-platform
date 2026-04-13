// =====================================================
// Project Socrates - Clear Chat History API
// 清除对话历史并重新初始化
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { getConversationHistoryStore } from '@/lib/chat/conversation-history';
import { buildSystemPrompt } from '@/lib/prompts/builder';
import type {
  GradeLevel,
  QuestionType,
  SubjectType,
  UserLevel,
} from '@/lib/prompts/types';

const conversationHistory = getConversationHistoryStore();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      newSessionId,
      theme = 'junior',
      grade,
      subject = 'generic',
      userLevel = 'free',
      subjectConfidence = 1,
      questionContent,
      geometryData,
      questionType = 'unknown',
    } = body;

    const actualGrade: GradeLevel = grade || theme || 'junior';
    const actualSubject: SubjectType = subject || 'generic';
    const actualUserLevel: UserLevel = userLevel || 'free';
    const actualQuestionType: QuestionType = questionType || 'unknown';

    if (sessionId && conversationHistory.has(sessionId)) {
      conversationHistory.delete(sessionId);
    }

    if (newSessionId) {
      const systemPrompt = buildSystemPrompt({
        subject: actualSubject,
        grade: actualGrade,
        userLevel: actualUserLevel,
        subjectConfidence,
        questionContent,
        geometryData,
        hasImage: false,
        questionType: actualQuestionType,
        isFirstTurn: true,
      });

      conversationHistory.set(newSessionId, [
        { role: 'system', content: systemPrompt },
      ]);
    }

    return NextResponse.json({
      success: true,
      message: '对话历史已清除，新会话已创建',
      newSessionId,
    });
  } catch (error: any) {
    console.error('Clear history API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '清除历史失败',
      },
      { status: 500 },
    );
  }
}
