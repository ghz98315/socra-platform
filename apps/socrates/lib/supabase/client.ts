import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mock.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';
const sharedCookieDomain = process.env.NEXT_PUBLIC_SHARED_AUTH_COOKIE_DOMAIN?.trim();

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

function writeBrowserCookie(key: string, value: string, maxAge: number) {
  if (typeof window === 'undefined') {
    return;
  }

  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? 'secure;' : '';
  const cookieDomain = resolveCookieDomain();
  const encodedValue = encodeURIComponent(value);

  // Remove the legacy host-only cookie first so it does not shadow the
  // shared-domain cookie introduced for landing <-> socrates auth sharing.
  document.cookie = `${key}=; max-age=-1; path=/; ${secureFlag} samesite=lax`;

  if (cookieDomain) {
    document.cookie = `${key}=${encodedValue}; max-age=${maxAge}; path=/; domain=${cookieDomain}; ${secureFlag} samesite=lax`;
    return;
  }

  document.cookie = `${key}=${encodedValue}; max-age=${maxAge}; path=/; ${secureFlag} samesite=lax`;
}

function removeBrowserCookie(key: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const isSecure = window.location.protocol === 'https:';
  const secureFlag = isSecure ? 'secure;' : '';
  const cookieDomain = resolveCookieDomain();

  // Clear both the current-host cookie and the shared-domain cookie so older
  // sessions cannot survive sign-out after the cookie-domain rollout.
  document.cookie = `${key}=; max-age=-1; path=/; ${secureFlag} samesite=lax`;

  if (cookieDomain) {
    document.cookie = `${key}=; max-age=-1; path=/; domain=${cookieDomain}; ${secureFlag} samesite=lax`;
  }
}

export function createClient() {
  if (!clientInstance) {
    clientInstance = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
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
            writeBrowserCookie(key, value, 60 * 60 * 24 * 7);
          },
          removeItem: (key: string) => {
            removeBrowserCookie(key);
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
