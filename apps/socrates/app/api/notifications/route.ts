// =====================================================
// Project Socrates - Notifications API
// 家长通知推送系统
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 通知类型
export type NotificationType =
  | 'study_complete'      // 学习完成
  | 'review_reminder'     // 复习提醒
  | 'achievement'         // 成就达成
  | 'new_error'           // 新错题
  | 'mastery_update';     // 掌握度更新

// 通知接口
export interface Notification {
  id: string;
  parent_id: string;
  student_id: string;
  student_name?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

// GET - 获取通知列表
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const parent_id = searchParams.get('parent_id');
    const unread_only = searchParams.get('unread_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!parent_id) {
      return NextResponse.json({ error: 'parent_id is required' }, { status: 400 });
    }

    // 模拟通知数据 (实际应从数据库获取)
    const mockNotifications: Notification[] = [
      {
        id: '1',
        parent_id,
        student_id: 'student1',
        student_name: '小明',
        type: 'study_complete',
        title: '学习完成',
        message: '小明刚刚完成了一道数学错题的学习',
        data: { subject: 'math', duration: 15 },
        read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30分钟前
      },
      {
        id: '2',
        parent_id,
        student_id: 'student1',
        student_name: '小明',
        type: 'review_reminder',
        title: '复习提醒',
        message: '小明有3道错题需要复习',
        data: { count: 3 },
        read: false,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2小时前
      },
      {
        id: '3',
        parent_id,
        student_id: 'student1',
        student_name: '小明',
        type: 'achievement',
        title: '成就达成',
        message: '小明已连续学习3天！',
        data: { streak: 3 },
        read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1天前
      },
      {
        id: '4',
        parent_id,
        student_id: 'student1',
        student_name: '小明',
        type: 'mastery_update',
        title: '掌握度提升',
        message: '小明已掌握"勾股定理"知识点',
        data: { concept: '勾股定理' },
        read: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2天前
      },
    ];

    let notifications = mockNotifications;
    if (unread_only) {
      notifications = notifications.filter(n => !n.read);
    }

    // 按时间排序
    notifications.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      data: notifications.slice(0, limit),
      unread_count: mockNotifications.filter(n => !n.read).length,
    });
  } catch (error: any) {
    console.error('Notifications GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 创建新通知
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { parent_id, student_id, student_name, type, title, message, data } = body;

    if (!parent_id || !type || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 创建通知 (实际应存入数据库)
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      parent_id,
      student_id,
      student_name,
      type,
      title,
      message,
      data,
      read: false,
      created_at: new Date().toISOString(),
    };

    // TODO: 存入数据库
    // await supabase.from('notifications').insert(notification);

    return NextResponse.json({
      data: notification,
      message: '通知创建成功',
    });
  } catch (error: any) {
    console.error('Notifications POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - 标记通知为已读
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { notification_id, mark_all_read, parent_id } = body;

    if (mark_all_read && parent_id) {
      // 标记所有通知为已读
      // TODO: await supabase.from('notifications').update({ read: true }).eq('parent_id', parent_id)
      return NextResponse.json({
        message: '所有通知已标记为已读',
      });
    }

    if (notification_id) {
      // 标记单个通知为已读
      // TODO: await supabase.from('notifications').update({ read: true }).eq('id', notification_id)
      return NextResponse.json({
        message: '通知已标记为已读',
      });
    }

    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  } catch (error: any) {
    console.error('Notifications PATCH error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - 删除通知
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const notification_id = searchParams.get('id');

    if (!notification_id) {
      return NextResponse.json({ error: 'notification_id is required' }, { status: 400 });
    }

    // TODO: await supabase.from('notifications').delete().eq('id', notification_id)

    return NextResponse.json({
      message: '通知已删除',
    });
  } catch (error: any) {
    console.error('Notifications DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
