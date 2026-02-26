// =====================================================
// Project Socrates - Variant Question Types
// 变式题目类型定义
// =====================================================

// 变式题目难度
export type VariantDifficulty = 'easy' | 'medium' | 'hard';

// 变式题目状态
export type VariantStatus = 'pending' | 'practicing' | 'completed' | 'mastered';

// 变式题目定义
export interface VariantQuestion {
  id: string;
  original_session_id: string;    // 原错题ID
  student_id: string;
  subject: 'math' | 'physics' | 'chemistry';

  // 题目内容
  question_text: string;          // 题目文本
  question_image_url?: string;    // 生成的题目图片（如有）

  // AI 生成的相关数据
  concept_tags: string[];         // 涉及的知识点
  difficulty: VariantDifficulty;
  hints: string[];                // 提示（逐步揭示）
  solution: string;               // 解析
  answer: string;                 // 答案

  // 学习状态
  status: VariantStatus;
  attempts: number;               // 尝试次数
  correct_attempts: number;       // 正确次数

  // 时间戳
  created_at: string;
  last_practiced_at?: string;
  completed_at?: string;
}

// 变式题目生成请求
export interface GenerateVariantRequest {
  session_id: string;             // 原错题会话ID
  student_id: string;
  subject: 'math' | 'physics' | 'chemistry';
  original_text: string;          // 原题文本
  concept_tags?: string[];        // 原题知识点
  difficulty?: VariantDifficulty; // 目标难度（默认与原题相同）
  count?: number;                 // 生成数量（默认1）
}

// 变式题目生成响应
export interface GenerateVariantResponse {
  success: boolean;
  variants?: VariantQuestion[];
  error?: string;
}

// 变式题目练习结果
export interface VariantPracticeResult {
  variant_id: string;
  student_id: string;
  is_correct: boolean;
  student_answer: string;
  time_spent: number;             // 秒
  hints_used: number;
}

// 变式练习统计
export interface VariantPracticeStats {
  total_variants: number;
  completed: number;
  mastered: number;
  accuracy_rate: number;
  avg_time_spent: number;
}
