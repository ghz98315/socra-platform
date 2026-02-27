// =====================================================
// Project Socrates - Link Requests Panel Component
// 学生端的家长关联请求面板
// =====================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Check,
  X,
  Loader2,
  Clock,
  UserCheck,
  UserX,
  RefreshCw,
  Link2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface LinkRequest {
  id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  created_at: string;
  responded_at: string | null;
  parent: {
    id: string;
    display_name: string;
    phone: string | null;
  };
}

interface LinkedParent {
  id: string;
  display_name: string;
  phone: string | null;
}

interface LinkRequestsPanelProps {
  className?: string;
}

export function LinkRequestsPanel({ className }: LinkRequestsPanelProps) {
  const [requests, setRequests] = useState<LinkRequest[]>([]);
  const [linkedParent, setLinkedParent] = useState<LinkedParent | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/link-requests');
      if (response.ok) {
        const result = await response.json();
        setRequests(result.data.requests || []);
        setLinkedParent(result.data.linkedParent || null);
      }
    } catch (error) {
      console.error('Error loading link requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleAction = async (requestId: string, action: 'accept' | 'reject') => {
    setActionLoading(requestId);
    try {
      const response = await fetch(`/api/link-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        // 重新加载数据
        await loadRequests();
      } else {
        const error = await response.json();
        alert(error.error || '操作失败');
      }
    } catch (error) {
      console.error('Error handling request:', error);
      alert('网络错误，请稍后重试');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <Card className={cn('border-border/50', className)}>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 已关联的家长 */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Link2 className="w-5 h-5 text-green-500" />
            当前关联
          </CardTitle>
          <CardDescription>
            已与您建立关联的家长
          </CardDescription>
        </CardHeader>
        <CardContent>
          {linkedParent ? (
            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">{linkedParent.display_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {linkedParent.phone || '未设置手机号'}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                已关联
              </Badge>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无关联的家长</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 待处理的请求 */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-orange-500" />
                待处理请求
              </CardTitle>
              <CardDescription>
                家长发起的关联请求需要您确认
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadRequests}
              disabled={loading}
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {pendingRequests.length > 0 ? (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="p-4 bg-muted/30 rounded-xl space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                        <span className="text-lg font-bold text-orange-500">
                          {request.parent.display_name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{request.parent.display_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {request.message && (
                    <p className="text-sm text-muted-foreground pl-13">
                      留言：{request.message}
                    </p>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 gap-1"
                      onClick={() => handleAction(request.id, 'accept')}
                      disabled={actionLoading === request.id || !!linkedParent}
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      接受
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1"
                      onClick={() => handleAction(request.id, 'reject')}
                      disabled={actionLoading === request.id}
                    >
                      {actionLoading === request.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                      拒绝
                    </Button>
                  </div>

                  {linkedParent && (
                    <p className="text-xs text-orange-500 text-center">
                      您已关联其他家长，请先解除关联
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无待处理的请求</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 已处理的请求历史 */}
      {processedRequests.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-muted-foreground" />
              历史记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {processedRequests.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between p-3 bg-muted/20 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center",
                      request.status === 'accepted'
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    )}>
                      {request.status === 'accepted' ? (
                        <UserCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <UserX className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{request.parent.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(request.responded_at || request.created_at)}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      request.status === 'accepted'
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    )}
                  >
                    {request.status === 'accepted' ? '已接受' : '已拒绝'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
