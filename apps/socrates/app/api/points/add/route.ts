import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PointSource =
  | 'error_review'
  | 'error_mastered'
  | 'essay'
  | 'invite'
  | 'streak'
  | 'daily_login'
  | 'task'
  | 'achievement'
  | 'subscription'
  | 'share'
  | 'admin';

interface AddPointsRequest {
  user_id: string;
  amount: number;
  source: PointSource;
  transaction_type?: 'earn' | 'reward';
  related_id?: string;
  related_type?: string;
  description?: string;
  metadata?: Record<string, any>;
}

function normalizeRpcRow<T>(data: T | T[] | null): T | null {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const body: AddPointsRequest = await req.json();
    const {
      user_id,
      amount,
      source,
      transaction_type = 'earn',
      related_id,
      related_type,
      description,
      metadata = {},
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'amount must be positive' }, { status: 400 });
    }
    if (!source) {
      return NextResponse.json({ error: 'source is required' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('add_points', {
      p_user_id: user_id,
      p_amount: amount,
      p_source: source,
      p_transaction_type: transaction_type,
      p_related_id: related_id,
      p_related_type: related_type,
      p_description: description,
      p_metadata: metadata,
    });

    if (error) {
      console.error('[Add Points API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = normalizeRpcRow(data);
    return NextResponse.json({
      success: Boolean(result?.success),
      new_balance: result?.new_balance ?? null,
      new_level: result?.new_level ?? null,
    });
  } catch (error: any) {
    console.error('[Add Points API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
