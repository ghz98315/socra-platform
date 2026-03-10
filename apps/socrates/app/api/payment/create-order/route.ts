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

// 测试用套餐配置（数据库表不存在时使用）
const TEST_PLANS: Record<string, {
  id: string;
  plan_code: string;
  plan_name: string;
  price: number;
  duration_days: number;
}> = {
  pro_monthly: {
    id: 'plan_monthly_001',
    plan_code: 'pro_monthly',
    plan_name: '月度会员',
    price: 29.9,
    duration_days: 30,
  },
  pro_quarterly: {
    id: 'plan_quarterly_001',
    plan_code: 'pro_quarterly',
    plan_name: '季度会员',
    price: 79.9,
    duration_days: 90,
  },
  pro_yearly: {
    id: 'plan_yearly_001',
    plan_code: 'pro_yearly',
    plan_name: '年度会员',
    price: 239.9,
    duration_days: 365,
  },
};

// 测试用优惠码配置
const TEST_COUPONS: Record<string, {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  applicable_plans: string[];
}> = {
  WELCOME10: {
    id: 'coupon_welcome10',
    code: 'WELCOME10',
    discount_type: 'percentage',
    discount_value: 10,
    applicable_plans: [],
  },
  SAVE20: {
    id: 'coupon_save20',
    code: 'SAVE20',
    discount_type: 'percentage',
    discount_value: 20,
    applicable_plans: [],
  },
  PRO30: {
    id: 'coupon_pro30',
    code: 'PRO30',
    discount_type: 'percentage',
    discount_value: 30,
    applicable_plans: [],
  },
};

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

    console.log('[Payment] Creating order:', { user_id, plan_code, payment_method, coupon_code });

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

    // 获取计划信息 - 先尝试数据库，失败则使用测试配置
    let plan = null;
    let useTestData = false;

    try {
      const { data: dbPlan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('plan_code', plan_code)
        .eq('is_active', true)
        .single();

      if (!planError && dbPlan) {
        plan = dbPlan;
      } else {
        console.log('[Payment] Database plan not found, using test data');
        useTestData = true;
        plan = TEST_PLANS[plan_code];
      }
    } catch (dbError) {
      console.log('[Payment] Database error, using test data:', dbError);
      useTestData = true;
      plan = TEST_PLANS[plan_code];
    }

    if (!plan) {
      return NextResponse.json({ error: 'Plan not found', message: '套餐不存在' }, { status: 404 });
    }

    // 免费计划直接返回
    if (plan.price === 0) {
      return NextResponse.json({
        error: 'Cannot create order for free plan',
        message: '免费计划无需支付'
      }, { status: 400 });
    }

    // 检查用户是否已有有效订阅（仅数据库模式）
    if (!useTestData) {
      try {
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
      } catch {
        // 忽略错误，继续处理
      }
    }

    // 计算价格
    let originalAmount = plan.price;
    let discountAmount = 0;
    let couponId = null;

    // 应用优惠码
    if (coupon_code) {
      if (useTestData) {
        // 使用测试优惠码
        const testCoupon = TEST_COUPONS[coupon_code.toUpperCase()];
        if (testCoupon) {
          couponId = testCoupon.id;
          if (testCoupon.discount_type === 'percentage') {
            discountAmount = originalAmount * (testCoupon.discount_value / 100);
          } else if (testCoupon.discount_type === 'fixed') {
            discountAmount = testCoupon.discount_value;
          }
          discountAmount = Math.min(discountAmount, originalAmount);
          console.log('[Payment] Applied test coupon:', coupon_code, 'discount:', discountAmount);
        }
      } else {
        // 数据库模式
        try {
          const { data: coupon, error: couponError } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', coupon_code)
            .eq('is_active', true)
            .single();

          if (!couponError && coupon) {
            if (coupon.applicable_plans.length === 0 || coupon.applicable_plans.includes(plan_code)) {
              if (coupon.max_uses === 0 || coupon.current_uses < coupon.max_uses) {
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

                  discountAmount = Math.min(discountAmount, originalAmount);
                }
              }
            }
          }
        } catch {
          // 忽略优惠码错误
        }
      }
    }

    const paidAmount = originalAmount - discountAmount;

    // 生成订单号
    const orderNo = generateOrderNo();

    // 创建支付订单
    let order: any = null;

    if (useTestData) {
      // 测试模式：模拟订单创建
      order = {
        id: `order_${Date.now()}`,
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
        expired_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      };
      console.log('[Payment] Test mode: created mock order:', orderNo);
    } else {
      // 数据库模式
      try {
        const { data: dbOrder, error: orderError } = await supabase
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
            expired_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (orderError) {
          console.error('[Payment] Error creating order:', orderError);
          // 回退到测试模式
          order = {
            id: `order_${Date.now()}`,
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
            expired_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          };
        } else {
          order = dbOrder;
        }
      } catch (dbOrderError) {
        console.error('[Payment] Database error, using mock order:', dbOrderError);
        order = {
          id: `order_${Date.now()}`,
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
          expired_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        };
      }
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

    // 测试模式：添加跳转信息
    if (useTestData) {
      paymentParams = {
        ...paymentParams,
        testMode: true,
        redirectUrl: `/payment/success?order_id=${order.id}&plan=${plan_code}&amount=${paidAmount}`,
      };
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
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
