// =====================================================
// Project Socrates - Share Poster Component
// 分享海报组件 (Canvas 生成)
// =====================================================

'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
  Share2,
  Download,
  Copy,
  Check,
  Loader2,
  MessageCircle,
  Link2,
  Image as ImageIcon
} from 'lucide-react';

interface SharePosterProps {
  isOpen: boolean;
  onClose: () => void;
  config: {
    title: string;
    subtitle: string;
    stats: Array<{
      label: string;
      value: string | number;
    }>;
    qrCodeUrl: string;
    avatarUrl?: string;
    userName?: string;
    theme: string;
  };
  inviteCode?: string;
  inviteUrl?: string;
  onShare?: (platform: string) => void;
}

// 主题颜色配置
const THEME_COLORS: Record<string, {
  primary: string;
  secondary: string;
  accent: string;
  gradient: string[];
}> = {
  invite: {
    primary: '#F97316',
    secondary: '#FB923C',
    accent: '#FFEDD5',
    gradient: ['#F97316', '#FB923C']
  },
  achievement: {
    primary: '#8B5CF6',
    secondary: '#A78BFA',
    accent: '#EDE9FE',
    gradient: ['#8B5CF6', '#A78BFA']
  },
  study: {
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#D1FAE5',
    gradient: ['#10B981', '#34D399']
  }
};

export function SharePoster({
  isOpen,
  onClose,
  config,
  inviteCode,
  inviteUrl,
  onShare
}: SharePosterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<'link' | 'code' | null>(null);

  const theme = THEME_COLORS[config.theme] || THEME_COLORS.invite;

  // 生成海报
  const generatePoster = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setGenerating(true);

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 海报尺寸
      const width = 375;
      const height = 600;
      canvas.width = width;
      canvas.height = height;

      // 背景渐变
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, theme.gradient[0]);
      gradient.addColorStop(1, theme.gradient[1]);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 装饰圆圈
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(width - 50, 100, 80, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(50, height - 100, 60, 0, Math.PI * 2);
      ctx.fill();

      // 白色卡片背景
      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, 20, 140, width - 40, height - 200, 20);
      ctx.fill();

      // 标题
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(config.title, width / 2, 70);

      // 副标题
      ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(config.subtitle, width / 2, 105);

      // 用户信息
      if (config.userName) {
        ctx.fillStyle = '#374151';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(config.userName, 40, 180);
      }

      // 统计数据
      const statY = 230;
      const statWidth = (width - 80) / 3;

      config.stats.forEach((stat, index) => {
        const x = 40 + index * statWidth + statWidth / 2;

        ctx.fillStyle = theme.primary;
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(stat.value), x, statY);

        ctx.fillStyle = '#9CA3AF';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillText(stat.label, x, statY + 25);
      });

      // 分割线
      ctx.strokeStyle = '#E5E7EB';
      ctx.beginPath();
      ctx.moveTo(40, statY + 50);
      ctx.lineTo(width - 40, statY + 50);
      ctx.stroke();

      // 二维码区域
      const qrSize = 120;
      const qrX = (width - qrSize) / 2;
      const qrY = 310;

      // 二维码背景
      ctx.fillStyle = '#F3F4F6';
      ctx.fillRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20);

      // 尝试加载二维码图片
      try {
        // 生成简单的二维码占位符
        ctx.fillStyle = '#1F2937';
        ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('扫码加入', qrX + qrSize / 2, qrY + qrSize / 2 - 10);
        ctx.fillText('Socrates', qrX + qrSize / 2, qrY + qrSize / 2 + 10);

        // 绘制简化的二维码样式
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
          ctx.strokeRect(qrX + 10 + i * 20, qrY + 10, 15, 15);
          ctx.strokeRect(qrX + 10 + i * 20, qrY + 95, 15, 15);
        }
      } catch (e) {
        console.error('Failed to draw QR code placeholder:', e);
      }

      // 邀请码
      if (inviteCode) {
        ctx.fillStyle = '#374151';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`邀请码: ${inviteCode}`, width / 2, qrY + qrSize + 40);
      }

      // 底部提示
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.fillText('长按保存图片，分享给好友', width / 2, height - 30);

      // 转换为图片
      const url = canvas.toDataURL('image/png');
      setPosterUrl(url);
    } catch (error) {
      console.error('Failed to generate poster:', error);
    } finally {
      setGenerating(false);
    }
  }, [config, theme, inviteCode]);

  // 圆角矩形辅助函数
  function roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  useEffect(() => {
    if (isOpen) {
      generatePoster();
    }
  }, [isOpen, generatePoster]);

  // 复制到剪贴板
  const copyToClipboard = async (text: string, type: 'link' | 'code') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // 下载海报
  const downloadPoster = () => {
    if (!posterUrl) return;

    const link = document.createElement('a');
    link.download = `socrates-share-${Date.now()}.png`;
    link.href = posterUrl;
    link.click();
  };

  // 分享到平台
  const handleShare = (platform: string) => {
    if (onShare) {
      onShare(platform);
    }

    // 调用原生分享 API（如果可用）
    if (navigator.share && platform === 'native') {
      navigator.share({
        title: config.title,
        text: config.subtitle,
        url: inviteUrl
      }).catch(console.error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            分享给好友
          </DialogTitle>
          <DialogDescription>
            分享你的专属邀请链接，邀请好友一起学习
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 海报预览 */}
          <div className="flex justify-center">
            {generating ? (
              <div className="w-full h-80 flex items-center justify-center bg-gray-100 rounded-lg">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : posterUrl ? (
              <img
                src={posterUrl}
                alt="分享海报"
                className="max-w-full rounded-lg shadow-lg"
              />
            ) : null}
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* 邀请码和链接 */}
          {inviteCode && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">邀请码</p>
                    <p className="font-mono font-bold text-lg">{inviteCode}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(inviteCode, 'code')}
                  >
                    {copied === 'code' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {inviteUrl && (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">邀请链接</p>
                      <p className="text-sm text-gray-700 truncate">{inviteUrl}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(inviteUrl, 'link')}
                    >
                      {copied === 'link' ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 分享按钮 */}
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleShare('wechat')}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
            >
              <MessageCircle className="w-6 h-6 text-green-600" />
              <span className="text-xs text-gray-600">微信</span>
            </button>
            <button
              onClick={() => handleShare('moments')}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
            >
              <ImageIcon className="w-6 h-6 text-green-600" />
              <span className="text-xs text-gray-600">朋友圈</span>
            </button>
            <button
              onClick={() => copyToClipboard(inviteUrl || '', 'link')}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <Link2 className="w-6 h-6 text-blue-600" />
              <span className="text-xs text-gray-600">复制链接</span>
            </button>
            <button
              onClick={downloadPoster}
              className="flex flex-col items-center gap-1 p-3 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors"
            >
              <Download className="w-6 h-6 text-purple-600" />
              <span className="text-xs text-gray-600">保存图片</span>
            </button>
          </div>

          {/* 原生分享（移动端） */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <Button
              onClick={() => handleShare('native')}
              className="w-full"
              variant="outline"
            >
              <Share2 className="w-4 h-4 mr-2" />
              系统分享
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
