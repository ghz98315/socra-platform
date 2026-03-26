import {
  ROOT_CAUSE_CATEGORY_LABELS,
  getRootCauseSubtypeOption,
  type RootCauseCategory,
  type RootCauseSubtype,
} from '@/lib/error-loop/taxonomy';

export type GuidedReflectionStepKey =
  | 'replay_error_moment'
  | 'find_breakpoint'
  | 'locate_root_pattern'
  | 'commit_next_action';

export interface GuidedReflectionStepDefinition {
  key: GuidedReflectionStepKey;
  title: string;
  question: string;
  description: string;
}

export interface GuidedReflectionAnswer {
  key: GuidedReflectionStepKey;
  title: string;
  question: string;
  answer: string;
  answered_at?: string;
}

export interface GuidedReflectionState {
  current_step: number;
  completed: boolean;
  steps: GuidedReflectionAnswer[];
  student_summary: string | null;
  updated_at?: string;
}

type ReflectionFocus = {
  replayFocus: string;
  breakpointFocus: string;
  patternFocus: string;
  actionFocus: string;
};

const DEFAULT_REFLECTION_FOCUS: ReflectionFocus = {
  replayFocus: '真正开始下手的那个瞬间',
  breakpointFocus: '最容易再次出错的具体一步',
  patternFocus: '会反复制造错误的稳定模式',
  actionFocus: '下次先做的 2 到 3 个防错动作',
};

const SUBTYPE_REFLECTION_FOCUS: Record<RootCauseSubtype, ReflectionFocus> = {
  definition_recall_unstable: {
    replayFocus: '你发现定义记不准、只能凭感觉做的那个瞬间',
    breakpointFocus: '需要先说清定义却没说清的那一步',
    patternFocus: '为什么一离开定义支撑就不稳',
    actionFocus: '下次先回忆定义、性质和判定的动作',
  },
  formula_condition_missing: {
    replayFocus: '你直接套公式、却没先判断适用条件的那个瞬间',
    breakpointFocus: '公式本来该停下来检查条件的那一步',
    patternFocus: '为什么你会记住公式，却忽略使用条件',
    actionFocus: '下次套公式前必须先核对条件的动作',
  },
  knowledge_link_disconnected: {
    replayFocus: '你看见题目却想不到对应知识点的那个瞬间',
    breakpointFocus: '条件和知识点没有连上的那一步',
    patternFocus: '为什么你会背知识点，却不会调出来用',
    actionFocus: '下次先把条件映射到知识点的动作',
  },
  concept_boundary_blur: {
    replayFocus: '你在两个相近概念之间拿不准的那个瞬间',
    breakpointFocus: '本来应该区分概念边界、却混过去的那一步',
    patternFocus: '为什么概念一相似你就容易混',
    actionFocus: '下次先比较概念边界再作答的动作',
  },
  symbol_semantics_confused: {
    replayFocus: '你把符号、单位或关系含义想错的那个瞬间',
    breakpointFocus: '本来要确认符号含义、却直接算下去的那一步',
    patternFocus: '为什么你对符号语义总是容易模糊',
    actionFocus: '下次先用自己的话解释符号再列式的动作',
  },
  representation_mapping_confused: {
    replayFocus: '你在图形、文字和式子之间切换卡住的那个瞬间',
    breakpointFocus: '需要做表征转换、却没转对的那一步',
    patternFocus: '为什么一换表达方式你就断线',
    actionFocus: '下次先把题意转换成图或式子的动作',
  },
  missed_condition: {
    replayFocus: '你漏掉限制条件就开始做题的那个瞬间',
    breakpointFocus: '本来应该圈条件、却直接列式的那一步',
    patternFocus: '为什么条件总会被你跳过去',
    actionFocus: '下次先圈条件再下笔的动作',
  },
  goal_target_misaligned: {
    replayFocus: '你以为自己知道题目在问什么、结果问偏了的那个瞬间',
    breakpointFocus: '本来要先对齐目标量、却没停下来的那一步',
    patternFocus: '为什么你常常知道大意却没对准真正问题',
    actionFocus: '下次先复述题目目标再作答的动作',
  },
  quantity_relation_misread: {
    replayFocus: '你把数量、顺序或比例关系看错的那个瞬间',
    breakpointFocus: '本来要确认关系方向、却直接代入的那一步',
    patternFocus: '为什么数量关系一复杂你就容易读偏',
    actionFocus: '下次先画关系或列对应表的动作',
  },
  sign_operation_slip: {
    replayFocus: '你在负号、括号或移项上滑掉的那个瞬间',
    breakpointFocus: '本来要单独检查符号、却省掉的那一步',
    patternFocus: '为什么一快起来符号运算就不稳',
    actionFocus: '下次做完专查符号和运算顺序的动作',
  },
  draft_management_disorder: {
    replayFocus: '你草稿开始乱掉、自己也跟不上的那个瞬间',
    breakpointFocus: '本来该分栏或对齐、却混写在一起的那一步',
    patternFocus: '为什么过程一长草稿就失控',
    actionFocus: '下次先分栏、编号和对齐的动作',
  },
  step_skipping_instability: {
    replayFocus: '你为了快直接跳步的那个瞬间',
    breakpointFocus: '本来要写中间步骤、却省掉的那一步',
    patternFocus: '为什么你一觉得会就会跳步',
    actionFocus: '下次强制保留关键中间步骤的动作',
  },
  no_entry_strategy: {
    replayFocus: '你看见题目却不知道第一步做什么的那个瞬间',
    breakpointFocus: '本来需要先找入口、却直接停住的那一步',
    patternFocus: '为什么一脱离示范题你就不会起手',
    actionFocus: '下次先写出已知、未知和第一步的动作',
  },
  single_path_dependency: {
    replayFocus: '你发现题目和老师讲过的不完全一样就卡住的那个瞬间',
    breakpointFocus: '本来该换路径、却只盯着一种做法的那一步',
    patternFocus: '为什么你总依赖唯一套路',
    actionFocus: '下次先列出两个可能思路的动作',
  },
  decomposition_planning_weak: {
    replayFocus: '你面对复杂题没有拆步骤就乱了的那个瞬间',
    breakpointFocus: '本来该先拆问题、却直接硬做的那一步',
    patternFocus: '为什么题一复杂你就缺少规划',
    actionFocus: '下次先拆成小步骤再推进的动作',
  },
  condition_marking_missing: {
    replayFocus: '你没有圈条件、划关键词就下笔的那个瞬间',
    breakpointFocus: '本来该做条件标记、却略过的那一步',
    patternFocus: '为什么你没形成固定的起手动作',
    actionFocus: '下次先圈条件、划目标、复述问题的动作',
  },
  verification_routine_missing: {
    replayFocus: '你做完就停，没有复核的那个瞬间',
    breakpointFocus: '本来该检查答案合理性、却直接提交的那一步',
    patternFocus: '为什么你总把复核省掉',
    actionFocus: '下次固定做单位、符号、答所问检查的动作',
  },
  simple_problem_rush: {
    replayFocus: '你觉得题简单，所以抢着下笔的那个瞬间',
    breakpointFocus: '本来该慢一秒确认、却因为轻敌省掉的那一步',
    patternFocus: '为什么越简单的题你越容易失误',
    actionFocus: '下次简单题也先停 3 秒检查再下笔的动作',
  },
  time_pressure_panic: {
    replayFocus: '你一感觉时间紧就开始慌的那个瞬间',
    breakpointFocus: '本来该稳住步骤、却被时间拉乱的那一步',
    patternFocus: '为什么时间压力一上来你就降质',
    actionFocus: '下次先稳节奏、先拿稳分步骤的动作',
  },
  frustration_shutdown: {
    replayFocus: '你一遇到卡点就想放弃或烦躁的那个瞬间',
    breakpointFocus: '本来该继续拆小问题、却情绪上来的那一步',
    patternFocus: '为什么受挫后你会停摆',
    actionFocus: '下次卡住先暂停、复述已知、再重启的动作',
  },
  attention_drift: {
    replayFocus: '你做题时思路突然飘走的那个瞬间',
    breakpointFocus: '本来在跟条件、却注意力断开的那一步',
    patternFocus: '为什么你做题中段容易走神',
    actionFocus: '下次用短时专注和口头跟题的动作',
  },
  prompt_dependency: {
    replayFocus: '你还没独立想清就等提示的那个瞬间',
    breakpointFocus: '本来该先自己尝试、却先寻求帮助的那一步',
    patternFocus: '为什么你离开提示就不稳',
    actionFocus: '下次先独立尝试再决定是否求助的动作',
  },
  original_only_transfer_fail: {
    replayFocus: '你发现原题会、稍一变形就不会的那个瞬间',
    breakpointFocus: '本来该抽出通用思路、却只记住原题外形的那一步',
    patternFocus: '为什么你只会原题不会迁移',
    actionFocus: '下次做完原题立刻讲通用方法的动作',
  },
  answer_without_explanation: {
    replayFocus: '你虽然做对了，但讲不清为什么这么做的那个瞬间',
    breakpointFocus: '本来该说明依据、却只能报答案的那一步',
    patternFocus: '为什么你的理解停在答案层',
    actionFocus: '下次做完必须口头复述思路依据的动作',
  },
};

function getReflectionFocus(subtype: RootCauseSubtype | null | undefined) {
  if (!subtype) {
    return DEFAULT_REFLECTION_FOCUS;
  }

  return SUBTYPE_REFLECTION_FOCUS[subtype] || DEFAULT_REFLECTION_FOCUS;
}

export function buildGuidedReflectionSteps({
  category,
  subtype,
}: {
  category: RootCauseCategory;
  subtype?: RootCauseSubtype | null;
}): GuidedReflectionStepDefinition[] {
  const focus = getReflectionFocus(subtype);
  const categoryLabel = ROOT_CAUSE_CATEGORY_LABELS[category];
  const subtypeLabel = subtype ? getRootCauseSubtypeOption(subtype)?.label ?? subtype : null;
  const labelSuffix = subtypeLabel ? `，重点看「${subtypeLabel}」` : `，重点看「${categoryLabel}」`;

  return [
    {
      key: 'replay_error_moment',
      title: '还原出错时刻',
      question: `回到你当时做错的那一刻。围绕${focus.replayFocus}，你脑子里第一反应是什么？你是怎么开始下手的？`,
      description: `先把当时真实想法说出来，不要直接下结论${labelSuffix}。`,
    },
    {
      key: 'find_breakpoint',
      title: '找到断点',
      question: `如果这题再做一次，最容易再次出错的是哪一步？请围绕${focus.breakpointFocus}说清楚：为什么偏偏这一步最危险？`,
      description: `把“具体哪一步会断掉”讲清楚，不要只说粗心${labelSuffix}。`,
    },
    {
      key: 'locate_root_pattern',
      title: '追到稳定模式',
      question: `这暴露出你平时什么习惯、策略或知识调用方式有问题？请围绕${focus.patternFocus}回答：它为什么会反复出现？`,
      description: `这一层要落到能反复制造错误的稳定模式${labelSuffix}。`,
    },
    {
      key: 'commit_next_action',
      title: '写下下次动作',
      question: `下次遇到同类题，你准备先做哪 2 到 3 个动作来阻止它再次发生？请围绕${focus.actionFocus}回答。`,
      description: `动作要能立刻执行，例如先圈条件、先复述问题、做完核对目标${labelSuffix}。`,
    },
  ];
}

export const GUIDED_REFLECTION_STEPS: GuidedReflectionStepDefinition[] = buildGuidedReflectionSteps({
  category: 'habit_issue',
});

export function createEmptyGuidedReflectionState(): GuidedReflectionState {
  return {
    current_step: 0,
    completed: false,
    steps: [],
    student_summary: null,
  };
}
