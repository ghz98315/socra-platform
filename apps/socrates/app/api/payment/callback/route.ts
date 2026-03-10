// =====================================================
// Project Socrates - Payment Callback API
// 支付回调 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - 处理支付回调
export async function POST(req: NextRequest) {
  try {
    const body = await req.text();

    // 解析微信支付回调 XML
    // 注意：实际项目中需要验证签名
    const orderNoMatch = body.match(/<out_trade_no><!\[CDATA\[(.*?)\]\]><\/out_trade_no>/);
    const transactionIdMatch = body.match(/<transaction_id><!\[CDATA\[(.*?)\]\]><\/transaction_id>/);
    const resultCodeMatch = body.match(/<result_code><!\[CDATA\[(.*?)\]\]><\/result_code>/);

    if (!orderNoMatch) {
      return new NextResponse(
        '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[缺少订单号]]></return_msg></xml>',
        { headers: { 'Content-Type': 'application/xml' } }
      );
    }

    const orderNo = orderNoMatch[1];
    const transactionId = transactionIdMatch ? transactionIdMatch[1] : null;
    const resultCode = resultCodeMatch ? resultCodeMatch[1] : 'FAIL';

    // 查询订单
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('order_no', orderNo)
      .single();

    if (orderError || !order) {
      console.error('[Payment Callback] Order not found:', orderNo);
      return new NextResponse(
        '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[订单不存在]]></return_msg></xml>',
        { headers: { 'Content-Type': 'application/xml' } }
      );
    }

    // 检查订单是否已处理
    if (order.payment_status === 'paid') {
      return new NextResponse(
        '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>',
        { headers: { 'Content-Type': 'application/xml' } }
      );
    }

    if (resultCode === 'SUCCESS') {
      // 支付成功
      // 1. 更新订单状态
      const { error: updateOrderError } = await supabase
        .from('payment_orders')
        .update({
          payment_status: 'paid',
          out_trade_no: transactionId,
          paid_at: new Date().toISOString(),
          callback_data: { raw: body },
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (updateOrderError) {
        console.error('[Payment Callback] Failed to update order:', updateOrderError);
        throw updateOrderError;
      }

      // 2. 获取计划信息
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('plan_code', order.plan_code)
        .single();

      if (planError || !plan) {
        console.error('[Payment Callback] Plan not found:', order.plan_code);
        throw new Error('Plan not found');
      }

      // 3. 创建或更新用户订阅
      const expiresAt = plan.duration_days
        ? new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: order.user_id,
          plan_id: plan.id,
          plan_code: plan.plan_code,
          status: 'active',
          started_at: new Date().toISOString(),
          expires_at: expiresAt,
          payment_method: order.payment_method,
          payment_id: transactionId,
          paid_amount: order.paid_amount,
          coupon_id: order.coupon_id,
          coupon_code: order.coupon_code,
          discount_amount: order.discount_amount,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,plan_id'
        });

      if (subscriptionError) {
        console.error('[Payment Callback] Failed to create subscription:', subscriptionError);
        throw subscriptionError;
      }

      // 4. 如果有赠送积分，添加积分
      const bonusPoints = plan.features?.bonus_points;
      if (bonusPoints && bonusPoints > 0) {
        await supabase.rpc('add_points', {
          p_user_id: order.user_id,
          p_amount: bonusPoints,
          p_source: 'subscription',
          p_transaction_type: 'reward',
          p_description: `订阅 ${plan.plan_name} 赠送积分`,
          p_related_id: order.id,
          p_related_type: 'payment_order'
        });
      }

      console.log('[Payment Callback] Payment success:', orderNo);
    } else {
      // 支付失败
      await supabase
        .from('payment_orders')
        .update({
          payment_status: 'failed',
          callback_data: { raw: body },
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id);

      console.log('[Payment Callback] Payment failed:', orderNo);
    }

    return new NextResponse(
      '<xml><return_code><![CDATA[SUCCESS]]></return_code><return_msg><![CDATA[OK]]></return_msg></xml>',
      { headers: { 'Content-Type': 'application/xml' } }
    );
  } catch (error: any) {
    console.error('[Payment Callback] Error:', error);
    return new NextResponse(
      '<xml><return_code><![CDATA[FAIL]]></return_code><return_msg><![CDATA[处理失败]]></return_msg></xml>',
      { headers: { 'Content-Type': 'application/xml' } }
    );
  }
}
