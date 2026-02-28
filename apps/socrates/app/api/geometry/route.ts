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

const GEOMETRY_PARSE_PROMPT = `你是一个几何图形分析专家。请分析题目描述中的几何图形，提取出图形的结构信息。

【任务】
分析以下题目文本，识别其中描述的几何图形，返回JSON格式的图形数据。

【输出格式】
{
  "type": "triangle|quadrilateral|circle|line|angle|composite|unknown",
  "points": [
    {"id": "A", "name": "A", "x": 0, "y": 4}
  ],
  "lines": [
    {"id": "AB", "start": "A", "end": "B", "type": "segment"}
  ],
  "circles": [
    {"id": "O", "center": "O", "radius": 3}
  ],
  "angles": [
    {"id": "angleA", "vertex": "A", "point1": "B", "point2": "C", "value": 60, "showArc": true}
  ],
  "labels": [
    {"targetId": "A", "text": "A", "position": "top"}
  ],
  "relations": [
    {"type": "perpendicular", "targets": ["AB", "BC"]}
  ],
  "confidence": 0.9
}

【坐标系统】
- 使用标准笛卡尔坐标系
- 坐标范围建议在 -10 到 10 之间
- 三角形默认：A(0,4), B(-3,-2), C(3,-2) 为等腰三角形
- 正方形/矩形：边与坐标轴平行或成角度

【识别规则】
1. type 类型：
   - triangle: 三角形（包括等腰、等边、直角、一般三角形）
   - quadrilateral: 四边形（包括正方形、矩形、平行四边形、梯形、菱形）
   - circle: 圆相关（圆、圆弧、扇形）
   - line: 线段、直线、射线
   - angle: 角度相关
   - composite: 组合图形（包含多个基本图形）
   - unknown: 无法识别

2. points 点：
   - 大写字母命名（A, B, C, D, O, P, Q等）
   - 坐标要合理，使图形可见
   - 圆心通常用O表示

3. lines 线段：
   - type: segment(线段), line(直线), ray(射线)
   - start/end 是点的id

4. circles 圆：
   - center 是圆心的点id
   - radius 是半径数值，或者 pointOnCircle 是圆上的点id

5. angles 角：
   - vertex 是角的顶点id
   - point1, point2 是角两边上的点
   - value 是角度值（如果题目中给出）
   - showArc 是否显示角弧

6. relations 关系：
   - perpendicular: 垂直
   - parallel: 平行
   - congruent: 全等
   - similar: 相似
   - tangent: 相切

【示例输入1】
"如图，在△ABC中，AB=AC，∠BAC=120°，D是BC的中点。"

【示例输出1】
{
  "type": "triangle",
  "points": [
    {"id": "A", "name": "A", "x": 0, "y": 3},
    {"id": "B", "name": "B", "x": -3, "y": -1},
    {"id": "C", "name": "C", "x": 3, "y": -1},
    {"id": "D", "name": "D", "x": 0, "y": -1}
  ],
  "lines": [
    {"id": "AB", "start": "A", "end": "B", "type": "segment"},
    {"id": "BC", "start": "B", "end": "C", "type": "segment"},
    {"id": "CA", "start": "C", "end": "A", "type": "segment"},
    {"id": "AD", "start": "A", "end": "D", "type": "segment"}
  ],
  "circles": [],
  "angles": [
    {"id": "angleA", "vertex": "A", "point1": "B", "point2": "C", "value": 120, "showArc": true}
  ],
  "labels": [
    {"targetId": "A", "text": "A", "position": "top"},
    {"targetId": "B", "text": "B", "position": "bottom"},
    {"targetId": "C", "text": "C", "position": "bottom"},
    {"targetId": "D", "text": "D", "position": "bottom"}
  ],
  "relations": [
    {"type": "congruent", "targets": ["AB", "AC"]}
  ],
  "confidence": 0.85
}

【示例输入2】
"如图，AB是圆O的直径，点C在圆上，∠ACB=90°"

【示例输出2】
{
  "type": "circle",
  "points": [
    {"id": "O", "name": "O", "x": 0, "y": 0},
    {"id": "A", "name": "A", "x": -3, "y": 0},
    {"id": "B", "name": "B", "x": 3, "y": 0},
    {"id": "C", "name": "C", "x": 2, "y": 2.24}
  ],
  "lines": [
    {"id": "AB", "start": "A", "end": "B", "type": "segment"},
    {"id": "AC", "start": "A", "end": "C", "type": "segment"},
    {"id": "CB", "start": "C", "end": "B", "type": "segment"}
  ],
  "circles": [
    {"id": "circleO", "center": "O", "radius": 3}
  ],
  "angles": [
    {"id": "angleC", "vertex": "C", "point1": "A", "point2": "B", "value": 90, "showArc": true}
  ],
  "labels": [
    {"targetId": "O", "text": "O", "position": "bottom"},
    {"targetId": "A", "text": "A", "position": "left"},
    {"targetId": "B", "text": "B", "position": "right"},
    {"targetId": "C", "text": "C", "position": "top"}
  ],
  "relations": [],
  "confidence": 0.9
}

【示例输入3】
"如图，矩形ABCD中，AB=6，BC=4"

【示例输出3】
{
  "type": "quadrilateral",
  "points": [
    {"id": "A", "name": "A", "x": -3, "y": 2},
    {"id": "B", "name": "B", "x": 3, "y": 2},
    {"id": "C", "name": "C", "x": 3, "y": -2},
    {"id": "D", "name": "D", "x": -3, "y": -2}
  ],
  "lines": [
    {"id": "AB", "start": "A", "end": "B", "type": "segment"},
    {"id": "BC", "start": "B", "end": "C", "type": "segment"},
    {"id": "CD", "start": "C", "end": "D", "type": "segment"},
    {"id": "DA", "start": "D", "end": "A", "type": "segment"}
  ],
  "circles": [],
  "angles": [
    {"id": "angleA", "vertex": "A", "point1": "B", "point2": "D", "value": 90, "showArc": false},
    {"id": "angleB", "vertex": "B", "point1": "A", "point2": "C", "value": 90, "showArc": false},
    {"id": "angleC", "vertex": "C", "point1": "B", "point2": "D", "value": 90, "showArc": false},
    {"id": "angleD", "vertex": "D", "point1": "A", "point2": "C", "value": 90, "showArc": false}
  ],
  "labels": [
    {"targetId": "A", "text": "A", "position": "top"},
    {"targetId": "B", "text": "B", "position": "top"},
    {"targetId": "C", "text": "C", "position": "bottom"},
    {"targetId": "D", "text": "D", "position": "bottom"}
  ],
  "relations": [
    {"type": "perpendicular", "targets": ["AB", "BC"]},
    {"type": "parallel", "targets": ["AB", "CD"]},
    {"type": "parallel", "targets": ["BC", "DA"]}
  ],
  "confidence": 0.95
}

【注意事项】
1. 如果题目没有图形描述，返回 type: "unknown" 和 confidence: 0
2. 坐标要合理分布，图形不能太小或太大
3. 如果提到"如图"，即使没有详细描述，也尝试推测常见图形
4. 特殊三角形：等腰(AB=AC)、等边(AB=BC=CA)、直角(有90度角)
5. 圆的半径要适中，点要在合适位置

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

    // 检查是否是几何相关题目
    const geometryKeywords = ['△', '三角形', '四边形', '矩形', '正方形', '圆', '直径', '半径',
      '圆心', '切线', '弦', '弧', '∠', '角', '垂直', '平行', '全等', '相似', 'AB', 'BC', 'CD',
      '如图', '⊙', '⊙O', '点A', '点B', '点C', '中点', '垂线', '高'];

    const hasGeometryContent = geometryKeywords.some(keyword => text.includes(keyword));

    if (!hasGeometryContent) {
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

    const apiKey = process.env.AI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'AI服务未配置',
      }, { status: 500 });
    }

    // 调用AI解析几何图形
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
      console.error('AI parse error:', errorText);
      return NextResponse.json({
        success: false,
        error: `AI解析失败: ${response.status}`,
      }, { status: 500 });
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';

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

      geometry = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError, 'Content:', content);
      return NextResponse.json({
        success: false,
        error: '图形数据解析失败',
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
  const hasAIKey = !!process.env.AI_API_KEY;

  return NextResponse.json({
    config: {
      provider: hasAIKey ? 'qwen-plus' : 'unavailable',
      method: hasAIKey ? '通义千问 (云端)' : '未配置',
      available: hasAIKey,
    },
  });
}
