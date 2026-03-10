// =====================================================
// Project Socrates - Invite Code Display Component
// 邀请码展示组件
// =====================================================

'use client';

import { useState } from 'react';
import { Copy, Check, Gift, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface InviteCodeDisplayProps {
  inviteCode: string;
  inviteUrl: string;
  stats?: {
    totalInvites: number;
    completedInvites: number;
    pendingPoints: number;
  };
  className?: string;
}

export function InviteCodeDisplay({
  inviteCode,
  inviteUrl,
  stats,
  className
}: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const handleShare = (platform: 'wechat' | 'copy') => {
    if (platform === 'wechat') {
      // 微信分享
      if (typeof window !== 'undefined') {
        const wx = (window as any).wx;
        if (wx?.shareAppMessage) {
          wx.shareAppMessage({
            title: '邀请你一起学习',
            desc: `使用我的邀请码 ${inviteCode} 注册，送你免费学习权益！`,
            link: inviteUrl
          });
        }
      }
      setShowShareMenu(false);
    } else if (platform === 'copy') {
      handleCopy(inviteUrl);
      setShowShareMenu(false);
    }
  };

  return (
    <div className={cn("bg-white rounded-2xl p-6 border border-gray-200", className)}>
      {/* 标题 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gift className="w-8 h-8 text-warm-500" />
          <h2 className="text-xl font-bold text-gray-900">邀请好友</h2>
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-4">邀请好友注册，一起获得学习权益</p>

      {/* 邀请码卡片 */}
      <div className="bg-gradient-to-r from-warm-50 to-orange-50 rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">我的邀请码</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleCopy(inviteCode)}
            className="flex items-center gap-1"
          >
            <code className="text-2xl font-mono text-warm-600 bg-warm-50 px-3 py-2 rounded-lg">
              {inviteCode}
            </code>
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </Button>
        </div>
      </div>

      {/* 邀请链接 */}
      <div className="mb-4">
        <label className="text-sm text-gray-600 mb-2 block">邀请链接</label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inviteUrl}
            readOnly
            className="flex-1 px-3 py-2 border rounded-lg bg-gray-50 text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(inviteUrl)}
          >
            复制链接
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center p-3 bg-warm-50 rounded-lg">
            <p className="text-2xl font-bold text-warm-600">{stats.totalInvites}</p>
            <p className="text-xs text-gray-500">已邀请</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{stats.completedInvites}</p>
            <p className="text-xs text-gray-500">已注册</p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{stats.pendingPoints || 0}</p>
            <p className="text-xs text-gray-500">待获得</p>
          </div>
        </div>
      )}

      {/* 分享按钮 */}
      <div className="flex gap-2 mt-4">
        <Button
          variant="outline"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={() => setShowShareMenu(true)}
        >
          <span className="text-green-500 font-bold">微信</span>
          分享给好友
        </Button>
        <Button
          variant="outline"
          className="flex-1 flex items-center justify-center gap-2"
          onClick={() => handleShare('copy')}
        >
          <Copy className="w-4 h-4" />
          复制链接
        </Button>
      </div>

      {/* 分享菜单 */}
      {showShareMenu && (
        <div className="fixed bottom-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900">分享到</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowShareMenu(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-2">
            <Button
              className="w-full"
              onClick={() => handleShare('wechat')}
            >
              <span className="text-green-500 font-bold">微信</span>
              <span className="ml-2">分享给好友</span>
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleShare('copy')}
            >
              <Copy className="w-4 h-4" />
              <span className="ml-2">复制链接</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
