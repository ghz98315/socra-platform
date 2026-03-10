// =====================================================
// Project Socrates - Points API
// 积分系统 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// =====================================================
// GET - 获取当前用户积分信息
// =====================================================
export async function GET(req: NextRequest) {
  try {
    // 从查询参数或请求头获取用户ID
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id') || req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    // 调用数据库函数获取积分信息
    const { data, error } = await supabase
      .rpc('get_user_points', { p_user_id: userId });

    if (error) {
      console.error('[Points API] Error fetching points:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Points API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// =====================================================
// POST - 添加积分 (内部调用)
// =====================================================
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, amount, source, transaction_type, related_id, related_type, description, metadata } = body;

    // 参数验证
    if (!user_id || !amount || !source) {
      return NextResponse.json(
        { error: 'user_id, amount and source are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be positive' },
        { status: 400 }
      );
    }

    // 调用数据库函数添加积分
    const { data, error } = await supabase.rpc('add_points', {
      p_user_id: user_id,
      p_amount: amount,
      p_source: source,
      p_transaction_type: transaction_type || 'earn',
      p_related_id: related_id,
      p_related_type: related_type,
      p_description: description,
      p_metadata: metadata || {}
    });

    if (error) {
      console.error('[Points API] Error adding points:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Points API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
