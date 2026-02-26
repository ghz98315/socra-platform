// =====================================================
// Project Socrates - Registration API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 延迟创建 Supabase Admin 客户端（避免构建时环境变量问题）
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Missing Supabase environment variables');
    }
    supabaseAdminInstance = createClient(url, key);
  }
  return supabaseAdminInstance;
}

// POST endpoint - 注册新用户
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, password, display_name, role = 'student' } = body;

    // 验证必填字段
    if (!phone || !password) {
      return NextResponse.json({ error: 'Missing required fields: phone, password' }, { status: 400 });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // 检查手机号是否已注册
    const { data: existingUser } = await getSupabaseAdmin().auth.admin.listUsers();
    const alreadyExists = existingUser.users.find(u => u.email === `${phone}@student.local`);

    if (alreadyExists) {
      return NextResponse.json({
        error: '该手机号已注册',
        code: 'PHONE_EXISTS'
      }, { status: 400 });
    }

    // 创建 auth.users 记录（自动确认邮箱）
    const { data: { user: authUser }, error: authError } = await getSupabaseAdmin().auth.admin.createUser({
      email: `${phone}@student.local`,
      password,
      email_confirm: true, // 自动确认邮箱
      user_metadata: {
        display_name,
        phone,
      },
    });

    if (authError || !authUser) {
      console.error('Error creating auth user:', authError);
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    // profiles 记录会由触发器自动创建
    // 但为了确保 phone 字段被正确存储，我们手动更新
    const { error: updateError } = await (getSupabaseAdmin() as any)
      .from('profiles')
      .update({
        phone,
        display_name,
      })
      .eq('id', authUser.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      // 不返回错误，因为用户已创建成功
    }

    return NextResponse.json({
      data: {
        id: authUser.id,
        phone,
        display_name,
        role,
      },
      message: 'Registration successful',
    });
  } catch (error: any) {
    console.error('Registration API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
