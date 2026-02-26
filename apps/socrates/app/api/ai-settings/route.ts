// =====================================================
// Project Socrates - AI Model Settings API
// AI 模型设置 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { AVAILABLE_MODELS, getDefaultModel } from '@/lib/ai-models/config';
import type { UserModelPreference } from '@/lib/ai-models/types';

// 模拟存储（实际应使用数据库）
const userPreferences: Map<string, UserModelPreference> = new Map();

// GET - 获取用户模型偏好和可用模型列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const user_id = searchParams.get('user_id');

    // 获取可用模型列表
    const models = AVAILABLE_MODELS.filter(m => m.enabled);

    // 获取用户偏好
    let preference = user_id ? userPreferences.get(user_id) : null;

    if (!preference && user_id) {
      // 返回默认偏好
      const defaultChat = getDefaultModel('chat');
      const defaultVision = getDefaultModel('vision');
      const defaultReasoning = getDefaultModel('reasoning');

      preference = {
        user_id,
        chat_model: defaultChat.id,
        vision_model: defaultVision.id,
        reasoning_model: defaultReasoning.id,
        updated_at: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      data: {
        models,
        preference: preference || null,
      },
    });
  } catch (error: any) {
    console.error('AI Settings GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 更新用户模型偏好
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, chat_model, vision_model, reasoning_model } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 验证模型 ID 是否有效
    const validModelIds = AVAILABLE_MODELS.filter(m => m.enabled).map(m => m.id);

    const preference: UserModelPreference = {
      user_id,
      chat_model: validModelIds.includes(chat_model) ? chat_model : getDefaultModel('chat').id,
      vision_model: validModelIds.includes(vision_model) ? vision_model : getDefaultModel('vision').id,
      reasoning_model: validModelIds.includes(reasoning_model) ? reasoning_model : getDefaultModel('reasoning').id,
      updated_at: new Date().toISOString(),
    };

    userPreferences.set(user_id, preference);

    return NextResponse.json({
      success: true,
      data: preference,
    });
  } catch (error: any) {
    console.error('AI Settings POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
