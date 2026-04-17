export type VariantDifficulty = 'easy' | 'medium' | 'hard';

export type VariantStatus = 'pending' | 'practicing' | 'completed' | 'mastered';

export type VariantGeometryMode = 'auto' | 'preserve_figure' | 'change_figure';

export interface VariantQuestion {
  id: string;
  original_session_id: string;
  student_id: string;
  subject: 'math' | 'physics' | 'chemistry';
  question_text: string;
  question_image_url?: string;
  concept_tags: string[];
  difficulty: VariantDifficulty;
  hints: string[];
  solution: string;
  answer: string;
  status: VariantStatus;
  attempts: number;
  correct_attempts: number;
  created_at: string;
  last_practiced_at?: string;
  completed_at?: string;
}

export interface GenerateVariantRequest {
  session_id: string;
  student_id: string;
  subject: 'math' | 'physics' | 'chemistry';
  original_text: string;
  concept_tags?: string[];
  difficulty?: VariantDifficulty;
  geometry_mode?: VariantGeometryMode;
  count?: number;
  geometry_data?: unknown;
  geometry_svg?: string | null;
}

export interface GenerateVariantResponse {
  success: boolean;
  variants?: VariantQuestion[];
  error?: string;
}

export interface VariantPracticeResult {
  variant_id: string;
  student_id: string;
  is_correct: boolean;
  student_answer: string;
  time_spent: number;
  hints_used: number;
}

export interface VariantPracticeStats {
  total_variants: number;
  completed: number;
  mastered: number;
  accuracy_rate: number;
  avg_time_spent: number;
}

export type VariantAnswerMatchStrategy =
  | 'exact'
  | 'assignment_rhs'
  | 'numeric'
  | 'normalized_text'
  | 'unmatched';

export interface VariantAnswerEvaluation {
  is_correct: boolean;
  strategy: VariantAnswerMatchStrategy;
  normalized_expected: string;
  normalized_student: string;
  expected_display: string;
  student_display: string;
}

export interface VariantPracticeFeedback {
  variant_id: string;
  student_answer: string;
  hints_used: number;
  time_spent: number;
  is_correct: boolean;
  independent_success: boolean;
  counts_as_transfer_evidence: boolean;
  evidence_label: string;
  evaluation: VariantAnswerEvaluation;
}
