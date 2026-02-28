// =====================================================
// Project Socrates - Clear Chat History API
// 清除对话历史并重新初始化
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';

// 与主 chat API 共享的对话历史缓存
// 注意：这里需要导入同一个 Map 实例
declare global {
  var conversationHistory: Map<string, Array<{ role: string; content: string }>>;
}

// 如果全局缓存不存在，初始化它
if (!globalThis.conversationHistory) {
  globalThis.conversationHistory = new Map();
}

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
      composite: '组合图形',
    };
    geometryDescription = `
【几何图形信息】
图形类型：${typeNames[geometryData.type] || geometryData.type}
顶点：${geometryData.points?.map((p: any) => p.name).join('、') || '未知'}
线段：${geometryData.lines?.map((l: any) => l.id).join('、') || '未知'}
${geometryData.relations?.length > 0 ? `关系：${geometryData.relations.map((r: any) => {
  const relationNames: Record<string, string> = {
    perpendicular: '垂直',
    parallel: '平行',
    congruent: '全等',
    similar: '相似',
  };
  return `${r.targets.join('与')}${relationNames[r.type] || r.type}`;
}).join('、')}` : ''}
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

  return basePrompt;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      sessionId,
      newSessionId,
      theme = 'junior',
      subject,
      questionContent,
      geometryData,
    } = body;

    // 删除旧的会话历史
    if (sessionId && globalThis.conversationHistory.has(sessionId)) {
      globalThis.conversationHistory.delete(sessionId);
    }

    // 创建新的会话历史，包含几何数据
    if (newSessionId) {
      globalThis.conversationHistory.set(newSessionId, [
        { role: 'system', content: getSystemPrompt(theme, subject, questionContent, geometryData) },
      ]);
    }

    return NextResponse.json({
      success: true,
      message: '对话历史已清除，新会话已创建',
      newSessionId,
    });
  } catch (error: any) {
    console.error('Clear history API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '清除历史失败',
    }, { status: 500 });
  }
}
