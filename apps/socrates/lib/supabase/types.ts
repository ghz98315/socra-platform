export type ThemeType = 'junior' | 'senior';

export interface UserProfile {
  id: string;
  email: string;
  role: 'student' | 'parent' | 'admin';
  theme_preference?: ThemeType;
  grade_level?: number;
  name?: string;
  display_name?: string;
  phone?: string;
  avatar_url?: string;
  student_avatar_url?: string;
  parent_avatar_url?: string;
  created_at: string;
}

export interface StudySession {
  session_id: string;
  student_id: string;
  session_type: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
}

export interface ErrorSession {
  id: string;
  student_id: string;
  subject: 'math' | 'chinese' | 'english' | 'physics' | 'chemistry' | 'generic';
  concept_tags: string[] | null;
  difficulty_rating: number | null; // AI 评估难度 (1-5)
  student_difficulty_rating: number | null; // 学生自评难度 (1-5)
  final_difficulty_rating: number | null; // 最终综合难度 (0.5步进，如3.5)
  guardian_error_type?: string | null;
  guardian_root_cause_summary?: string | null;
  child_poka_yoke_action?: string | null;
  suggested_guardian_action?: string | null;
  false_error_gate?: boolean | null;
  analysis_mode?: string | null;
  stuck_stage?: string | null;
  created_at: string;
}

export interface ReviewSchedule {
  id: string;
  session_id: string;
  student_id: string;
  review_stage: number;
  next_review_at: string;
  is_completed: boolean;
  created_at: string;
}

export interface StudentStats {
  student_id: string;
  total_errors: number;
  mastered_count: number;
  mastery_rate: number;
}
