// =====================================================
// Project Socrates - Ensure Profile API
// 确保用户 profile 存在并包含正确信息
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// 创建 Supabase Admin 客户端（绕过 RLS）
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

// POST endpoint - 确保当前用户的 profile 存在
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

    // 解析请求体
    const body = await req.json();
    const { phone, display_name, role = 'student' } = body;

    const admin = getSupabaseAdmin();

    // 检查 profile 是否存在
    const { data: existingProfile, error: fetchError } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching profile:', fetchError);
    }

    if (existingProfile) {
      // Profile 存在，检查是否需要更新
      const updates: Record<string, any> = {};

      if (phone && existingProfile.phone !== phone) {
        updates.phone = phone;
      }
      if (display_name && existingProfile.display_name !== display_name) {
        updates.display_name = display_name;
      }

      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await admin
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (updateError) {
          console.error('Error updating profile:', updateError);
        }
      }

      // 重新获取更新后的 profile
      const { data: updatedProfile } = await admin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return NextResponse.json({
        data: updatedProfile,
        message: 'Profile updated',
        created: false,
      });
    } else {
      // Profile 不存在，创建新的
      const { data: newProfile, error: insertError } = await admin
        .from('profiles')
        .insert({
          id: user.id,
          phone: phone || user.user_metadata?.phone || null,
          display_name: display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || '用户',
          role,
          theme_preference: 'junior',
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating profile:', insertError);
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
      }

      return NextResponse.json({
        data: newProfile,
        message: 'Profile created',
        created: true,
      });
    }
  } catch (error: any) {
    console.error('Ensure profile API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
