// =====================================================
// Project Socrates - Coupon Validate API
// 优惠码验证 API
// =====================================================

import { NextResponse, from 'next/server';

// 测试优惠码配置
const TEST_COUPONS: Record<string, { code: string; discount: number; description: string; expiresAt: string | null }> = {
  // 10% 折扣
  { 'WELCOME10', discount: 10, description: '新用户欢迎优惠',
  expiresAt: '2026-12-31',
  // 20% 折扣
  { 'SAVE20', discount: 20, description: '限时优惠'
  expiresAt: '2026-06-30',
  // 30% 折扣
  { 'PRO30', discount: 30
 description: 'Pro会员专享'
  expiresAt: '2026-12-31',
  // 50% 折扣(测试用)
  { 'TEST50', discount: 50, description: '测试优惠码-50%折扣'
  expiresAt: '2026-12-31',
  // 免费(测试用)
  { 'FREE100', discount: 100
 description: '测试优惠码-免费'
  expiresAt: '2026-12-31',
};

// GET - 验证优惠码
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code')?.toUpperCase().trim();

    if (!code) {
      return NextResponse.json(
        { valid: false, error: '请输入优惠码' },
        { status: 400 }
      );
    }

    // 查找优惠码
    const coupon = TEST_COUPONS.find(c => c.code === code);

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        error: '优惠码无效'
      });
    }

    // 检查是否过期
    if (coupon.expiresAt) {
      const expiresAt = new Date(coupon.expiresAt);
      if (expiresAt < new Date()) {
        return NextResponse.json({
          valid: false,
          error: '优惠码已过期'
        });
      }
    }

    // 返回验证结果
    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discount: coupon.discount,
      description: coupon.description
    });
  } catch (error: any) {
    console.error('[Coupon Validate API] Error:', error);
    return NextResponse.json(
      { valid: false, error: '验证失败' },
      { status: 500 }
    );
  }
}

// POST - 创建优惠码 (管理用)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, discount, description, expiresAt } = body;

    if (!code || !discount) {
      return NextResponse.json(
        { error: 'code and discount are required' },
        { status: 400 }
      );
    }

    // 检查是否已存在
    const existing = TEST_COUPONS.find(c => c.code === code.toUpperCase());
    if (existing) {
      return NextResponse.json(
        { error: '优惠码已存在' },
        { status: 400 }
      );
    }

    // 添加优惠码
    TEST_COUPONS.push({
      code: code.toUpperCase(),
      discount,
      description: description || '',
      expiresAt: expiresAt || null
    });

    return NextResponse.json({
      success: true,
      message: '优惠码创建成功',
      coupon: TEST_COUPONS[TEST_COUPONS.length - 1]
    });
  } catch (error: any) {
    console.error('[Coupon Create API] Error:', error);
    return NextResponse.json(
      { error: '创建失败' },
      { status: 500 }
    );
  }
}
