// =====================================================
// Project Socrates - AI Chat API
// Integrated with Multi-Model Support
// =====================================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { callModelById } from '@/lib/ai-models/service';
import { getDefaultModel } from '@/lib/ai-models/config';

// 创建 Supabase 服务端客户端（使用 service_role 绕过 RLS）
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;
function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }
    supabaseAdminInstance = createClient(url, key);
  }
  return supabaseAdminInstance;
}

// 对话历史存储（开发环境使用内存存储）
const conversationHistory = new Map<string, Array<{role: string; content: string}>>();

// 通用 AI 模型调用
async function callAIModel(
  messages: Array<{role: string; content: string}>,
  modelId?: string,
  isReasoning: boolean = false
): Promise<string> {
  // 确定使用的模型
  let targetModelId = modelId;

  if (!targetModelId) {
    // 根据是否需要推理选择默认模型
    const defaultModel = getDefaultModel(isReasoning ? 'reasoning' : 'chat');
    targetModelId = defaultModel.id;
  }

  // 使用模型服务调用
  const result = await callModelById(targetModelId, messages, {
    temperature: isReasoning ? 0.3 : 0.7,
    maxTokens: isReasoning ? 4096 : 2048,
  });

  if (!result.success) {
    throw new Error(result.error || 'AI 模型调用失败');
  }

  return result.content || '';
}

// 苏格拉底式教学系统提示词
function getSystemPrompt(theme: 'junior' | 'senior', subject?: string, questionContent?: string, geometryData?: any): string {
  const basePrompt = `你是苏格拉底，一位古希腊哲学家，专门用提问的方式帮助学生自己思考出答案。

【核心原则】
1. 永不直接给出答案，而是通过提问引导学生
2. 每次只问一个问题，让学生专注思考
3. 问题要具体，不能太抽象
4. 适时给出一小步提示，让学生有方向感
5. 学生的任何思路都值得肯定，然后引导深入

【提问技巧】
- 不要问"你知道为什么吗？"这种空泛问题
- 要问具体问题，如"题目中哪个数字最大？"
- 可以提供选项引导，如"是用加法还是乘法比较好？"
- 给出半开放问题，如"如果A=3，那么B会是什么？"

【渐进式引导】
第一轮：找出题目关键信息
第二轮：确定解题方向（公式/方法）
第三轮：引导列出算式/步骤
第四轮：验证结果是否合理

${theme === 'junior' ? `
【小学生模式】
- 语言：口语化，像朋友聊天
- 举例：用买东西、分水果等生活例子
- 鼓励：多夸奖，用🌟✨💪表情
- 进度：慢一点，每步确认理解了再继续
` : `
【中学生模式】
- 语言：专业但易懂
- 方法：引导分析题目类型、解题思路
- 深度：可以问"为什么""怎么样""如果...会..."
- 逻辑：培养完整推理链条
`}
`;

  // 构建几何图形描述
  let geometryDescription = '';
  if (geometryData && geometryData.type !== 'unknown') {
    const typeNames: Record<string, string> = {
      triangle: '三角形',
      quadrilateral: '四边形',
      circle: '圆',
      function: '函数图象',
      composite: '组合图形',
    };

    // 构建条件描述
    const conditions: string[] = [];
    if (geometryData.conditions) {
      if (geometryData.conditions.lengths?.length) {
        conditions.push(`长度：${geometryData.conditions.lengths.join('、')}`);
      }
      if (geometryData.conditions.angles?.length) {
        conditions.push(`角度：${geometryData.conditions.angles.join('、')}`);
      }
      if (geometryData.conditions.ratios?.length) {
        conditions.push(`比例：${geometryData.conditions.ratios.join('、')}`);
      }
      if (geometryData.conditions.parallels?.length) {
        conditions.push(`平行：${geometryData.conditions.parallels.join('、')}`);
      }
      if (geometryData.conditions.perpendiculars?.length) {
        conditions.push(`垂直：${geometryData.conditions.perpendiculars.join('、')}`);
      }
      if (geometryData.conditions.midpoints?.length) {
        conditions.push(`中点：${geometryData.conditions.midpoints.join('、')}`);
      }
      if (geometryData.conditions.functions?.length) {
        conditions.push(`函数：${geometryData.conditions.functions.join('、')}`);
      }
      if (geometryData.conditions.others?.length) {
        conditions.push(`其他：${geometryData.conditions.others.join('、')}`);
      }
    }

    // 构建曲线描述
    let curvesDesc = '';
    if (geometryData.curves?.length > 0) {
      curvesDesc = geometryData.curves.map((c: any) => {
        const typeNames: Record<string, string> = {
          inverse_proportional: '反比例函数',
          linear: '一次函数',
          quadratic: '二次函数',
        };
        return `${typeNames[c.type] || c.type} ${c.equation}`;
      }).join('、');
    }

    geometryDescription = `
【几何图形信息】
图形类型：${typeNames[geometryData.type] || geometryData.type}
顶点：${geometryData.points?.map((p: any) => `${p.name}(${p.x.toFixed(1)},${p.y.toFixed(1)})`).join('、') || '未知'}
线段：${geometryData.lines?.map((l: any) => l.id).join('、') || '未知'}
${curvesDesc ? `曲线：${curvesDesc}` : ''}
${geometryData.relations?.length > 0 ? `关系：${geometryData.relations.map((r: any) => {
  const relationNames: Record<string, string> = {
    perpendicular: '垂直',
    parallel: '平行',
    congruent: '全等',
    similar: '相似',
    tangent: '相切',
    intersect: '相交',
    midpoint: '中点',
  };
  return `${r.targets.join('与')}${relationNames[r.type] || r.type}`;
}).join('、')}` : ''}
${conditions.length > 0 ? `已知条件：\n${conditions.map(c => `  - ${c}`).join('\n')}` : ''}
`;
  }

  if (questionContent) {
    return `${basePrompt}

【当前题目】
${questionContent}
${geometryDescription}
【任务】
请引导学生分析这道题，从读题→找条件→定方法→列算式→验答案，一步步引导。${geometryDescription ? '题目包含几何图形，可以引导学生观察图形中的点和线的关系。' : ''}
每次回应包含：
1. 简短肯定（"很好""对""这个思路不错"）
2. 一个具体的引导问题`;
  }

  if (subject) {
    return `${basePrompt}
当前学科：${subject}，请根据该学科特点调整引导方式。`;
  }

  return basePrompt;
}

// 改进的预设回应逻辑 - 跟踪对话进度，提供渐进式引导
function generateImprovedMockResponse(
  userMessage: string,
  theme: 'junior' | 'senior',
  history: Array<{role: string; content: string}>,
  questionContent?: string
): string {
  const userMessageCount = history.filter(m => m.role === 'user').length;
  const lowerMessage = userMessage.toLowerCase();

  const askingForAnswer = /答案|结果|对不对|是多少|怎么做/.test(lowerMessage);
  const givingSolution = /我觉得|我认为|应该是|我想|第一步|首先|用.*?方法|先算|然后|最后/.test(lowerMessage);
  const confused = /不懂|不会|不知道|太难了|不明白/.test(lowerMessage);

  // 分析题目内容以提供更具体的引导
  const questionInfo = analyzeQuestion(questionContent);

  if (confused) {
    if (theme === 'junior') {
      return `没关系，让我帮你拆解这道题！😊

${questionInfo.hasNumbers ? `题目里的数字：${questionInfo.numbers}` : ''}
${questionInfo.hasShapes ? `图形：${questionInfo.shapes}` : ''}

第一步：${questionInfo.whatToFind ? `题目要算"${questionInfo.whatToFind}"` : `先告诉我题目在问什么？`}`;
    }
    return `理解题目是关键。让我帮你梳理：

${questionInfo.summary || '请告诉我：题目给了哪些条件？要求解决什么？'}`;
  }

  if (askingForAnswer) {
    return `不能直接给答案哦！但我可以引导你：

${getSpecificHint(questionContent, theme)}

告诉我你的思路，我们一起推导。`;
  }

  // 用户给出方案时的回应 - 关键改进点
  if (givingSolution) {
    // 提取用户方案中的关键信息
    const userPlan = extractPlanFromMessage(userMessage);

    return `${theme === 'junior' ? `很好的想法！✨` : `思路清晰。`}

${userPlan ? `你的方案是：${userPlan}` : ''}

接下来：${getNextAction(userMessageCount, questionContent, theme)}`;
  }

  // 根据对话轮次提供渐进式引导
  if (userMessageCount === 1) {
    return `你好！${theme === 'junior' ? `🌟` : ``}

我们来看看这道题。

${questionInfo.question ? `题目求：${questionInfo.question}` : ''}
${questionInfo.hasNumbers ? `已知：${questionInfo.numbers}` : ''}

第一问：${questionInfo.whatToFind ? `怎么求${questionInfo.whatToFind}？` : `解题目标是什么？`}`;
  }

  if (userMessageCount === 2) {
    return `好的，我们确定了方向。

下一步：${getStep2Action(questionContent, theme)}

告诉我具体怎么做？`;
  }

  if (userMessageCount === 3) {
    return `继续！

具体步骤：${getStep3Action(questionContent, theme)}

把算式列出来看看？`;
  }

  if (userMessageCount === 4) {
    return `算完了吗？${theme === 'junior' ? `🎯` : ``}

最后：${getStep4Action(questionContent, theme)}

结果合理吗？`;
  }

  // 后续轮次
  return `${theme === 'junior' ? `继续加油！💪` : `继续。`}

${getNextStepQuestion(questionContent, theme, userMessageCount)}`;
}

// 提取用户的方案/想法
function extractPlanFromMessage(message: string): string {
  // 提取用户提到的数字、运算、方法
  const hasNumber = /\d+/.test(message);
  const hasOperation = /[+\-×÷加减少乘除]/.test(message);
  const hasMethod = /用|公式|定理|方法|设|列方程/.test(message);

  if (hasNumber && hasOperation) {
    return `你提到了计算，很棒！`;
  }
  if (hasMethod) {
    return `你选择了方法，继续！`;
  }
  return '';
}

// 根据进度给出下一步行动指示
function getNextAction(count: number, content: string | undefined, theme: 'junior' | 'senior'): string {
  if (count <= 2) {
    return getStep2Action(content, theme);
  } else if (count === 3) {
    return getStep3Action(content, theme);
  } else if (count >= 4) {
    return getStep4Action(content, theme);
  }
  return '继续下一步...';
}

// 第2步行动
function getStep2Action(content: string | undefined, theme: 'junior' | 'senior'): string {
  if (!content) return '确定用什么公式或方法？';

  if (/∠|度数/.test(content)) return '确定用哪个角度定理？内角和？外角？';
  if (/方程|未知数/.test(content)) return '设谁为x？找出等量关系';
  if (/面积/.test(content)) return '面积公式是什么？需要哪些数据？';
  if (/速度|路程/.test(content)) return '用哪个公式？路程=速度×时间';

  return '确定解题公式';
}

// 第3步行动
function getStep3Action(content: string | undefined, theme: 'junior' | 'senior'): string {
  if (!content) return '列出具体算式或步骤';

  if (/∠|度数/.test(content)) return '列出角度计算式，如：∠A = 180° - ∠B - ∠C';
  if (/方程/.test(content)) return '列出方程：... = ...，然后求解';
  if (/面积/.test(content)) return '代入数据计算，注意单位';

  return theme === 'junior' ? '现在开始计算' : '列出完整算式';
}

// 第4步行动
function getStep4Action(content: string | undefined, theme: 'junior' | 'senior'): string {
  if (!content) return '验证结果是否正确';

  return '把结果代入原题检验一下，看是否符合题意？';
}

// 分析题目内容
function analyzeQuestion(content: string | undefined) {
  if (!content) {
    return {
      hasNumbers: false,
      hasShapes: false,
      question: '',
      questionType: '',
      whatToFind: '',
      keyCondition: '',
      methodSuggestion: '',
      calculationHint: '',
      theoreticalHint: '',
      directionHint: '',
      numbers: '',
      shapes: '',
      summary: ''
    };
  }

  // 提取数字
  const numbers = content.match(/\d+\.?\d*/g) || [];
  const hasNumbers = numbers.length > 0;

  // 检测图形
  const shapes = [];
  if (/三角形|△|ABC/.test(content)) shapes.push('三角形');
  if (/圆|⊙|O/.test(content)) shapes.push('圆');
  if (/正方形|矩形|□|ABCD/.test(content)) shapes.push('四边形');
  const hasShapes = shapes.length > 0;

  // 检测问题类型
  let questionType = '';
  if (/求.*?度数|角度|∠/.test(content)) questionType = '角度计算';
  else if (/方程|解|未知数|x|y/.test(content)) questionType = '方程求解';
  else if (/面积|周长|体积/.test(content)) questionType = '几何计算';
  else if (/速度|时间|距离|路程/.test(content)) questionType = '应用题';
  else if (/比例|百分比|%/.test(content)) questionType = '比例问题';

  // 找出求解目标
  const whatToFindMatch = content.match(/求[^(，。！？\n)]+/);
  const whatToFind = whatToFindMatch ? whatToFindMatch[0].replace('求', '') : '';

  // 关键条件
  const keyConditionMatch = content.match(/已知.*?[：:]/);
  const keyCondition = keyConditionMatch ? keyConditionMatch[0] : '';

  return {
    hasNumbers,
    hasShapes,
    question: whatToFind,
    questionType,
    whatToFind,
    keyCondition,
    methodSuggestion: getMethodSuggestion(content, questionType),
    calculationHint: getCalculationHint(content, questionType),
    theoreticalHint: getTheoreticalHint(content, questionType),
    directionHint: getDirectionHint(content, questionType),
    numbers: hasNumbers ? numbers.join(', ') : '',
    shapes: hasShapes ? shapes.join('、') : '',
    summary: hasNumbers ? `题目包含数字：${numbers.join('、')}` : ''
  };
}

function getMethodSuggestion(content: string, type: string): string {
  if (type === '角度计算') return '角度问题通常用到三角形内角和、外角定理等';
  if (type === '方程求解') return '方程题需要设未知数、列等式';
  if (type === '几何计算') return '几何计算需要用面积或周长公式';
  return '仔细审题，找出数量关系';
}

function getCalculationHint(content: string, type: string): string {
  if (type === '角度计算') return '角度通常是度数相加等于180°（三角形内角和）';
  if (type === '几何计算') return '注意单位，可能需要换算';
  return '确定用加法、减法、乘法还是除法';
}

function getTheoreticalHint(content: string, type: string): string {
  if (type === '角度计算') return '三角形内角和定理、外角定理、圆周角定理';
  if (type === '方程求解') return '等量关系、等式性质';
  if (type === '几何计算') return '面积公式、周长公式、勾股定理';
  return '建立数学模型，找出等量关系';
}

function getDirectionHint(content: string, type: string): string {
  if (type === '角度计算') return '从已知角度入手，利用角度关系求解';
  if (type === '方程求解') return '设未知数，根据题意列方程';
  if (type === '几何计算') return '画出图形，标注已知量，应用公式';
  return '画图辅助理解，找出数量之间的相等或不等关系';
}

function getNextStepQuestion(content: string | undefined, theme: 'junior' | 'senior', count: number): string {
  if (!content) {
    return theme === 'junior'
      ? '接下来你打算怎么做？'
      : '你的下一步计划是什么？';
  }

  const questions = [
    `你觉得这道题的第一步应该做什么？`,
    `需要用到什么公式或方法？`,
    `把你的想法列出来看看？`,
    `算式怎么列？`,
    `算出来的结果合理吗？怎么验证？`
  ];

  return questions[count % questions.length];
}

// 根据题目内容生成具体提示
function getHint(questionContent: string | undefined, theme: 'junior' | 'senior', messageCount: number): string {
  if (!questionContent) {
    return theme === 'junior'
      ? '把题目再读一遍，找出最重要的信息'
      : '重新审视题目，确定解题目标和已知条件';
  }

  // 数学题 - 角度问题
  if (/∠|度数|角/.test(questionContent)) {
    const angleHints = [
      '三角形三个内角加起来是多少度？这是解题的关键',
      '有没有等腰三角形？等腰三角形的底角有什么特点？',
      '有没有外角？外角等于不相邻的两个内角之和',
      '如果是圆，圆周角定理会不会用到？',
    ];
    return angleHints[messageCount % angleHints.length];
  }

  // 数学题 - 方程问题
  if (/方程|未知数|x|y|解/.test(questionContent)) {
    const equationHints = [
      '先设哪个量为x？通常设所求量为x',
      '题目中有哪些等量关系？把它们写成等式',
      '题目中有没有"是""等于""相当于"这些关键词？',
      '能不能用列表法表示数量关系？',
    ];
    return equationHints[messageCount % equationHints.length];
  }

  // 数学题 - 几何计算
  if (/面积|周长|体积|表面积/.test(questionContent)) {
    const geometryHints = [
      '这个图形的面积公式是什么？',
      '题目要求的是哪一部分的面积？可能需要做减法',
      '单位统一吗？注意单位换算',
      '有没有需要添加辅助线？',
    ];
    return geometryHints[messageCount % geometryHints.length];
  }

  // 数学题 - 比例/百分比
  if (/比例|%|百分数|比/.test(questionContent)) {
    const ratioHints = [
      '设单位"1"，找到对应的量',
      '是谁是谁的百分之几？画图帮助理解',
      '比例式怎么列？a:b = c:d',
      '注意区分"是""比""占"',
    ];
    return ratioHints[messageCount % ratioHints.length];
  }

  // 数学题 - 应用题（速度、时间、路程）
  if (/速度|时间|路程|距离/.test(questionContent)) {
    const speedHints = [
      '路程 = 速度 × 时间，这个公式用得上吗？',
      '是相遇问题还是追及问题？画线段图分析',
      '有没有"同时""相向""同向"这些关键词？',
      '单位是小时还是分钟？要统一哦',
    ];
    return speedHints[messageCount % speedHints.length];
  }

  // 语文阅读理解
  if (/语文|阅读|理解|概括|中心/.test(questionContent)) {
    const chineseHints = [
      '文章第一段或最后一段通常包含中心思想',
      '注意重复出现的关键词，它们往往揭示主题',
      '作者的情感态度是什么？从哪些词语看出来的？',
      '用"谁+在什么情况下+做了什么+结果怎样"来概括',
    ];
    return chineseHints[messageCount % chineseHints.length];
  }

  // 英语题
  if (/英语|English|翻译|填空/.test(questionContent)) {
    const englishHints = [
      '时态：看时间状语，yesterday用过去时，tomorrow用将来时',
      '主语是单数第三人称，动词要加s/es',
      '固定搭配：look forward to doing, enjoy doing等',
      '被动语态：be + done，判断主被动关系',
    ];
    return englishHints[messageCount % englishHints.length];
  }

  // 通用提示
  const generalHints = [
    '把题目分成"已知""要求""怎么做"三部分来看',
    '有没有隐含条件？题目没说但默认成立的条件',
    '和类似的题目比较，它们有什么相同和不同',
    '能不能用更简单的方法？',
  ];

  return generalHints[messageCount % generalHints.length];
}

// 获取具体提示（新函数）
function getSpecificHint(questionContent: string | undefined, theme: 'junior' | 'senior'): string {
  if (!questionContent) {
    return '仔细读题目，找出最关键的数字和关系';
  }

  // 分析题目给出非常具体的提示
  if (/∠.*?∠.*?求.*?∠/.test(questionContent)) {
    return '多个角的问题，考虑：①三角形内角和=180° ②外角=两内角之和 ③等角等边等腰';
  }

  if (/AB.*?AC.*?AD.*?BD/.test(questionContent)) {
    return '这是几何题，标记：AB=AC说明是等腰三角形，底角相等，这可能是突破口';
  }

  if (/x.*?\+.*?=.*?\d+/.test(questionContent)) {
    return '方程提示：把含有x的项放一边，常数项放另一边，注意移项变号';
  }

  // 根据数字给出提示
  const numbers = questionContent.match(/\d+/g);
  if (numbers && numbers.length >= 2) {
    const numCount = numbers.length;
    if (numCount === 2) {
      return `两个数字${numbers.join('和')}，考虑它们之间的运算关系（加减乘除）`;
    }
    if (numCount >= 3) {
      return `有${numCount}个数字，可能需要分步计算，先算哪一步？`;
    }
  }

  return theme === 'junior'
    ? '先找出题目给了哪些条件，再看要求什么'
    : '分析已知条件和求解目标之间的桥梁是什么';
}

// POST endpoint - AI 对话
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      message,
      sessionId,
      session_id,
      theme = 'junior',
      subject,
      questionContent,
      geometryData,   // 新增：几何图形数据
      modelId,        // 可选：用户指定的模型 ID
      useReasoning,   // 可选：是否使用推理模型
      userId,         // 可选：用户 ID（用于获取模型偏好）
    } = body;

    if (!message) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
    }

    // 检查是否配置了任意 API Key
    const hasApiKey = (process.env.AI_API_KEY_LOGIC && process.env.AI_API_KEY_LOGIC !== 'your-api-key-here') ||
                      (process.env.AI_API_KEY_VISION && process.env.AI_API_KEY_VISION !== 'your-api-key-here') ||
                      (process.env.DASHSCOPE_API_KEY && process.env.DASHSCOPE_API_KEY !== 'your-api-key-here');

    console.log('Chat API - hasApiKey:', hasApiKey);
    console.log('Chat API - geometryData:', geometryData ? JSON.stringify(geometryData).substring(0, 200) : 'null');
    console.log('Chat API - questionContent:', questionContent?.substring(0, 100));

    // 获取或创建对话历史（内存）
    const historySessionId = sessionId || session_id;

    if (!conversationHistory.has(historySessionId)) {
      conversationHistory.set(historySessionId, [
        { role: 'system', content: getSystemPrompt(theme, subject, questionContent, geometryData) },
      ]);
    }

    const history = conversationHistory.get(historySessionId)!;
    history.push({ role: 'user', content: message });

    let responseText: string;

    if (hasApiKey) {
      // 使用多模型 AI 服务
      console.log('Using AI Model Service, modelId:', modelId || 'default');
      try {
        responseText = await callAIModel(history, modelId, useReasoning);
      } catch (apiError: any) {
        console.error('AI API Error, falling back to mock:', apiError.message);
        responseText = generateImprovedMockResponse(message, theme, history, questionContent);
      }
    } else {
      // 使用改进的预设回应
      console.log('Using fallback mock response mode');
      responseText = generateImprovedMockResponse(message, theme, history, questionContent);
    }

    // 添加助手响应到历史（内存）
    history.push({ role: 'assistant', content: responseText });

    // 保存对话消息到 Supabase（如果提供了 session_id）
    if (session_id) {
      try {
        const supabase = getSupabaseAdmin();
        // 保存用户消息
        await (supabase as any)
          .from('chat_messages')
          .insert({
            session_id: session_id,
            role: 'user',
            content: message,
            created_at: new Date().toISOString(),
          });

        // 保存助手消息
        await (supabase as any)
          .from('chat_messages')
          .insert({
            session_id: session_id,
            role: 'assistant',
            content: responseText,
            created_at: new Date().toISOString(),
          });

        console.log('Chat messages saved to Supabase, session:', session_id);
      } catch (error) {
        console.error('Failed to save chat to Supabase:', error);
        // 不影响主流程，继续返回
      }
    }

    return NextResponse.json({
      content: responseText,
      done: true,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'AI 对话失败' },
      { status: 500 }
    );
  }
}

// DELETE endpoint - 清除对话历史
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const sessionId = searchParams.get('sessionId');

    if (sessionId) {
      conversationHistory.delete(sessionId);
    } else {
      conversationHistory.clear();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: '清除历史失败' }, { status: 500 });
  }
}

// GET endpoint - 获取对话历史
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }

  const history = conversationHistory.get(sessionId) || [];

  return NextResponse.json({
    history: history.filter((msg) => msg.role !== 'system'),
  });
}
