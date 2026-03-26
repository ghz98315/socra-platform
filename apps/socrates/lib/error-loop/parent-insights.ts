import {
  ROOT_CAUSE_CATEGORY_LABELS,
  getRootCauseSubtypeOption,
  type RootCauseCategory,
  type RootCauseSubtype,
} from '@/lib/error-loop/taxonomy';

export interface ParentSupportPlaybook {
  title: string;
  summary: string;
  actions: string[];
  watchFors: string[];
}

export interface HeatScoreInput {
  count: number;
  recentCount: number;
  reopenedCount: number;
  pseudoMasteryCount: number;
  pendingCount: number;
}

const CATEGORY_PLAYBOOKS: Record<RootCauseCategory, ParentSupportPlaybook> = {
  knowledge_gap: {
    title: '先补知识缺口，再谈提速',
    summary: '孩子不是不会做这一题，而是对应知识点还没有形成稳定调用。',
    actions: [
      '先让孩子说出定义、公式和适用条件，再开始做题。',
      '把这一类题压缩成一个最小知识卡片，连续几次独立回忆后再撤掉提示。',
      '一次只盯一个最小知识缺口，不要同时追很多错因。',
    ],
    watchFors: ['能背公式但不会判断什么时候用', '题目一换表达就不会'],
  },
  concept_confusion: {
    title: '盯边界，不只盯答案',
    summary: '孩子把相近概念混在一起，题型一变化就容易失稳。',
    actions: [
      '多问“为什么用 A 不是 B”，逼孩子说出概念边界。',
      '做对比题时每次只变一个变量，让差异被看见。',
      '家长提问时优先问“区别是什么”，不要只问“会不会”。',
    ],
    watchFors: ['定义会背但说不清差别', '题目稍变形就套错规则'],
  },
  problem_reading: {
    title: '先审题，再运算',
    summary: '问题来源是信息提取不完整，不是单纯算错。',
    actions: [
      '要求孩子先圈条件、目标量、限制词，再下笔。',
      '先复述“已知什么、求什么、不能漏什么”，再开始列式。',
      '把“审题 10 秒”固定成每道题的起手动作。',
    ],
    watchFors: ['漏条件', '目标量看偏', '单位或范围被忽略'],
  },
  calculation_execution: {
    title: '把过程稳定下来',
    summary: '根因不在知识点，而在执行步骤、符号管理和草稿秩序。',
    actions: [
      '限制每一步只做一种运算，写清中间结果，不跳步。',
      '养成做完后只检查符号和抄写的固定动作。',
      '先把正确率拉稳，再谈速度。',
    ],
    watchFors: ['符号经常错', '草稿混乱', '一快就错'],
  },
  strategy_gap: {
    title: '先建立解题路线图',
    summary: '孩子卡在不会下手，说明方法路径还没有真正建立。',
    actions: [
      '先让孩子说“第一步为什么这么做”，再继续第二步。',
      '把同类题整理成 2 到 3 步的固定策略句式。',
      '遇到不会的题，先写已知和目标，不要直接向 AI 求助。',
    ],
    watchFors: ['看到题就发呆', '只会老师讲过的原题路径', '不会拆步骤'],
  },
  habit_issue: {
    title: '修习惯，不只纠一题',
    summary: '反复出现同类错误，往往来自稳定坏习惯，而不是单次失误。',
    actions: [
      '固定一个复盘动作，例如先查条件、符号、答所问。',
      '每天只盯一个习惯指标，不要贪多。',
      '让孩子说出今天最容易复发的行为问题，并承诺下次动作。',
    ],
    watchFors: ['总说“下次不会了”但同类错误继续出现', '不愿复盘过程'],
  },
  attention_emotion: {
    title: '先稳状态，再谈难题',
    summary: '注意力波动、急躁或情绪压力正在直接影响解题质量。',
    actions: [
      '把高难题拆短，限制单次专注时长，先确保稳定完成。',
      '孩子焦躁时先停，不要立刻追问“为什么又错”。',
      '记录最容易急、乱、拖的场景，优先调环境和节奏。',
    ],
    watchFors: ['一赶时间就乱', '一错就急', '做题时频繁分心'],
  },
  pseudo_mastery: {
    title: '重点识别“假会”',
    summary: '孩子可能记住了原题，却没有形成迁移和独立讲解能力。',
    actions: [
      '原题做对后，必须追加一题变式题和一次口头讲解。',
      '如果需要 AI 提示才能做出，就不要判定为真的会。',
      '对已判定为假会的题，隔天先盲做，再决定是否关闭。',
    ],
    watchFors: ['原题会、变式不会', '答案对但讲不清', '离开提示就卡住'],
  },
};

const SUBTYPE_PLAYBOOK_OVERRIDES: Partial<Record<RootCauseSubtype, Partial<ParentSupportPlaybook>>> = {
  definition_recall_unstable: {
    title: '先把定义说准',
    summary: '问题不是不会算，而是定义和性质没有被准确提取出来。',
    actions: [
      '做题前先口头复述定义，不准只说“大概知道”。',
      '把定义、性质、反例放在一起，让孩子说明边界。',
      '先做“定义判断题”再回到综合题。',
    ],
  },
  formula_condition_missing: {
    title: '套公式前先核条件',
    summary: '孩子记住了公式本身，但总跳过“能不能用”的判断。',
    actions: [
      '每次套公式前先问一句“条件满足了吗”。',
      '把“公式名 + 使用条件”写成成对卡片。',
      '专门练“这题为什么不能直接套公式”的反向题。',
    ],
  },
  knowledge_link_disconnected: {
    title: '把条件和知识点连起来',
    summary: '孩子背得出知识点，但看题时调不出来。',
    actions: [
      '先让孩子圈条件，再说“这对应哪个知识点”。',
      '同一知识点换几种题面，让孩子练识别入口。',
      '错题复盘时别只看答案，要补“为什么想到这个知识点”。',
    ],
  },
  concept_boundary_blur: {
    title: '专治概念边界混淆',
    summary: '孩子容易把相近概念揉成一团，边界不清。',
    actions: [
      '让孩子自己举一个“容易混”的反例。',
      '同类概念做双列表，对比适用条件和不能用的场景。',
      '家长提问时多问“差别是什么”，少问“背会了吗”。',
    ],
  },
  symbol_semantics_confused: {
    title: '先解释符号，再动笔',
    summary: '符号、单位或关系含义没讲清，后面过程再努力也会歪。',
    actions: [
      '列式前先让孩子用口头解释每个符号代表什么。',
      '对单位和正负方向做显式标记。',
      '遇到关系题，先写一句“谁和谁在比较”。',
    ],
  },
  representation_mapping_confused: {
    title: '加强表征转换',
    summary: '文字、图形、算式之间转不稳，所以题一换表达就掉线。',
    actions: [
      '同一题要求孩子做“文字转图”“图转式”双向转换。',
      '优先让孩子自己画草图或关系图。',
      '讲评时问“这句话在图上/式子里对应哪里”。',
    ],
  },
  missed_condition: {
    title: '先治漏条件',
    summary: '表面像粗心，底层是条件提取动作根本没有建立。',
    actions: [
      '要求先圈限制词、单位词、范围词。',
      '列式前先复述“题目有哪些不能漏的条件”。',
      '做完后专查“每个条件有没有进入过程”。',
    ],
  },
  goal_target_misaligned: {
    title: '先对准题目目标',
    summary: '孩子知道题目大意，但没有对准真正要回答的量。',
    actions: [
      '下笔前先说“题目最终让我求什么”。',
      '把“求什么”单独写在草稿第一行。',
      '复盘时专问“这一步是在靠近哪个目标”。',
    ],
  },
  quantity_relation_misread: {
    title: '把关系读准',
    summary: '数量、比例、顺序关系读偏，后面算得再认真也白费。',
    actions: [
      '先画关系图或列表，再代入数字。',
      '多练“谁比谁多/少、先后顺序、倍数关系”的复述。',
      '让孩子把每个数字的身份说清楚再计算。',
    ],
  },
  sign_operation_slip: {
    title: '专查符号运算',
    summary: '问题集中在负号、括号、移项和运算顺序。',
    actions: [
      '把“符号复核”从全面检查里单独拆出来。',
      '限定关键步骤必须逐行写，不能心算跳过。',
      '做错后不要只重做，要定位是哪类符号错反复出现。',
    ],
  },
  draft_management_disorder: {
    title: '先把草稿管起来',
    summary: '草稿混乱会直接把本来会的题拖成不会。',
    actions: [
      '固定分栏：左边审题，右边运算，底部检查。',
      '每一步编号，对齐抄写，避免错位。',
      '题一长就强制换行，不准挤成一团。',
    ],
  },
  step_skipping_instability: {
    title: '慢一点，别跳关键步',
    summary: '孩子不是不会，而是老想省步骤，结果把稳定性省掉了。',
    actions: [
      '规定关键步骤必须写全，特别是变形和转化处。',
      '练“最短但不丢信息”的标准写法，而不是完全省略。',
      '先把完整率练稳，再去追速度。',
    ],
  },
  no_entry_strategy: {
    title: '先解决不会起手',
    summary: '真正的问题是没有入口，不是简单地“不会做”。',
    actions: [
      '固定先写已知、未知、关系、第一步。',
      '每次卡住先回答“我现在手里有什么”。',
      '用 3 句模板帮孩子形成起手动作。',
    ],
  },
  single_path_dependency: {
    title: '打破单一路径依赖',
    summary: '孩子只认熟悉套路，方法一换就停。',
    actions: [
      '同一题尝试两种思路，哪怕第二种不完整也要说出来。',
      '讲评时多问“如果这条路不通，还有什么办法”。',
      '专练“同核心、不同外形”的变式题。',
    ],
  },
  decomposition_planning_weak: {
    title: '先学会拆题',
    summary: '复杂题一上来就硬做，缺少先规划后推进的动作。',
    actions: [
      '先把题拆成 2 到 4 个小任务，再逐个完成。',
      '每一步结束都问“下一步我要解决什么”。',
      '鼓励先写框架，再补细节。',
    ],
  },
  condition_marking_missing: {
    title: '建立圈条件习惯',
    summary: '根因不是一时粗心，而是起手动作根本没有形成。',
    actions: [
      '所有题统一执行“圈条件 - 划目标 - 口头复述”。',
      '家长只监督动作有没有做，不直接替孩子解题。',
      '连续几天只盯这个动作是否稳定出现。',
    ],
  },
  verification_routine_missing: {
    title: '把复核变成习惯',
    summary: '孩子会做，但总在最后一步把本来能拿到的分丢掉。',
    actions: [
      '固定三查：符号、单位、答所问。',
      '做完后先不提交，留 20 秒只查结果合理性。',
      '错题复盘时记录“本来哪一查能救回来”。',
    ],
  },
  simple_problem_rush: {
    title: '简单题也要防轻敌',
    summary: '轻敌会让孩子在简单题上跳过本来该做的动作。',
    actions: [
      '简单题先停 3 秒再下笔。',
      '要求孩子说出“这题最容易轻敌漏什么”。',
      '把简单题失分单独归档，提醒不是难题才值得认真。',
    ],
  },
  time_pressure_panic: {
    title: '先稳住时间压力',
    summary: '一赶时间就变形，说明节奏管理先于提分。',
    actions: [
      '练固定节奏：先拿稳基础分，再冲难题。',
      '做题时把“慌”改成“先做最确定一步”。',
      '不要在焦躁状态下追问结果，对状态先降压。',
    ],
  },
  frustration_shutdown: {
    title: '处理受挫停摆',
    summary: '孩子不是完全不会，而是卡住后情绪先崩，思考被打断。',
    actions: [
      '卡住时先暂停 30 秒，再复述已知，不立刻批评。',
      '把任务缩小成一个可以立即完成的小问题。',
      '家长开口先帮孩子找“已经做对的部分”。',
    ],
  },
  attention_drift: {
    title: '把专注力拉回来',
    summary: '问题是中途掉线，不是开头不会。',
    actions: [
      '缩短单次做题时长，采用短回合专注。',
      '要求孩子边做边口头跟题，减少无意识飘走。',
      '观察哪些场景最容易分心，先调环境再要求结果。',
    ],
  },
  prompt_dependency: {
    title: '减少提示依赖',
    summary: '孩子还没真正独立思考，就习惯等提示接管。',
    actions: [
      '规定先独立尝试 2 分钟，再决定是否求助。',
      'AI 或家长只给最小提示，不直接给路径。',
      '复盘时记录“如果没提示，我卡在哪”。',
    ],
  },
  original_only_transfer_fail: {
    title: '从原题记忆走向迁移',
    summary: '孩子会的是原题外形，不是可迁移的方法。',
    actions: [
      '每次原题通过后，立刻追加一题结构相近但外形不同的变式。',
      '要求孩子讲“这题的方法能迁移到哪里”。',
      '复习时优先做变式，而不是反复刷原题。',
    ],
  },
  answer_without_explanation: {
    title: '答案对，不代表真的会',
    summary: '孩子停在结果层，还没有形成能说清依据的理解。',
    actions: [
      '每次做对都追问“为什么这么做”。',
      '让孩子用自己的话讲，不允许只复述标准答案。',
      '把“讲清思路”作为是否关闭错题的必要条件。',
    ],
  },
};

export const HEAT_SCORE_MODEL = {
  countWeight: 45,
  recentWeight: 20,
  reopenedWeight: 20,
  pseudoMasteryWeight: 10,
  pendingWeight: 5,
};

function mergePlaybook(base: ParentSupportPlaybook, override?: Partial<ParentSupportPlaybook>) {
  if (!override) {
    return base;
  }

  return {
    title: override.title || base.title,
    summary: override.summary || base.summary,
    actions: override.actions || base.actions,
    watchFors: override.watchFors || base.watchFors,
  };
}

export function computeHeatScore(input: HeatScoreInput) {
  const rawScore =
    input.count * HEAT_SCORE_MODEL.countWeight +
    input.recentCount * HEAT_SCORE_MODEL.recentWeight +
    input.reopenedCount * HEAT_SCORE_MODEL.reopenedWeight +
    input.pseudoMasteryCount * HEAT_SCORE_MODEL.pseudoMasteryWeight +
    input.pendingCount * HEAT_SCORE_MODEL.pendingWeight;

  return rawScore;
}

export function describeHeatLevel(score: number) {
  if (score >= 80) {
    return 'high';
  }

  if (score >= 45) {
    return 'medium';
  }

  return 'low';
}

export function getParentSupportPlaybook(category: RootCauseCategory, subtype?: RootCauseSubtype | null) {
  const base = CATEGORY_PLAYBOOKS[category];
  const override = subtype ? SUBTYPE_PLAYBOOK_OVERRIDES[subtype] : undefined;
  const merged = mergePlaybook(base, override);

  if (!subtype) {
    return merged;
  }

  const subtypeLabel = getRootCauseSubtypeOption(subtype)?.label;
  if (!subtypeLabel) {
    return merged;
  }

  return {
    ...merged,
    summary: `${ROOT_CAUSE_CATEGORY_LABELS[category]}中的「${subtypeLabel}」正在反复出现。${merged.summary}`,
  };
}

export function getRootCauseLabel(category: RootCauseCategory) {
  return ROOT_CAUSE_CATEGORY_LABELS[category] ?? category;
}
