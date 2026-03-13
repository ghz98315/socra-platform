import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function mapMember(member: any) {
  return {
    id: member.id,
    userId: member.user_id,
    role: member.role,
    nickname: member.nickname ?? null,
    joinedAt: member.joined_at ?? member.created_at ?? null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const { data: familyGroup, error: groupError } = await supabase
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

    const { data: members, error: membersError } = await supabase
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
    const body = await req.json();
    const { name, createdBy } = body;

    if (!name || !createdBy) {
      return NextResponse.json({ error: 'name and createdBy are required' }, { status: 400 });
    }

    const inviteCode = `FM${String(createdBy).slice(0, 8).toUpperCase()}`;

    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .insert({
        name,
        created_by: createdBy,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (groupError) {
      console.error('[family] create family error:', groupError);
      throw groupError;
    }

    const { error: memberError } = await supabase.from('family_members').insert({
      family_id: familyGroup.id,
      user_id: createdBy,
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
        createdBy,
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
    const body = await req.json();
    const { inviteCode, userId, role, nickname } = body;

    if (!inviteCode || !userId) {
      return NextResponse.json({ error: 'inviteCode and userId are required' }, { status: 400 });
    }

    const { data: familyGroup, error: familyError } = await supabase
      .from('family_groups')
      .select('*')
      .eq('invite_code', inviteCode)
      .maybeSingle();

    if (familyError || !familyGroup) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    const { data: existingMembership } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', userId)
      .eq('family_id', familyGroup.id)
      .maybeSingle();

    if (existingMembership) {
      return NextResponse.json({ error: 'User is already in this family' }, { status: 400 });
    }

    if ((role || 'child') === 'child') {
      const { data: childProfile, error: childProfileError } = await supabase
        .from('profiles')
        .select('id, role, parent_id')
        .eq('id', userId)
        .maybeSingle();

      if (childProfileError || !childProfile) {
        return NextResponse.json({ error: 'Child profile not found' }, { status: 404 });
      }

      if (childProfile.role !== 'student') {
        return NextResponse.json({ error: 'Only student profiles can be added as children' }, { status: 400 });
      }

      if (childProfile.parent_id && childProfile.parent_id !== familyGroup.created_by) {
        return NextResponse.json(
          { error: 'This student is already linked to another parent' },
          { status: 400 }
        );
      }
    }

    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_id: familyGroup.id,
        user_id: userId,
        role: role || 'child',
        nickname: nickname || null,
      })
      .select()
      .single();

    if (memberError) {
      console.error('[family] add member error:', memberError);
      throw memberError;
    }

    if ((role || 'child') === 'child') {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ parent_id: familyGroup.created_by })
        .eq('id', userId);

      if (profileUpdateError) {
        console.error('[family] sync parent_id error:', profileUpdateError);
        await supabase.from('family_members').delete().eq('id', member.id);
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
    const familyId = req.nextUrl.searchParams.get('family_id');
    const targetUserId = req.nextUrl.searchParams.get('user_id');
    const requestUserId = req.nextUrl.searchParams.get('request_user_id');

    if (!familyId || !targetUserId || !requestUserId) {
      return NextResponse.json(
        { error: 'family_id, user_id and request_user_id are required' },
        { status: 400 }
      );
    }

    const { data: requester, error: requesterError } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', familyId)
      .eq('user_id', requestUserId)
      .maybeSingle();

    if (requesterError || !requester) {
      return NextResponse.json({ error: 'No permission to modify this family' }, { status: 403 });
    }

    if (requester.role !== 'parent') {
      return NextResponse.json({ error: 'Only parents can remove family members' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('family_members')
      .delete()
      .eq('family_id', familyId)
      .eq('user_id', targetUserId);

    if (deleteError) {
      console.error('[family] delete member error:', deleteError);
      throw deleteError;
    }

    const { data: removedProfile } = await supabase
      .from('profiles')
      .select('id, role, parent_id')
      .eq('id', targetUserId)
      .maybeSingle();

    if (
      removedProfile &&
      removedProfile.role === 'student' &&
      removedProfile.parent_id === requestUserId
    ) {
      const { error: clearParentError } = await supabase
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
