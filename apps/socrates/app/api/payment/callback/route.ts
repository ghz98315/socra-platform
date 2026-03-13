import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FALLBACK_PLAN_DURATION: Record<string, number> = {
  pro_monthly: 30,
  pro_quarterly: 90,
  pro_yearly: 365,
};

function xmlResponse(returnCode: 'SUCCESS' | 'FAIL', returnMsg: string) {
  return new NextResponse(
    `<xml><return_code><![CDATA[${returnCode}]]></return_code><return_msg><![CDATA[${returnMsg}]]></return_msg></xml>`,
    { headers: { 'Content-Type': 'application/xml' } }
  );
}

function extractXmlValue(xml: string, field: string) {
  const cdataMatch = xml.match(new RegExp(`<${field}><!\\[CDATA\\[(.*?)\\]\\]><\\/${field}>`));
  if (cdataMatch) {
    return cdataMatch[1];
  }

  const plainMatch = xml.match(new RegExp(`<${field}>(.*?)<\\/${field}>`));
  return plainMatch?.[1] ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const orderNo = extractXmlValue(body, 'out_trade_no');
    const transactionId = extractXmlValue(body, 'transaction_id');
    const resultCode = extractXmlValue(body, 'result_code') || 'FAIL';

    if (!orderNo) {
      return xmlResponse('FAIL', 'Missing order number');
    }

    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_no', orderNo)
      .maybeSingle();

    if (orderError || !order) {
      console.error('[payment/callback] order not found:', orderNo, orderError);
      return xmlResponse('FAIL', 'Order not found');
    }

    if (order.payment_status === 'paid') {
      return xmlResponse('SUCCESS', 'OK');
    }

    if (resultCode !== 'SUCCESS') {
      await supabase
        .from('payment_orders')
        .update({
          payment_status: 'failed',
          callback_data: { raw: body },
          updated_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      return xmlResponse('SUCCESS', 'OK');
    }

    await supabase
      .from('payment_orders')
      .update({
        payment_status: 'paid',
        out_trade_no: transactionId,
        paid_at: new Date().toISOString(),
        callback_data: { raw: body },
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id);

    const { data: planData } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_code', order.plan_code)
      .maybeSingle();

    const durationDays = planData?.duration_days ?? FALLBACK_PLAN_DURATION[order.plan_code] ?? 30;
    const startedAt = new Date().toISOString();
    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    const existingSubResult = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('user_id', order.user_id)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const subscriptionPayload = {
      user_id: order.user_id,
      plan_id: planData?.id ?? order.plan_id ?? null,
      plan_code: order.plan_code,
      plan_name: planData?.plan_name ?? order.plan_name ?? order.plan_code,
      status: 'active',
      started_at: startedAt,
      expires_at: expiresAt,
      payment_method: order.payment_method,
      payment_id: transactionId,
      paid_amount: order.paid_amount,
      coupon_id: order.coupon_id,
      coupon_code: order.coupon_code,
      discount_amount: order.discount_amount,
      updated_at: new Date().toISOString(),
    };

    if (!existingSubResult.error && existingSubResult.data?.id) {
      await supabase
        .from('user_subscriptions')
        .update(subscriptionPayload)
        .eq('id', existingSubResult.data.id);
    } else {
      await supabase.from('user_subscriptions').insert(subscriptionPayload);
    }

    const bonusPoints = planData?.features?.bonus_points;
    if (bonusPoints && bonusPoints > 0) {
      const addPointsResult = await supabase.rpc('add_points', {
        p_user_id: order.user_id,
        p_amount: bonusPoints,
        p_source: 'subscription',
        p_transaction_type: 'reward',
        p_description: `Subscription bonus for ${subscriptionPayload.plan_name}`,
        p_related_id: null,
        p_related_type: 'payment_order',
        p_metadata: {
          payment_order_id: order.id,
          order_no: order.order_no,
          plan_code: order.plan_code,
        },
      });

      if (addPointsResult.error) {
        console.error('[payment/callback] bonus points failed:', addPointsResult.error);
      }
    }

    return xmlResponse('SUCCESS', 'OK');
  } catch (error: any) {
    console.error('[payment/callback] error:', error);
    return xmlResponse('FAIL', 'Processing failed');
  }
}
