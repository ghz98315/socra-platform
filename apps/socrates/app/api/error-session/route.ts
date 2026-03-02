// =====================================================
// Project Socrates - Error Session API (保存错题会话)
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// 创建 Supabase 服务端客户端（使用 service_role 绕过 RLS）
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST endpoint - 创建新的错题会话
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      student_id,
      subject,
      original_image_url,
      extracted_text,
      difficulty_rating,
      concept_tags,
      theme_used,
      geometry_data,
      geometry_svg,
    } = body;

    // 验证必填字段
    if (!student_id || !subject || !extracted_text) {
      return NextResponse.json({ error: '缺少必填字段: student_id, subject, extracted_text' }, { status: 400 });
    }

    // 创建新的错题会话
    const { data, error } = await supabase
      .from('error_sessions')
      .insert({
        id: randomUUID(), // 使用 UUID 作为主键
        student_id,
        subject,
        original_image_url,
        extracted_text,
        status: 'guided_learning',
        difficulty_rating: difficulty_rating || null,
        concept_tags: concept_tags || null,
        theme_used: theme_used || null, // 记录对话时使用的主题模式
        geometry_data: geometry_data || null, // 几何图形JSON数据
        geometry_svg: geometry_svg || null, // 几何图形SVG图片
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating error session:', error);
      return NextResponse.json({ error: '创建错题会话失败' }, { status: 500 });
    }

    // 获取该学生的错题总数，用于成就检查
    const { count: errorCount, error: countError } = await supabase
      .from('error_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', student_id);

    console.log('[Error Session] Total error count for user:', student_id, 'is:', errorCount);
    if (countError) {
      console.error('[Error Session] Failed to count errors:', countError);
    }

    // 触发成就检查 - 上传错题
    const achievementUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/achievements`;
    console.log('[Error Session] Triggering achievement check at:', achievementUrl);

    try {
      const achievementResponse = await fetch(achievementUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: student_id,
          action: 'error_uploaded',
          data: { count: errorCount || 1 },
        }),
      });

      const achievementResult = await achievementResponse.json();
      console.log('[Error Session] Achievement API response:', achievementResult);
    } catch (e) {
      console.error('[Error Session] Failed to check upload achievements:', e);
    }

    return NextResponse.json({
      data: {
        session_id: data.id,
        theme_used: data.theme_used,
        message: '错题会话创建成功',
      },
    });
  } catch (error: any) {
    console.error('Error session API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint - 获取学生的错题列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const student_id = searchParams.get('student_id');
    const status = searchParams.get('status');

    if (!student_id) {
      return NextResponse.json({ error: 'student_id is required' }, { status: 400 });
    }

    // 构建查询
    let query = supabase
      .from('error_sessions')
      .select('*')
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching error sessions:', error);
      return NextResponse.json({ error: '获取错题列表失败' }, { status: 500 });
    }

    return NextResponse.json({
      data: data || [],
    });
  } catch (error: any) {
    console.error('Error session GET API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
