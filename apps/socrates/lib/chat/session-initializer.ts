import { buildSystemPrompt } from '../prompts/builder';
import { getConversationHistoryStore, type ConversationMessage } from './conversation-history';
import type {
  GradeLevel,
  QuestionType,
  SubjectType,
  UserLevel,
} from '../prompts/types';

export interface InitializeConversationSessionOptions {
  sessionId?: string;
  newSessionId?: string;
  theme?: GradeLevel;
  grade?: GradeLevel;
  subject?: SubjectType;
  userLevel?: UserLevel;
  subjectConfidence?: number;
  questionContent?: string;
  geometryData?: any;
  questionType?: QuestionType;
}

export interface InitializeConversationSessionResult {
  newSessionId?: string;
  deletedExistingSession: boolean;
  initialized: boolean;
  systemPrompt: string;
  history: ConversationMessage[];
}

export function initializeConversationSession(
  options: InitializeConversationSessionOptions,
): InitializeConversationSessionResult {
  const conversationHistory = getConversationHistoryStore();
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
  } = options;

  const actualGrade: GradeLevel = grade || theme || 'junior';
  const actualSubject: SubjectType = subject || 'generic';
  const actualUserLevel: UserLevel = userLevel || 'free';
  const actualQuestionType: QuestionType = questionType || 'unknown';
  const deletedExistingSession = Boolean(sessionId && conversationHistory.has(sessionId));

  if (deletedExistingSession && sessionId) {
    conversationHistory.delete(sessionId);
  }

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

  const history = newSessionId
    ? [{ role: 'system', content: systemPrompt }]
    : [];

  if (newSessionId) {
    conversationHistory.set(newSessionId, history);
  }

  return {
    newSessionId,
    deletedExistingSession,
    initialized: Boolean(newSessionId),
    systemPrompt,
    history,
  };
}
