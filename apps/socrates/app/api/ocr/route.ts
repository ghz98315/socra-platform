// =====================================================
// Project Socrates - Cloud OCR API (通义千问 VL)
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';

const QWEN_VL_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

interface OCRResponse {
  success: boolean;
  text?: string;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<OCRResponse>> {
  try {
    const body = await req.json();
    const { image } = body as { image?: string };

    if (!image) {
      return NextResponse.json({
        success: false,
        error: '缺少图片数据',
      }, { status: 400 });
    }

    const apiKey = process.env.AI_API_KEY_VISION;

    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OCR 服务未配置',
      }, { status: 500 });
    }

    // 使用通义千问 VL 进行 OCR
    const response = await fetch(QWEN_VL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'qwen-vl-max',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${image}`,
                },
              },
              {
                type: 'text',
                text: `你是一个专业的数学题目OCR识别助手。请识别图片中的【数学题目文字部分】。

═══════════════════════════════════════
【识别范围界定 - 非常重要！】
═══════════════════════════════════════

✅ 需要识别的内容：
1. 题目的已知条件（如"如图，反比例函数y=k/x的图象经过点A(1,3)..."）
2. 问题部分（如"则k=______。"）
3. 题号（如"1."、"第1题"）
4. 选择题的选项（A. B. C. D.）
5. 题目中的表格数据

❌ 不需要识别的内容（必须忽略）：
1. 界面上的按钮文字（如"题目识别"、"AI识别"、"确认"、"上传图片"等）
2. 界面上的标签和提示（如"云识别"、"服务可用"等状态提示）
3. 几何图形上的点标记字母（图形中的A、B、C等字母标记）
4. 几何图形上的线段标注（如标注在图形边的长度数字）
5. 图形本身（三角形、圆、曲线等）- 只识别文字，不描述图形
6. 任何界面元素的名称

【识别截止点】
- 题目通常以句号"。"、问号"？"或下划线"______"结束
- 遇到界面按钮或状态提示时停止识别
- 只输出题目本身的文字内容

═══════════════════════════════════════
【初中数学符号输出规范】
═══════════════════════════════════════

【重要：不要使用 LaTeX 或任何公式格式！绝对不要出现 $ 符号！】

【1. 基本运算符号】
┌─────────┬─────────┬─────────────────────┐
│  符号   │  名称   │    禁止使用的格式    │
├─────────┼─────────┼─────────────────────┤
│   +     │  加号   │                     │
│   -     │  减号   │                     │
│   ×     │  乘号   │  \\times, *         │
│   ÷     │  除号   │  \\div              │
│   =     │  等号   │                     │
│   ≠     │  不等号 │  \\neq              │
│   ≈     │  约等号 │  \\approx           │
│   ±     │  正负号 │  \\pm               │
│   >     │  大于   │                     │
│   <     │  小于   │                     │
│   ≥     │ 大于等于│  \\geq, >=          │
│   ≤     │ 小于等于│  \\leq, <=          │
└─────────┴─────────┴─────────────────────┘

【2. 分数与比例】
- 分数用斜线格式：a/b，如 1/2, 3/4, (x+1)/2
- 禁止使用：\\frac{a}{b}, {a\over b}

【3. 幂与根号】
┌─────────┬─────────┬─────────────────────┐
│  符号   │  示例   │    禁止使用的格式    │
├─────────┼─────────┼─────────────────────┤
│   ²     │  x²     │  x^2, \\sq          │
│   ³     │  x³     │  x^3                │
│   ⁿ     │  xⁿ     │  x^n                │
│   √     │  √2     │  \\sqrt{2}          │
│   ∛     │  ∛8     │  \\sqrt[3]{8}       │
└─────────┴─────────┴─────────────────────┘

【4. 几何符号（重要！）】
┌─────────┬─────────┬─────────────────────┐
│  符号   │  名称   │    禁止使用的格式    │
├─────────┼─────────┼─────────────────────┤
│   ∠     │  角     │  \\angle            │
│   ∟     │  直角   │                     │
│   △     │ 三角形  │  \\triangle         │
│   □     │  四边形 │                     │
│   ◇     │  菱形   │                     │
│   ○     │   圆    │                     │
│   ∥     │  平行   │  \\parallel         │
│   ∦     │ 不平行  │                     │
│   ⊥     │  垂直   │  \\perp             │
│   ≌     │  全等   │  \\cong             │
│   ∽     │  相似   │  \\sim              │
│   ⌒     │   弧    │                     │
│   °     │   度    │  ^\\circ            │
│   ′     │   分    │                     │
│   ″     │   秒    │                     │
│   ∵     │  因为   │  \\because          │
│   ∴     │  所以   │  \\therefore        │
└─────────┴─────────┴─────────────────────┘

【5. 全等与相似三角形表示法】
- 全等：△ABC ≌ △DEF
- 相似：△ABC ∽ △DEF
- 对应边：AB = DE, BC = EF
- 对应角：∠A = ∠D

【6. 其他常用符号】
┌─────────┬─────────┬─────────────────────┐
│  符号   │  名称   │    禁止使用的格式    │
├─────────┼─────────┼─────────────────────┤
│   |x|   │ 绝对值  │  \\left|x\\right|   │
│   π     │ 圆周率  │  \\pi               │
│   °C    │ 摄氏度  │                     │
│   %     │ 百分号  │                     │
│   ‰     │ 千分号  │                     │
│   ∈     │  属于   │  \\in               │
│   ∉     │ 不属于  │  \\notin            │
│   ⊆     │ 包含于  │  \\subseteq         │
│   ∪     │  并集   │  \\cup              │
│   ∩     │  交集   │  \\cap              │
│   ∅     │  空集   │  \\emptyset         │
└─────────┴─────────┴─────────────────────┘

═══════════════════════════════════════
【正确示例 vs 错误示例】
═══════════════════════════════════════

例1 - 分数方程：
✅ 正确：60/x - 60/2x = 3
❌ 错误：$\\frac{60}{x}-\\frac{60}{2x}=3$

例2 - 复杂分数：
✅ 正确：(x+1)/2 + 5/3 = 1
❌ 错误：$\\frac{x+1}{2} + \\frac{5}{3} = 1$

例2 - 全等三角形：
✅ 正确：△ABC ≌ △DEF
❌ 错误：\\triangle ABC \\cong \\triangle DEF

例3 - 相似三角形：
✅ 正确：△ABC ∽ △DEF，相似比为 2:3
❌ 错误：\\triangle ABC \\sim \\triangle DEF

例4 - 几何证明：
✅ 正确：∵ AB = AC，∴ △ABC 是等腰三角形
❌ 错误：\\because AB = AC, \\therefore \\triangle ABC...

例5 - 角度：
✅ 正确：∠A = 60°，∠B = 30°
❌ 错误：\\angle A = 60^\\circ

例6 - 垂直与平行：
✅ 正确：AB ⊥ CD，EF ∥ GH
❌ 错误：AB \\perp CD, EF \\parallel GH

例7 - 二次方程：
✅ 正确：x² + 2x + 1 = 0
❌ 错误：x^2 + 2x + 1 = 0

例8 - 根号：
✅ 正确：√(x² + y²) = 5
❌ 错误：\\sqrt{x^2 + y^2} = 5

═══════════════════════════════════════

【输出要求】
1. 只输出题目文字内容，忽略界面元素和图形标记
2. 完全按照原图的文字和格式输出
3. 绝对不要出现 $ 符号
4. 绝对不要使用 LaTeX 格式（\\frac, \\sqrt, \\angle 等）
5. 保持原有换行和排版
6. 只输出识别到的内容，不要解释
7. 如果图片包含多个区域，只输出主要题目区域的文字

请直接输出题目文字识别结果：`,
              },
            ],
          },
        ],
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Qwen VL OCR error:', errorText);
      return NextResponse.json({
        success: false,
        error: `OCR 服务错误: ${response.status}`,
      }, { status: 500 });
    }

    const result = await response.json();
    const recognizedText = result.choices?.[0]?.message?.content || '';

    if (!recognizedText.trim()) {
      return NextResponse.json({
        success: false,
        error: '未能识别到文字内容',
      });
    }

    return NextResponse.json({
      success: true,
      text: recognizedText.trim(),
    });

  } catch (error: any) {
    console.error('OCR API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'OCR 处理失败',
    }, { status: 500 });
  }
}

// GET endpoint - 获取 OCR 配置状态
export async function GET() {
  const hasVisionKey = !!process.env.AI_API_KEY_VISION;

  return NextResponse.json({
    config: {
      provider: hasVisionKey ? 'qwen-vl' : 'unavailable',
      method: hasVisionKey ? '通义千问 VL (云端)' : '未配置',
      available: hasVisionKey,
    },
  });
}
