import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FREE_LIMITS: Record<string, number> = {
  ai_chat: 50,
  error_review: 5,
  pdf_export: 3,
  essay: 3,
};

const PRO_ONLY_FEATURES = new Set([
  'geometry_board',
  'review_plan',
  'time_planner',
  'learning_report',
]);

async function isActiveProUser(userId: string) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('plan_code, status, expires_at')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return (
    String(data.plan_code || '').startsWith('pro') &&
    data.status === 'active' &&
    (!data.expires_at || new Date(data.expires_at) > new Date())
  );
}

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

    const { data, error } = await supabase.rpc('check_feature_limit', {
      p_user_id: user_id,
      p_feature: feature,
      p_current_usage: current_usage,
    });

    if (!error && data) {
      const result = Array.isArray(data) ? data[0] : data;
      if (result) {
        return NextResponse.json({
          allowed: Boolean(result.allowed),
          limit: result.limit ?? result.limit_value ?? 0,
          remaining: result.remaining ?? 0,
          is_pro: Boolean(result.is_pro),
        });
      }
    }

    if (error) {
      console.error('[subscription/check-feature] RPC fallback:', error);
    }

    const isPro = await isActiveProUser(user_id);
    if (isPro) {
      return NextResponse.json({
        allowed: true,
        limit: -1,
        remaining: -1,
        is_pro: true,
      });
    }

    if (PRO_ONLY_FEATURES.has(feature)) {
      return NextResponse.json({
        allowed: false,
        limit: 0,
        remaining: 0,
        is_pro: false,
      });
    }

    const limit = FREE_LIMITS[feature] ?? 0;
    const remaining = Math.max(limit - current_usage, 0);

    return NextResponse.json({
      allowed: limit > 0 && current_usage < limit,
      limit,
      remaining,
      is_pro: false,
    });
  } catch (error: any) {
    console.error('[subscription/check-feature] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
