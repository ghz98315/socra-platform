import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const query = (req.nextUrl.searchParams.get('q') || '').trim();

    if (!query) {
      return NextResponse.json({ users: [] });
    }

    const normalizedQuery = query.replace(/\s+/g, '');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, phone, role')
      .or(`display_name.ilike.%${query}%,phone.ilike.%${normalizedQuery}%`)
      .limit(10);

    if (error) {
      console.error('[users/search] query error:', error);
      throw error;
    }

    return NextResponse.json({
      users: (data ?? []).map((user: any) => ({
        id: user.id,
        display_name: user.display_name || '未命名用户',
        phone: user.phone || null,
        role: user.role || 'student',
      })),
    });
  } catch (error: any) {
    console.error('[users/search] error:', error);
    return NextResponse.json({ error: error.message, users: [] }, { status: 500 });
  }
}
