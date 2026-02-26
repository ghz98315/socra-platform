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
                text: `请仔细识别这张图片中的所有文字内容。

要求：
1. 准确识别图片中的所有文字，包括数学公式、符号等
2. 保持原有的排版和格式
3. 如果是数学题目，请保留数学符号和公式
4. 如果有图片或图表，请简单描述
5. 只输出识别到的文字内容，不要添加任何解释
6. 空格就是普通空格，不要用$或其他符号表示空格
7. 直接输出原始文字，不要添加任何格式化符号

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
