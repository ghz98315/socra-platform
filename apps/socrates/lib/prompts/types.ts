// =====================================================
// Project Socrates - Prompt System Types
// Prompt 系统类型定义
// =====================================================

/**
 * 支持的科目类型
 */
export type SubjectType = 'math' | 'chinese' | 'english' | 'generic';

/**
 * 学段类型
 */
export type GradeLevel = 'junior' | 'senior';

/**
 * 用户等级
 */
export type UserLevel = 'free' | 'premium';

/**
 * 对话模式（前端显示名称）
 */
export type DialogMode = 'Logic' | 'Socra';

/**
 * 题型
 */
export type QuestionType =
  | 'choice'
  | 'fill'
  | 'solution'
  | 'proof'
  | 'calculation'
  | 'reading'
  | 'writing'
  | 'listening'
  | 'unknown';

/**
 * 知识点结构
 */
export interface KnowledgePoint {
  category: string;
  items: string[];
}

/**
 * 对话示例
 */
export interface DialogExample {
  scenario: string;
  dialog: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

/**
 * 科目配置
 */
export interface SubjectConfig {
  id: SubjectType;
  name: string;
  description: string;

  // 科目特定策略
  strategies: {
    junior: string;
    senior: string;
  };

  // 知识点库
  knowledgeBase: {
    junior: KnowledgePoint[];
    senior: KnowledgePoint[];
  };

  // Few-Shot 示例
  examples: {
    junior: DialogExample[];
    senior: DialogExample[];
  };

  // 特殊处理函数（如几何数据格式化）
  specialHandlers?: {
    formatExtraData?: (data: any) => string;
  };
}

/**
 * OCR 识别结果
 */
export interface OCRResult {
  success: boolean;
  text?: string;
  error?: string;
  // 科目识别
  subject?: {
    type: SubjectType;
    confidence: number;
  };
  // 题型识别
  questionType?: {
    type: QuestionType;
    confidence: number;
  };
  // 几何数据（如果是几何题）
  geometryData?: any;
}

/**
 * Prompt 构建选项
 */
export interface PromptBuildOptions {
  subject: SubjectType;
  grade: GradeLevel;
  userLevel: UserLevel;
  questionContent?: string;
  geometryData?: any;
  hasImage?: boolean;
  questionType?: QuestionType;
}

/**
 * 对话响应（扩展）
 */
export interface ChatResponse {
  content: string;
  done: boolean;
  dialogMode: DialogMode;
  modelUsed: string;
}
