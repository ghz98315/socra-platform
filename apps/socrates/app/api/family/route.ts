import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function mapMember(member: {
  id: string;
  user_id: string;
  role: string;
  nickname: string | null;
  joined_at?: string | null;
  created_at?: string | null;
}) {
  return {
    id: member.id,
    userId: member.user_id,
    role: member.role,
    nickname: member.nickname ?? null,
    joinedAt: member.joined_at ?? member.created_at ?? null,
  };
}

async function createAuthedClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

async function getAuthenticatedParent() {
  const supabase = await createAuthedClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('[family] profile lookup failed:', profileError);
    return { error: NextResponse.json({ error: 'Failed to verify account' }, { status: 500 }) };
  }

  if (!profile || profile.role !== 'parent') {
    return { error: NextResponse.json({ error: 'Only parents can manage family data' }, { status: 403 }) };
  }

  return { supabase, userId: user.id };
}

export async function GET() {
  try {
    const auth = await getAuthenticatedParent();
    if (auth.error) {
      return auth.error;
    }

    const { userId } = auth;

    const { data: familyGroup, error: groupError } = await supabaseAdmin
      .from('family_groups')
      .select('*')
      .eq('created_by', userId)
      .maybeSingle();

    if (groupError) {
      console.error('[family] group lookup error:', groupError);
      return NextResponse.json({ family: null, members: [] });
    }

    if (!familyGroup) {
      return NextResponse.json({ family: null, members: [] });
    }

    const { data: members, error: membersError } = await supabaseAdmin
      .from('family_members')
      .select('id, user_id, role, nickname, joined_at, created_at')
      .eq('family_id', familyGroup.id);

    if (membersError) {
      console.error('[family] member lookup error:', membersError);
    }

    const mappedMembers = (members ?? []).map(mapMember);
    const children = mappedMembers.filter((member) => member.role === 'child');

    return NextResponse.json({
      family: {
        id: familyGroup.id,
        name: familyGroup.name,
        inviteCode: familyGroup.invite_code,
        createdBy: familyGroup.created_by,
        createdAt: familyGroup.created_at ?? null,
        role: 'parent',
        members: mappedMembers,
        children,
      },
      members: mappedMembers,
    });
  } catch (error: any) {
    console.error('[family] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedParent();
    if (auth.error) {
      return auth.error;
    }

    const { userId } = auth;
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    const { data: existingFamily } = await supabaseAdmin
      .from('family_groups')
      .select('id')
      .eq('created_by', userId)
      .maybeSingle();

    if (existingFamily) {
      return NextResponse.json({ error: 'Family already exists for this parent' }, { status: 409 });
    }

    const inviteCode = `FM${String(userId).slice(0, 8).toUpperCase()}`;

    const { data: familyGroup, error: groupError } = await supabaseAdmin
      .from('family_groups')
      .insert({
        name,
        created_by: userId,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (groupError) {
      console.error('[family] create family error:', groupError);
      throw groupError;
    }

    const { error: memberError } = await supabaseAdmin.from('family_members').insert({
      family_id: familyGroup.id,
      user_id: userId,
      role: 'parent',
      nickname: '家长',
    });

    if (memberError) {
      console.error('[family] create owner membership error:', memberError);
      throw memberError;
    }

    return NextResponse.json({
      success: true,
      family: {
        id: familyGroup.id,
        name: familyGroup.name,
        inviteCode,
        createdBy: userId,
        createdAt: familyGroup.created_at ?? null,
        role: 'parent',
        members: [],
      },
      members: [],
    });
  } catch (error: any) {
    console.error('[family] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = await getAuthenticatedParent();
    if (auth.error) {
      return auth.error;
    }

    const { userId } = auth;
    const body = await req.json();
    const inviteCode = typeof body.inviteCode === 'string' ? body.inviteCode.trim() : '';
    const targetUserId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const role = body.role === 'parent' ? 'parent' : 'child';
    const nickname = typeof body.nickname === 'string' && body.nickname.trim().length > 0
      ? body.nickname.trim()
      : null;

    if (!inviteCode || !targetUserId) {
      return NextResponse.json({ error: 'inviteCode and userId are required' }, { status: 400 });
    }

    const { data: familyGroup, error: familyError } = await supabaseAdmin
      .from('family_groups')
      .select('*')
      .eq('invite_code', inviteCode)
      .maybeSingle();

    if (familyError || !familyGroup) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    if (familyGroup.created_by !== userId) {
      return NextResponse.json({ error: 'Only the parent owner can add family members' }, { status: 403 });
    }

    const { data: existingMembership } = await supabaseAdmin
      .from('family_members')
      .select('id')
      .eq('user_id', targetUserId)
      .eq('family_id', familyGroup.id)
      .maybeSingle();

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already in this family' }, { status: 400 });
    }

    if (role === 'child') {
      const { data: childProfile, error: childProfileError } = await supabaseAdmin
        .from('profiles')
        .select('id, role, parent_id')
        .eq('id', targetUserId)
        .maybeSingle();

      if (childProfileError || !childProfile) {
        return NextResponse.json({ error: 'Child profile not found' }, { status: 404 });
      }

      if (childProfile.role !== 'student') {
        return NextResponse.json({ error: 'Only student profiles can be added as children' }, { status: 400 });
      }

      if (childProfile.parent_id && childProfile.parent_id !== userId) {
        return NextResponse.json(
          { error: 'This student is already linked to another parent' },
          { status: 400 }
        );
      }
    }

    const { data: member, error: memberError } = await supabaseAdmin
      .from('family_members')
      .insert({
        family_id: familyGroup.id,
        user_id: targetUserId,
        role,
        nickname,
      })
      .select()
      .single();

    if (memberError) {
      console.error('[family] add member error:', memberError);
      throw memberError;
    }

    if (role === 'child') {
      const { error: profileUpdateError } = await supabaseAdmin
        .from('profiles')
        .update({ parent_id: userId })
        .eq('id', targetUserId);

      if (profileUpdateError) {
        console.error('[family] sync parent_id error:', profileUpdateError);
        await supabaseAdmin.from('family_members').delete().eq('id', member.id);
        throw profileUpdateError;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Joined family successfully',
      family: {
        id: familyGroup.id,
        name: familyGroup.name,
        inviteCode: familyGroup.invite_code,
      },
      member: mapMember(member),
    });
  } catch (error: any) {
    console.error('[family] PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await getAuthenticatedParent();
    if (auth.error) {
      return auth.error;
    }

    const { userId } = auth;
    const familyId = req.nextUrl.searchParams.get('family_id');
    const targetUserId = req.nextUrl.searchParams.get('user_id');

    if (!familyId || !targetUserId) {
      return NextResponse.json(
        { error: 'family_id and user_id are required' },
        { status: 400 }
      );
    }

    const { data: familyGroup, error: familyError } = await supabaseAdmin
      .from('family_groups')
      .select('id, created_by')
      .eq('id', familyId)
      .maybeSingle();

    if (familyError || !familyGroup) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    if (familyGroup.created_by !== userId) {
      return NextResponse.json({ error: 'Only the parent owner can remove family members' }, { status: 403 });
    }

    const { data: targetMembership, error: targetError } = await supabaseAdmin
      .from('family_members')
      .select('id, role')
      .eq('family_id', familyId)
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (targetError || !targetMembership) {
      return NextResponse.json({ error: 'Family member not found' }, { status: 404 });
    }

    if (targetMembership.role === 'parent') {
      return NextResponse.json({ error: 'Parent owner cannot be removed here' }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('family_members')
      .delete()
      .eq('family_id', familyId)
      .eq('user_id', targetUserId);

    if (deleteError) {
      console.error('[family] delete member error:', deleteError);
      throw deleteError;
    }

    const { data: removedProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role, parent_id')
      .eq('id', targetUserId)
      .maybeSingle();

    if (
      removedProfile &&
      removedProfile.role === 'student' &&
      removedProfile.parent_id === userId
    ) {
      const { error: clearParentError } = await supabaseAdmin
        .from('profiles')
        .update({ parent_id: null })
        .eq('id', targetUserId);

      if (clearParentError) {
        console.error('[family] clear parent_id error:', clearParentError);
        throw clearParentError;
      }
    }

    return NextResponse.json({ success: true, message: 'Member removed successfully' });
  } catch (error: any) {
    console.error('[family] DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
