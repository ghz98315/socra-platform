// =====================================================
// Project Socrates - Subscription API
// 订阅系统 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// =====================================================
// GET - 获取用户订阅信息
// =====================================================
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id') || req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 尝试从 user_subscriptions 表获取订阅信息
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    // 如果表不存在或没有订阅记录，返回默认的免费用户状态
    if (error) {
      console.log('[Subscription API] No subscription found, returning default free tier');
      return NextResponse.json({
        is_pro: false,
        plan: 'free',
        status: 'active',
        expires_at: null,
        features: {
          daily_ai_chats: 50,
          subjects: ['math', 'chinese', 'english'],
          advanced_analysis: false,
          priority_support: false,
        }
      });
    }

    // 如果有订阅记录，返回订阅信息
    const isPro = (subscription as any)?.plan === 'pro' &&
                   (subscription as any)?.status === 'active' &&
                   new Date((subscription as any)?.expires_at) > new Date();

    return NextResponse.json({
      is_pro: isPro,
      plan: (subscription as any)?.plan || 'free',
      status: (subscription as any)?.status || 'active',
      expires_at: (subscription as any)?.expires_at || null,
      features: isPro ? {
        daily_ai_chats: -1, // unlimited
        subjects: ['math', 'chinese', 'english', 'physics', 'chemistry'],
        advanced_analysis: true,
        priority_support: true,
      } : {
        daily_ai_chats: 50,
        subjects: ['math', 'chinese', 'english'],
        advanced_analysis: false,
        priority_support: false,
      }
    });
  } catch (error: any) {
    console.error('[Subscription API] Error:', error);
    // 返回默认免费用户状态，避免前端报错
    return NextResponse.json({
      is_pro: false,
      plan: 'free',
      status: 'active',
      expires_at: null,
      features: {
        daily_ai_chats: 50,
        subjects: ['math', 'chinese', 'english'],
        advanced_analysis: false,
        priority_support: false,
      }
    });
  }
}
