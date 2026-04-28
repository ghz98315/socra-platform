import {
  getRootCauseSubtypeOption,
  type RootCauseCategory,
  type RootCauseSubtype,
} from '@/lib/error-loop/taxonomy';
import type { GradeLevel } from '@/lib/prompts/types';

export type GuardianErrorType =
  | 'knowledge_blind_spot'
  | 'reading_mistake'
  | 'thinking_gap'
  | 'execution_slip'
  | 'exam_mindset';

export type AnalysisMode = 'junior' | 'senior' | 'grade9_exam';

export type StuckStage =
  | 'read_question'
  | 'find_entry'
  | 'connect_reasoning'
  | 'stabilize_execution'
  | 'summarize_method';

export type StructuredOutcomeSnapshot = {
  guardian_error_type: GuardianErrorType;
  guardian_error_type_label: string;
  root_cause_summary: string;
  child_poka_yoke_action: string;
  suggested_guardian_action: string;
  false_error_gate: boolean;
  analysis_mode: AnalysisMode;
  analysis_mode_label: string;
  stuck_stage: StuckStage;
  stuck_stage_label: string;
};

export const GUARDIAN_ERROR_TYPE_LABELS: Record<GuardianErrorType, string> = {
  knowledge_blind_spot: '知识盲区',
  reading_mistake: '审题错误',
  thinking_gap: '思路偏差',
  execution_slip: '执行失误',
  exam_mindset: '考试心态',
};

export const ANALYSIS_MODE_LABELS: Record<AnalysisMode, string> = {
  junior: '小学模式',
  senior: '初中模式',
  grade9_exam: '初三模式',
};

export const STUCK_STAGE_LABELS: Record<StuckStage, string> = {
  read_question: '看题阶段',
  find_entry: '起手阶段',
  connect_reasoning: '搭桥阶段',
  stabilize_execution: '执行阶段',
  summarize_method: '复述阶段',
};

function cleanSentence(value: string | null | undefined) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/[；;。]+$/u, '')
    .trim();
}

function firstNonEmpty(values: Array<string | null | undefined>) {
  return values.map((value) => cleanSentence(value)).find(Boolean) || '';
}

export function resolveAnalysisModeFromGradeLevel(
  gradeLevel?: number | null,
  fallbackGrade?: GradeLevel | null,
): AnalysisMode {
  if (Number.isFinite(gradeLevel) && Number(gradeLevel) === 9) {
    return 'grade9_exam';
  }

  if (Number.isFinite(gradeLevel) && Number(gradeLevel) <= 6) {
    return 'junior';
  }

  if (Number.isFinite(gradeLevel) && Number(gradeLevel) >= 7) {
    return 'senior';
  }

  return fallbackGrade === 'senior' ? 'senior' : 'junior';
}

export function mapRootCauseToGuardianErrorType(
  category: RootCauseCategory,
  subtype?: RootCauseSubtype | null,
): GuardianErrorType {
  if (category === 'knowledge_gap' || category === 'concept_confusion') {
    return 'knowledge_blind_spot';
  }

  if (category === 'problem_reading') {
    return 'reading_mistake';
  }

  if (category === 'attention_emotion') {
    return 'exam_mindset';
  }

  if (category === 'calculation_execution' || category === 'habit_issue') {
    return subtype === 'condition_marking_missing' ? 'reading_mistake' : 'execution_slip';
  }

  return 'thinking_gap';
}

export function inferFalseErrorGate(
  category: RootCauseCategory,
  subtype?: RootCauseSubtype | null,
  surfaceLabels?: string[] | null,
) {
  if (category === 'calculation_execution' || category === 'habit_issue') {
    return true;
  }

  if (subtype === 'missed_condition' && (surfaceLabels || []).some((label) => /粗心|马虎/u.test(label))) {
    return true;
  }

  return false;
}

export function inferStuckStage(
  category: RootCauseCategory,
  subtype?: RootCauseSubtype | null,
): StuckStage {
  if (category === 'problem_reading') {
    return 'read_question';
  }

  if (category === 'knowledge_gap' || category === 'concept_confusion') {
    return 'connect_reasoning';
  }

  if (
    subtype === 'no_entry_strategy' ||
    subtype === 'single_path_dependency' ||
    subtype === 'decomposition_planning_weak'
  ) {
    return 'find_entry';
  }

  if (category === 'calculation_execution' || category === 'habit_issue') {
    return 'stabilize_execution';
  }

  if (category === 'pseudo_mastery') {
    return 'summarize_method';
  }

  return 'find_entry';
}

export function buildRootCauseSummary({
  guardianErrorType,
  rootCauseStatement,
  subtype,
}: {
  guardianErrorType: GuardianErrorType;
  rootCauseStatement: string;
  subtype?: RootCauseSubtype | null;
}) {
  const subtypeLabel = subtype ? getRootCauseSubtypeOption(subtype)?.label || null : null;
  const summaryCore = cleanSentence(rootCauseStatement);

  if (summaryCore) {
    return `${GUARDIAN_ERROR_TYPE_LABELS[guardianErrorType]}：${summaryCore}`;
  }

  if (subtypeLabel) {
    return `${GUARDIAN_ERROR_TYPE_LABELS[guardianErrorType]}：当前更接近“${subtypeLabel}”这一类稳定卡点。`;
  }

  return `${GUARDIAN_ERROR_TYPE_LABELS[guardianErrorType]}：当前需要继续围绕稳定错误模式做复盘。`;
}

export function buildChildPokaYokeAction({
  guardianErrorType,
  fixActions,
  subtype,
}: {
  guardianErrorType: GuardianErrorType;
  fixActions?: string[] | null;
  subtype?: RootCauseSubtype | null;
}) {
  const preferred = firstNonEmpty(fixActions || []);
  if (preferred) {
    return preferred;
  }

  switch (guardianErrorType) {
    case 'knowledge_blind_spot':
      return '先用自己的话讲清定义或公式条件，再开始做题。';
    case 'reading_mistake':
      return '先圈条件、复述所求，再动笔。';
    case 'thinking_gap':
      return subtype === 'no_entry_strategy'
        ? '先说出第一步想确认的条件或关系，再往下做。'
        : '先说清这题的突破口，再开始推。';
    case 'execution_slip':
      return '关键中间步骤先写出来，做完再复核符号和单位。';
    case 'exam_mindset':
      return '先慢两秒，先说清题目目标，再开始作答。';
    default:
      return '先把思路说清，再往下做。';
  }
}

export function buildSuggestedGuardianAction({
  guardianErrorType,
  falseErrorGate,
  analysisMode,
  stuckStage,
}: {
  guardianErrorType: GuardianErrorType;
  falseErrorGate: boolean;
  analysisMode: AnalysisMode;
  stuckStage: StuckStage;
}) {
  if (falseErrorGate) {
    return '先让孩子闭卷重做一遍，只检查起手、符号和条件，不要立刻重讲整题。';
  }

  if (analysisMode === 'grade9_exam' && guardianErrorType === 'exam_mindset') {
    return '先稳住节奏，再让孩子用一句话说出题目目标和第一步，避免一上来被时间压住。';
  }

  if (stuckStage === 'read_question') {
    return '先让孩子圈条件、复述所求，再判断要不要继续讲。';
  }

  if (stuckStage === 'find_entry') {
    return '先让孩子只说第一步做什么，不要求一次把整题讲完。';
  }

  if (guardianErrorType === 'knowledge_blind_spot') {
    return '先让孩子把相关概念或公式条件讲清，再做同类题验证。';
  }

  if (guardianErrorType === 'execution_slip') {
    return '先盯住过程动作，例如列式顺序、符号检查和复核步骤，不要只说“细心一点”。';
  }

  if (guardianErrorType === 'exam_mindset') {
    return '先降情绪和节奏，再推进题目，不要在慌乱状态下继续堆提示。';
  }

  return '先让孩子讲清为什么这样做，再决定下一步是练习还是回到讲解。';
}

export function buildStructuredOutcomeSnapshot({
  rootCauseCategory,
  rootCauseSubtype,
  rootCauseStatement,
  fixActions,
  surfaceLabels,
  gradeLevel,
  fallbackGrade,
}: {
  rootCauseCategory: RootCauseCategory;
  rootCauseSubtype?: RootCauseSubtype | null;
  rootCauseStatement: string;
  fixActions?: string[] | null;
  surfaceLabels?: string[] | null;
  gradeLevel?: number | null;
  fallbackGrade?: GradeLevel | null;
}): StructuredOutcomeSnapshot {
  const analysisMode = resolveAnalysisModeFromGradeLevel(gradeLevel, fallbackGrade);
  const guardianErrorType = mapRootCauseToGuardianErrorType(rootCauseCategory, rootCauseSubtype);
  const falseErrorGate = inferFalseErrorGate(rootCauseCategory, rootCauseSubtype, surfaceLabels);
  const stuckStage = inferStuckStage(rootCauseCategory, rootCauseSubtype);

  return {
    guardian_error_type: guardianErrorType,
    guardian_error_type_label: GUARDIAN_ERROR_TYPE_LABELS[guardianErrorType],
    root_cause_summary: buildRootCauseSummary({
      guardianErrorType,
      rootCauseStatement,
      subtype: rootCauseSubtype,
    }),
    child_poka_yoke_action: buildChildPokaYokeAction({
      guardianErrorType,
      fixActions,
      subtype: rootCauseSubtype,
    }),
    suggested_guardian_action: buildSuggestedGuardianAction({
      guardianErrorType,
      falseErrorGate,
      analysisMode,
      stuckStage,
    }),
    false_error_gate: falseErrorGate,
    analysis_mode: analysisMode,
    analysis_mode_label: ANALYSIS_MODE_LABELS[analysisMode],
    stuck_stage: stuckStage,
    stuck_stage_label: STUCK_STAGE_LABELS[stuckStage],
  };
}
