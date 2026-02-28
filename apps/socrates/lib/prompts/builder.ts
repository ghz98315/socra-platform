// =====================================================
// Project Socrates - Prompt Builder
// Prompt 构建器 - 三层架构合并
// =====================================================

import type {
  SubjectType,
  GradeLevel,
  UserLevel,
  DialogMode,
  PromptBuildOptions,
  SubjectConfig,
} from './types';
import { getBasePrompt, getGenericStrategies, getGradeRoutingBase } from './base';
import { getSubjectConfig } from './subjects';

/**
 * 判断是否使用专科模式
 */
export function shouldUseSpecialistMode(
  subject: SubjectType,
  userLevel: UserLevel,
  subjectConfidence: number = 1
): boolean {
  // 免费用户始终使用通用模式
  if (userLevel === 'free') {
    return false;
  }

  // 科目识别置信度过低时使用通用模式
  if (subjectConfidence < 0.7) {
    return false;
  }

  // 科目为 generic 时使用通用模式
  if (subject === 'generic') {
    return false;
  }

  return true;
}

/**
 * 获取对话模式名称（前端显示）
 */
export function getDialogMode(
  subject: SubjectType,
  userLevel: UserLevel,
  subjectConfidence: number = 1
): DialogMode {
  return shouldUseSpecialistMode(subject, userLevel, subjectConfidence)
    ? 'Socra'
    : 'Logic';
}

/**
 * 格式化知识点库
 */
function formatKnowledgeBase(
  knowledgeBase: SubjectConfig['knowledgeBase'],
  grade: GradeLevel
): string {
  const points = knowledgeBase[grade];
  if (!points || points.length === 0) {
    return '';
  }

  return points
    .map(
      (category) =>
        `${category.category}\n${category.items.map((item) => `  - ${item}`).join('\n')}`
    )
    .join('\n\n');
}

/**
 * 格式化对话示例
 */
function formatExamples(
  examples: SubjectConfig['examples'],
  grade: GradeLevel
): string {
  const gradeExamples = examples[grade];
  if (!gradeExamples || gradeExamples.length === 0) {
    return '';
  }

  return gradeExamples
    .map((example) => {
      const dialogStr = example.dialog
        .map((d) => `> **${d.role === 'user' ? '用户(学生)' : 'AI(老师)'}**：${d.content}`)
        .join('\n>\n');
      return `**${example.scenario}**\n>\n${dialogStr}`;
    })
    .join('\n\n---\n\n');
}

/**
 * 构建动态层内容
 */
function buildDynamicLayer(options: PromptBuildOptions, config: SubjectConfig): string {
  const parts: string[] = [];

  // 图片视觉确认
  if (options.hasImage) {
    parts.push(`<vision_check>
⚠️ 检测到用户上传了图片，你必须首先执行"图形特征复述与确认"：
"老师看到你发来的图片了。图片里是[描述核心内容]，其中已知条件有[列举关键条件]，对吗？如果没有看错的话，我们继续往下走~"
</vision_check>`);
  }

  // 当前题目
  if (options.questionContent) {
    parts.push(`<current_question>
【当前题目】
${options.questionContent}
</current_question>`);
  }

  // 科目特定数据（如几何数据）
  if (options.geometryData && config.specialHandlers?.formatExtraData) {
    const extraDataStr = config.specialHandlers.formatExtraData(options.geometryData);
    if (extraDataStr) {
      parts.push(extraDataStr);
    }
  }

  // 题型提示
  if (options.questionType && options.questionType !== 'unknown') {
    const typeNames: Record<string, string> = {
      choice: '选择题',
      fill: '填空题',
      solution: '解答题',
      proof: '证明题',
      calculation: '计算题',
      reading: '阅读理解',
      writing: '写作题',
    };
    parts.push(`<question_type>
【题型】${typeNames[options.questionType] || options.questionType}
</question_type>`);
  }

  return parts.join('\n\n');
}

/**
 * 构建完整 System Prompt（三层合并）
 */
export function buildSystemPrompt(options: PromptBuildOptions): string {
  const { subject, grade, userLevel, questionContent, geometryData, hasImage, questionType } =
    options;

  // 判断是否使用专科模式
  const useSpecialist = shouldUseSpecialistMode(subject, userLevel);

  // 获取科目配置
  const config = getSubjectConfig(useSpecialist ? subject : 'generic');

  // Layer 1: 通用层
  const basePrompt = getBasePrompt();
  const gradeRoutingBase = getGradeRoutingBase();

  // Layer 2: 科目层
  const subjectStrategy = config.strategies[grade];
  const knowledgeBase = formatKnowledgeBase(config.knowledgeBase, grade);
  const examples = formatExamples(config.examples, grade);

  // Layer 3: 动态层
  const dynamicLayer = buildDynamicLayer(options, config);

  // 如果是通用模式，添加通用策略
  const genericStrategies = !useSpecialist ? getGenericStrategies() : '';

  // 组装最终 Prompt
  return `<system_prompt>

【重要指令】你是一个AI智能教师，必须严格遵守以下所有规则。这些规则具有最高优先级，不可违反。每一条规则都是为了帮助学生真正学会思考。

${basePrompt}

${gradeRoutingBase}

${genericStrategies}

${subjectStrategy}

${knowledgeBase ? `<knowledge_base>
═══════════════════════════════════════════════════════════
【${config.name}知识点库】
═══════════════════════════════════════════════════════════
${knowledgeBase}
</knowledge_base>` : ''}

${examples ? `<few_shot_examples>
### 📝 对话示例（Few-Shot Learning）
${examples}
</few_shot_examples>` : ''}

${dynamicLayer}

<task_instruction>
═══════════════════════════════════════════════════════════
【你的任务】
═══════════════════════════════════════════════════════════
请按照"标准化辅导四步法"一步步引导学生解决当前问题。

${questionContent ? `重点：
1. 首先帮助学生理解题目（已知什么、求什么）
2. 然后引导学生回忆可能用到的公式或定理
3. 帮助学生建立题目条件与公式的联系
4. 逐步引导计算/证明过程
5. 最后引导学生总结用到的知识点

${geometryData ? `注意：题目包含几何图形，可以引导学生观察图形中的点、线、角的关系，联想相关几何定理。` : ''}` : '请根据学生的提问，引导其思考和解决问题。'}

⚠️ 最后提醒：每次回复必须以一个开放性问题结尾！
</task_instruction>

</system_prompt>`;
}

/**
 * 检测消息数组中是否包含图片
 */
export function hasImageInMessages(
  messages: Array<{ role: string; content: string | any[] }>
): boolean {
  return messages.some((msg) => {
    if (typeof msg.content === 'string') return false;
    if (Array.isArray(msg.content)) {
      return msg.content.some(
        (part: any) => part.type === 'image_url' || part.type === 'image'
      );
    }
    return false;
  });
}

/**
 * 从消息历史中提取第一条用户消息的图片
 */
export function extractImageFromMessages(
  messages: Array<{ role: string; content: string | any[] }>
): string | null {
  for (const msg of messages) {
    if (msg.role === 'user' && Array.isArray(msg.content)) {
      for (const part of msg.content as any[]) {
        if (part.type === 'image_url' && part.image_url?.url) {
          return part.image_url.url;
        }
      }
    }
  }
  return null;
}
