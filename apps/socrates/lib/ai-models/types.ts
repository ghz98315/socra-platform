// =====================================================
// Project Socrates - AI Model Configuration
// AI 模型配置系统
// =====================================================

// 支持的 AI 模型类型
export type AIModelProvider = 'deepseek' | 'qwen' | 'doubao' | 'custom';

// 模型用途
export type ModelPurpose = 'chat' | 'vision' | 'reasoning';

// AI 模型配置
export interface AIModelConfig {
  id: string;
  provider: AIModelProvider;
  name: string;
  description: string;
  model_id: string;           // API 调用时的模型 ID
  base_url: string;
  api_key_env: string;        // 环境变量名
  max_tokens: number;
  supports: ModelPurpose[];
  features: string[];
  pricing?: {
    input: number;            // 每 1K tokens 价格（元）
    output: number;
  };
  recommended?: boolean;
  enabled: boolean;
}

// 用户模型偏好
export interface UserModelPreference {
  user_id: string;
  chat_model: string;         // 选择的聊天模型 ID
  vision_model: string;       // 选择的视觉模型 ID
  reasoning_model: string;    // 选择的推理模型 ID
  updated_at: string;
}

// 模型响应
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
