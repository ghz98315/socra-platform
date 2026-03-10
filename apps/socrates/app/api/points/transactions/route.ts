// =====================================================
// Project Socrates - Points Transactions API
// 积分交易记录 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 获取用户积分交易记录
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const source = searchParams.get('source');
    const transactionType = searchParams.get('transaction_type');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    let query = supabase
      .from('point_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 可选过滤
    if (source) {
      query = query.eq('source', source);
    }
    if (transactionType) {
      query = query.eq('transaction_type', transactionType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Points Transactions API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 获取总数
    const { count, error: countError } = await supabase
      .from('point_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('[Points Transactions API] Error counting:', countError);
    }

    return NextResponse.json({
      transactions: data,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });
  } catch (error: any) {
    console.error('[Points Transactions API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
