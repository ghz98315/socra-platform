import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseAdmin() {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }

  return supabaseAdminInstance;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: parentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('[students] profile lookup failed:', profileError);
      return NextResponse.json({ error: 'Failed to verify account' }, { status: 500 });
    }

    if (!parentProfile || parentProfile.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can view students' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: students, error } = await supabaseAdmin
      .from('profiles')
      .select('id, display_name, grade_level, avatar_url, phone, parent_id')
      .eq('role', 'student')
      .eq('parent_id', user.id)
      .order('display_name', { ascending: true });

    if (error) {
      console.error('[students] fetch failed:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    return NextResponse.json({
      data: students || [],
    });
  } catch (error) {
    console.error('[students] unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
