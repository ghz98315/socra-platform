// =====================================================
// Project Socrates - AI Configuration
// =====================================================
// Domestic AI Models Configuration (DeepSeek + Qwen)

import { createOpenAI } from '@ai-sdk/openai';

// =====================================================
// DeepSeek Configuration (Logic Brain)
// =====================================================
// Models:
// - deepseek-chat: Standard chat model
// - deepseek-reasoner: R1 reasoning model
export const deepseekProvider = createOpenAI({
  baseURL: process.env.AI_BASE_URL_LOGIC || 'https://api.deepseek.com/v1',
  apiKey: process.env.AI_API_KEY_LOGIC || '',
});

// =====================================================
// Qwen Configuration (Vision Eyes)
// =====================================================
// Model: qwen-vl-max
export const qwenProvider = createOpenAI({
  baseURL: process.env.AI_BASE_URL_VISION || 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: process.env.AI_API_KEY_VISION || '',
});

// =====================================================
// Model Instances
// =====================================================
export const logicModel = deepseekProvider('deepseek-chat');
export const reasoningModel = deepseekProvider('deepseek-reasoner');
export const visionModel = qwenProvider('qwen-vl-max');

// =====================================================
// Type Definitions
// =====================================================
export type AIModelType = 'logic' | 'reasoning' | 'vision';

export interface AIConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}
