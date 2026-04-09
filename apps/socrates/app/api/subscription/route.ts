import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const FREE_FEATURES = {
  daily_ai_chats: 50,
  subjects: ['math', 'chinese', 'english'],
  advanced_analysis: false,
  priority_support: false,
};

const PRO_FEATURES = {
  daily_ai_chats: -1,
  subjects: ['math', 'chinese', 'english', 'physics', 'chemistry'],
  advanced_analysis: true,
  priority_support: true,
};

function getFallbackPlanName(planCode: string | null | undefined) {
  switch (planCode) {
    case 'pro_monthly':
      return '月度会员';
    case 'pro_quarterly':
      return '季度会员';
    case 'pro_yearly':
      return '年度会员';
    default:
      return '免费版';
  }
}

function buildFreeResponse() {
  return {
    has_subscription: false,
    is_pro: false,
    current_plan: null,
    subscription_history: [],
    plan: 'free',
    status: 'free',
    expires_at: null,
    features: FREE_FEATURES,
  };
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id') || req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: '缺少用户标识' }, { status: 400 });
    }

    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false });

    if (error || !subscriptions?.length) {
      if (error) {
        console.error('[subscription] falling back to free tier:', error);
      }
      return NextResponse.json(buildFreeResponse());
    }

    const history = subscriptions.map((subscription: any) => ({
      plan_name: subscription.plan_name || getFallbackPlanName(subscription.plan_code),
      status: subscription.status || 'inactive',
      started_at: subscription.started_at || subscription.created_at || new Date(0).toISOString(),
      expires_at: subscription.expires_at || null,
    }));

    const currentSubscription =
      subscriptions.find(
        (subscription: any) =>
          subscription.status === 'active' &&
          (!subscription.expires_at || new Date(subscription.expires_at) > new Date())
      ) ?? subscriptions[0];

    let planFeatures =
      currentSubscription.plan_code?.startsWith('pro') ? PRO_FEATURES : FREE_FEATURES;
    let planName =
      currentSubscription.plan_name || getFallbackPlanName(currentSubscription.plan_code);

    if (currentSubscription.plan_id || currentSubscription.plan_code) {
      const planQuery = currentSubscription.plan_id
        ? supabase.from('subscription_plans').select('*').eq('id', currentSubscription.plan_id).maybeSingle()
        : supabase
            .from('subscription_plans')
            .select('*')
            .eq('plan_code', currentSubscription.plan_code)
            .maybeSingle();

      const { data: planData, error: planError } = await planQuery;
      if (!planError && planData) {
        planFeatures = planData.features || planFeatures;
        planName = planData.plan_name || planName;
      }
    }

    const isPro =
      currentSubscription.plan_code?.startsWith('pro') === true &&
      currentSubscription.status === 'active' &&
      (!currentSubscription.expires_at || new Date(currentSubscription.expires_at) > new Date());

    return NextResponse.json({
      has_subscription: true,
      is_pro: isPro,
      current_plan: {
        plan_code: currentSubscription.plan_code || 'free',
        plan_name: planName,
        features: planFeatures,
        started_at: currentSubscription.started_at || currentSubscription.created_at || new Date().toISOString(),
        expires_at: currentSubscription.expires_at || null,
      },
      subscription_history: history,
      plan: currentSubscription.plan_code || 'free',
      status: currentSubscription.status || 'inactive',
      expires_at: currentSubscription.expires_at || null,
      features: planFeatures,
    });
  } catch (error: any) {
    console.error('[subscription] error:', error);
    return NextResponse.json(buildFreeResponse());
  }
}
