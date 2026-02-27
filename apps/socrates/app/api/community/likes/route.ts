// =====================================================
// Project Socrates - Community Likes API
// 社区点赞 API
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - 点赞/取消点赞
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { post_id, user_id, action } = body;

    if (!post_id || !user_id) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    if (action === 'unlike') {
      // 取消点赞
      const { error } = await supabase
        .from('community_likes')
        .delete()
        .eq('post_id', post_id)
        .eq('user_id', user_id);

      if (error) {
        console.error('Error unliking post:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({
        liked: false,
        message: '已取消点赞'
      });
    } else {
      // 点赞
      const { error } = await supabase
        .from('community_likes')
        .insert({
          post_id,
          user_id,
        });

      if (error) {
        if (error.code === '23505') {
          // 已点赞
          return NextResponse.json({
            liked: true,
            message: '已经点赞过了'
          });
        }
        console.error('Error liking post:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      // 给帖子作者加积分（被点赞 +2）
      const { data: post } = await supabase
        .from('community_posts')
        .select('user_id')
        .eq('id', post_id)
        .single();

      if (post && post.user_id !== user_id) {
        await supabase
          .from('community_profiles')
          .update({
            points: supabase.rpc('increment', { x: 2 })
          })
          .eq('user_id', post.user_id);
      }

      return NextResponse.json({
        liked: true,
        message: '点赞成功'
      });
    }
  } catch (error: any) {
    console.error('Likes POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET - 检查是否已点赞
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const post_id = searchParams.get('post_id');
    const user_id = searchParams.get('user_id');

    if (!post_id || !user_id) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 });
    }

    const { data } = await supabase
      .from('community_likes')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_id', user_id)
      .single();

    return NextResponse.json({
      liked: !!data
    });
  } catch (error: any) {
    console.error('Likes GET error:', error);
    return NextResponse.json({ liked: false });
  }
}
