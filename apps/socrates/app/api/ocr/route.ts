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
                text: `请仔细识别这张图片中的所有文字内容，完全按照原图格式输出。

【重要：不要使用 LaTeX 或任何公式格式！】

【符号输出规范】
- 乘号：用 ×（不要用 \\times 或 *）
- 除号：用 ÷（不要用 \\div）
- 分数：用 a/b 格式（不要用 \\frac{}{}）
- 根号：用 √（不要用 \\sqrt{}）
- 平方/立方：用 x²、x³（不要用 x^2）
- 角度：用 ∠ 和 °
- 等于：用 =
- 约等于：用 ≈
- 不等号：用 ≠、<、>、≤、≥

【示例】
- 正确输出：60/x - 60/2x = 3
- 错误输出：$\\frac{60}{x}-\\frac{60}{2x}=3$

【要求】
1. 完全按照原图的文字和格式输出
2. 不要添加任何 $ 符号
3. 不要使用 LaTeX 格式
4. 保持原有换行和排版
5. 只输出识别到的内容，不要解释

请直接输出识别结果：`,
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
