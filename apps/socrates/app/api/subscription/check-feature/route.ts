// =====================================================
// Project Socrates - Check Feature API
// 检查功能权限 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - 检查功能限制
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, feature, current_usage } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }
    if (!feature) {
      return NextResponse.json({ error: 'feature is required' }, { status: 400 });
    }
    if (typeof current_usage !== 'number') {
      return NextResponse.json({ error: 'current_usage is required' }, { status: 400 });
    }

    // 调用数据库函数检查功能限制
    const { data, error } = await supabase.rpc('check_feature_limit', {
      p_user_id: user_id,
      p_feature: feature,
      p_current_usage: current_usage
    });

    if (error) {
      console.error('[Check Feature API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Check Feature API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
