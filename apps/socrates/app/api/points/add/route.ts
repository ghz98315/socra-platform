// =====================================================
// Project Socrates - Add Points API
// 添加积分 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 积分来源类型
type PointSource =
  | 'error_review'      // 错题学习完成
  | 'error_mastered'    // 错题掌握
  | 'essay'             // 作文批改完成
  | 'invite'            // 邀请好友
  | 'streak'            // 连续学习奖励
  | 'daily_login'       // 每日登录
  | 'task'             // 家长任务
  | 'achievement'       // 成就解锁
  | 'subscription'      // 订阅奖励
  | 'share'             // 分享奖励
  | 'admin';            // 管理员操作

interface AddPointsRequest {
  user_id: string;
  amount: number;
  source: PointSource;
  transaction_type?: 'earn' | 'reward';
  related_id?: string;
  related_type?: string;
  description?: string;
  metadata?: Record<string, any>;
}

// POST - 添加积分
export async function POST(req: NextRequest) {
  try {
    const body: AddPointsRequest = await req.json();
    const {
      user_id,
      amount,
      source,
      transaction_type = 'earn',
      related_id,
      related_type,
      description,
      metadata = {}
    } = body;

    // 参数验证
    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'amount must be positive' }, { status: 400 });
    }
    if (!source) {
      return NextResponse.json({ error: 'source is required' }, { status: 400 });
    }

    // 调用数据库函数添加积分
    const { data, error } = await supabase.rpc('add_points', {
      p_user_id: user_id,
      p_amount: amount,
      p_source: source,
      p_transaction_type: transaction_type,
      p_related_id: related_id,
      p_related_type: related_type,
      p_description: description,
      p_metadata: metadata
    });

    if (error) {
      console.error('[Add Points API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[Add Points API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
