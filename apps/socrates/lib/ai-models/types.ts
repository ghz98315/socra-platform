export type AIModelProvider = 'deepseek' | 'qwen' | 'doubao' | 'custom';

export type ModelPurpose = 'chat' | 'vision' | 'reasoning';

export interface AIModelConfig {
  id: string;
  provider: AIModelProvider;
  name: string;
  description: string;
  model_id: string;
  base_url: string;
  api_key_env: string;
  max_tokens: number;
  supports: ModelPurpose[];
  features: string[];
  pricing?: {
    input: number;
    output: number;
  };
  recommended?: boolean;
  enabled: boolean;
}

export interface UserModelPreference {
  user_id: string;
  chat_model: string;
  vision_model: string;
  reasoning_model: string;
  updated_at: string;
}

export interface ModelResponse {
  success: boolean;
  content?: string;
  model?: string;
  tokens_used?: {
    input: number;
    output: number;
  };
  error?: string;
}
