// =====================================================
// Project Socrates - Community Featured API
// 精华内容 API（用于落地页展示）
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET - 获取精华帖子（用于落地页轮播）
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const limit = parseInt(searchParams.get('limit') || '10');

    // 获取精华帖子
    const { data, error } = await supabase
      .from('community_posts')
      .select(`
        id,
        content,
        post_type,
        subject,
        grade_level,
        likes_count,
        comments_count,
        featured_at,
        created_at,
        community_profiles!community_posts_user_id_fkey (
          nickname,
          avatar_emoji,
          is_parent
        )
      `)
      .eq('is_featured', true)
      .eq('is_hidden', false)
      .order('featured_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching featured posts:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 格式化返回数据
    const featuredPosts = (data || []).map((post: any) => {
      const profile = Array.isArray(post.community_profiles)
        ? post.community_profiles[0]
        : post.community_profiles;

      return {
        id: post.id,
        content: post.content,
        type: post.post_type,
        subject: post.subject,
        grade: post.grade_level,
        likes: post.likes_count,
        comments: post.comments_count,
        featuredAt: post.featured_at,
        createdAt: post.created_at,
        author: {
          nickname: profile?.nickname || '匿名小伙伴',
          avatar: profile?.avatar_emoji || '🐻',
          isParent: profile?.is_parent || false,
        },
      };
    });

    // 如果没有精华帖子，返回示例数据
    if (featuredPosts.length === 0) {
      return NextResponse.json({
        data: getSampleFeaturedPosts(),
        isSample: true,
      });
    }

    return NextResponse.json({
      data: featuredPosts,
      isSample: false,
    });
  } catch (error: any) {
    console.error('Featured GET error:', error);
    // 出错时返回示例数据
    return NextResponse.json({
      data: getSampleFeaturedPosts(),
      isSample: true,
    });
  }
}

// 示例精华帖子（用于落地页展示，当没有真实数据时使用）
function getSampleFeaturedPosts() {
  return [
    {
      id: 'sample-1',
      content: '今天终于理解了分数除法！原来就是问"有多少个"的问题，AI老师讲得比课本清楚多了~',
      type: 'insight',
      subject: 'math',
      grade: '六年级',
      likes: 128,
      comments: 23,
      author: {
        nickname: '快乐小熊88',
        avatar: '🐻',
        isParent: false,
      },
    },
    {
      id: 'sample-2',
      content: '坚持使用苏格拉底30天，数学从70分提到了95分！感谢AI老师的耐心引导！',
      type: 'mastery',
      subject: 'math',
      grade: '初二',
      likes: 89,
      comments: 15,
      author: {
        nickname: '聪明小兔56',
        avatar: '🐰',
        isParent: false,
      },
    },
    {
      id: 'sample-3',
      content: '孩子以前不敢问问题，现在每天都主动找AI老师讨论，学习兴趣明显提高了！',
      type: 'insight',
      subject: null,
      grade: null,
      likes: 156,
      comments: 42,
      author: {
        nickname: '阳光家长',
        avatar: '🌟',
        isParent: true,
      },
    },
    {
      id: 'sample-4',
      content: '分享一个小技巧：背英语单词的时候，先用AI造3个句子，记忆效果超级好！',
      type: 'tip',
      subject: 'english',
      grade: '初一',
      likes: 67,
      comments: 18,
      author: {
        nickname: '机智小狐23',
        avatar: '🦊',
        isParent: false,
      },
    },
    {
      id: 'sample-5',
      content: '物理终于开窍了！原来摩擦力和生活关系这么大，今天特意观察了刹车痕迹~',
      type: 'mastery',
      subject: 'physics',
      grade: '初三',
      likes: 45,
      comments: 12,
      author: {
        nickname: '勇敢小虎91',
        avatar: '🐯',
        isParent: false,
      },
    },
    {
      id: 'sample-6',
      content: '作为家长，最喜欢看AI和孩子对话的过程，能看到孩子是怎么一步步思考的，比直接给答案有意义多了！',
      type: 'insight',
      subject: null,
      grade: null,
      likes: 203,
      comments: 56,
      author: {
        nickname: '暖心妈妈',
        avatar: '🌈',
        isParent: true,
      },
    },
  ];
}
