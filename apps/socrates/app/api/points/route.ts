import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalizeRpcRow<T>(data: T | T[] | null): T | null {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id') || req.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('get_user_points', { p_user_id: userId });

    if (error) {
      console.error('[Points API] Error fetching points:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      normalizeRpcRow(data) || {
        balance: 0,
        total_earned: 0,
        total_spent: 0,
        level: 1,
        level_name: 'Bronze',
        streak_days: 0,
        longest_streak: 0,
        next_level_points: 100,
        progress_to_next: 0,
      }
    );
  } catch (error: any) {
    console.error('[Points API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, amount, source, transaction_type, related_id, related_type, description, metadata } = body;

    if (!user_id || !amount || !source) {
      return NextResponse.json(
        { error: 'user_id, amount and source are required' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'amount must be positive' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('add_points', {
      p_user_id: user_id,
      p_amount: amount,
      p_source: source,
      p_transaction_type: transaction_type || 'earn',
      p_related_id: related_id,
      p_related_type: related_type,
      p_description: description,
      p_metadata: metadata || {},
    });

    if (error) {
      console.error('[Points API] Error adding points:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const result = normalizeRpcRow(data);
    return NextResponse.json({
      success: Boolean(result?.success),
      new_balance: result?.new_balance ?? null,
      new_level: result?.new_level ?? null,
    });
  } catch (error: any) {
    console.error('[Points API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
