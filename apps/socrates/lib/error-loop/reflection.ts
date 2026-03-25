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

export const GUIDED_REFLECTION_STEPS: GuidedReflectionStepDefinition[] = [
  {
    key: 'replay_error_moment',
    title: '还原出错时刻',
    question: '回到你当时做错的那一刻，你脑子里第一反应是什么？你是怎么开始下手的？',
    description: '先把当时的真实想法说出来，不要直接说结论。',
  },
  {
    key: 'find_breakpoint',
    title: '找到断点',
    question: '如果这题再做一次，最容易再次出错的具体一步是哪一步？为什么那一步最危险？',
    description: '把“哪一步会断掉”说清楚，别只说粗心。',
  },
  {
    key: 'locate_root_pattern',
    title: '追到稳定模式',
    question: '这暴露出你平时什么习惯、策略或知识调用方式有问题？它为什么会反复出现？',
    description: '这一层要落到会反复制造错误的模式。',
  },
  {
    key: 'commit_next_action',
    title: '写下下次动作',
    question: '下次遇到同类题，你准备先做哪 2 到 3 个动作，来阻止这个错误再次发生？',
    description: '动作要能立刻执行，例如先圈条件、先复述问题、做完核对目标。',
  },
];

export function createEmptyGuidedReflectionState(): GuidedReflectionState {
  return {
    current_step: 0,
    completed: false,
    steps: [],
    student_summary: null,
  };
}
