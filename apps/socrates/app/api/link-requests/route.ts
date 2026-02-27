// =====================================================
// Project Socrates - Link Requests API
// 家长关联学生请求 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET endpoint - 获取关联请求列表
// 家长：获取发送的请求
// 学生：获取收到的请求
export async function GET(req: NextRequest) {
  try {
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

    // 获取用户角色
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    let requests = [];

    if (profile.role === 'parent') {
      // 家长：获取发送的请求
      const { data, error } = await supabase
        .from('link_requests')
        .select(`
          id,
          status,
          message,
          created_at,
          responded_at,
          student:profiles!link_requests_student_id_fkey (
            id,
            display_name,
            grade_level,
            phone
          )
        `)
        .eq('parent_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sent requests:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
      }
      requests = data || [];
    } else if (profile.role === 'student') {
      // 学生：获取收到的请求
      const { data, error } = await supabase
        .from('link_requests')
        .select(`
          id,
          status,
          message,
          created_at,
          responded_at,
          parent:profiles!link_requests_parent_id_fkey (
            id,
            display_name,
            phone
          )
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching received requests:', error);
        return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
      }
      requests = data || [];

      // 同时获取已关联的家长信息
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select(`
          parent_id,
          parent:profiles!profiles_parent_id_fkey (
            id,
            display_name,
            phone
          )
        `)
        .eq('id', user.id)
        .single();

      return NextResponse.json({
        data: {
          requests,
          linkedParent: studentProfile?.parent || null,
        },
      });
    }

    return NextResponse.json({
      data: {
        requests,
        linkedParent: null,
      },
    });
  } catch (error) {
    console.error('Link requests API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST endpoint - 创建关联请求（通过手机号）
export async function POST(req: NextRequest) {
  try {
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
      return NextResponse.json({ error: 'Only parents can create link requests' }, { status: 403 });
    }

    // 解析请求体
    const body = await req.json();
    const { phone, message } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // 格式化手机号（确保是11位数字）
    const formattedPhone = phone.replace(/\D/g, '');
    if (formattedPhone.length !== 11) {
      return NextResponse.json({ error: 'Invalid phone number format' }, { status: 400 });
    }

    // 查找学生（通过手机号）
    const { data: studentProfile, error: studentError } = await supabase
      .from('profiles')
      .select('id, display_name, role, parent_id')
      .eq('phone', formattedPhone)
      .single();

    if (studentError || !studentProfile) {
      return NextResponse.json({ error: '未找到该手机号对应的学生账号' }, { status: 404 });
    }

    // 验证目标是学生
    if (studentProfile.role !== 'student') {
      return NextResponse.json({ error: '该账号不是学生账号' }, { status: 400 });
    }

    // 检查学生是否已有家长
    if (studentProfile.parent_id) {
      if (studentProfile.parent_id === user.id) {
        return NextResponse.json({ error: '该学生已经与您关联' }, { status: 400 });
      }
      return NextResponse.json({ error: '该学生已关联其他家长' }, { status: 400 });
    }

    // 检查是否已有待处理的请求
    const { data: existingRequest, error: checkError } = await supabase
      .from('link_requests')
      .select('id, status')
      .eq('parent_id', user.id)
      .eq('student_id', studentProfile.id)
      .single();

    if (existingRequest) {
      if (existingRequest.status === 'pending') {
        return NextResponse.json({ error: '已有待处理的关联请求' }, { status: 400 });
      }
      if (existingRequest.status === 'accepted') {
        return NextResponse.json({ error: '该学生已经与您关联' }, { status: 400 });
      }
      // 如果之前被拒绝，允许重新发送
    }

    // 创建关联请求
    const { data: linkRequest, error: insertError } = await supabase
      .from('link_requests')
      .insert({
        parent_id: user.id,
        student_id: studentProfile.id,
        message: message || null,
        status: 'pending',
      })
      .select(`
        id,
        status,
        created_at,
        student:profiles!link_requests_student_id_fkey (
          id,
          display_name,
          grade_level
        )
      `)
      .single();

    if (insertError) {
      console.error('Error creating link request:', insertError);
      return NextResponse.json({ error: '创建请求失败' }, { status: 500 });
    }

    return NextResponse.json({
      message: '关联请求已发送',
      data: linkRequest,
    });
  } catch (error) {
    console.error('Create link request API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
