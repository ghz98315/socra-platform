// =====================================================
// 共享类型定义
// =====================================================

// 用户资料
export interface UserProfile {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
  role?: 'student' | 'parent' | 'teacher';
  created_at?: string;
}

// 认证状态
export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  error: string | null;
}
