// =====================================================
// Project Socrates - Community Posts API
// 社区帖子 API - 发布、获取、更新、删除
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 帖子类型
const POST_TYPES = ['insight', 'question', 'tip', 'mastery', 'error_share'] as const;
const SUBJECTS = ['math', 'chinese', 'english', 'physics', 'chemistry', 'biology', 'history', 'geography', 'other'] as const;

// 敏感词过滤（基础版）
const SENSITIVE_WORDS = ['微信', '手机号', '电话', '地址', '学校名称', 'QQ', 'qq', '加我'];

function containsSensitiveContent(content: string): boolean {
  return SENSITIVE_WORDS.some(word => content.includes(word));
}

// GET - 获取帖子列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get('type');
    const subject = searchParams.get('subject');
    const user_id = searchParams.get('user_id');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('community_posts')
      .select(`
        *,
        community_profiles!community_posts_user_id_fkey (
          nickname,
          avatar_emoji,
          is_parent
        )
      `)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (type && POST_TYPES.includes(type as any)) {
      query = query.eq('post_type', type);
    }
    if (subject && SUBJECTS.includes(subject as any)) {
      query = query.eq('subject', subject);
    }
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (featured === 'true') {
      query = query.eq('is_featured', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 获取当前用户的点赞状态
    const currentUserId = searchParams.get('current_user_id');
    let likedPostIds: string[] = [];

    if (currentUserId && data && data.length > 0) {
      const postIds = data.map(p => p.id);
      const { data: likes } = await supabase
        .from('community_likes')
        .select('post_id')
        .eq('user_id', currentUserId)
        .in('post_id', postIds);
      likedPostIds = (likes || []).map(l => l.post_id);
    }

    // 格式化返回数据
    const posts = (data || []).map(post => ({
      ...post,
      profile: post.community_profiles,
      community_profiles: undefined,
      is_liked: likedPostIds.includes(post.id),
    }));

    return NextResponse.json({ data: posts });
  } catch (error: any) {
    console.error('Posts GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 发布新帖子
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, post_type, content, subject, grade_level, error_session_id, image_url, is_anonymous } = body;

    if (!user_id || !post_type || !content) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    if (!POST_TYPES.includes(post_type)) {
      return NextResponse.json({ error: '无效的帖子类型' }, { status: 400 });
    }

    // 敏感词检测
    if (containsSensitiveContent(content)) {
      return NextResponse.json({
        error: '内容可能包含个人信息，请检查后重新发布',
        hint: '为了保护隐私，请不要在分享中包含联系方式、学校名称等信息哦~'
      }, { status: 400 });
    }

    // 内容长度限制
    if (content.length > 500) {
      return NextResponse.json({ error: '内容太长了，请精简到500字以内' }, { status: 400 });
    }

    // 插入帖子
    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        user_id,
        post_type,
        content,
        subject: subject || null,
        grade_level: grade_level || null,
        error_session_id: error_session_id || null,
        image_url: image_url || null,
        is_anonymous: is_anonymous || false,
      })
      .select(`
        *,
        community_profiles!community_posts_user_id_fkey (
          nickname,
          avatar_emoji,
          is_parent
        )
      `)
      .single();

    if (error) {
      console.error('Error creating post:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 更新用户积分（发布分享 +5）
    await supabase.rpc('update_user_points', {
      p_user_id: user_id,
      p_points: 5
    }).catch(() => {
      // 如果 RPC 不存在，直接更新
      supabase.from('community_profiles')
        .update({ points: supabase.rpc('increment_points', { amount: 5 }) })
        .eq('user_id', user_id);
    });

    return NextResponse.json({
      data: {
        ...data,
        profile: data.community_profiles,
        community_profiles: undefined,
      },
      message: '发布成功！感谢你的分享~'
    });
  } catch (error: any) {
    console.error('Posts POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - 删除帖子
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const post_id = searchParams.get('post_id');
    const user_id = searchParams.get('user_id');

    if (!post_id || !user_id) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 验证帖子所有权
    const { data: post } = await supabase
      .from('community_posts')
      .select('user_id')
      .eq('id', post_id)
      .single();

    if (!post || post.user_id !== user_id) {
      return NextResponse.json({ error: '无权删除此帖子' }, { status: 403 });
    }

    const { error } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', post_id);

    if (error) {
      console.error('Error deleting post:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '删除成功' });
  } catch (error: any) {
    console.error('Posts DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
