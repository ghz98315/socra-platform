import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface PosterConfig {
  title: string;
  subtitle: string;
  stats: Array<{
    label: string;
    value: string | number;
  }>;
  qrCodeUrl: string;
  avatarUrl?: string;
  userName?: string;
  theme: string;
}

function buildInviteCode(userId: string) {
  return `SC${userId.slice(0, 8).toUpperCase()}`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type') || 'invite';

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const [{ data: profile }, { data: points }, { data: inviteCode }, { data: inviteRecords }] =
      await Promise.all([
        supabase
          .from('profiles')
          .select('display_name, name, avatar_url')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('socra_points')
          .select('balance, level, streak_days')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('invite_codes')
          .select('code')
          .eq('user_id', userId)
          .maybeSingle(),
        supabase
          .from('invite_records')
          .select('id')
          .eq('inviter_id', userId)
          .eq('status', 'completed'),
      ]);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://socrates.socra.cn';
    const code = inviteCode?.code || buildInviteCode(userId);
    const userName = profile?.display_name || profile?.name || undefined;

    let config: PosterConfig;

    switch (type) {
      case 'achievement':
        config = {
          title: '学习成就达成',
          subtitle: '我在 Socrates 解锁了新的学习里程碑',
          stats: [
            { label: '当前积分', value: points?.balance || 0 },
            { label: '当前等级', value: `Lv.${points?.level || 1}` },
            { label: '连续学习', value: `${points?.streak_days || 0}天` },
          ],
          qrCodeUrl: `${siteUrl}/register?ref=${code}`,
          avatarUrl: profile?.avatar_url || undefined,
          userName,
          theme: 'achievement',
        };
        break;
      case 'study':
        config = {
          title: '今日学习打卡',
          subtitle: '保持节奏，持续进步',
          stats: [
            { label: '当前积分', value: points?.balance || 0 },
            { label: '连续学习', value: `${points?.streak_days || 0}天` },
            { label: '当前等级', value: `Lv.${points?.level || 1}` },
          ],
          qrCodeUrl: `${siteUrl}/register?ref=${code}`,
          avatarUrl: profile?.avatar_url || undefined,
          userName,
          theme: 'study',
        };
        break;
      case 'invite':
      default:
        config = {
          title: '邀请你一起学习',
          subtitle: '加入 Socrates，一起建立更稳定的学习节奏',
          stats: [
            { label: '已邀请好友', value: inviteRecords?.length || 0 },
            { label: '邀请奖励', value: '50积分/人' },
            { label: '我的等级', value: `Lv.${points?.level || 1}` },
          ],
          qrCodeUrl: `${siteUrl}/register?ref=${code}`,
          avatarUrl: profile?.avatar_url || undefined,
          userName,
          theme: 'invite',
        };
        break;
    }

    return NextResponse.json({
      success: true,
      config,
      inviteCode: code,
      inviteUrl: `${siteUrl}/register?ref=${code}`,
    });
  } catch (error: any) {
    console.error('[Share Poster API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, share_type, platform } = body;

    if (!user_id || !share_type) {
      return NextResponse.json(
        { error: 'user_id and share_type are required' },
        { status: 400 }
      );
    }

    const shareRewards: Record<string, number> = {
      wechat: 2,
      moments: 3,
      weibo: 2,
      qq: 2,
      link: 1,
    };

    const reward = shareRewards[platform] || 1;
    const today = new Date().toISOString().split('T')[0];

    const { data: todayShares, error: shareCountError } = await supabase
      .from('point_transactions')
      .select('id')
      .eq('user_id', user_id)
      .eq('source', 'share')
      .gte('created_at', today);

    if (shareCountError) {
      console.error('[Share Poster API] count error:', shareCountError);
    }

    if ((todayShares?.length || 0) < 3 && reward > 0) {
      const addPointsResult = await supabase.rpc('add_points', {
        p_user_id: user_id,
        p_amount: reward,
        p_source: 'share',
        p_transaction_type: 'reward',
        p_description: `Share reward from ${platform || 'other'} platform`,
        p_metadata: {
          share_type,
          platform: platform || null,
        },
      });

      if (addPointsResult.error) {
        console.error('[Share Poster API] add points error:', addPointsResult.error);
      }
    }

    return NextResponse.json({
      success: true,
      reward,
      message: 'Share recorded successfully',
    });
  } catch (error: any) {
    console.error('[Share Poster API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
