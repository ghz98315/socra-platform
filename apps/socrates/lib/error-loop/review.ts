export type AttemptMode = 'original' | 'variant' | 'mixed';

export type MasteryJudgement =
  | 'not_mastered'
  | 'assisted_correct'
  | 'explanation_gap'
  | 'pseudo_mastery'
  | 'provisional_mastered'
  | 'mastered';

export const ATTEMPT_MODE_OPTIONS: Array<{
  value: AttemptMode;
  label: string;
  description: string;
}> = [
  {
    value: 'original',
    label: '原题复习',
    description: '先验证原题是否能独立做出并讲清思路。',
  },
  {
    value: 'variant',
    label: '变式复习',
    description: '重点检查迁移能力，避免只会记答案。',
  },
  {
    value: 'mixed',
    label: '原题 + 变式',
    description: '同时验证原题稳定性和变式迁移能力。',
  },
];

export const MASTERY_JUDGEMENT_META: Record<
  MasteryJudgement,
  {
    label: string;
    description: string;
    tone: 'red' | 'amber' | 'blue' | 'green';
  }
> = {
  not_mastered: {
    label: '未掌握',
    description: '这次仍未独立做对，需要回到引导学习，把根因处理掉。',
    tone: 'red',
  },
  assisted_correct: {
    label: '提示后做对',
    description: '结果对了，但依赖了提示，还不能算真正掌握。',
    tone: 'amber',
  },
  explanation_gap: {
    label: '会做但讲不清',
    description: '能得到答案，但解释链路不完整，知识还不稳。',
    tone: 'amber',
  },
  pseudo_mastery: {
    label: '假会',
    description: '原题似乎会，变式不过关，说明还停留在记忆层。',
    tone: 'red',
  },
  provisional_mastered: {
    label: '暂时掌握',
    description: '这次独立完成得不错，但还需要下一轮间隔复习继续验证。',
    tone: 'blue',
  },
  mastered: {
    label: '稳定掌握',
    description: '已满足关闭条件，这道题可以进入关闭状态。',
    tone: 'green',
  },
};

export const MASTERY_TONE_STYLES: Record<
  'red' | 'amber' | 'blue' | 'green',
  {
    badge: string;
    panel: string;
  }
> = {
  red: {
    badge: 'bg-red-100 text-red-700',
    panel: 'border-red-200 bg-red-50 text-red-800',
  },
  amber: {
    badge: 'bg-amber-100 text-amber-700',
    panel: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  blue: {
    badge: 'bg-blue-100 text-blue-700',
    panel: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  green: {
    badge: 'bg-emerald-100 text-emerald-700',
    panel: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
};
