export type ThemeType = 'junior' | 'senior';

export interface UserProfile {
  id: string;
  email: string;
  role: 'student' | 'parent' | 'admin';
  theme_preference?: ThemeType;
  grade_level?: number;
  name?: string;
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
  subject: 'math' | 'physics' | 'chemistry';
  concept_tags: string[] | null;
  difficulty_rating: number | null;
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
