// =====================================================
// Auth Helpers - 认证辅助函数
// =====================================================

import { User, Session } from '@supabase/supabase-js';
import { getSupabaseBrowserClient } from './client';

// 获取当前用户
export async function getCurrentUser(): Promise<User | null> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      console.error('Error getting user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

// 获取当前会话
export async function getCurrentSession(): Promise<Session | null> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Error getting session:', error);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error in getCurrentSession:', error);
    return null;
  }
}

// 登出
export async function signOut(): Promise<void> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in signOut:', error);
    throw error;
  }
}

// 邮箱密码登录
export async function signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}

// 注册
export async function signUp(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  const supabase = getSupabaseBrowserClient();

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}
