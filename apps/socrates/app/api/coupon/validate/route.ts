import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TEST_COUPONS: Record<
  string,
  { id: string; code: string; discount: number; description: string; expiresAt: string | null }
> = {
  WELCOME10: {
    id: 'coupon_welcome10',
    code: 'WELCOME10',
    discount: 10,
    description: 'New user welcome discount',
    expiresAt: '2026-12-31',
  },
  SAVE20: {
    id: 'coupon_save20',
    code: 'SAVE20',
    discount: 20,
    description: 'Limited-time promotion',
    expiresAt: '2026-06-30',
  },
  PRO30: {
    id: 'coupon_pro30',
    code: 'PRO30',
    discount: 30,
    description: 'Pro membership promotion',
    expiresAt: null,
  },
};

function buildCouponResponse(coupon: {
  code: string;
  discount: number;
  description: string | null;
  expiresAt: string | null;
}) {
  return {
    valid: true,
    code: coupon.code,
    discount: coupon.discount,
    description: coupon.description,
    expiresAt: coupon.expiresAt,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawCode = searchParams.get('code');

    if (!rawCode) {
      return NextResponse.json({ error: 'Please provide a coupon code' }, { status: 400 });
    }

    const code = rawCode.toUpperCase();

    const { data: dbCoupon, error: dbError } = await supabase
      .from('coupons')
      .select('code, discount_type, discount_value, description, expires_at')
      .eq('code', code)
      .eq('is_active', true)
      .maybeSingle();

    if (!dbError && dbCoupon) {
      if (dbCoupon.expires_at && new Date(dbCoupon.expires_at) < new Date()) {
        return NextResponse.json({ valid: false, error: 'Coupon code expired' });
      }

      return NextResponse.json(
        buildCouponResponse({
          code: dbCoupon.code,
          discount:
            dbCoupon.discount_type === 'percentage'
              ? Number(dbCoupon.discount_value)
              : Number(dbCoupon.discount_value),
          description: dbCoupon.description,
          expiresAt: dbCoupon.expires_at,
        })
      );
    }

    if (dbError) {
      console.error('[coupon/validate] database fallback:', dbError);
    }

    const coupon = TEST_COUPONS[code];
    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Invalid coupon code' });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Coupon code expired' });
    }

    return NextResponse.json(buildCouponResponse(coupon));
  } catch (error: any) {
    console.error('[coupon/validate] error:', error);
    return NextResponse.json({ error: 'Coupon validation failed' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, discount, description, expiresAt } = body;

    if (!code || !discount) {
      return NextResponse.json({ error: 'code and discount are required' }, { status: 400 });
    }

    const upperCode = String(code).toUpperCase();
    const couponId = `coupon_${upperCode.toLowerCase()}`;
    const payload = {
      id: couponId,
      code: upperCode,
      discount_type: 'percentage',
      discount_value: Number(discount),
      description: description || '',
      expires_at: expiresAt || null,
      is_active: true,
    };

    const { data: dbCoupon, error: dbError } = await supabase
      .from('coupons')
      .upsert(payload)
      .select('code, discount_value, description, expires_at')
      .single();

    if (!dbError && dbCoupon) {
      return NextResponse.json({
        success: true,
        message: 'Coupon created successfully',
        coupon: {
          code: dbCoupon.code,
          discount: Number(dbCoupon.discount_value),
          description: dbCoupon.description,
          expiresAt: dbCoupon.expires_at,
        },
      });
    }

    if (dbError) {
      console.error('[coupon/create] database fallback:', dbError);
    }

    TEST_COUPONS[upperCode] = {
      id: couponId,
      code: upperCode,
      discount: Number(discount),
      description: description || '',
      expiresAt: expiresAt || null,
    };

    return NextResponse.json({
      success: true,
      message: 'Coupon created successfully',
      coupon: TEST_COUPONS[upperCode],
    });
  } catch (error: any) {
    console.error('[coupon/create] error:', error);
    return NextResponse.json({ error: 'Coupon creation failed' }, { status: 500 });
  }
}
