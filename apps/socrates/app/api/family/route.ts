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

    // 获取家庭成员
    const { data: members, error: membersError } = await supabase
      .from('family_members')
      .select(`
        user_id,
        role,
        nickname,
        joined_at
      `)
      .eq('family_id', familyGroup.id);

    const familyMembers = members || [];
    const children = familyMembers.filter(m => m.role === 'child').map(m => ({
      id: m.id,
      userId: m.user_id,
      role: m.role,
      nickname: m.nickname,
      joinedAt: m.joined_at
    }));

    // 获取邀请码
    const inviteCode = familyGroup?.invite_code;

    return NextResponse.json({
      family: {
        id: familyGroup.id,
        name: familyGroup.name,
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
        { error: 'name and created_by are required' },
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
        created_by,
        invite_code
      })
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
        family_id: familyGroup.id,
        user_id: createdBy,
        role: 'parent',
        nickname: '家长'
      });

    return NextResponse.json({
      success: true,
      family: {
        id: familyGroup.id,
        name: familyGroup.name,
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

// POST - 加入家庭（通过邀请码)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { inviteCode, userId, role, nickname } = body;

    if (!inviteCode || !userId) {
      return NextResponse.json(
        { error: 'invite_code and user_id are required' },
        { status: 400 }
      );
    }

    // 查找邀请码
    const { data: inviteData, error: inviteError } = await supabase
      .from('family_groups')
      .select('*')
      .eq('invite_code', inviteCode)
      .single();

    if (inviteError || !inviteData) {
      return NextResponse.json(
        { error: '无效的邀请码' },
        { status: 400 }
      );
    }

    // 检查用户是否已在其他家庭
    const { data: existingMembership } = await supabase
      .from('family_members')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existingMembership) {
      return NextResponse.json(
        { error: '您已经是其他家庭的成员' },
        { status: 400 }
      );
    }

    // 获取家庭信息
    const { data: familyGroup } = await supabase
      .from('family_groups')
      .select('*')
      .eq('id', inviteData.family_id)
      .single();

    if (!familyGroup) {
      return NextResponse.json(
        { error: '家庭不存在' },
        { status: 404 }
      );
    }

    // 添加成员
    const { data: member, error: memberError } = await supabase
      .from('family_members')
      .insert({
        family_id: familyGroup.id,
        user_id: userId,
        role: role || 'child',
        nickname: nickname || null
      })
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
        id: familyGroup.id,
        name: familyGroup.name
      },
      member: {
        id: member.id,
        userId: member.user_id,
        role: member.role,
        nickname: member.nickname
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
    const userId = searchParams.get('user_id');

    if (!familyId || !userId) {
      return NextResponse.json(
        { error: 'family_id and user_id are required' },
        { status: 400 }
      );
    }

    // 检查权限
    const { data: membership, error: memberError } = await supabase
      .from('family_members')
      .select('family_id, user_id')
      .eq('family_id', familyId)
      .eq('user_id', userId)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        { error: '成员不存在' },
        { status: 404 }
      );
    }

    // 只有家长可以移除成员
    if (membership.role !== 'parent') {
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
      .eq('user_id', userId);

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
