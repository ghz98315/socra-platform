// @socra/auth - 共享认证模块
// 后续从 socrates-app 提取认证逻辑到这里

export const AUTH_CONFIG = {
  // Supabase 配置从环境变量读取
  getSupabaseConfig: () => ({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  }),
};

// 用户角色类型
export type UserRole = 'student' | 'parent';

// 用户资料类型
export interface UserProfile {
  id: string;
  role: UserRole;
  display_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}
