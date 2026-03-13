import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function buildInviteCode(userId: string) {
  return `SC${userId.slice(0, 8).toUpperCase()}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const { data: inviteCodeRecord, error: codeError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (codeError) {
      throw codeError;
    }

    let code = inviteCodeRecord?.code;
    if (!code) {
      code = buildInviteCode(userId);
      const { error: insertCodeError } = await supabase.from('invite_codes').insert({
        user_id: userId,
        code,
        is_active: true,
      });

      if (insertCodeError) {
        throw insertCodeError;
      }
    }

    const { data: inviteRecords, error: recordsError } = await supabase
      .from('invite_records')
      .select('*')
      .eq('inviter_id', userId)
      .order('created_at', { ascending: false });

    if (recordsError) {
      throw recordsError;
    }

    const records = inviteRecords || [];
    const totalInvites = records.length;
    const completedInvites = records.filter((record) => record.status === 'completed').length;
    const pendingInvites = records.filter((record) => record.status === 'pending').length;
    const totalPointsEarned = records
      .filter((record) => record.status === 'completed')
      .reduce((sum, record) => sum + (record.reward_points || 0), 0);
    const pendingPoints = records
      .filter((record) => record.status === 'pending')
      .reduce((sum, record) => sum + (record.reward_points || 0), 0);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${appUrl}/register?ref=${code}`;

    return NextResponse.json({
      invite_code: code,
      invite_url: inviteUrl,
      total_invites: totalInvites,
      completed_invites: completedInvites,
      pending_invites: pendingInvites,
      total_points_earned: totalPointsEarned,
      pending_points: pendingPoints,
      records: records.map((record) => ({
        id: record.id,
        invitee_id: record.invitee_id,
        invitee_name: record.invitee_name || '新用户',
        invitee_avatar: record.invitee_avatar,
        status: record.status,
        created_at: record.created_at,
        completed_at: record.completed_at,
        reward_points: record.reward_points,
      })),
    });
  } catch (error: any) {
    console.error('[Invite API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.user_id as string | undefined;
    const inviteCode = body.invite_code ? String(body.invite_code).toUpperCase() : undefined;

    if (!userId || !inviteCode) {
      return NextResponse.json(
        { error: 'user_id and invite_code are required' },
        { status: 400 }
      );
    }

    const { data: inviteCodeData, error: codeError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', inviteCode)
      .eq('is_active', true)
      .maybeSingle();

    if (codeError || !inviteCodeData) {
      return NextResponse.json({ error: 'Invalid invite code' }, { status: 400 });
    }

    if (inviteCodeData.user_id === userId) {
      return NextResponse.json({ error: 'Cannot use your own invite code' }, { status: 400 });
    }

    const { data: existingInvite, error: existingError } = await supabase
      .from('invite_records')
      .select('id')
      .eq('invitee_id', userId)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existingInvite) {
      return NextResponse.json({ error: 'Invite code already used' }, { status: 400 });
    }

    const { data: inviterProfile } = await supabase
      .from('profiles')
      .select('display_name, name')
      .eq('id', inviteCodeData.user_id)
      .maybeSingle();

    const rewardPoints = 50;
    const { data: inviteRecord, error: recordError } = await supabase
      .from('invite_records')
      .insert({
        inviter_id: inviteCodeData.user_id,
        invitee_id: userId,
        invitee_name: '新用户',
        status: 'pending',
        reward_points: rewardPoints,
      })
      .select()
      .single();

    if (recordError) {
      throw recordError;
    }

    const { error: updateCodeError } = await supabase
      .from('invite_codes')
      .update({
        used_count: (inviteCodeData.used_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inviteCodeData.id);

    if (updateCodeError) {
      throw updateCodeError;
    }

    const registerRewardResult = await supabase.rpc('add_points', {
      p_user_id: userId,
      p_amount: 30,
      p_source: 'invite',
      p_transaction_type: 'reward',
      p_description: 'Invite registration bonus',
      p_related_id: inviteRecord.id,
      p_related_type: 'invite_record',
      p_metadata: {
        invite_code: inviteCode,
        inviter_id: inviteCodeData.user_id,
      },
    });

    if (registerRewardResult.error) {
      throw registerRewardResult.error;
    }

    return NextResponse.json({
      success: true,
      message: 'Invite code accepted',
      inviter_name: inviterProfile?.display_name || inviterProfile?.name || '好友',
      bonus_points: 30,
    });
  } catch (error: any) {
    console.error('[Invite API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const inviteeId = body.invitee_id as string | undefined;

    if (!inviteeId) {
      return NextResponse.json({ error: 'invitee_id is required' }, { status: 400 });
    }

    const { data: inviteRecord, error: recordError } = await supabase
      .from('invite_records')
      .select('*')
      .eq('invitee_id', inviteeId)
      .eq('status', 'pending')
      .maybeSingle();

    if (recordError || !inviteRecord) {
      return NextResponse.json({ error: 'Invite record not found or already completed' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('invite_records')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', inviteRecord.id);

    if (updateError) {
      throw updateError;
    }

    const inviterReward = inviteRecord.reward_points || 50;

    const inviterRewardResult = await supabase.rpc('add_points', {
      p_user_id: inviteRecord.inviter_id,
      p_amount: inviterReward,
      p_source: 'invite',
      p_transaction_type: 'reward',
      p_description: 'Invite completion reward',
      p_related_id: inviteRecord.id,
      p_related_type: 'invite_record',
      p_metadata: {
        invitee_id: inviteeId,
      },
    });

    if (inviterRewardResult.error) {
      throw inviterRewardResult.error;
    }

    const inviteeRewardResult = await supabase.rpc('add_points', {
      p_user_id: inviteeId,
      p_amount: 20,
      p_source: 'invite',
      p_transaction_type: 'reward',
      p_description: 'First study completion bonus',
      p_related_id: inviteRecord.id,
      p_related_type: 'invite_record',
      p_metadata: {
        inviter_id: inviteRecord.inviter_id,
      },
    });

    if (inviteeRewardResult.error) {
      throw inviteeRewardResult.error;
    }

    return NextResponse.json({
      success: true,
      message: 'Invite rewards granted',
      inviter_reward: inviterReward,
      invitee_reward: 20,
    });
  } catch (error: any) {
    console.error('[Invite API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
