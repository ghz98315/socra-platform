export type ConversationRiskCategory =
  | 'frustration_escalation'
  | 'avoidance_resistance'
  | 'disrespect_boundary'
  | 'helplessness_shutdown'
  | 'answer_dependency';

export type ConversationRiskSeverity = 'low' | 'medium' | 'high';

export interface ConversationRiskMatch {
  category: ConversationRiskCategory;
  severity: ConversationRiskSeverity;
  score: number;
  title: string;
  summary: string;
  triggerPhrases: string[];
  parentActions: string[];
  parentOpening: string;
}

export interface ConversationRiskSignal {
  category: ConversationRiskCategory;
  severity: ConversationRiskSeverity;
  score: number;
  title: string;
  summary: string;
  messageText: string;
  triggerPhrases: string[];
  parentActions: string[];
  parentOpening: string;
}

export interface AggregatedConversationRiskSignal extends ConversationRiskSignal {
  session_id: string;
  message_id: string;
  created_at: string;
}

export interface ConversationRiskInterventionTaskDraft {
  title: string;
  description: string;
  taskType: 'conversation_intervention';
  subject: 'math';
  targetCount: 1;
  targetDuration: number;
  priority: 1 | 2 | 3;
  rewardPoints: number;
}

type RiskRule = {
  category: ConversationRiskCategory;
  title: string;
  summary: string;
  patterns: RegExp[];
  baseScore: number;
  escalationPatterns?: RegExp[];
  parentActions: string[];
  parentOpening: string;
};

const RISK_RULES: RiskRule[] = [
  {
    category: 'frustration_escalation',
    title: '挫败情绪明显上升',
    summary: '孩子在对话里出现了明显急躁、崩溃或强烈受挫表达，先稳情绪再继续讲题更重要。',
    patterns: [
      /烦死了|烦死|气死了|崩溃了|我受不了了|真的烦|好烦啊|烦/i,
      /太难了吧|怎么这么难|根本做不出来|完全不会/i,
      /我不行了|我裂开了|救命啊/i,
    ],
    escalationPatterns: [/再也不想|根本没法|一点都不想|完全不想/i],
    baseScore: 4,
    parentActions: [
      '先暂停讲题，先确认孩子现在是卡在题目还是情绪。',
      '把任务缩短到下一步，例如只先说题目条件，不要求立刻做完。',
      '避免继续追问“为什么还不会”，先把状态稳住。',
    ],
    parentOpening: '我看到你刚刚那会儿有点急，我们先不追答案，先说说你是卡在哪一步。',
  },
  {
    category: 'avoidance_resistance',
    title: '出现明显逃避或抗拒',
    summary: '孩子正在用拖延、敷衍或抗拒来回避当前学习任务，需要先处理任务接受度。',
    patterns: [
      /不想学|不学了|不做了|懒得做|随便吧|爱咋咋地/i,
      /跳过吧|换一个吧|别讲了|算了吧/i,
      /我不想听|不要学这个|没意思/i,
    ],
    escalationPatterns: [/别烦我|别管我|别说了/i],
    baseScore: 3,
    parentActions: [
      '不要直接压任务量，先把任务降到一个可接受的最小动作。',
      '先问孩子现在最抗拒的是难度、时长还是被催促的感觉。',
      '让孩子自己选“先做哪一步”，提高可控感。',
    ],
    parentOpening: '我看出来你现在有点抗拒，我们先不讲整道题，只定一个最小动作，你来选先做哪一步。',
  },
  {
    category: 'disrespect_boundary',
    title: '出现不当表达或边界问题',
    summary: '孩子在对话里出现了攻击性或不合适表达，家长需要及时校正沟通边界。',
    patterns: [
      /闭嘴|滚|你别烦|烦不烦|神经病/i,
      /蠢死了|傻/i,
      /有病吧|去死|真恶心/i,
    ],
    escalationPatterns: [/滚开|别来烦我|闭嘴行吗/i],
    baseScore: 5,
    parentActions: [
      '先明确表达方式不可接受，但不要立刻升级成训斥。',
      '把“内容问题”和“表达边界问题”分开谈。',
      '让孩子重新用可以接受的方式说一遍真实感受。',
    ],
    parentOpening: '我先接住你的情绪，但这种表达方式不行。你可以生气，我们换一种说法把真实想法说出来。',
  },
  {
    category: 'helplessness_shutdown',
    title: '出现无助或自我否定',
    summary: '孩子不只是不会题，而是开始把问题归因到“我不行”，需要尽快止损。',
    patterns: [
      /我就是不会|我太笨了|我不行|我学不会|我做不到/i,
      /算了我没救了|我就是差|我怎么这么笨/i,
      /反正我也学不会|我肯定不行/i,
    ],
    escalationPatterns: [/没希望了|没救了|都没用/i],
    baseScore: 5,
    parentActions: [
      '先把评价对象从“我不行”改成“这一步不会”。',
      '立即拆分任务，只保留一个可以完成的小目标。',
      '回到最近做对过的同类题，重建可完成感。',
    ],
    parentOpening: '先别把它变成“我不行”，我们只看这一小步是哪里没过，不把整个人一起否定掉。',
  },
  {
    category: 'answer_dependency',
    title: '答案依赖信号偏高',
    summary: '孩子在跳过独立尝试，直接索要答案或完整步骤，容易形成假会。',
    patterns: [
      /直接告诉我答案|给我答案|发答案|标准答案/i,
      /你直接做出来|你帮我写|你替我做/i,
      /别提示了直接说|直接告诉我怎么做/i,
    ],
    escalationPatterns: [/快点给答案|我要抄答案|直接发我结果/i],
    baseScore: 2,
    parentActions: [
      '先要求孩子说出自己已经想到的第一步，再决定是否给提示。',
      '把“要答案”改成“先讲思路，再给一条提示”。',
      '原题做对后必须加一道变式题，避免假会。',
    ],
    parentOpening: '这次先不拿完整答案，你先告诉我你已经想到哪一步，我只补你卡住的那一小段。',
  },
];

function normalizeText(value: string) {
  return value.replace(/\s+/g, '').trim().toLowerCase();
}

function computeSeverity(score: number): ConversationRiskSeverity {
  if (score >= 6) {
    return 'high';
  }

  if (score >= 4) {
    return 'medium';
  }

  return 'low';
}

export function detectConversationRisks(messageText: string) {
  const normalized = normalizeText(messageText);
  if (!normalized) {
    return [] as ConversationRiskMatch[];
  }

  const matches: ConversationRiskMatch[] = [];

  for (const rule of RISK_RULES) {
    const triggerPhrases = rule.patterns
      .filter((pattern) => pattern.test(normalized))
      .map((pattern) => pattern.source);

    if (triggerPhrases.length === 0) {
      continue;
    }

    let score = rule.baseScore + Math.max(0, triggerPhrases.length - 1);
    if (rule.escalationPatterns?.some((pattern) => pattern.test(normalized))) {
      score += 2;
    }

    matches.push({
      category: rule.category,
      severity: computeSeverity(score),
      score,
      title: rule.title,
      summary: rule.summary,
      triggerPhrases,
      parentActions: rule.parentActions,
      parentOpening: rule.parentOpening,
    });
  }

  return matches.sort((a, b) => b.score - a.score);
}

export function shouldNotifyParentForRisk(signal: ConversationRiskSignal) {
  return signal.severity === 'high';
}

export function buildConversationRiskSignal(messageText: string) {
  const topMatch = detectConversationRisks(messageText)[0];
  if (!topMatch) {
    return null;
  }

  return {
    ...topMatch,
    messageText,
  } satisfies ConversationRiskSignal;
}

export function aggregateConversationRiskSignals(
  items: Array<{
    sessionId: string;
    messageId: string;
    createdAt: string;
    messageText: string;
  }>,
) {
  return items
    .map((item) => {
      const signal = buildConversationRiskSignal(item.messageText);
      if (!signal) {
        return null;
      }

      return {
        session_id: item.sessionId,
        message_id: item.messageId,
        created_at: item.createdAt,
        ...signal,
      };
    })
    .filter((item): item is AggregatedConversationRiskSignal => item !== null)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

export function buildConversationRiskInterventionTaskDraft(signal: {
  session_id: string;
  category: ConversationRiskCategory;
  title: string;
  summary: string;
  message_excerpt: string;
  question_excerpt: string;
  parent_opening: string;
  parent_actions: string[];
}): ConversationRiskInterventionTaskDraft {
  const priority: 1 | 2 | 3 = signal.category === 'disrespect_boundary' || signal.category === 'helplessness_shutdown' ? 1 : 2;
  const targetDuration =
    signal.category === 'frustration_escalation' || signal.category === 'helplessness_shutdown' ? 15 : 20;

  return {
    title: `沟通干预: ${signal.title}`,
    description: [
      signal.summary,
      `学生原话: ${signal.message_excerpt}`,
      `关联题目: ${signal.question_excerpt}`,
      `建议开场: ${signal.parent_opening}`,
      '建议动作:',
      ...signal.parent_actions.map((action, index) => `${index + 1}. ${action}`),
      `[conversation-session:${signal.session_id}]`,
      `[conversation-risk:${signal.category}]`,
    ].join('\n'),
    taskType: 'conversation_intervention',
    subject: 'math',
    targetCount: 1,
    targetDuration,
    priority,
    rewardPoints: 0,
  };
}
