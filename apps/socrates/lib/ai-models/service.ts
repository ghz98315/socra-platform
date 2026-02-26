// =====================================================
// Project Socrates - AI Model Service
// AI 模型调用服务 - 统一接口调用不同 AI 模型
// =====================================================

import { AVAILABLE_MODELS, getModelById, getDefaultModel } from './config';
import type { AIModelConfig, ModelPurpose, ModelResponse } from './types';

// 模拟用户偏好存储（实际应从数据库获取）
const userPreferencesCache = new Map<string, { chat: string; vision: string; reasoning: string }>();

// 获取用户模型偏好
export async function getUserModelPreference(
  userId: string,
  purpose: ModelPurpose
): Promise<AIModelConfig> {
  // 先检查缓存
  const cached = userPreferencesCache.get(userId);

  if (cached) {
    const modelId = cached[purpose];
    const model = getModelById(modelId);
    if (model && model.enabled) {
      return model;
    }
  }

  // 从 API 获取用户偏好
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/ai-settings?user_id=${userId}`);
    if (response.ok) {
      const result = await response.json();
      if (result.data?.preference) {
        const pref = result.data.preference;
        userPreferencesCache.set(userId, {
          chat: pref.chat_model,
          vision: pref.vision_model,
          reasoning: pref.reasoning_model,
        });

        const modelId = pref[`${purpose}_model`];
        const model = getModelById(modelId);
        if (model && model.enabled) {
          return model;
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch user model preference:', error);
  }

  // 返回默认模型
  return getDefaultModel(purpose);
}

// 调用 AI 模型
export async function callAIModel(
  model: AIModelConfig,
  messages: Array<{ role: string; content: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
    images?: string[]; // Base64 encoded images for vision models
  }
): Promise<ModelResponse> {
  const apiKey = process.env[model.api_key_env];

  if (!apiKey || apiKey === 'your-api-key-here') {
    return {
      success: false,
      error: `API Key not configured for model ${model.name}`,
    };
  }

  try {
    // 构建请求体
    const requestBody: any = {
      model: model.model_id,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? model.max_tokens,
    };

    // 如果有图片，添加到消息中
    if (options?.images && options.images.length > 0) {
      const lastMessage = requestBody.messages[requestBody.messages.length - 1];
      if (lastMessage.role === 'user') {
        lastMessage.content = [
          { type: 'text', text: lastMessage.content },
          ...options.images.map(img => ({
            type: 'image_url',
            image_url: { url: img.startsWith('data:') ? img : `data:image/jpeg;base64,${img}` },
          })),
        ];
      }
    }

    const response = await fetch(`${model.base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI API Error (${model.provider}):`, errorText);
      return {
        success: false,
        error: `API Error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      content: data.choices[0]?.message?.content || '',
      model: model.id,
      tokens_used: {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0,
      },
    };
  } catch (error: any) {
    console.error('AI Model call failed:', error);
    return {
      success: false,
      error: error.message || 'AI 模型调用失败',
    };
  }
}

// 便捷方法：调用聊天模型
export async function callChatModel(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<ModelResponse> {
  const model = await getUserModelPreference(userId, 'chat');
  return callAIModel(model, messages, options);
}

// 便捷方法：调用视觉模型
export async function callVisionModel(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  images: string[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<ModelResponse> {
  const model = await getUserModelPreference(userId, 'vision');
  return callAIModel(model, messages, { ...options, images });
}

// 便捷方法：调用推理模型
export async function callReasoningModel(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<ModelResponse> {
  const model = await getUserModelPreference(userId, 'reasoning');
  return callAIModel(model, messages, options);
}

// 直接使用指定模型 ID 调用
export async function callModelById(
  modelId: string,
  messages: Array<{ role: string; content: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
    images?: string[];
  }
): Promise<ModelResponse> {
  const model = getModelById(modelId);
  if (!model) {
    return { success: false, error: `Model not found: ${modelId}` };
  }
  if (!model.enabled) {
    return { success: false, error: `Model is disabled: ${modelId}` };
  }
  return callAIModel(model, messages, options);
}

// 清除用户偏好缓存
export function clearUserPreferenceCache(userId?: string) {
  if (userId) {
    userPreferencesCache.delete(userId);
  } else {
    userPreferencesCache.clear();
  }
}
