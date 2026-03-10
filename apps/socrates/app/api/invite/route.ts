// =====================================================
// Project Socrates - Invite API
// 邀请系统 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 获取邀请信息
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 获取用户的邀请码
    const { data: inviteCode, error: codeError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('user_id', userId)
      .single();

    // 如果没有邀请码，生成一个
    let code = inviteCode?.code;
    if (!code) {
      code = 'SC' + userId.slice(0, 8).toUpperCase();
      await supabase
        .from('invite_codes')
        .insert({
          user_id: userId,
          code,
          is_active: true
        });
    }

    // 获取邀请统计
    const { data: inviteRecords, error: recordsError } = await supabase
      .from('invite_records')
      .select('*')
      .eq('inviter_id', userId)
      .order('created_at', { ascending: false });

    if (recordsError) {
      console.error('[Invite API] Error fetching records:', recordsError);
    }

    // 计算统计数据
    const records = inviteRecords || [];
    const totalInvites = records.length;
    const completedInvites = records.filter(r => r.status === 'completed').length;
    const pendingInvites = records.filter(r => r.status === 'pending').length;
    const totalPointsEarned = records
      .filter(r => r.status === 'completed')
      .reduce((sum, r) => sum + (r.reward_points || 0), 0);
    const pendingPoints = records
      .filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + (r.reward_points || 0), 0);

    // 构建邀请链接
    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/register?ref=${code}`;

    return NextResponse.json({
      invite_code: code,
      invite_url: inviteUrl,
      total_invites: totalInvites,
      completed_invites: completedInvites,
      pending_invites: pendingInvites,
      total_points_earned: totalPointsEarned,
      pending_points: pendingPoints,
      records: records.map(r => ({
        id: r.id,
        invitee_id: r.invitee_id,
        invitee_name: r.invitee_name || '新用户',
        invitee_avatar: r.invitee_avatar,
        status: r.status,
        created_at: r.created_at,
        completed_at: r.completed_at,
        reward_points: r.reward_points
      }))
    });
  } catch (error: any) {
    console.error('[Invite API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 使用邀请码注册
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, invite_code } = body;

    if (!user_id || !invite_code) {
      return NextResponse.json(
        { error: 'user_id and invite_code are required' },
        { status: 400 }
      );
    }

    // 查找邀请码
    const { data: inviteCodeData, error: codeError } = await supabase
      .from('invite_codes')
      .select('*, users!invite_codes_user_id_fkey(id, name, avatar_url)')
      .eq('code', invite_code)
      .eq('is_active', true)
      .single();

    if (codeError || !inviteCodeData) {
      return NextResponse.json(
        { error: '无效的邀请码' },
        { status: 400 }
      );
    }

    // 不能邀请自己
    if (inviteCodeData.user_id === user_id) {
      return NextResponse.json(
        { error: '不能使用自己的邀请码' },
        { status: 400 }
      );
    }

    // 检查是否已经被邀请过
    const { data: existingInvite, error: existingError } = await supabase
      .from('invite_records')
      .select('*')
      .eq('invitee_id', user_id)
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: '您已经使用过邀请码了' },
        { status: 400 }
      );
    }

    // 获取邀请人信息
    const inviter = inviteCodeData.users as any;

    // 创建邀请记录
    const rewardPoints = 50; // 默认奖励积分
    const { data: inviteRecord, error: recordError } = await supabase
      .from('invite_records')
      .insert({
        inviter_id: inviteCodeData.user_id,
        invitee_id: user_id,
        invitee_name: '新用户',
        status: 'pending',
        reward_points: rewardPoints
      })
      .select()
      .single();

    if (recordError) {
      console.error('[Invite API] Error creating record:', recordError);
      throw recordError;
    }

    // 更新邀请码使用次数
    await supabase
      .from('invite_codes')
      .update({
        used_count: (inviteCodeData.used_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', inviteCodeData.id);

    // 给被邀请人发放注册奖励
    await supabase.rpc('add_points', {
      p_user_id: user_id,
      p_amount: 30, // 新用户注册奖励
      p_source: 'invite_register',
      p_transaction_type: 'reward',
      p_description: '使用邀请码注册奖励',
      p_related_id: inviteRecord.id,
      p_related_type: 'invite_record'
    });

    return NextResponse.json({
      success: true,
      message: '邀请码使用成功',
      inviter_name: inviter?.name || '好友',
      bonus_points: 30
    });
  } catch (error: any) {
    console.error('[Invite API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - 完成邀请（好友完成首次学习后调用）
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { invitee_id } = body;

    if (!invitee_id) {
      return NextResponse.json(
        { error: 'invitee_id is required' },
        { status: 400 }
      );
    }

    // 查找邀请记录
    const { data: inviteRecord, error: recordError } = await supabase
      .from('invite_records')
      .select('*')
      .eq('invitee_id', invitee_id)
      .eq('status', 'pending')
      .single();

    if (recordError || !inviteRecord) {
      return NextResponse.json(
        { error: '邀请记录不存在或已完成' },
        { status: 400 }
      );
    }

    // 更新邀请记录状态
    const { error: updateError } = await supabase
      .from('invite_records')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', inviteRecord.id);

    if (updateError) {
      console.error('[Invite API] Error updating record:', updateError);
      throw updateError;
    }

    // 给邀请人发放奖励
    const rewardPoints = inviteRecord.reward_points || 50;
    await supabase.rpc('add_points', {
      p_user_id: inviteRecord.inviter_id,
      p_amount: rewardPoints,
      p_source: 'invite_reward',
      p_transaction_type: 'reward',
      p_description: '邀请好友完成首次学习奖励',
      p_related_id: inviteRecord.id,
      p_related_type: 'invite_record'
    });

    // 给被邀请人发放额外奖励
    await supabase.rpc('add_points', {
      p_user_id: invitee_id,
      p_amount: 20, // 完成首次学习额外奖励
      p_source: 'invite_bonus',
      p_transaction_type: 'reward',
      p_description: '完成首次学习奖励',
      p_related_id: inviteRecord.id,
      p_related_type: 'invite_record'
    });

    return NextResponse.json({
      success: true,
      message: '邀请奖励已发放',
      inviter_reward: rewardPoints,
      invitee_reward: 20
    });
  } catch (error: any) {
    console.error('[Invite API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
