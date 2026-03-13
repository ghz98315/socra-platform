import type { AIModelConfig, AIModelProvider, ModelPurpose } from './types';

export const AVAILABLE_MODELS: AIModelConfig[] = [
  {
    id: 'deepseek-chat',
    provider: 'deepseek',
    name: 'DeepSeek Chat',
    description: 'Balanced chat model for general tutoring and Q&A.',
    model_id: 'deepseek-chat',
    base_url: 'https://api.deepseek.com/v1',
    api_key_env: 'AI_API_KEY_LOGIC',
    max_tokens: 4096,
    supports: ['chat'],
    features: ['chat', 'qa', 'tutoring'],
    pricing: { input: 0.001, output: 0.002 },
    enabled: false,
  },
  {
    id: 'deepseek-reasoner',
    provider: 'deepseek',
    name: 'DeepSeek Reasoner',
    description: 'Reasoning-focused model for harder math and science tasks.',
    model_id: 'deepseek-reasoner',
    base_url: 'https://api.deepseek.com/v1',
    api_key_env: 'AI_API_KEY_LOGIC',
    max_tokens: 8192,
    supports: ['chat', 'reasoning'],
    features: ['reasoning', 'math', 'science'],
    pricing: { input: 0.002, output: 0.004 },
    enabled: false,
  },
  {
    id: 'qwen-turbo',
    provider: 'qwen',
    name: 'Qwen Turbo',
    description: 'Fast general-purpose Chinese-first chat model.',
    model_id: 'qwen-turbo',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api_key_env: 'DASHSCOPE_API_KEY',
    max_tokens: 4096,
    supports: ['chat'],
    features: ['chat', 'chinese', 'fast'],
    pricing: { input: 0.002, output: 0.006 },
    recommended: true,
    enabled: true,
  },
  {
    id: 'qwen-plus',
    provider: 'qwen',
    name: 'Qwen Plus',
    description: 'Stronger reasoning and long-context generation.',
    model_id: 'qwen-plus',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api_key_env: 'DASHSCOPE_API_KEY',
    max_tokens: 8192,
    supports: ['chat', 'reasoning'],
    features: ['chat', 'reasoning', 'long-context'],
    pricing: { input: 0.004, output: 0.012 },
    recommended: true,
    enabled: true,
  },
  {
    id: 'qwen-vl',
    provider: 'qwen',
    name: 'Qwen VL',
    description: 'Vision-capable model for OCR and image understanding.',
    model_id: 'qwen-vl-plus',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    api_key_env: 'DASHSCOPE_API_KEY',
    max_tokens: 4096,
    supports: ['vision'],
    features: ['vision', 'ocr', 'image-understanding'],
    pricing: { input: 0.008, output: 0.008 },
    recommended: true,
    enabled: true,
  },
  {
    id: 'doubao-pro',
    provider: 'doubao',
    name: 'Doubao Pro',
    description: 'Alternative Chinese chat model with lower latency.',
    model_id: 'doubao-pro-32k',
    base_url: 'https://ark.cn-beijing.volces.com/api/v3',
    api_key_env: 'DOUBAO_API_KEY',
    max_tokens: 32768,
    supports: ['chat'],
    features: ['chat', 'chinese', 'long-context'],
    pricing: { input: 0.0008, output: 0.002 },
    enabled: false,
  },
  {
    id: 'custom-openai',
    provider: 'custom',
    name: 'Custom OpenAI Compatible',
    description: 'Any OpenAI-compatible endpoint configured by the team.',
    model_id: 'gpt-4o-mini',
    base_url: '',
    api_key_env: 'CUSTOM_API_KEY',
    max_tokens: 4096,
    supports: ['chat', 'vision'],
    features: ['custom', 'openai-compatible'],
    enabled: false,
  },
];

export function getDefaultModel(purpose: ModelPurpose): AIModelConfig {
  const recommended = AVAILABLE_MODELS.find(
    (model) => model.enabled && model.recommended && model.supports.includes(purpose)
  );

  if (recommended) {
    return recommended;
  }

  const fallback = AVAILABLE_MODELS.find(
    (model) => model.enabled && model.supports.includes(purpose)
  );

  return fallback ?? AVAILABLE_MODELS[0];
}

export function getModelById(id: string): AIModelConfig | undefined {
  return AVAILABLE_MODELS.find((model) => model.id === id);
}

export function getModelsForPurpose(purpose: ModelPurpose): AIModelConfig[] {
  return AVAILABLE_MODELS.filter((model) => model.enabled && model.supports.includes(purpose));
}

export const PROVIDER_CONFIG: Record<
  AIModelProvider,
  { name: string; color: string; bgColor: string }
> = {
  deepseek: {
    name: 'DeepSeek',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  qwen: {
    name: 'Qwen',
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  doubao: {
    name: 'Doubao',
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  custom: {
    name: 'Custom',
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
};
