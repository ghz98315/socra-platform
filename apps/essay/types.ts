// =====================================================
// AI Essay Reviewer - Type Definitions
// =====================================================

export interface MagicCorrection {
  original: string;
  improved: string;
  reason: string;
}

export interface GoldenSentence {
  sentence: string;
  benefit: string;
}

export interface EssayAnalysis {
  title?: string;
  body?: string;
  transcribedText?: string;
  highlights?: string[];
  corrections?: MagicCorrection[];
  goldenSentences?: GoldenSentence[];
  overallComment?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}

export type GradeLevel =
  | '小学一年级' | '小学二年级' | '小学三年级' | '小学四年级' | '小学五年级' | '小学六年级'
  | '初中一年级' | '初中二年级' | '初中三年级';

// 用户信息（从 Supabase Auth 获取）
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}
