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

// 手机号/邮箱登录
export async function signIn(emailOrPhone: string, password: string): Promise<{ user: User | null; error: Error | null }> {
  const supabase = getSupabaseBrowserClient();

  try {
    // 判断是手机号还是邮箱（11位：1开头 + 第二位3-9 + 后9位数字）
    const phoneRegex = /^1[3-9]\d{9}$/;
    const email = phoneRegex.test(emailOrPhone)
      ? `${emailOrPhone}@student.local`  // 手机号转换为 email
      : emailOrPhone;

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

// 注册（支持手机号和昵称）
export async function signUp(
  emailOrPhone: string,
  password: string,
  displayName?: string
): Promise<{ user: User | null; error: Error | null }> {
  const supabase = getSupabaseBrowserClient();

  try {
    // 判断是手机号还是邮箱（11位：1开头 + 第二位3-9 + 后9位数字）
    const phoneRegex = /^1[3-9]\d{9}$/;
    const isPhone = phoneRegex.test(emailOrPhone);
    const email = isPhone
      ? `${emailOrPhone}@student.local`  // 手机号转换为 email
      : emailOrPhone;

    // 记录原始手机号
    const phone = isPhone ? emailOrPhone : null;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined, // 不需要邮件验证
        data: {
          phone: phone,  // 存储手机号到 metadata
          display_name: displayName || (isPhone ? phone : email.split('@')[0]),  // 昵称
        },
      },
    });

    if (error) {
      return { user: null, error };
    }

    return { user: data.user, error: null };
  } catch (error) {
    return { user: null, error: error as Error };
  }
}
