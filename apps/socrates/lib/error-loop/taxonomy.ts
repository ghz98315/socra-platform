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

export type RootCauseSubtype =
  | 'definition_recall_unstable'
  | 'formula_condition_missing'
  | 'knowledge_link_disconnected'
  | 'concept_boundary_blur'
  | 'symbol_semantics_confused'
  | 'representation_mapping_confused'
  | 'missed_condition'
  | 'goal_target_misaligned'
  | 'quantity_relation_misread'
  | 'sign_operation_slip'
  | 'draft_management_disorder'
  | 'step_skipping_instability'
  | 'no_entry_strategy'
  | 'single_path_dependency'
  | 'decomposition_planning_weak'
  | 'condition_marking_missing'
  | 'verification_routine_missing'
  | 'simple_problem_rush'
  | 'time_pressure_panic'
  | 'frustration_shutdown'
  | 'attention_drift'
  | 'prompt_dependency'
  | 'original_only_transfer_fail'
  | 'answer_without_explanation';

export interface StructuredDiagnosis {
  id?: string;
  session_id: string;
  student_id: string;
  subject: ErrorLoopSubject;
  surface_labels: string[];
  surface_error: string;
  root_cause_category: RootCauseCategory;
  root_cause_subtype: RootCauseSubtype | null;
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
    description: '知识点本身没有真正掌握，导致无法稳定调用定义、公式或前提条件。',
  },
  {
    value: 'concept_confusion',
    label: '概念混淆',
    description: '表面会做，但概念边界、规则含义或表达方式一变就混乱。',
  },
  {
    value: 'problem_reading',
    label: '审题偏差',
    description: '题目信息提取不完整，容易漏条件、看错目标或误读数量关系。',
  },
  {
    value: 'calculation_execution',
    label: '计算执行',
    description: '问题不在思路，而在符号处理、草稿管理和过程执行稳定性。',
  },
  {
    value: 'strategy_gap',
    label: '策略缺口',
    description: '不知道先做什么、怎么拆步骤，或只会单一路径不会迁移。',
  },
  {
    value: 'habit_issue',
    label: '习惯问题',
    description: '没有形成稳定的审题、列式、检查和复盘动作，错误会重复出现。',
  },
  {
    value: 'attention_emotion',
    label: '注意力 / 情绪',
    description: '着急、焦虑、分心或时间压力干扰了解题质量。',
  },
  {
    value: 'pseudo_mastery',
    label: '假会',
    description: '依赖提示或记忆，原题似乎会，换一种问法或让他讲就暴露。',
  },
];

export const ROOT_CAUSE_SUBTYPE_OPTIONS: Array<{
  value: RootCauseSubtype;
  category: RootCauseCategory;
  label: string;
  description: string;
}> = [
  {
    value: 'definition_recall_unstable',
    category: 'knowledge_gap',
    label: '定义回忆不稳',
    description: '知道大概意思，但无法准确说出定义、性质或判定。',
  },
  {
    value: 'formula_condition_missing',
    category: 'knowledge_gap',
    label: '公式条件缺失',
    description: '记得公式，但不知道什么时候能用、什么时候不能直接套。',
  },
  {
    value: 'knowledge_link_disconnected',
    category: 'knowledge_gap',
    label: '知识连接断开',
    description: '单个点会背，但不会把题目条件和知识点对应起来。',
  },
  {
    value: 'concept_boundary_blur',
    category: 'concept_confusion',
    label: '概念边界模糊',
    description: '相近概念混在一起，题型稍变就选错规则。',
  },
  {
    value: 'symbol_semantics_confused',
    category: 'concept_confusion',
    label: '符号语义混淆',
    description: '对符号、单位或数量关系的含义理解不清。',
  },
  {
    value: 'representation_mapping_confused',
    category: 'concept_confusion',
    label: '表征转换混乱',
    description: '图形、文字、式子之间不能稳定互相转换。',
  },
  {
    value: 'missed_condition',
    category: 'problem_reading',
    label: '漏条件',
    description: '没有把限制条件、关键词或隐藏前提带入解题。',
  },
  {
    value: 'goal_target_misaligned',
    category: 'problem_reading',
    label: '目标看偏',
    description: '知道题目大意，但真正要求的量或问法没对齐。',
  },
  {
    value: 'quantity_relation_misread',
    category: 'problem_reading',
    label: '数量关系误读',
    description: '比较、比例、单位或顺序关系看错了。',
  },
  {
    value: 'sign_operation_slip',
    category: 'calculation_execution',
    label: '符号运算滑坡',
    description: '负号、括号、移项或运算顺序频繁出错。',
  },
  {
    value: 'draft_management_disorder',
    category: 'calculation_execution',
    label: '草稿管理混乱',
    description: '草稿无分栏、抄写错位，过程越做越乱。',
  },
  {
    value: 'step_skipping_instability',
    category: 'calculation_execution',
    label: '跳步导致不稳',
    description: '为了快省略中间步骤，导致过程失真。',
  },
  {
    value: 'no_entry_strategy',
    category: 'strategy_gap',
    label: '不会起手',
    description: '看到题目不知道第一步做什么。',
  },
  {
    value: 'single_path_dependency',
    category: 'strategy_gap',
    label: '单一路径依赖',
    description: '只会老师讲过的做法，稍换结构就不会迁移。',
  },
  {
    value: 'decomposition_planning_weak',
    category: 'strategy_gap',
    label: '拆解规划弱',
    description: '不会把复杂题拆成几个可执行的小步骤。',
  },
  {
    value: 'condition_marking_missing',
    category: 'habit_issue',
    label: '不圈条件',
    description: '没有形成先圈条件、划关键词、复述目标的固定起手动作。',
  },
  {
    value: 'verification_routine_missing',
    category: 'habit_issue',
    label: '不做复核',
    description: '做完不检查单位、符号、答案合理性或是否答所问。',
  },
  {
    value: 'simple_problem_rush',
    category: 'habit_issue',
    label: '简单题抢答',
    description: '一觉得题简单就直接下笔，跳过必要检查。',
  },
  {
    value: 'time_pressure_panic',
    category: 'attention_emotion',
    label: '时间压力慌乱',
    description: '一赶时间就明显降质，动作变形。',
  },
  {
    value: 'frustration_shutdown',
    category: 'attention_emotion',
    label: '受挫后停摆',
    description: '一遇到卡点就急躁、逃避或放弃思考。',
  },
  {
    value: 'attention_drift',
    category: 'attention_emotion',
    label: '专注力漂移',
    description: '做题中容易走神，导致条件和过程断线。',
  },
  {
    value: 'prompt_dependency',
    category: 'pseudo_mastery',
    label: '提示依赖',
    description: '离开 AI 或老师提示就难以独立完成。',
  },
  {
    value: 'original_only_transfer_fail',
    category: 'pseudo_mastery',
    label: '原题会变式不会',
    description: '对原题有记忆，但不会迁移到变式题。',
  },
  {
    value: 'answer_without_explanation',
    category: 'pseudo_mastery',
    label: '答案对但讲不清',
    description: '能做出结果，却说不清为什么这么做。',
  },
];

export const ROOT_CAUSE_CATEGORY_LABELS: Record<RootCauseCategory, string> = ROOT_CAUSE_CATEGORY_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<RootCauseCategory, string>,
);

export const ROOT_CAUSE_SUBTYPE_LABELS: Record<RootCauseSubtype, string> = ROOT_CAUSE_SUBTYPE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label;
    return acc;
  },
  {} as Record<RootCauseSubtype, string>,
);

export const ROOT_CAUSE_SUBTYPE_DESCRIPTIONS: Record<RootCauseSubtype, string> = ROOT_CAUSE_SUBTYPE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.description;
    return acc;
  },
  {} as Record<RootCauseSubtype, string>,
);

export const ROOT_CAUSE_SUBTYPE_OPTIONS_BY_CATEGORY: Record<
  RootCauseCategory,
  Array<(typeof ROOT_CAUSE_SUBTYPE_OPTIONS)[number]>
> = ROOT_CAUSE_SUBTYPE_OPTIONS.reduce(
  (acc, option) => {
    acc[option.category].push(option);
    return acc;
  },
  {
    knowledge_gap: [],
    concept_confusion: [],
    problem_reading: [],
    calculation_execution: [],
    strategy_gap: [],
    habit_issue: [],
    attention_emotion: [],
    pseudo_mastery: [],
  } as Record<RootCauseCategory, Array<(typeof ROOT_CAUSE_SUBTYPE_OPTIONS)[number]>>,
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

export function getRootCauseSubtypeOptions(category: RootCauseCategory) {
  return ROOT_CAUSE_SUBTYPE_OPTIONS_BY_CATEGORY[category] ?? [];
}

export function getRootCauseSubtypeOption(subtype: RootCauseSubtype | null | undefined) {
  if (!subtype) {
    return null;
  }

  return ROOT_CAUSE_SUBTYPE_OPTIONS.find((option) => option.value === subtype) ?? null;
}

export function isValidRootCauseSubtype(category: RootCauseCategory, subtype: unknown): subtype is RootCauseSubtype {
  if (typeof subtype !== 'string') {
    return false;
  }

  return getRootCauseSubtypeOptions(category).some((option) => option.value === subtype);
}

export function isCarelessnessLike(value: string) {
  const normalized = value.trim().toLowerCase();
  return CARELESS_SURFACE_TERMS.some((term) => term.toLowerCase() === normalized);
}
