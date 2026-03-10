// =====================================================
// Project Socrates - Invite Records List Component
// 邀请记录列表组件
// =====================================================

'use client';

import { useState } from 'react';
import { Gift, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface InviteRecord {
  id: string;
  invitee_id: string;
  invitee_name: string;
  invitee_avatar: string | null;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  completed_at: string | null;
  reward_points: number;
}

interface InviteRecordsListProps {
  records: InviteRecord[];
  className?: string;
}

export function InviteRecordsList({
  records,
  className
}: InviteRecordsListProps) {
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">待注册</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">已完成</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-500">已取消</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-500">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'completed':
        return <Check className="w-4 h-4 text-green-500" />;
      default:
        return <Gift className="w-4 h-4 text-gray-400" />;
    }
  };

  if (records.length === 0) {
    return (
      <div className={cn("text-center py-8 text-gray-500", className)}>
        <p className="text-lg">还没有邀请记录</p>
        <p className="text-sm text-gray-400">邀请好友注册后即可获得积分奖励</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {records.map((record) => (
        <Card
          key={record.id}
          className={cn(
            "cursor-pointer hover:shadow-md transition-all",
            selectedRecord === record.id && "ring-2 ring-warm-500"
          )}
          onClick={() => setSelectedRecord(selectedRecord === record.id ? null : record.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(record.status)}
                {record.invitee_avatar ? (
                  <img
                    src={record.invitee_avatar}
                    alt={record.invitee_name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-warm-700">
                      {record.invitee_name?.[0] || '?'}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm text-gray-600">{record.invitee_name}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(record.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {getStatusBadge(record.status)}
                {record.reward_points !== undefined && record.reward_points > 0 && (
                  <div className="flex items-center gap-1 text-sm text-warm-600">
                    <Gift className="w-4 h-4" />
                    <span>+{record.reward_points} 积分</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
