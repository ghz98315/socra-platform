// =====================================================
// Supabase Client Singleton
// 防止重复创建客户端导致的问题
// =====================================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 单例客户端
let clientInstance: ReturnType<typeof createSupabaseClient> | null = null;

export function getSupabaseClient() {
  if (clientInstance) {
    return clientInstance;
  }

  clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return clientInstance;
}

// 导出兼容的 createClient 函数
export function createClient() {
  return getSupabaseClient();
}
