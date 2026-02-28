// =====================================================
// Project Socrates - Geometry Parse API
// 几何图形解析API：从OCR文本中提取几何数据
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';

const AI_URL = process.env.AI_API_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

interface GeometryParseResponse {
  success: boolean;
  geometry?: {
    type: 'triangle' | 'quadrilateral' | 'circle' | 'line' | 'angle' | 'composite' | 'unknown';
    points: Array<{
      id: string;
      name: string;
      x: number;
      y: number;
    }>;
    lines: Array<{
      id: string;
      start: string;
      end: string;
      type: 'line' | 'segment' | 'ray';
    }>;
    circles: Array<{
      id: string;
      center: string;
      radius?: number;
      pointOnCircle?: string;
    }>;
    angles: Array<{
      id: string;
      vertex: string;
      point1: string;
      point2: string;
      value?: number;
      showArc: boolean;
    }>;
    labels: Array<{
      targetId: string;
      text: string;
      position?: 'top' | 'bottom' | 'left' | 'right';
    }>;
    relations: Array<{
      type: 'perpendicular' | 'parallel' | 'congruent' | 'similar' | 'tangent';
      targets: string[];
    }>;
    confidence: number;
  };
  error?: string;
}

const GEOMETRY_PARSE_PROMPT = `你是一个几何图形精确绘制专家。请根据题目描述生成精确的几何图形坐标。

【重要：坐标系统规则】
- 使用数学坐标系：X轴向右为正，Y轴向上为正
- 矩形的顶点按顺时针或逆时针顺序排列
- 通常将图形中心放在原点(0,0)附近
- 坐标范围建议在 -8 到 8 之间

【输出格式】
{
  "type": "triangle|quadrilateral|circle|composite|unknown",
  "points": [
    {"id": "A", "name": "A", "x": 0, "y": 4}
  ],
  "lines": [
    {"id": "AB", "start": "A", "end": "B", "type": "segment"}
  ],
  "circles": [],
  "angles": [
    {"id": "angleA", "vertex": "A", "point1": "B", "point2": "C", "value": 90, "showArc": true}
  ],
  "labels": [
    {"targetId": "A", "text": "A", "position": "top"}
  ],
  "relations": [],
  "confidence": 0.95
}

═══════════════════════════════════════════════════════════
【关键规则：点必须精确放置】
═══════════════════════════════════════════════════════════

【规则1：矩形坐标计算】
矩形ABCD，按顺时针方向：
- A在左上，B在右上，C在右下，D在左下
- 假设宽为w，高为h，中心在原点：
  A = (-w/2, h/2)
  B = (w/2, h/2)
  C = (w/2, -h/2)
  D = (-w/2, -h/2)
- 示例：矩形ABCD，AB=6，BC=4
  A = (-3, 2), B = (3, 2), C = (3, -2), D = (-3, -2)

【规则2：边上的点必须精确计算】
- "E为AD边上一点" → E的x坐标必须与A、D相同！
- "E为AB边上一点" → E的y坐标必须与A、B相同！
- 示例：矩形ABCD，A(-3,2), D(-3,-2)，E在AD上且AE:ED=1:2
  E = (-3, 2 + (2-(-2)) × 1/3) = (-3, 2/3)
  注意：E的x坐标必须是-3，与A、D相同！

【规则3：垂足坐标计算】
- CF ⊥ BE，F是垂足
- 需要计算F的坐标使CF垂直于BE
- 使用向量点积为0来验证垂直

【规则4：中点坐标】
- D是BC的中点 → D = ((Bx+Cx)/2, (By+Cy)/2)

【规则5：特殊三角形】
- 直角三角形：直角顶点放在方便计算的位置
- 等腰三角形：底边水平，顶点在垂直平分线上
- 等边三角形：底边水平，顶点y = 底边长度 × √3/2

═══════════════════════════════════════════════════════════
【完整示例1：矩形带辅助点】
═══════════════════════════════════════════════════════════

输入："如图，在矩形ABCD中，E为AD边上一点，连接BE，若BE = BC，过C作CF ⊥ BE交BE于点F"

分析：
1. 矩形ABCD：设宽8高6
   - A(-4, 3), B(4, 3), C(4, -3), D(-4, -3)
2. E在AD上：E的x=-4，设E在AD的上1/3处
   - E = (-4, 3 - 6/3) = (-4, 1)
3. F是BE上的一点，CF垂直于BE
   - BE向量 = (4-(-4), 3-1) = (8, 2)
   - 需要计算F使CF⊥BE

输出：
{
  "type": "composite",
  "points": [
    {"id": "A", "name": "A", "x": -4, "y": 3},
    {"id": "B", "name": "B", "x": 4, "y": 3},
    {"id": "C", "name": "C", "x": 4, "y": -3},
    {"id": "D", "name": "D", "x": -4, "y": -3},
    {"id": "E", "name": "E", "x": -4, "y": 1},
    {"id": "F", "name": "F", "x": 2.4, "y": 2.1}
  ],
  "lines": [
    {"id": "AB", "start": "A", "end": "B", "type": "segment"},
    {"id": "BC", "start": "B", "end": "C", "type": "segment"},
    {"id": "CD", "start": "C", "end": "D", "type": "segment"},
    {"id": "DA", "start": "D", "end": "A", "type": "segment"},
    {"id": "BE", "start": "B", "end": "E", "type": "segment"},
    {"id": "CF", "start": "C", "end": "F", "type": "segment"}
  ],
  "circles": [],
  "angles": [
    {"id": "angleA", "vertex": "A", "point1": "B", "point2": "D", "value": 90, "showArc": true},
    {"id": "angleB", "vertex": "B", "point1": "A", "point2": "C", "value": 90, "showArc": true},
    {"id": "angleC", "vertex": "C", "point1": "B", "point2": "D", "value": 90, "showArc": true},
    {"id": "angleD", "vertex": "D", "point1": "A", "point2": "C", "value": 90, "showArc": true},
    {"id": "angleCFB", "vertex": "F", "point1": "C", "point2": "B", "value": 90, "showArc": true}
  ],
  "labels": [
    {"targetId": "A", "text": "A", "position": "left"},
    {"targetId": "B", "text": "B", "position": "top"},
    {"targetId": "C", "text": "C", "position": "right"},
    {"targetId": "D", "text": "D", "position": "left"},
    {"targetId": "E", "text": "E", "position": "left"},
    {"targetId": "F", "text": "F", "position": "top"}
  ],
  "relations": [
    {"type": "perpendicular", "targets": ["AB", "BC"]},
    {"type": "perpendicular", "targets": ["CF", "BE"]}
  ],
  "confidence": 0.9
}

═══════════════════════════════════════════════════════════
【完整示例2：三角形带中线】
═══════════════════════════════════════════════════════════

输入："如图，在△ABC中，AB=AC，D是BC的中点，AD是中线"

输出：
{
  "type": "triangle",
  "points": [
    {"id": "A", "name": "A", "x": 0, "y": 4},
    {"id": "B", "name": "B", "x": -3, "y": -2},
    {"id": "C", "name": "C", "x": 3, "y": -2},
    {"id": "D", "name": "D", "x": 0, "y": -2}
  ],
  "lines": [
    {"id": "AB", "start": "A", "end": "B", "type": "segment"},
    {"id": "BC", "start": "B", "end": "C", "type": "segment"},
    {"id": "CA", "start": "C", "end": "A", "type": "segment"},
    {"id": "AD", "start": "A", "end": "D", "type": "segment"}
  ],
  "circles": [],
  "angles": [],
  "labels": [
    {"targetId": "A", "text": "A", "position": "top"},
    {"targetId": "B", "text": "B", "position": "bottom"},
    {"targetId": "C", "text": "C", "position": "bottom"},
    {"targetId": "D", "text": "D", "position": "bottom"}
  ],
  "relations": [],
  "confidence": 0.95
}

═══════════════════════════════════════════════════════════
【完整示例3：直角三角形】
═══════════════════════════════════════════════════════════

输入："如图，Rt△ABC中，∠C=90°，AC=3，BC=4"

输出：
{
  "type": "triangle",
  "points": [
    {"id": "A", "name": "A", "x": 0, "y": 3},
    {"id": "B", "name": "B", "x": 4, "y": 0},
    {"id": "C", "name": "C", "x": 0, "y": 0}
  ],
  "lines": [
    {"id": "AB", "start": "A", "end": "B", "type": "segment"},
    {"id": "BC", "start": "B", "end": "C", "type": "segment"},
    {"id": "CA", "start": "C", "end": "A", "type": "segment"}
  ],
  "circles": [],
  "angles": [
    {"id": "angleC", "vertex": "C", "point1": "A", "point2": "B", "value": 90, "showArc": true}
  ],
  "labels": [
    {"targetId": "A", "text": "A", "position": "left"},
    {"targetId": "B", "text": "B", "position": "right"},
    {"targetId": "C", "text": "C", "position": "bottom"}
  ],
  "relations": [
    {"type": "perpendicular", "targets": ["CA", "CB"]}
  ],
  "confidence": 0.95
}

═══════════════════════════════════════════════════════════

【输出检查清单】
1. □ 矩形顶点是否按顺序排列？
2. □ 边上的点的坐标是否正确（x或y与边的端点相同）？
3. □ 中点坐标是否正确？
4. □ 垂直关系的坐标是否满足垂直条件？
5. □ 直角是否标记了90度？
6. □ 所有辅助线是否都添加了？
7. □ 标签位置是否合理？

只返回JSON，不要有其他文字。`;

export async function POST(req: NextRequest): Promise<NextResponse<GeometryParseResponse>> {
  try {
    const body = await req.json();
    const { text, subject } = body as { text?: string; subject?: string };

    if (!text) {
      return NextResponse.json({
        success: false,
        error: '缺少题目文本',
      }, { status: 400 });
    }

    console.log('Geometry API received text:', text.substring(0, 200));

    // 检查是否是几何相关题目 - 扩展关键词列表
    const geometryKeywords = [
      // 基本图形
      '△', '三角形', '四边形', '矩形', '正方形', '圆', '直径', '半径',
      '圆心', '切线', '弦', '弧', '扇形', '菱形', '平行四边形', '梯形',
      // 点和线
      '∠', '角', '线段', '直线', '射线', '点A', '点B', '点C', '点D', '点O',
      // 关系
      '垂直', '平行', '全等', '相似', '相交', '中点', '垂线', '高', '中线',
      // 图形描述
      '如图', '⊙', '⊙O', 'ABCD', 'AB=', 'BC=', 'CD=', 'DA=',
      // 常见字母组合
      'AB', 'BC', 'CD', 'DA', 'AC', 'BD', 'OA', 'OB', 'OC', 'OD',
      // 角度相关
      '度', '∠A', '∠B', '∠C', '∠D', '90°', '60°', '45°', '30°',
      // 其他几何术语
      '对角线', '周长', '面积', '勾股', '斜边', '直角边', '等腰', '等边'
    ];

    const hasGeometryContent = geometryKeywords.some(keyword => text.includes(keyword));
    console.log('Has geometry content:', hasGeometryContent, 'Keywords found:',
      geometryKeywords.filter(k => text.includes(k)));

    if (!hasGeometryContent) {
      console.log('No geometry keywords found, returning unknown');
      return NextResponse.json({
        success: true,
        geometry: {
          type: 'unknown',
          points: [],
          lines: [],
          circles: [],
          angles: [],
          labels: [],
          relations: [],
          confidence: 0,
        },
      });
    }

    const apiKey = process.env.AI_API_KEY_LOGIC || process.env.DASHSCOPE_API_KEY || process.env.AI_API_KEY;

    if (!apiKey) {
      console.error('Geometry API: No AI API key configured');
      return NextResponse.json({
        success: false,
        error: 'AI服务未配置，请检查环境变量 AI_API_KEY_LOGIC 或 DASHSCOPE_API_KEY',
      }, { status: 500 });
    }

    // 调用AI解析几何图形
    console.log('Calling AI for geometry parsing...');
    const response = await fetch(AI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-plus',
        messages: [
          {
            role: 'system',
            content: GEOMETRY_PARSE_PROMPT,
          },
          {
            role: 'user',
            content: `请分析以下题目中的几何图形：\n\n${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI parse error:', response.status, errorText);
      return NextResponse.json({
        success: false,
        error: `AI解析失败(${response.status}): ${errorText.substring(0, 200)}`,
      }, { status: 500 });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    console.log('AI response content:', content.substring(0, 500));

    // 尝试解析JSON
    let geometry;
    try {
      // 提取JSON部分（可能被markdown包裹）
      let jsonStr = content.trim();
      if (jsonStr.includes('```json')) {
        jsonStr = jsonStr.match(/```json\s*([\s\S]*?)\s*```/)?.[1] || jsonStr;
      } else if (jsonStr.includes('```')) {
        jsonStr = jsonStr.match(/```\s*([\s\S]*?)\s*```/)?.[1] || jsonStr;
      }
      console.log('Parsing JSON:', jsonStr.substring(0, 300));

      geometry = JSON.parse(jsonStr);
      console.log('Parsed geometry type:', geometry.type);
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError.message, 'Content:', content.substring(0, 500));
      return NextResponse.json({
        success: false,
        error: `图形数据解析失败: ${parseError.message}`,
      }, { status: 500 });
    }

    // 验证并补充默认值
    geometry = {
      type: geometry.type || 'unknown',
      points: geometry.points || [],
      lines: geometry.lines || [],
      circles: geometry.circles || [],
      angles: geometry.angles || [],
      labels: geometry.labels || [],
      relations: geometry.relations || [],
      confidence: geometry.confidence || 0.5,
    };

    return NextResponse.json({
      success: true,
      geometry,
    });

  } catch (error: any) {
    console.error('Geometry parse API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || '图形解析失败',
    }, { status: 500 });
  }
}

// GET endpoint - 获取服务状态
export async function GET() {
  const hasAIKey = !!(process.env.AI_API_KEY_LOGIC || process.env.DASHSCOPE_API_KEY || process.env.AI_API_KEY);

  return NextResponse.json({
    config: {
      provider: hasAIKey ? 'qwen-plus' : 'unavailable',
      method: hasAIKey ? '通义千问 (云端)' : '未配置',
      available: hasAIKey,
    },
  });
}
