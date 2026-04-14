// =====================================================
// Project Socrates - Clear Chat History API
// 清除对话历史并重新初始化
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { initializeConversationSession } from '@/lib/chat/session-initializer';

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

    initializeConversationSession({
      sessionId,
      newSessionId,
      theme,
      grade,
      subject,
      userLevel,
      subjectConfidence,
      questionContent,
      geometryData,
      questionType,
    });

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
