// =====================================================
// Project Socrates - Subscription Plans API
// 订阅计划 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 获取所有可用的订阅计划
export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('[Plans API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 格式化返回数据
    const plans = data.map(plan => ({
      id: plan.id,
      code: plan.plan_code,
      name: plan.plan_name,
      price: plan.price,
      originalPrice: plan.original_price,
      durationDays: plan.duration_days,
      isPopular: plan.is_popular,
      features: plan.features,
      savings: plan.original_price
        ? Math.round((1 - plan.price / plan.original_price) * 100)
        : null
    }));

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error('[Plans API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
