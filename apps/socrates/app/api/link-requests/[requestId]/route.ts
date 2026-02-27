// =====================================================
// Project Socrates - Link Request Action API
// 处理关联请求（接受/拒绝）
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// PATCH endpoint - 接受或拒绝关联请求
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const { requestId } = await params;
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 获取当前用户
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 解析请求体
    const body = await req.json();
    const { action } = body;

    if (!action || !['accept', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Must be "accept" or "reject"' }, { status: 400 });
    }

    // 获取请求详情
    const { data: linkRequest, error: requestError } = await supabase
      .from('link_requests')
      .select('id, parent_id, student_id, status')
      .eq('id', requestId)
      .single();

    if (requestError || !linkRequest) {
      return NextResponse.json({ error: '请求不存在' }, { status: 404 });
    }

    // 验证当前用户是请求的目标学生
    if (linkRequest.student_id !== user.id) {
      return NextResponse.json({ error: '无权处理此请求' }, { status: 403 });
    }

    // 验证请求状态
    if (linkRequest.status !== 'pending') {
      return NextResponse.json({ error: '该请求已被处理' }, { status: 400 });
    }

    // 如果接受请求，先检查学生是否已有家长
    if (action === 'accept') {
      const { data: studentProfile } = await supabase
        .from('profiles')
        .select('parent_id')
        .eq('id', user.id)
        .single();

      if (studentProfile?.parent_id) {
        return NextResponse.json({ error: '您已关联其他家长，请先解除关联' }, { status: 400 });
      }
    }

    // 更新请求状态
    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const { data: updatedRequest, error: updateError } = await supabase
      .from('link_requests')
      .update({
        status: newStatus,
        responded_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .select(`
        id,
        status,
        responded_at,
        parent:profiles!link_requests_parent_id_fkey (
          id,
          display_name
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating link request:', updateError);
      return NextResponse.json({ error: '处理请求失败' }, { status: 500 });
    }

    // 如果接受请求，更新学生的 parent_id
    // 注意：这个逻辑也在数据库触发器中处理，这里作为备份
    if (action === 'accept') {
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ parent_id: linkRequest.parent_id })
        .eq('id', user.id);

      if (profileUpdateError) {
        console.error('Error updating student parent_id:', profileUpdateError);
        // 不返回错误，因为触发器应该已经处理了
      }

      // 拒绝其他待处理的请求
      await supabase
        .from('link_requests')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('student_id', user.id)
        .eq('status', 'pending')
        .neq('id', requestId);
    }

    return NextResponse.json({
      message: action === 'accept' ? '已接受关联请求' : '已拒绝关联请求',
      data: updatedRequest,
    });
  } catch (error) {
    console.error('Link request action API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
