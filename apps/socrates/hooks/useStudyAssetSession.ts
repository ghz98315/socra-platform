'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  createStudyAssetMessageKey,
  saveStudyAssetTurn,
  type StudyAssetQuestionType,
  type StudyAssetSubject,
} from '@/lib/study/assets-v2';

interface PersistStudyAssetTurnInput {
  studentId?: string | null;
  subject: StudyAssetSubject;
  module: string;
  inputType: string;
  questionType: StudyAssetQuestionType;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  userMessage: string;
  assistantContent: string;
}

interface UseStudyAssetSessionOptions {
  sessionKey: string;
}

function createSessionId(sessionKey: string) {
  return `${sessionKey}_${Date.now()}`;
}

export function useStudyAssetSession(options: UseStudyAssetSessionOptions) {
  const { sessionKey } = options;
  const sessionIdRef = useRef(createSessionId(sessionKey));
  const assetIdRef = useRef<string | null>(null);

  const [assetId, setAssetId] = useState<string | null>(null);
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);

  useEffect(() => {
    sessionIdRef.current = createSessionId(sessionKey);
    assetIdRef.current = null;
    setAssetId(null);
    setHistoryRefreshToken(0);
  }, [sessionKey]);

  const persistTurn = useCallback(async (input: PersistStudyAssetTurnInput) => {
    if (!input.studentId) {
      return null;
    }

    const sessionId = sessionIdRef.current;
    const nextAssetId = await saveStudyAssetTurn({
      assetId: assetIdRef.current,
      studentId: input.studentId,
      subject: input.subject,
      module: input.module,
      inputType: input.inputType,
      questionType: input.questionType,
      title: input.title,
      summary: input.summary,
      payload: input.payload,
      messages: [
        {
          role: 'user',
          content: input.userMessage,
          message_key: createStudyAssetMessageKey(`${sessionId}_user`),
        },
        {
          role: 'assistant',
          content: input.assistantContent,
          message_key: createStudyAssetMessageKey(`${sessionId}_assistant`),
        },
      ],
    });

    assetIdRef.current = nextAssetId;
    setAssetId(nextAssetId);
    setHistoryRefreshToken((current) => current + 1);

    return nextAssetId;
  }, []);

  const resetSession = useCallback(() => {
    sessionIdRef.current = createSessionId(sessionKey);
    assetIdRef.current = null;
    setAssetId(null);
  }, [sessionKey]);

  const getSessionId = useCallback(() => {
    return sessionIdRef.current;
  }, []);

  return {
    assetId,
    getSessionId,
    historyRefreshToken,
    persistTurn,
    resetSession,
  };
}
