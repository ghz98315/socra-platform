import { type ErrorLoopSubject } from '@/lib/error-loop/taxonomy';
import { resolveAnalysisModeFromGradeLevel, ANALYSIS_MODE_LABELS, type AnalysisMode } from '@/lib/error-loop/structured-outcome';
import type { GradeLevel, QuestionType, SubjectType } from '@/lib/prompts/types';

export type FalseErrorEntryGate = {
  enabled: boolean;
  reason: string;
  openingPrompt: string;
  analysisMode: AnalysisMode;
};

function normalizeGrade(gradeLevel?: number | null, fallbackGrade?: GradeLevel | null) {
  return resolveAnalysisModeFromGradeLevel(gradeLevel, fallbackGrade);
}

function isShortObjectiveQuestion(questionType: QuestionType, questionText?: string | null) {
  if (questionType === 'choice' || questionType === 'fill' || questionType === 'calculation') {
    return true;
  }

  const normalized = String(questionText || '').replace(/\s+/g, '');
  return /_{2,}|[ABCD][\.．、]|选择正确|计算|求值/u.test(normalized);
}

export function shouldUseFalseErrorEntryGate({
  subject,
  questionType,
  questionText,
  analysisMode,
}: {
  subject: ErrorLoopSubject | SubjectType;
  questionType: QuestionType;
  questionText?: string | null;
  analysisMode: AnalysisMode;
}) {
  if (subject === 'math') {
    return isShortObjectiveQuestion(questionType, questionText);
  }

  if (subject === 'english') {
    return questionType === 'fill' || questionType === 'choice';
  }

  if (subject === 'chinese') {
    return questionType === 'choice' || questionType === 'fill';
  }

  if (analysisMode === 'grade9_exam') {
    return questionType !== 'reading' && questionType !== 'writing' && questionType !== 'proof';
  }

  return false;
}

export function buildFalseErrorEntryGate({
  studentName,
  subject,
  questionType,
  gradeLevel,
  fallbackGrade,
  questionText,
}: {
  studentName?: string | null;
  subject: ErrorLoopSubject | SubjectType;
  questionType: QuestionType;
  gradeLevel?: number | null;
  fallbackGrade?: GradeLevel | null;
  questionText?: string | null;
}): FalseErrorEntryGate {
  const analysisMode = normalizeGrade(gradeLevel, fallbackGrade);
  const normalizedName = studentName?.trim();
  const enabled = shouldUseFalseErrorEntryGate({
    subject,
    questionType,
    questionText,
    analysisMode,
  });

  if (!enabled) {
    return {
      enabled: false,
      reason: '当前题型更适合直接进入正常分析。',
      openingPrompt: normalizedName
        ? `你好，${normalizedName}，这道题我看到了。你现在最卡哪一步？`
        : '你好，这道题我看到了。你现在最卡哪一步？',
      analysisMode,
    };
  }

  const prefix = normalizedName ? `你好，${normalizedName}。` : '你好。';

  if (analysisMode === 'junior') {
    return {
      enabled: true,
      reason: `${ANALYSIS_MODE_LABELS[analysisMode]}下，这类短题更适合先闭卷重做，判断是不是一时看漏或算滑了。`,
      openingPrompt: `${prefix}这题先不急着分析。先闭卷重做一遍，只说题目最后要你求什么，再把你准备怎么做的第一步发给我。`,
      analysisMode,
    };
  }

  if (analysisMode === 'grade9_exam') {
    return {
      enabled: true,
      reason: `${ANALYSIS_MODE_LABELS[analysisMode]}下，这类题先做闭卷重做，更容易分清是真不会还是时间下的执行滑坡。`,
      openingPrompt: `${prefix}这题先做一个闭卷重做检查。先别看原来的做法，只用一句话说题目最后要求什么，再把第一步写出来。`,
      analysisMode,
    };
  }

  return {
    enabled: true,
    reason: `${ANALYSIS_MODE_LABELS[analysisMode]}下，这类题先闭卷重做，能更快判断是思路问题还是执行失误。`,
    openingPrompt: `${prefix}这题先不急着深挖。先闭卷重做：先说题目最后要求什么，再把你的第一步写出来。`,
    analysisMode,
  };
}
