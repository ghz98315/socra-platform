import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Supabase 配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';
const sharedCookieDomain = process.env.NEXT_PUBLIC_SHARED_AUTH_COOKIE_DOMAIN?.trim();

// 单例模式：确保只有一个客户端实例
let clientInstance: ReturnType<typeof createSupabaseClient<Database>> | null = null;

function resolveCookieDomain() {
  if (sharedCookieDomain) {
    return sharedCookieDomain;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  const hostname = window.location.hostname;
  if (hostname === 'socra.cn' || hostname.endsWith('.socra.cn')) {
    return '.socra.cn';
  }

  return '';
}

export function createClient() {
  if (!clientInstance) {
    clientInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        // 使用 cookies 存储令牌（而不是 localStorage）
        // 这样服务端才能读取认证信息
        storage: {
          getItem: (key: string) => {
            if (typeof window === 'undefined') return null;
            const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]*)`));
            if (!match?.[2]) return null;
            try {
              return decodeURIComponent(match[2]);
            } catch {
              return match[2];
            }
          },
          setItem: (key: string, value: string) => {
            if (typeof window === 'undefined') return;
            // 设置 cookie 时根据协议决定是否使用 secure 标志
            // localhost 开发环境不使用 secure，生产环境使用
            const maxAge = 60 * 60 * 24 * 7; // 7 天
            const isSecure = window.location.protocol === 'https:';
            const secureFlag = isSecure ? 'secure;' : '';
            const cookieDomain = resolveCookieDomain();
            const domainFlag = cookieDomain ? `domain=${cookieDomain}; ` : '';
            const encodedValue = encodeURIComponent(value);
            document.cookie = `${key}=${encodedValue}; max-age=${maxAge}; path=/; ${domainFlag}${secureFlag} samesite=lax`;
          },
          removeItem: (key: string) => {
            if (typeof window === 'undefined') return;
            const isSecure = window.location.protocol === 'https:';
            const secureFlag = isSecure ? 'secure;' : '';
            const cookieDomain = resolveCookieDomain();
            const domainFlag = cookieDomain ? `domain=${cookieDomain}; ` : '';
            document.cookie = `${key}=; max-age=-1; path=/; ${domainFlag}${secureFlag} samesite=lax`;
          },
        },
      },
    });
  }
  return clientInstance;
}

export async function createServerClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
