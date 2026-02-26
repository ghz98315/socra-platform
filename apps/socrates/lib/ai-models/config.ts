// =====================================================
// Project Socrates - AI Model Definitions
// AI 模型配置定义
// =====================================================

import type { AIModelConfig } from './types';

// 可用的 AI 模型列表
export const AVAILABLE_MODELS: AIModelConfig[] = [
  // ============ DeepSeek 模型 ============
  {
    id: 'deepseek-chat',
    provider: 'deepseek',
    name: 'DeepSeek Chat',
    description: 'DeepSeek 对话模型，适合日常对话和基础问答',
    model_id: 'deepseek-chat',
    base_url: 'https://api.deepseek.com/v1',
    api_key_env: 'AI_API_KEY_LOGIC',
    max_tokens: 4096,
    supports: ['chat'],
    features: ['对话', '问答', '苏格拉底引导'],
    pricing: { input: 0.001, output: 0.002 },
    enabled: false, // 需要配置 API Key
  },
  {
    id: 'deepseek-reasoner',
    provider: 'deepseek',
    name: 'DeepSeek Reasoner',
    description: 'DeepSeek 推理模型，适合复杂数学物理题目',
    model_id: 'deepseek-reasoner',
    base_url: 'https://api.deepseek.com/v1',
    api_key_env: 'AI_API_KEY_LOGIC',
    max_tokens: 8192,
    supports: ['reasoning', 'chat'],
    features: ['深度推理', '数学计算', '物理解题'],
    pricing: { input: 0.002, output: 0.004 },
    enabled: false, // 需要配置 API Key
  },

  // ============ 通义千问 模型 ============
  {
    id: 'qwen-turbo',
    provider: 'qwen',
    name: '通义千问 Turbo',
    description: '阿里云通义千问，快速响应，适合日常对话',
    model_id: 'qwen-turbo',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api_key_env: 'DASHSCOPE_API_KEY',
    max_tokens: 4096,
    supports: ['chat'],
    features: ['对话', '中文优化', '快速响应'],
    pricing: { input: 0.002, output: 0.006 },
    recommended: true,
    enabled: true,
  },
  {
    id: 'qwen-plus',
    provider: 'qwen',
    name: '通义千问 Plus',
    description: '通义千问增强版，更强理解和生成能力',
    model_id: 'qwen-plus',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api_key_env: 'DASHSCOPE_API_KEY',
    max_tokens: 8192,
    supports: ['chat', 'reasoning'],
    features: ['对话', '推理', '长文本'],
    pricing: { input: 0.004, output: 0.012 },
    recommended: true,
    enabled: true,
  },
  {
    id: 'qwen-vl',
    provider: 'qwen',
    name: '通义千问 VL',
    description: '通义千问视觉模型，支持图片理解',
    model_id: 'qwen-vl-plus',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api_key_env: 'DASHSCOPE_API_KEY',
    max_tokens: 4096,
    supports: ['vision'],
    features: ['图片理解', 'OCR', '数学公式识别'],
    pricing: { input: 0.008, output: 0.008 },
    recommended: true,
    enabled: true,
  },

  // ============ 豆包 模型 ============
  {
    id: 'doubao-pro',
    provider: 'doubao',
    name: '豆包 Pro',
    description: '字节跳动豆包模型，中文能力强',
    model_id: 'doubao-pro-32k',
    base_url: 'https://ark.cn-beijing.volces.com/api/v3',
    api_key_env: 'DOUBAO_API_KEY',
    max_tokens: 32768,
    supports: ['chat'],
    features: ['对话', '长文本', '中文优化'],
    pricing: { input: 0.0008, output: 0.002 },
    enabled: false, // 需要配置 API Key
  },

  // ============ 自定义模型 ============
  {
    id: 'custom-openai',
    provider: 'custom',
    name: '自定义 OpenAI 兼容',
    description: '支持任何 OpenAI 兼容的 API',
    model_id: 'gpt-4o-mini',
    base_url: '', // 用户自定义
    api_key_env: 'CUSTOM_API_KEY',
    max_tokens: 4096,
    supports: ['chat', 'vision'],
    features: ['自定义', 'OpenAI 兼容'],
    enabled: false,
  },
];

// 获取默认模型
export function getDefaultModel(purpose: 'chat' | 'vision' | 'reasoning'): AIModelConfig {
  const recommended = AVAILABLE_MODELS.find(
    m => m.supports.includes(purpose) && m.recommended && m.enabled
  );
  if (recommended) return recommended;

  const enabled = AVAILABLE_MODELS.find(
    m => m.supports.includes(purpose) && m.enabled
  );
  return enabled || AVAILABLE_MODELS[0];
}

// 根据 ID 获取模型配置
export function getModelById(id: string): AIModelConfig | undefined {
  return AVAILABLE_MODELS.find(m => m.id === id);
}

// 获取指定用途的可用模型
export function getModelsForPurpose(purpose: ModelPurpose): AIModelConfig[] {
  return AVAILABLE_MODELS.filter(m => m.supports.includes(purpose) && m.enabled);
}

// Provider 标签配置
export const PROVIDER_CONFIG = {
  deepseek: {
    name: 'DeepSeek',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  qwen: {
    name: '通义千问',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  doubao: {
    name: '豆包',
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  custom: {
    name: '自定义',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
};

import type { ModelPurpose } from './types';
