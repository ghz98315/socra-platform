// =====================================================
// Supabase Client - 共享配置
// =====================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 获取 Supabase 配置
export function getSupabaseConfig() {
  const isBrowser = typeof window !== 'undefined';

  // 浏览器端使用 VITE_ 前缀
  const url = isBrowser
    ? (import.meta as any).env?.VITE_SUPABASE_URL
    : process.env.NEXT_PUBLIC_SUPABASE_URL;

  const anonKey = isBrowser
    ? (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, anonKey };
}

// 创建 Supabase Client
export function createSupabaseClient(): SupabaseClient {
  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey) {
    console.warn('Supabase environment variables not configured');
    // 返回一个占位 client，避免崩溃
    return createClient('https://placeholder.supabase.co', 'placeholder-key');
  }

  return createClient(url, anonKey);
}

// 单例模式 - 浏览器端
let browserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(): SupabaseClient {
  if (typeof window === 'undefined') {
    // 服务端每次都创建新的
    return createSupabaseClient();
  }

  if (!browserClient) {
    browserClient = createSupabaseClient();
  }

  return browserClient;
}
