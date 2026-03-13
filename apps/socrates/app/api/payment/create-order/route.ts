import crypto from 'crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_PLANS: Record<
  string,
  { id: string; plan_code: string; plan_name: string; price: number; duration_days: number }
> = {
  pro_monthly: {
    id: 'plan_monthly_001',
    plan_code: 'pro_monthly',
    plan_name: 'Monthly Pro',
    price: 29.9,
    duration_days: 30,
  },
  pro_quarterly: {
    id: 'plan_quarterly_001',
    plan_code: 'pro_quarterly',
    plan_name: 'Quarterly Pro',
    price: 79.9,
    duration_days: 90,
  },
  pro_yearly: {
    id: 'plan_yearly_001',
    plan_code: 'pro_yearly',
    plan_name: 'Yearly Pro',
    price: 239.9,
    duration_days: 365,
  },
};

const TEST_COUPONS: Record<
  string,
  { id: string; code: string; discount_type: 'percentage' | 'fixed'; discount_value: number }
> = {
  WELCOME10: {
    id: 'coupon_welcome10',
    code: 'WELCOME10',
    discount_type: 'percentage',
    discount_value: 10,
  },
  SAVE20: {
    id: 'coupon_save20',
    code: 'SAVE20',
    discount_type: 'percentage',
    discount_value: 20,
  },
  PRO30: {
    id: 'coupon_pro30',
    code: 'PRO30',
    discount_type: 'percentage',
    discount_value: 30,
  },
};

function generateOrderNo() {
  return `SC${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function calculateDiscount(
  amount: number,
  coupon:
    | { discount_type: 'percentage' | 'fixed'; discount_value: number }
    | null
    | undefined
) {
  if (!coupon) {
    return 0;
  }

  const rawDiscount =
    coupon.discount_type === 'percentage'
      ? amount * (coupon.discount_value / 100)
      : coupon.discount_value;

  return Math.min(Number(rawDiscount.toFixed(2)), amount);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, plan_code, payment_method, coupon_code } = body;
    const normalizedCouponCode = coupon_code ? String(coupon_code).toUpperCase() : null;

    if (!user_id || !plan_code || !payment_method) {
      return NextResponse.json(
        { error: 'user_id, plan_code and payment_method are required' },
        { status: 400 }
      );
    }

    if (!['wechat', 'alipay'].includes(payment_method)) {
      return NextResponse.json({ error: 'Invalid payment_method' }, { status: 400 });
    }

    let useTestData = false;
    let plan: any = null;

    const { data: dbPlan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_code', plan_code)
      .eq('is_active', true)
      .maybeSingle();

    if (!planError && dbPlan) {
      plan = dbPlan;
    } else {
      useTestData = true;
      plan = TEST_PLANS[plan_code];
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const existingSubResult = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (!existingSubResult.error && existingSubResult.data) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    let coupon: any = null;
    if (normalizedCouponCode) {
      if (useTestData) {
        coupon = TEST_COUPONS[normalizedCouponCode] ?? null;
      } else {
        const couponResult = await supabase
          .from('coupons')
          .select('*')
          .eq('code', normalizedCouponCode)
          .eq('is_active', true)
          .maybeSingle();
        coupon = couponResult.error ? null : couponResult.data;
      }
    }

    const originalAmount = Number(plan.price);
    const discountAmount = calculateDiscount(originalAmount, coupon);
    const paidAmount = Number((originalAmount - discountAmount).toFixed(2));
    const orderNo = generateOrderNo();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    let order: any = {
      id: `order_${Date.now()}`,
      order_no: orderNo,
      user_id,
      plan_id: plan.id,
      plan_code: plan.plan_code,
      plan_name: plan.plan_name,
      original_amount: originalAmount,
      discount_amount: discountAmount,
      paid_amount: paidAmount,
      payment_method,
      payment_status: 'pending',
      coupon_id: coupon?.id ?? null,
      coupon_code: coupon?.code ?? normalizedCouponCode,
      expired_at: expiresAt,
    };

    if (!useTestData) {
      const { data: dbOrder, error: orderError } = await supabase
        .from('payment_orders')
        .insert(order)
        .select()
        .single();

      if (!orderError && dbOrder) {
        order = dbOrder;
      } else if (orderError) {
        console.error('[payment/create-order] using fallback mock order:', orderError);
      }
    }

    const successUrl = `/payment/success?order_id=${order.id}&plan=${plan.plan_code}&amount=${paidAmount}`;
    const payment = {
      method: payment_method,
      testMode: useTestData,
      redirectUrl: successUrl,
      wechatPayParams:
        payment_method === 'wechat'
          ? {
              orderNo,
              amount: paidAmount,
              appId: process.env.WECHAT_APP_ID || '',
            }
          : null,
      alipayUrl: payment_method === 'alipay' ? successUrl : null,
    };

    return NextResponse.json({
      success: true,
      orderId: order.id,
      order: {
        id: order.id,
        order_no: orderNo,
        plan_code: plan.plan_code,
        plan_name: plan.plan_name,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        paid_amount: paidAmount,
        expires_at: expiresAt,
      },
      payment,
      wechatPayParams: payment.wechatPayParams,
      alipayUrl: payment.alipayUrl,
      redirectUrl: payment.redirectUrl,
    });
  } catch (error: any) {
    console.error('[payment/create-order] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
