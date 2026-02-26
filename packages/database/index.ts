// @socra/database - 共享数据库工具
import { createClient } from '@supabase/supabase-js';

// 创建 Supabase 客户端
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key);
}

// 创建服务端 Supabase 客户端（绕过 RLS）
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key);
}

// 数据库表类型定义
export interface Tables {
  profiles: {
    id: string;
    role: 'student' | 'parent';
    display_name: string | null;
    avatar_url: string | null;
    theme_preference: 'junior' | 'senior' | null;
    created_at: string;
    updated_at: string;
  };
  // 其他表后续添加
}
