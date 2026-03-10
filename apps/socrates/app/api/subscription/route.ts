// =====================================================
// Project Socrates - Subscription API
// 订阅系统 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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

    // 获取用户订阅状态
    const { data, error } = await supabase
      .rpc('get_user_subscription', { p_user_id: userId });

    if (error) {
      console.error('[Subscription API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Subscription API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
