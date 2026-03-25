import { ROOT_CAUSE_CATEGORY_LABELS, type RootCauseCategory } from '@/lib/error-loop/taxonomy';

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

export const PARENT_SUPPORT_PLAYBOOKS: Record<RootCauseCategory, ParentSupportPlaybook> = {
  knowledge_gap: {
    title: '先补知识缺口，再谈提速',
    summary: '孩子不是不会做这一题，而是对应知识点没有形成稳定调用。',
    actions: [
      '让孩子先口头说出定义、公式和适用条件，再开始做题。',
      '把这一类题压缩成 1 个知识点小卡片，连续三次独立回忆后再撤掉提示。',
      '每天只追一个最小知识缺口，不要同时追很多错因。',
    ],
    watchFors: ['公式背得出但不知道什么时候用', '换一个数字或问法就不会'],
  },
  concept_confusion: {
    title: '盯边界，不只盯答案',
    summary: '孩子常把相近概念混在一起，表面会做，边界一变就失稳。',
    actions: [
      '让孩子比较“这题为什么用 A 不是 B”，必须说出边界条件。',
      '针对易混概念做一组对比题，每次只比一个变量。',
      '家长提问时优先问“区别是什么”，不要只问“会不会”。',
    ],
    watchFors: ['定义会背但辨不清差异', '题目稍变形就套错规则'],
  },
  problem_reading: {
    title: '先审题，再运算',
    summary: '错误来源是信息提取不完整，不是单纯算错。',
    actions: [
      '要求孩子先圈条件、目标量、限制词，再下笔。',
      '让孩子复述题意，确认“已知什么、求什么、不能漏什么”。',
      '把“审题 10 秒”固定成每道题起手动作。',
    ],
    watchFors: ['漏条件', '目标量看错', '单位或范围被忽略'],
  },
  calculation_execution: {
    title: '把过程稳定下来',
    summary: '根因不在知识点，而在执行步骤、符号管理和草稿秩序。',
    actions: [
      '限定每步只做一种运算，写清中间结果，不跳步。',
      '让孩子养成做完后只检查符号和抄写的固定动作。',
      '控制题量，先把正确率拉稳，再谈速度。',
    ],
    watchFors: ['符号经常错', '草稿凌乱', '一快就错'],
  },
  strategy_gap: {
    title: '先建立解题路线图',
    summary: '孩子卡在不会下手，说明方法路径没有真正建立。',
    actions: [
      '先让孩子说“第一步为什么这么做”，再继续第二步。',
      '把同类题统一成 2 到 3 步的固定策略句式。',
      '遇到不会做的题，先要求写出已知关系，而不是直接求助 AI。',
    ],
    watchFors: ['看到题就发呆', '只会老师讲过的原题路径', '不会拆分步骤'],
  },
  habit_issue: {
    title: '修习惯，不只纠一次错',
    summary: '反复犯同类错误，往往来自稳定坏习惯，而不是单次失误。',
    actions: [
      '固定一个复盘动作，例如“做完先查条件、符号、答案合理性”。',
      '每天只盯一个习惯指标，例如是否列式、是否复核，不要贪多。',
      '让孩子自己说出今天最容易复发的行为问题，并承诺下一次动作。',
    ],
    watchFors: ['总说“我知道，下次不会了”但同类错误继续出现', '不愿意复盘过程'],
  },
  attention_emotion: {
    title: '先稳状态，再谈难题',
    summary: '注意力波动、急躁或情绪压力正在直接影响解题质量。',
    actions: [
      '把高难题拆短，限定单次专注时长，先保证稳定完成。',
      '当孩子焦躁时先暂停，不要立即追问“为什么又错”。',
      '记录什么场景最容易急、乱、拖，优先调整环境和节奏。',
    ],
    watchFors: ['赶时间就乱', '一错就急', '做题时频繁分心'],
  },
  pseudo_mastery: {
    title: '重点识别“假会”',
    summary: '孩子可能记住了原题，却没有真正形成迁移和独立讲解能力。',
    actions: [
      '原题做对后，必须追加一题变式题和一次口头讲解。',
      '如果需要 AI 提示才做出，就不要判定为真的会。',
      '对已判定为假会的题，隔天先盲做，再决定是否关闭。',
    ],
    watchFors: ['原题会、变式不会', '答案对但讲不清', '一离开提示就卡住'],
  },
};

export const HEAT_SCORE_MODEL = {
  countWeight: 45,
  recentWeight: 20,
  reopenedWeight: 20,
  pseudoMasteryWeight: 10,
  pendingWeight: 5,
};

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

export function getParentSupportPlaybook(category: RootCauseCategory) {
  return PARENT_SUPPORT_PLAYBOOKS[category];
}

export function getRootCauseLabel(category: RootCauseCategory) {
  return ROOT_CAUSE_CATEGORY_LABELS[category] ?? category;
}
