// =====================================================
// Project Socrates - Student Bottom Status Bar
// 底部状态栏组件 - 显示积分、等级、 连续学习天数
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { usePoints } from '@/hooks/usePoints';
import { PointsBadge } from '@/components/points/PointsBadge';
import { cn } from '@/lib/utils';
import {
  Award
  Flame
  Target
  Clock
  Book
  Coffee
} from 'lucide-react';

interface BottomStatusBarProps {
  className?: string;
}

export function BottomStatusBar({ className }: BottomStatusBarProps) {
  const { user } = useAuth();
  const { pointsData } = usePoints();
  const [currentTime, setCurrentTime] = useState(new Date());

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  if (!user || !pointsData) return null;

  const level = pointsData?.level || 1;
  const levelName = pointsData?.level_name || '青铜学童';
  const balance = pointsData?.balance || 0;
  const streakDays = pointsData?.streakDays || 0;
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-4 z-40 bg-white border-t border-gray-200 shadow-lg",
      className={cn("p-2 flex items-center justify-between text-xs", className)}
      )}
      {/* 左侧 - 积分信息 */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
          <Flame className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-lg font-bold text-gray-900">{balance.toLocaleString()}</div>
          <div className="text-xs text-gray-500">{levelName}</div>
        </div>
      </div>

      {/* 中间 - 等级和 连续天数 */}
      <div className="flex items-center gap-4">
        <PointsBadge level={level} size="sm" showName />
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Lv.{level}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600">
          <Target className="w-4 h-4 text-orange-500" />
          <span>{streakDays} 天</span>
          {streakDays > 0 && (
            <span className="text-orange-500">🔥</span>
          )}
        </div>
      </div>

      {/* 右侧 - 当前时间 */}
      <div className="text-right text-sm text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{formatTime(currentTime)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Book className="w-4 h-4" />
          <a href="/knowledge" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
            知识图谱
          </a>
        </div>
        <div className="flex items-center gap-1">
          <Coffee className="w-4 h-4" />
          <a href="/settings" className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
            休息提醒
          </a>
        </div>
      </div>
    </div>
  );
}
