// =====================================================
// Project Socrates - Share Poster API
// 分享海报配置 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 分享海报配置
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

// GET - 获取分享海报配置
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type') || 'invite'; // invite, achievement, study

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // 获取用户信息
    const { data: profile } = await supabase
      .from('profiles')
      .select('name, avatar_url')
      .eq('id', userId)
      .single();

    // 获取用户积分
    const { data: points } = await supabase
      .from('socra_points')
      .select('balance, level, streak_days')
      .eq('user_id', userId)
      .single();

    // 获取邀请码
    const { data: inviteCode } = await supabase
      .from('invite_codes')
      .select('code')
      .eq('user_id', userId)
      .single();

    // 获取邀请统计
    const { data: inviteRecords } = await supabase
      .from('invite_records')
      .select('id')
      .eq('inviter_id', userId)
      .eq('status', 'completed');

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://socrates.socra.cn';
    const code = inviteCode?.code || `SC${userId.slice(0, 8).toUpperCase()}`;

    let config: PosterConfig;

    switch (type) {
      case 'achievement':
        config = {
          title: '学习成就达成！',
          subtitle: '我在 Socrates 错题本平台取得了新成就',
          stats: [
            { label: '积分', value: points?.balance || 0 },
            { label: '等级', value: `Lv.${points?.level || 1}` },
            { label: '连续学习', value: `${points?.streak_days || 0}天` }
          ],
          qrCodeUrl: `${siteUrl}/register?ref=${code}`,
          avatarUrl: profile?.avatar_url || undefined,
          userName: profile?.name || undefined,
          theme: 'achievement'
        };
        break;

      case 'study':
        config = {
          title: '今日学习打卡',
          subtitle: '坚持学习，不断进步',
          stats: [
            { label: '积分', value: points?.balance || 0 },
            { label: '连续学习', value: `${points?.streak_days || 0}天` },
            { label: '等级', value: `Lv.${points?.level || 1}` }
          ],
          qrCodeUrl: `${siteUrl}/register?ref=${code}`,
          avatarUrl: profile?.avatar_url || undefined,
          userName: profile?.name || undefined,
          theme: 'study'
        };
        break;

      case 'invite':
      default:
        config = {
          title: '邀请你一起学习',
          subtitle: '加入 Socrates，开启智能学习之旅',
          stats: [
            { label: '已邀请好友', value: inviteRecords?.length || 0 },
            { label: '积分奖励', value: '50分/人' },
            { label: '我的等级', value: `Lv.${points?.level || 1}` }
          ],
          qrCodeUrl: `${siteUrl}/register?ref=${code}`,
          avatarUrl: profile?.avatar_url || undefined,
          userName: profile?.name || undefined,
          theme: 'invite'
        };
    }

    return NextResponse.json({
      success: true,
      config,
      inviteCode: code,
      inviteUrl: `${siteUrl}/register?ref=${code}`
    });
  } catch (error: any) {
    console.error('[Share Poster API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 记录分享行为并发放奖励
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

    // 分享奖励配置
    const shareRewards: Record<string, number> = {
      wechat: 2,
      moments: 3,
      weibo: 2,
      qq: 2,
      link: 1
    };

    const reward = shareRewards[platform] || 1;

    // 每日分享奖励上限检查
    const today = new Date().toISOString().split('T')[0];
    const { data: todayShares } = await supabase
      .from('point_transactions')
      .select('id')
      .eq('user_id', user_id)
      .eq('source', 'share_reward')
      .gte('created_at', today);

    // 每日最多获得 3 次分享奖励
    if ((todayShares?.length || 0) < 3 && reward > 0) {
      await supabase.rpc('add_points', {
        p_user_id: user_id,
        p_amount: reward,
        p_source: 'share_reward',
        p_transaction_type: 'reward',
        p_description: `分享到${platform || '其他平台'}奖励`
      });
    }

    return NextResponse.json({
      success: true,
      reward: reward,
      message: '分享成功'
    });
  } catch (error: any) {
    console.error('[Share Poster API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
