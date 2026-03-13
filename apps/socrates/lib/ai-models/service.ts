import { getDefaultModel, getModelById } from './config';
import type { AIModelConfig, ModelPurpose, ModelResponse } from './types';

const userPreferencesCache = new Map<
  string,
  { chat: string; vision: string; reasoning: string }
>();

export async function getUserModelPreference(
  userId: string,
  purpose: ModelPurpose
): Promise<AIModelConfig> {
  const cached = userPreferencesCache.get(userId);

  if (cached) {
    const cachedModel = getModelById(cached[purpose]);
    if (cachedModel?.enabled) {
      return cachedModel;
    }
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const response = await fetch(`${baseUrl}/api/ai-settings?user_id=${userId}`);

    if (response.ok) {
      const result = await response.json();
      const preference = result.data?.preference;

      if (preference) {
        userPreferencesCache.set(userId, {
          chat: preference.chat_model,
          vision: preference.vision_model,
          reasoning: preference.reasoning_model,
        });

        const modelId = preference[`${purpose}_model` as const];
        const selectedModel = getModelById(modelId);
        if (selectedModel?.enabled) {
          return selectedModel;
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch user model preference:', error);
  }

  return getDefaultModel(purpose);
}

export async function callAIModel(
  model: AIModelConfig,
  messages: Array<{ role: string; content: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
    images?: string[];
  }
): Promise<ModelResponse> {
  const apiKey = process.env[model.api_key_env];

  if (!apiKey || apiKey === 'your-api-key-here') {
    return {
      success: false,
      error: `API key not configured for model ${model.name}`,
    };
  }

  try {
    const requestMessages: Array<Record<string, unknown>> = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    if (options?.images?.length) {
      const lastMessage = requestMessages[requestMessages.length - 1];
      if (lastMessage?.role === 'user') {
        lastMessage.content = [
          { type: 'text', text: String(lastMessage.content ?? '') },
          ...options.images.map((image) => ({
            type: 'image_url',
            image_url: {
              url: image.startsWith('data:') ? image : `data:image/jpeg;base64,${image}`,
            },
          })),
        ];
      }
    }

    const requestBody = {
      model: model.model_id,
      messages: requestMessages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? model.max_tokens,
    };

    const response = await fetch(`${model.base_url}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API Error: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      content: data.choices?.[0]?.message?.content || '',
      model: model.id,
      tokens_used: {
        input: data.usage?.prompt_tokens || 0,
        output: data.usage?.completion_tokens || 0,
      },
    };
  } catch (error: any) {
    console.error('AI model call failed:', error);
    return {
      success: false,
      error: error?.message || 'AI model call failed',
    };
  }
}

export async function callChatModel(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<ModelResponse> {
  const model = await getUserModelPreference(userId, 'chat');
  return callAIModel(model, messages, options);
}

export async function callVisionModel(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  images: string[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<ModelResponse> {
  const model = await getUserModelPreference(userId, 'vision');
  return callAIModel(model, messages, { ...options, images });
}

export async function callReasoningModel(
  userId: string,
  messages: Array<{ role: string; content: string }>,
  options?: { temperature?: number; maxTokens?: number }
): Promise<ModelResponse> {
  const model = await getUserModelPreference(userId, 'reasoning');
  return callAIModel(model, messages, options);
}

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

export function clearUserPreferenceCache(userId?: string) {
  if (userId) {
    userPreferencesCache.delete(userId);
    return;
  }

  userPreferencesCache.clear();
}
