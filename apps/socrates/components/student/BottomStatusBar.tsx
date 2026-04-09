'use client';

import { useEffect, useState } from 'react';
import { Award, Book, Clock, Coffee, Flame, Target } from 'lucide-react';
import { PointsBadge } from '@/components/points/PointsBadge';
import { usePoints } from '@/hooks/usePoints';
import { cn } from '@/lib/utils';

interface BottomStatusBarProps {
  className?: string;
}

export function BottomStatusBar({ className }: BottomStatusBarProps) {
  const { points } = usePoints();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  if (!points) {
    return null;
  }

  const level = points.level || 1;
  const levelName = points.level_name || '新手';
  const balance = points.balance || 0;
  const streakDays = points.streak_days || 0;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur',
        className
      )}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2 text-xs">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
            <Flame className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-foreground">{balance.toLocaleString()} 积分</div>
            <div className="truncate text-muted-foreground">{levelName}</div>
          </div>
        </div>

        <div className="hidden items-center gap-4 text-sm text-muted-foreground sm:flex">
          <div className="flex items-center gap-1">
            <PointsBadge level={level} size="sm" showName />
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4 text-amber-500" />
            <span>Lv.{level}</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4 text-orange-500" />
            <span>{streakDays} 天</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="hidden items-center gap-1 sm:flex">
            <Book className="h-4 w-4" />
            <a href="/knowledge" className="hover:text-foreground">
              知识库
            </a>
          </div>
          <div className="hidden items-center gap-1 sm:flex">
            <Coffee className="h-4 w-4" />
            <a href="/settings" className="hover:text-foreground">
              设置
            </a>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{currentTime.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
