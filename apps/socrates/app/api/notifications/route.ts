// =====================================================
// Project Socrates - Notifications API
// 通知系统 API (完整版)
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 通知类型
export type NotificationType =
  | 'review'           // 复习提醒
  | 'task'             // 任务提醒
  | 'task_completed'   // 任务完成
  | 'achievement'      // 成就达成
  | 'points'           // 积分奖励
  | 'streak'           // 连续学习
  | 'subscription'     // 订阅相关
  | 'system';          // 系统通知

// 通知接口
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string | null;
  data: Record<string, any> | null;
  action_url: string | null;
  action_text: string | null;
  is_read: boolean;
  read_at: string | null;
  priority: number;
  expires_at: string | null;
  created_at: string;
}

// GET - 获取通知列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type');
    const isRead = searchParams.get('is_read');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('priority', { ascending: false })
      .range(offset, offset + limit - 1);

    // 筛选条件
    if (type) {
      query = query.eq('type', type);
    }
    if (isRead !== null && isRead !== 'all') {
      query = query.eq('is_read', isRead === 'true');
    }

    // 过滤过期通知
    query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    const { data: notifications, error, count } = await query;

    if (error) throw error;

    // 获取未读数量
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    return NextResponse.json({
      data: notifications || [],
      total: count || 0,
      unread_count: unreadCount || 0,
    });
  } catch (error: any) {
    console.error('[Notifications API] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 创建通知
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      user_id,
      type,
      title,
      content,
      data,
      action_url,
      action_text,
      priority,
      expires_at,
    } = body;

    if (!user_id || !type || !title) {
      return NextResponse.json(
        { error: 'user_id, type, and title are required' },
        { status: 400 }
      );
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        content: content || null,
        data: data || null,
        action_url: action_url || null,
        action_text: action_text || null,
        priority: priority || 0,
        expires_at: expires_at || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      data: notification,
      message: '通知创建成功',
    });
  } catch (error: any) {
    console.error('[Notifications API] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - 标记通知为已读
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { user_id, notification_ids, mark_all_read } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    let markedCount = 0;

    if (mark_all_read) {
      // 标记所有为已读
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user_id)
        .eq('is_read', false)
        .select('id');

      if (error) throw error;
      markedCount = data?.length || 0;
    } else if (notification_ids && notification_ids.length > 0) {
      // 标记指定通知为已读
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user_id)
        .in('id', notification_ids)
        .eq('is_read', false)
        .select('id');

      if (error) throw error;
      markedCount = data?.length || 0;
    } else {
      return NextResponse.json(
        { error: 'Either notification_ids or mark_all_read is required' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: `已标记 ${markedCount} 条通知为已读`,
      marked_count: markedCount,
    });
  } catch (error: any) {
    console.error('[Notifications API] PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - 删除通知
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const userId = searchParams.get('user_id');
    const notificationId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';
    const deleteRead = searchParams.get('read') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    if (deleteAll) {
      // 删除所有通知
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;

      return NextResponse.json({ message: '所有通知已删除' });
    }

    if (deleteRead) {
      // 删除已读通知
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true);

      if (error) throw error;

      return NextResponse.json({ message: '已读通知已删除' });
    }

    if (notificationId) {
      // 删除指定通知
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;

      return NextResponse.json({ message: '通知已删除' });
    }

    return NextResponse.json(
      { error: 'Either id, all=true, or read=true is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Notifications API] DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
