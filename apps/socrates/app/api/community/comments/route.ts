// =====================================================
// Project Socrates - Community Comments API
// 社区评论 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 敏感词过滤
const SENSITIVE_WORDS = ['微信', '手机号', '电话', '地址', '学校名称', 'QQ', 'qq', '加我'];

function containsSensitiveContent(content: string): boolean {
  return SENSITIVE_WORDS.some(word => content.includes(word));
}

// GET - 获取评论列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const post_id = searchParams.get('post_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!post_id) {
      return NextResponse.json({ error: '缺少帖子ID' }, { status: 400 });
    }

    // 获取评论
    const { data: comments, error } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', post_id)
      .eq('is_hidden', false)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 如果没有评论，返回空数组
    if (!comments || comments.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 获取用户ID列表
    const userIds = [...new Set(comments.map(c => c.user_id))];

    // 获取社区档案
    const { data: profiles } = await supabase
      .from('community_profiles')
      .select('user_id, nickname, avatar_emoji, is_parent')
      .in('user_id', userIds);

    // 创建档案映射
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    // 格式化评论数据
    const formattedComments = comments.map(comment => ({
      ...comment,
      profile: profileMap.get(comment.user_id) || null,
    }));

    // 构建评论树（支持回复）
    const commentMap = new Map();
    const rootComments: any[] = [];

    formattedComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });

    formattedComments.forEach(comment => {
      const node = commentMap.get(comment.id);
      if (comment.parent_comment_id && commentMap.has(comment.parent_comment_id)) {
        commentMap.get(comment.parent_comment_id).replies.push(node);
      } else {
        rootComments.push(node);
      }
    });

    return NextResponse.json({ data: rootComments });
  } catch (error: any) {
    console.error('Comments GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 发表评论
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_id, user_id, content, parent_comment_id } = body;

    if (!post_id || !user_id || !content) {
      return NextResponse.json({ error: '缺少必要字段' }, { status: 400 });
    }

    // 敏感词检测
    if (containsSensitiveContent(content)) {
      return NextResponse.json({
        error: '内容可能包含个人信息，请检查后重新发布'
      }, { status: 400 });
    }

    // 内容长度限制
    if (content.length > 200) {
      return NextResponse.json({ error: '评论太长了，请精简到200字以内' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('community_comments')
      .insert({
        post_id,
        user_id,
        content,
        parent_comment_id: parent_comment_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 获取用户社区档案
    const { data: profileData } = await supabase
      .from('community_profiles')
      .select('nickname, avatar_emoji, is_parent')
      .eq('user_id', user_id)
      .single();

    return NextResponse.json({
      data: {
        ...data,
        profile: profileData || null,
        replies: [],
      },
      message: '评论成功！'
    });
  } catch (error: any) {
    console.error('Comments POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - 删除评论
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const comment_id = searchParams.get('comment_id');
    const user_id = searchParams.get('user_id');

    if (!comment_id || !user_id) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    // 验证评论所有权
    const { data: comment } = await supabase
      .from('community_comments')
      .select('user_id')
      .eq('id', comment_id)
      .single();

    if (!comment || comment.user_id !== user_id) {
      return NextResponse.json({ error: '无权删除此评论' }, { status: 403 });
    }

    const { error } = await supabase
      .from('community_comments')
      .delete()
      .eq('id', comment_id);

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '删除成功' });
  } catch (error: any) {
    console.error('Comments DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
