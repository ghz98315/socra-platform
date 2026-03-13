import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PRO_FEATURES = {
  error_review: { limit: 'error_review_daily', label: '错题学习' },
  essay: { limit: 'essay_weekly', label: '作文批改' },
  ai_chat: { limit: 'ai_chat_rounds', label: 'AI对话' },
  pdf_export: { limit: 'pdf_export_monthly', label: 'PDF导出' },
  geometry_board: { limit: 'geometry_board', label: '几何画板' },
  review_plan: { limit: 'review_plan', label: '复习计划' },
  time_planner: { limit: 'time_planner', label: '时间规划' },
  learning_report: { limit: 'learning_report', label: '学习报告' },
};

export type ProFeature = keyof typeof PRO_FEATURES;

async function getLatestSubscription(userId: string) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('plan_code, status, expires_at')
    .eq('user_id', userId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

export async function checkProStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_pro_user', { p_user_id: userId });
  if (!error && data === true) {
    return true;
  }

  const subscription = await getLatestSubscription(userId);
  return Boolean(
    subscription &&
      String(subscription.plan_code || '').startsWith('pro') &&
      subscription.status === 'active' &&
      (!subscription.expires_at || new Date(subscription.expires_at) > new Date())
  );
}

export async function checkFeatureLimit(
  userId: string,
  feature: ProFeature,
  currentUsage: number
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  isPro: boolean;
}> {
  const { data, error } = await supabase.rpc('check_feature_limit', {
    p_user_id: userId,
    p_feature: feature,
    p_current_usage: currentUsage,
  });

  const result = Array.isArray(data) ? data[0] : data;

  if (error || !result) {
    return { allowed: false, limit: 0, remaining: 0, isPro: false };
  }

  return {
    allowed: Boolean(result.allowed),
    limit: result.limit ?? result.limit_value ?? 0,
    remaining: result.remaining ?? 0,
    isPro: Boolean(result.is_pro),
  };
}

export async function withProCheck(
  req: NextRequest,
  feature: ProFeature,
  handler: (userId: string, isPro: boolean) => Promise<NextResponse>
): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPro = await checkProStatus(userId);
  if (isPro) {
    return handler(userId, true);
  }

  return NextResponse.json(
    {
      error: 'Feature limit exceeded',
      message: '此功能需要升级到 Pro 版本',
      feature: PRO_FEATURES[feature]?.label || feature,
      isPro: false,
    },
    { status: 403 }
  );
}
