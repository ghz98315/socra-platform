// =====================================================
// Project Socrates - Family Management API
// 家庭管理 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 获取用户的家庭信息
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 获取用户创建的家庭
    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .select('*')
      .eq('created_by', userId)
      .single();

    if (groupError && groupError.code !== 'PGRST116') {
      // 用户没有创建家庭，返回空家庭
      return NextResponse.json({
        family: null,
        members: []
      });
    }

    if (!familyGroup) {
      return NextResponse.json({
        family: null,
        members: []
      });
    }

    // 获取家庭成员
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select('id, user_id, role, nickname, joined_at')
      .eq('family_id', (familyGroup as any).id);

    const familyMembers = members || [];
    const children = familyMembers.filter((m: any) => m.role === 'child').map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      role: m.role,
      nickname: m.nickname,
      joinedAt: m.joined_at
    }));

    // 获取邀请码
    const inviteCode = (familyGroup as any)?.invite_code;

    return NextResponse.json({
      family: {
        id: (familyGroup as any).id,
        name: (familyGroup as any).name,
        inviteCode,
        createdBy: userId,
        role: 'parent',
        members: familyMembers,
        children
      }
    });
  } catch (error: any) {
    console.error('[Family API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 创建家庭
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, createdBy } = body;

    if (!name || !createdBy) {
      return NextResponse.json(
        { error: 'name and createdBy are required' },
        { status: 400 }
      );
    }

    // 生成邀请码
    const inviteCode = 'FM' + createdBy.slice(0, 8).toUpperCase();

    // 创建家庭
    const { data: familyGroup, error: groupError } = await supabase
      .from('family_groups')
      .insert({
        name,
        created_by: createdBy,
        invite_code: inviteCode
      } as any)
      .select()
      .single();

    if (groupError) {
      console.error('[Family API] Error creating family:', groupError);
      throw groupError;
    }

    // 创建者自动成为家长
    await supabase
      .from('family_members')
      .insert({
        family_id: (familyGroup as any).id,
        user_id: createdBy,
        role: 'parent',
        nickname: '家长'
      } as any);

    return NextResponse.json({
      success: true,
      family: {
        id: (familyGroup as any).id,
        name: (familyGroup as any).name,
        inviteCode,
        createdBy,
        role: 'parent',
        members: []
      }
    });
  } catch (error: any) {
    console.error('[Family API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - 加入家庭（通过邀请码)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { inviteCode, userId, role, nickname } = body;

    if (!inviteCode || !userId) {
      return NextResponse.json(
        { error: 'inviteCode and userId are required' },
        { status: 400 }
      );
    }

    // 查找邀请码对应的家庭
    const { data: familyGroup, error: familyError } = await supabase
      .from('family_groups')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (familyError || !familyGroup) {
      return NextResponse.json(
        { error: '无效的邀请码' },
        { status: 400 }
      );
    }

    // 检查用户是否已在家庭中
    const { data: existingMembership } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', userId)
      .eq('family_id', (familyGroup as any).id)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: '您已经是该家庭的成员' },
        { status: 400 }
      );
    }

    // 添加成员
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_id: (familyGroup as any).id,
        user_id: userId,
        role: role || 'child',
        nickname: nickname || null
      } as any)
      .select()
      .single();

    if (memberError) {
      console.error('[Family API] Error adding member:', memberError);
      throw memberError;
    }

    return NextResponse.json({
      success: true,
      message: '成功加入家庭',
      family: {
        id: (familyGroup as any).id,
        name: (familyGroup as any).name
      },
      member: {
        id: (member as any).id,
        userId: (member as any).user_id,
        role: (member as any).role,
        nickname: (member as any).nickname
      }
    });
  } catch (error: any) {
    console.error('[Family API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - 移除家庭成员
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const familyId = searchParams.get('family_id');
    const targetUserId = searchParams.get('user_id');
    const requestUserId = searchParams.get('request_user_id');

    if (!familyId || !targetUserId || !requestUserId) {
      return NextResponse.json(
        { error: 'family_id, user_id and request_user_id are required' },
        { status: 400 }
      );
    }

    // 检查请求者权限
    const { data: requester, error: requesterError } = await supabase
      .from('family_members')
      .select('role')
      .eq('family_id', familyId)
      .eq('user_id', requestUserId)
      .single();

    if (requesterError || !requester) {
      return NextResponse.json(
        { error: '无权限操作' },
        { status: 403 }
      );
    }

    // 只有家长可以移除成员
    if ((requester as any).role !== 'parent') {
      return NextResponse.json(
        { error: '只有家长可以移除家庭成员' },
        { status: 403 }
      );
    }

    // 移除成员
    const { error: deleteError } = await supabase
      .from('family_members')
      .delete()
      .eq('family_id', familyId)
      .eq('user_id', targetUserId);

    if (deleteError) {
      console.error('[Family API] Error deleting member:', deleteError);
      throw deleteError;
    }

    return NextResponse.json({
      success: true,
      message: '成员已移除'
    });
  } catch (error: any) {
    console.error('[Family API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
