// =====================================================
// Project Socrates - Add Student API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// 创建 Supabase Admin 客户端（用于创建用户）
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST endpoint - 添加学生账号
export async function POST(req: NextRequest) {
  try {
    // 创建服务端客户端，自动处理 cookies（用于认证当前用户）
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 验证当前用户是家长
    const { data: parentProfile, error: parentError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (parentError || !parentProfile || parentProfile.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can add students' }, { status: 403 });
    }

    const body = await req.json();
    const { display_name, phone, password, grade_level } = body;

    // 验证必填字段
    if (!display_name || !phone || !password) {
      return NextResponse.json({ error: 'Missing required fields: display_name, phone, password' }, { status: 400 });
    }

    // 验证手机号格式（简单验证）
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // 验证年级（必须是1-12的整数）
    const parsedGradeLevel = grade_level ? parseInt(String(grade_level), 10) : null;
    if (parsedGradeLevel !== null && (isNaN(parsedGradeLevel) || parsedGradeLevel < 1 || parsedGradeLevel > 12)) {
      return NextResponse.json({ error: 'Grade level must be between 1 and 12' }, { status: 400 });
    }

    // 检查手机号是否已注册
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const alreadyExists = existingUser.users.find(u => u.email === `${phone}@student.local`);

    if (alreadyExists) {
      return NextResponse.json({
        error: '该手机号已注册，请让学生先自行登录或使用其他手机号',
        code: 'PHONE_EXISTS'
      }, { status: 400 });
    }

    // 1. 创建 auth.users 记录
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: `${phone}@student.local`, // 使用 phone@student.local 作为 email
      password,
      email_confirm: true, // 自动确认邮箱（因为使用手机号注册，无邮件验证流程）
      user_metadata: {
        display_name,
        parent_id: user.id, // 记录父级用户 ID
      },
    });

    if (authError || !authUser) {
      console.error('Error creating auth user:', authError);

      // 处理邮箱已存在的错误
      if (authError?.message?.includes('already been registered') || authError?.message?.includes('User already registered')) {
        return NextResponse.json({
          error: '该手机号已注册，请让学生先自行登录或使用其他手机号',
          code: 'PHONE_EXISTS'
        }, { status: 400 });
      }

      return NextResponse.json({ error: 'Failed to create student account' }, { status: 500 });
    }

    // 2. 创建 profiles 记录（使用 admin 客户端绕过 RLS）
    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authUser.id, // 使用 auth 用户 ID
        role: 'student',
        parent_id: user.id, // 设置父级用户 ID
        display_name,
        phone,
        grade_level: parsedGradeLevel,
        theme_preference: 'junior', // 默认主题
      });

    if (insertError) {
      console.error('Error creating profile:', insertError);
      return NextResponse.json({ error: 'Failed to create student profile' }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        id: authUser.id,
        display_name,
        phone,
        grade_level: parsedGradeLevel,
        role: 'student',
      },
      message: 'Student added successfully',
    });
  } catch (error: any) {
    console.error('Add student API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
