export type ErrorLoopSubject = 'math' | 'chinese' | 'english' | 'physics' | 'chemistry' | 'generic';

export type RootCauseCategory =
  | 'knowledge_gap'
  | 'concept_confusion'
  | 'problem_reading'
  | 'calculation_execution'
  | 'strategy_gap'
  | 'habit_issue'
  | 'attention_emotion'
  | 'pseudo_mastery';

export interface StructuredDiagnosis {
  id?: string;
  session_id: string;
  student_id: string;
  subject: ErrorLoopSubject;
  surface_labels: string[];
  surface_error: string;
  root_cause_category: RootCauseCategory;
  root_cause_statement: string;
  root_cause_depth: number;
  why_chain: Array<{
    level: number;
    question: string;
    answer: string;
  }>;
  evidence: string[];
  fix_actions: string[];
  knowledge_tags: string[];
  habit_tags: string[];
  risk_flags: string[];
  created_at?: string;
  updated_at?: string;
}

export const VALID_ERROR_LOOP_SUBJECTS: ErrorLoopSubject[] = [
  'math',
  'chinese',
  'english',
  'physics',
  'chemistry',
  'generic',
];

export const DEEP_ERROR_LOOP_V1_SUBJECTS = new Set<ErrorLoopSubject>(['math']);

export const ROOT_CAUSE_CATEGORY_OPTIONS: Array<{
  value: RootCauseCategory;
  label: string;
  description: string;
}> = [
  {
    value: 'knowledge_gap',
    label: '知识缺口',
    description: '题目对应知识点本身没有掌握稳，导致无法调用或调用错误。',
  },
  {
    value: 'concept_confusion',
    label: '概念混淆',
    description: '表面会做，但概念边界、条件或规则理解混在一起。',
  },
  {
    value: 'problem_reading',
    label: '审题偏差',
    description: '信息提取不完整，漏条件、错目标、误读数量关系。',
  },
  {
    value: 'calculation_execution',
    label: '计算执行',
    description: '步骤执行、符号处理、草稿管理或运算稳定性存在问题。',
  },
  {
    value: 'strategy_gap',
    label: '策略缺口',
    description: '不知道先做什么、用什么方法，或只会单一路径不会迁移。',
  },
  {
    value: 'habit_issue',
    label: '习惯问题',
    description: '缺少固定检查、审题、列式、复核习惯，错误会反复出现。',
  },
  {
    value: 'attention_emotion',
    label: '注意力 / 情绪',
    description: '着急、焦虑、分心或时间压力干扰了解题质量。',
  },
  {
    value: 'pseudo_mastery',
    label: '假会',
    description: '依赖提示或记忆，原题似乎会，换法就不会。',
  },
];

export const ROOT_CAUSE_CATEGORY_LABELS: Record<RootCauseCategory, string> = ROOT_CAUSE_CATEGORY_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<RootCauseCategory, string>,
);

export const SURFACE_LABEL_OPTIONS = [
  '粗心',
  '马虎',
  '审题偏差',
  '漏条件',
  '计算出错',
  '符号错',
  '过程跳步',
  '公式忘记',
  '概念混了',
  '不会下手',
  '变式不会',
  '没有检查',
];

export const CARELESS_SURFACE_TERMS = ['粗心', '马虎', 'careless', 'carelessness'];

export const ROOT_CAUSE_PATTERN_HINT =
  /习惯|检查|策略|审题|概念|知识|注意|情绪|pattern|habit|strategy|reading|concept|knowledge|attention/i;

export const WHY_CHAIN_PROMPTS = [
  '这次具体错在了哪一步？你当时为什么会在这里出错？',
  '再往下追一层：是什么行为、习惯或思路让这一步容易出问题？',
  '继续往下追：这个行为问题背后，稳定的根因模式是什么？',
];

export function isCarelessnessLike(value: string) {
  const normalized = value.trim().toLowerCase();
  return CARELESS_SURFACE_TERMS.some((term) => term.toLowerCase() === normalized);
}
