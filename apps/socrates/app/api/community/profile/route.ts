// =====================================================
// Project Socrates - Community Profile API
// 社区用户档案 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 可爱的昵称前缀和后缀
const NICKNAME_PREFIXES = ['快乐', '聪明', '勇敢', '可爱', '活泼', '机智', '阳光', '甜甜', '小小', '大大'];
const NICKNAME_SUFFIXES = ['小熊', '兔子', '猫咪', '狗狗', '小鸟', '小鱼', '小虎', '小狮', '小鹿', '小狐'];
const AVATAR_EMOJIS = ['🐻', '🐰', '🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🦉', '🦋', '🐳', '🦄', '🌟', '🌈', '🍎'];

// 生成随机可爱昵称
function generateNickname(): string {
  const prefix = NICKNAME_PREFIXES[Math.floor(Math.random() * NICKNAME_PREFIXES.length)];
  const suffix = NICKNAME_SUFFIXES[Math.floor(Math.random() * NICKNAME_SUFFIXES.length)];
  const num = Math.floor(Math.random() * 100);
  return `${prefix}${suffix}${num}`;
}

// 生成随机头像emoji
function generateAvatarEmoji(): string {
  return AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
}

// GET - 获取用户社区档案
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const user_id = searchParams.get('user_id');

    if (!user_id) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
    }

    let { data, error } = await supabase
      .from('community_profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    // 如果档案不存在，自动创建
    if (error && error.code === 'PGRST116') {
      // 获取用户角色
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user_id)
        .single();

      const { data: newProfile, error: createError } = await supabase
        .from('community_profiles')
        .insert({
          user_id,
          nickname: generateNickname(),
          avatar_emoji: generateAvatarEmoji(),
          is_parent: profile?.role === 'parent',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating community profile:', createError);
        return NextResponse.json({ error: createError.message }, { status: 500 });
      }

      data = newProfile;
    } else if (error) {
      console.error('Error fetching community profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error('Profile GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT - 更新用户社区档案
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, nickname, avatar_emoji, bio } = body;

    if (!user_id) {
      return NextResponse.json({ error: '缺少用户ID' }, { status: 400 });
    }

    // 昵称长度限制
    if (nickname && (nickname.length < 2 || nickname.length > 12)) {
      return NextResponse.json({ error: '昵称长度需要在2-12个字符之间' }, { status: 400 });
    }

    // 昵称敏感词检测
    const SENSITIVE_WORDS = ['管理员', '官方', '客服', '老师', 'admin'];
    if (nickname && SENSITIVE_WORDS.some(word => nickname.includes(word))) {
      return NextResponse.json({ error: '这个昵称不能使用哦，换一个吧~' }, { status: 400 });
    }

    const updateData: Record<string, any> = {};
    if (nickname) updateData.nickname = nickname;
    if (avatar_emoji) updateData.avatar_emoji = avatar_emoji;
    if (bio !== undefined) updateData.bio = bio;

    const { data, error } = await supabase
      .from('community_profiles')
      .update(updateData)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating community profile:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      message: '更新成功！'
    });
  } catch (error: any) {
    console.error('Profile PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
