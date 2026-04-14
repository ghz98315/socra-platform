// =====================================================
// Project Socrates - Prompt Builder
// Assemble the live tutoring prompt stack
// =====================================================

import type {
  SubjectType,
  GradeLevel,
  DialogMode,
  PromptBuildOptions,
  SubjectConfig,
} from './types';
import { getBasePrompt, getGenericStrategies, getGradeRoutingBase } from './base';
import { getSubjectConfig } from './subjects';

/**
 * Use subject-specific prompting only when the subject is known with enough confidence.
 */
export function shouldUseSpecialistMode(
  subject: SubjectType,
  subjectConfidence: number = 1,
): boolean {
  if (subjectConfidence < 0.7) {
    return false;
  }

  if (subject === 'generic') {
    return false;
  }

  return true;
}

/**
 * User-facing dialog mode label.
 */
export function getDialogMode(
  subject: SubjectType,
  subjectConfidence: number = 1,
): DialogMode {
  return shouldUseSpecialistMode(subject, subjectConfidence) ? 'Socra' : 'Logic';
}

function formatKnowledgeBase(
  knowledgeBase: SubjectConfig['knowledgeBase'],
  grade: GradeLevel,
): string {
  const points = knowledgeBase[grade];
  if (!points || points.length === 0) {
    return '';
  }

  return points
    .map(
      (category) =>
        `${category.category}\n${category.items.map((item) => `  - ${item}`).join('\n')}`,
    )
    .join('\n\n');
}

function formatExamples(
  examples: SubjectConfig['examples'],
  grade: GradeLevel,
): string {
  const gradeExamples = examples[grade];
  if (!gradeExamples || gradeExamples.length === 0) {
    return '';
  }

  return gradeExamples
    .map((example) => {
      const dialogStr = example.dialog
        .map((entry) => `> **${entry.role === 'user' ? '学生' : '老师'}**：${entry.content}`)
        .join('\n>\n');
      return `**${example.scenario}**\n>\n${dialogStr}`;
    })
    .join('\n\n---\n\n');
}

function buildFirstTurnFocus(options: PromptBuildOptions): string {
  const hasGeometry =
    Boolean(options.geometryData) &&
    options.geometryData?.type &&
    options.geometryData.type !== 'unknown';

  const focusLines: string[] = ['首轮只做轻诊断，不展开完整讲解。'];

  if (options.subject === 'math') {
    focusLines.push('优先判断学生卡在已知条件、目标、关系搭桥，还是计算表达。');

    if (hasGeometry) {
      focusLines.push('先让学生看图里的关键点、线、角，再确认已知关系和目标关系。');
      focusLines.push('首问优先落在“图里最关键的对象或关系是什么”。');
    } else {
      focusLines.push('先锚定题目给了什么、最后要求什么，再找最可能搭桥的关系。');
      focusLines.push('首问优先落在一个已知条件、目标量或关键关系上。');
    }
  } else if (options.subject === 'chinese') {
    focusLines.push('先让学生回到题干任务，不要直接讲抽象主题。');
    focusLines.push('优先确认关键词、题型和原文定位，再追问答案组织。');
    focusLines.push('首问优先落在题干关键词或原文对应句段。');
  } else if (options.subject === 'english') {
    focusLines.push('先锚定局部语境和句子结构，不直接给整句翻译或完整答案。');

    if (options.questionType === 'reading') {
      focusLines.push('先判断题干是在问细节、主旨还是推断，再回到原文定位。');
    } else {
      focusLines.push('先看空前空后、词性、时态或固定搭配信号。');
    }

    focusLines.push('首问优先落在一个局部语境线索上。');
  } else {
    focusLines.push('先确认当前已知、目标和最直接的卡点。');
    focusLines.push('首问优先落在一个最小可执行动作上。');
  }

  focusLines.push('首轮避免并列多个方法、多个定理或完整解题计划。');

  return `<first_turn_focus>
${focusLines.map((line) => `- ${line}`).join('\n')}
</first_turn_focus>`;
}

function buildLiveResponseContract(options: PromptBuildOptions): string {
  const firstTurnRules = options.isFirstTurn
    ? [
        '- 首轮回复在最后提问前，最多两句短句。',
        '- 首轮先做轻诊断：优先判断学生是没看懂题、概念不清、关系没找到、方法卡住，还是计算 / 表达出错。',
        '- 学生第一次说“看不懂 / 不会 / 没明白”时，先缩小一步，继续围绕当前卡点提问。',
        '- 学生在同一步连续第二次仍看不懂时，不要重复上一问；回退一层，改成更具体的观察、定位或判断动作。',
        '- 首轮不要直接展开完整 5 Whys，也不要给完整解题计划。',
        '- 首轮不要并列多个方法、多个定理或多个提示。',
      ].join('\n')
    : [
        '- 后续轮次继续一次只推进一小步。',
        '- 不要因为学生接近结果就直接跳到完整解法。',
        '- 如果学生在同一步连续看不懂，优先回退一层，而不是反复追问同一句话。',
      ].join('\n');

  const imageRule = options.hasImage
    ? '- 有图片时，先简短复述图中关键信息，再问一个具体问题。'
    : '';

  const geometryRule = options.geometryData
    ? '- 几何题优先引导学生观察点、线、角、相等、平行、垂直、中点等已知关系，再问方法。'
    : '';

  return `<live_response_contract>
最高优先级实时对话约束：
- 保持苏格拉底式引导，不给最终答案、完整推导、完整证明或整段标准答案。
- 每次回复结尾必须且只能有一个具体问题。
- 鼓励语要短而具体，不要长篇表扬或重复套话。
- 只给最小可行提示，让学生继续思考。
${firstTurnRules}
${imageRule}
${geometryRule}
- 如果学生直接要答案，只能简短拒绝，然后拉回一个可执行的下一步。
- 学生完成关键突破口或题目后，必须要求学生用自己的话总结这题该怎么想。
- 只有在错题、反复错题或学生暴露错误习惯时，才展开 5 Whys 深归因，并最终落到一个可执行对策。
</live_response_contract>`;
}

function buildDynamicLayer(options: PromptBuildOptions, config: SubjectConfig): string {
  const parts: string[] = [];

  if (options.hasImage) {
    parts.push(`<vision_check>
检测到图片输入。先复述你看到的关键事实或图形关系，再继续提问。
</vision_check>`);
  }

  if (options.questionContent) {
    parts.push(`<current_question>
【当前题目】${options.questionContent}
</current_question>`);
  }

  if (options.geometryData && config.specialHandlers?.formatExtraData) {
    const extraData = config.specialHandlers.formatExtraData(options.geometryData);
    if (extraData) {
      parts.push(extraData);
    }
  }

  if (options.questionType && options.questionType !== 'unknown') {
    const typeNames: Record<string, string> = {
      choice: '选择题',
      fill: '填空题',
      solution: '解答题',
      proof: '证明题',
      calculation: '计算题',
      reading: '阅读理解',
      writing: '写作',
      listening: '听力',
    };

    parts.push(`<question_type>
【题型】${typeNames[options.questionType] || options.questionType}
</question_type>`);
  }

  return parts.join('\n\n');
}

/**
 * Build the full system prompt used by the active tutoring flow.
 */
export function buildSystemPrompt(options: PromptBuildOptions): string {
  const { subject, grade, subjectConfidence, isFirstTurn } = options;

  const useSpecialist = shouldUseSpecialistMode(subject, subjectConfidence);
  const config = getSubjectConfig(useSpecialist ? subject : 'generic');

  const basePrompt = getBasePrompt();
  const firstTurnFocus = isFirstTurn ? buildFirstTurnFocus(options) : '';
  const strategyLayers = isFirstTurn
    ? [firstTurnFocus]
    : [
        getGradeRoutingBase(),
        !useSpecialist ? getGenericStrategies() : '',
        config.strategies[grade],
      ];
  const promptScaffold = strategyLayers.filter(Boolean).join('\n\n');
  const knowledgeBase = isFirstTurn ? '' : formatKnowledgeBase(config.knowledgeBase, grade);
  const examples = isFirstTurn ? '' : formatExamples(config.examples, grade);
  const dynamicLayer = buildDynamicLayer(options, config);
  const liveResponseContract = buildLiveResponseContract(options);

  return `<system_prompt>
${basePrompt}

${promptScaffold}

${knowledgeBase ? `<knowledge_base>
【仅在后续轮次按需参考的知识点】
${knowledgeBase}
</knowledge_base>` : ''}

${examples ? `<few_shot_examples>
【仅在后续轮次参考的对话示例】
${examples}
</few_shot_examples>` : ''}

${dynamicLayer}

${liveResponseContract}

<task_instruction>
你当前的执行顺序必须是：
1. 先轻诊断当前卡点，不做长篇归因。
2. 再抓一个条件、一个关系、一个步骤，推进当前问题。
3. 如果学生第一次说“看不懂 / 不会 / 没明白”，先把问题缩小一点，不要整题重启。
4. 如果学生在同一步连续第二次仍然看不懂，就回退一层，重新锚定“已知 / 所求 / 当前障碍”，并换一种更具体的表示方式。
5. 学生接近完成时，要求学生自己总结这题的关键思路。
6. 如果这是错题或反复错题，再做后置 5 Whys 深归因。
7. 最后落到一个“下次怎么避免再错”的可执行动作。

补充要求：
- 如果是数学几何题，先让学生看对象和关系，再问方法。
- 如果是语文题，先让学生回到题干关键词和文本位置。
- 如果是英语题，先让学生看局部语境、句子骨架、词性或时态信号。
- 回退时要从更小锚点重新开始，不要改成长篇讲解。
- 不要提前把整题讲完。
</task_instruction>
</system_prompt>`;
}

export function hasImageInMessages(
  messages: Array<{ role: string; content: string | unknown[] }>,
): boolean {
  return messages.some((message) => {
    if (typeof message.content === 'string') {
      return false;
    }

    if (Array.isArray(message.content)) {
      return message.content.some(
        (part: any) => part.type === 'image_url' || part.type === 'image',
      );
    }

    return false;
  });
}

export function extractImageFromMessages(
  messages: Array<{ role: string; content: string | unknown[] }>,
): string | null {
  for (const message of messages) {
    if (message.role === 'user' && Array.isArray(message.content)) {
      for (const part of message.content as any[]) {
        if (part.type === 'image_url' && part.image_url?.url) {
          return part.image_url.url;
        }
      }
    }
  }

  return null;
}
