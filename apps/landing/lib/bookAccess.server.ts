import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export type LandingBookAccessState = {
  userId: string | null;
  hasFullAccess: boolean;
};

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export async function resolveLandingBookAccess(): Promise<LandingBookAccessState> {
  const env = getSupabaseEnv();
  if (!env) {
    return { userId: null, hasFullAccess: false };
  }

  const cookieStore = await cookies();
  const supabase = createClient(env.url, env.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem(key: string) {
          return cookieStore.get(key)?.value ?? null;
        },
        setItem() {},
        removeItem() {},
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { userId: null, hasFullAccess: false };
  }

  const { data: rpcResult, error: rpcError } = await supabase.rpc('is_pro_user', {
    p_user_id: user.id,
  });

  if (!rpcError && rpcResult === true) {
    return { userId: user.id, hasFullAccess: true };
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from('user_subscriptions')
    .select('plan_code, status, expires_at')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (subscriptionError || !subscription) {
    return { userId: user.id, hasFullAccess: false };
  }

  const hasFullAccess =
    String(subscription.plan_code || '').startsWith('pro') &&
    subscription.status === 'active' &&
    (!subscription.expires_at || new Date(subscription.expires_at) > new Date());

  return {
    userId: user.id,
    hasFullAccess,
  };
}
