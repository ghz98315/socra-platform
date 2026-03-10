// =====================================================
// Project Socrates - Payment Order API
// 支付订单创建 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 生成订单号
function generateOrderNo(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SC${timestamp}${random}`;
}

// 微信支付配置
const WECHAT_PAY_CONFIG = {
  appId: process.env.WECHAT_APP_ID || '',
  mchId: process.env.WECHAT_MCH_ID || '',
  apiKey: process.env.WECHAT_API_KEY || '',
  notifyUrl: process.env.WECHAT_NOTIFY_URL || '',
};

// 创建微信支付签名
function createWechatSign(params: Record<string, string>, apiKey: string): string {
  const sortedKeys = Object.keys(params).sort();
  const stringA = sortedKeys
    .filter(key => params[key] !== '' && params[key] !== undefined)
    .map(key => `${key}=${params[key]}`)
    .join('&');
  const stringSignTemp = `${stringA}&key=${apiKey}`;
  return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
}

// POST - 创建支付订单
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, plan_code, payment_method, coupon_code } = body;

    // 参数验证
    if (!user_id || !plan_code || !payment_method) {
      return NextResponse.json(
        { error: 'user_id, plan_code and payment_method are required' },
        { status: 400 }
      );
    }

    if (!['wechat', 'alipay'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'Invalid payment_method' },
        { status: 400 }
      );
    }

    // 获取计划信息
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('plan_code', plan_code)
      .eq('is_active', true)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    // 免费计划直接返回
    if (plan.price === 0) {
      return NextResponse.json({
        error: 'Cannot create order for free plan',
        message: '免费计划无需支付'
      }, { status: 400 });
    }

    // 检查用户是否已有有效订阅
    const { data: existingSub } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user_id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (existingSub) {
      return NextResponse.json({
        error: 'User already has active subscription',
        message: '您已有有效的订阅，请等待到期后再续费'
      }, { status: 400 });
    }

    // 计算价格
    let originalAmount = plan.price;
    let discountAmount = 0;
    let couponId = null;

    // 应用优惠码
    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code)
        .eq('is_active', true)
        .single();

      if (!couponError && coupon) {
        // 检查优惠码是否适用于该计划
        if (coupon.applicable_plans.length === 0 || coupon.applicable_plans.includes(plan_code)) {
          // 检查使用次数
          if (coupon.max_uses === 0 || coupon.current_uses < coupon.max_uses) {
            // 检查有效期
            const now = new Date();
            const isValid = (!coupon.valid_from || new Date(coupon.valid_from) <= now) &&
                           (!coupon.valid_until || new Date(coupon.valid_until) >= now);

            if (isValid) {
              couponId = coupon.id;

              if (coupon.discount_type === 'percentage') {
                discountAmount = originalAmount * (coupon.discount_value / 100);
              } else if (coupon.discount_type === 'fixed') {
                discountAmount = coupon.discount_value;
              }

              // 折扣不超过原价
              discountAmount = Math.min(discountAmount, originalAmount);
            }
          }
        }
      }
    }

    const paidAmount = originalAmount - discountAmount;

    // 生成订单号
    const orderNo = generateOrderNo();

    // 创建支付订单
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .insert({
        user_id,
        order_no: orderNo,
        plan_id: plan.id,
        plan_code: plan.plan_code,
        plan_name: plan.plan_name,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        paid_amount: paidAmount,
        payment_method,
        payment_status: 'pending',
        coupon_id: couponId,
        coupon_code,
        expired_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30分钟过期
      })
      .select()
      .single();

    if (orderError) {
      console.error('[Payment] Error creating order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // 根据支付方式生成支付参数
    let paymentParams = null;

    if (payment_method === 'wechat') {
      // 微信支付参数
      const wechatParams = {
        appid: WECHAT_PAY_CONFIG.appId,
        mch_id: WECHAT_PAY_CONFIG.mchId,
        nonce_str: crypto.randomBytes(16).toString('hex'),
        body: `Socrates ${plan.plan_name}`,
        out_trade_no: orderNo,
        total_fee: String(Math.round(paidAmount * 100)), // 分，转为字符串
        spbill_create_ip: '127.0.0.1', // 客户端IP
        notify_url: WECHAT_PAY_CONFIG.notifyUrl,
        trade_type: 'JSAPI', // 或 NATIVE
        openid: '', // 用户openid (JSAPI需要)
      };

      const sign = createWechatSign(wechatParams, WECHAT_PAY_CONFIG.apiKey);

      paymentParams = {
        ...wechatParams,
        sign,
        orderNo,
        amount: paidAmount,
      };
    } else if (payment_method === 'alipay') {
      // 支付宝支付参数 (简化版)
      paymentParams = {
        orderNo,
        amount: paidAmount,
        subject: `Socrates ${plan.plan_name}`,
        body: plan.plan_name,
      };
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_no: orderNo,
        plan_name: plan.plan_name,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        paid_amount: paidAmount,
        expires_at: order.expired_at,
      },
      payment: paymentParams,
    });
  } catch (error: any) {
    console.error('[Payment] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
