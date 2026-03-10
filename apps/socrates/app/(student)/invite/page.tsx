// =====================================================
// Project Socrates - Invite Friends Page
// 邀请好友页面
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Gift, Users, ChevronRight, Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InviteCodeDisplay } from '@/components/invite/InviteCodeDisplay';
import { InviteRecordsList } from '@/components/invite/InviteRecordsList';

interface InviteStats {
  inviteCode: string;
  inviteUrl: string;
  totalInvites: number;
  completedInvites: number;
  pendingInvites: number;
  totalPointsEarned: number;
  pendingPoints: number;
}

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

// 邀请奖励规则
const INVITE_REWARDS = [
  { invites: 1, reward: 50, description: '邀请第1位好友' },
  { invites: 3, reward: 100, description: '累计邀请3位好友' },
  { invites: 5, reward: 200, description: '累计邀请5位好友' },
  { invites: 10, reward: 500, description: '累计邀请10位好友' },
];

export default function InvitePage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [records, setRecords] = useState<InviteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'invite' | 'records' | 'rewards'>('invite');

  useEffect(() => {
    async function fetchInviteData() {
      if (!user) return;

      try {
        const response = await fetch(`/api/invite?user_id=${user.id}`);
        const data = await response.json();

        setStats({
          inviteCode: data.invite_code || 'SC' + user.id.slice(0, 8).toUpperCase(),
          inviteUrl: data.invite_url || `${window.location.origin}/register?ref=${data.invite_code}`,
          totalInvites: data.total_invites || 0,
          completedInvites: data.completed_invites || 0,
          pendingInvites: data.pending_invites || 0,
          totalPointsEarned: data.total_points_earned || 0,
          pendingPoints: data.pending_points || 0,
        });
        setRecords(data.records || []);
      } catch (error) {
        console.error('Failed to fetch invite data:', error);
        // 设置默认值
        setStats({
          inviteCode: 'SC' + user.id.slice(0, 8).toUpperCase(),
          inviteUrl: `${window.location.origin}/register?ref=SC${user.id.slice(0, 8).toUpperCase()}`,
          totalInvites: 0,
          completedInvites: 0,
          pendingInvites: 0,
          totalPointsEarned: 0,
          pendingPoints: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchInviteData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-warm-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">加载失败，请重试</p>
        <Button onClick={() => window.location.reload()}>重试</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3 mb-6">
        <Gift className="w-8 h-8 text-warm-500" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">邀请好友</h1>
          <p className="text-gray-600">邀请好友注册，双方都能获得积分奖励</p>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-warm-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalInvites}</p>
            <p className="text-xs text-gray-500">已邀请</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.completedInvites}</p>
            <p className="text-xs text-gray-500">已注册</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{stats.totalPointsEarned}</p>
            <p className="text-xs text-gray-500">获得积分</p>
          </CardContent>
        </Card>
      </div>

      {/* 标签切换 */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'invite'
              ? "text-warm-600 border-warm-500"
              : "text-gray-500 border-transparent hover:text-gray-700"
          )}
          onClick={() => setActiveTab('invite')}
        >
          邀请好友
        </button>
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'records'
              ? "text-warm-600 border-warm-500"
              : "text-gray-500 border-transparent hover:text-gray-700"
          )}
          onClick={() => setActiveTab('records')}
        >
          邀请记录
        </button>
        <button
          className={cn(
            "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'rewards'
              ? "text-warm-600 border-warm-500"
              : "text-gray-500 border-transparent hover:text-gray-700"
          )}
          onClick={() => setActiveTab('rewards')}
        >
          奖励规则
        </button>
      </div>

      {/* 邀请好友 */}
      {activeTab === 'invite' && (
        <InviteCodeDisplay
          inviteCode={stats.inviteCode}
          inviteUrl={stats.inviteUrl}
          stats={{
            totalInvites: stats.totalInvites,
            completedInvites: stats.completedInvites,
            pendingPoints: stats.pendingPoints,
          }}
        />
      )}

      {/* 邀请记录 */}
      {activeTab === 'records' && (
        <InviteRecordsList records={records} />
      )}

      {/* 奖励规则 */}
      {activeTab === 'rewards' && (
        <div className="space-y-4">
          <Card className="bg-gradient-to-r from-warm-50 to-orange-50">
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">邀请奖励规则</h3>
              <div className="space-y-3">
                {INVITE_REWARDS.map((reward) => (
                  <div
                    key={reward.invites}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg",
                      stats.completedInvites >= reward.invites
                        ? "bg-green-50"
                        : "bg-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                        stats.completedInvites >= reward.invites
                          ? "bg-green-100 text-green-600"
                          : "bg-gray-100 text-gray-500"
                      )}>
                        {stats.completedInvites >= reward.invites ? '✓' : reward.invites}
                      </div>
                      <span className="text-sm text-gray-700">{reward.description}</span>
                    </div>
                    <span className={cn(
                      "font-bold",
                      stats.completedInvites >= reward.invites ? "text-green-600" : "text-warm-600"
                    )}>
                      +{reward.reward} 积分
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">如何邀请好友？</h3>
              <ol className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-warm-100 text-warm-600 flex items-center justify-center text-xs flex-shrink-0">1</span>
                  <span>复制你的专属邀请码或邀请链接</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-warm-100 text-warm-600 flex items-center justify-center text-xs flex-shrink-0">2</span>
                  <span>分享给好友，好友注册时填写你的邀请码</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-warm-100 text-warm-600 flex items-center justify-center text-xs flex-shrink-0">3</span>
                  <span>好友完成首次学习后，双方都能获得积分奖励</span>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
