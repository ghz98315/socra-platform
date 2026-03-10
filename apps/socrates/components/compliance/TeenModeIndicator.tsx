// =====================================================
// Project Socrates - Teen Mode Indicator
// 青少年模式提示组件
// =====================================================

'use client';

import { useState } from 'react';
import { Shield, AlertCircle, Clock, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TeenModeIndicatorProps {
  enabled: boolean;
  dailyLimit: number;        // 每日限制 (分钟)
  usedToday: number;          // 今日已用 (分钟)
  remainingMinutes: number;      // 今日剩余 (分钟)
  isTimeExceeded: boolean;      // 是否超时
  currentSessionStart: Date | null; // 当前会话开始时间
  onTimeExceeded?: () => void;                // 超时回调
  onRest?: () => void;                 // 休息提醒
}

export function TeenModeIndicator({
  enabled,
  dailyLimit,
  usedToday,
  remainingMinutes,
  isTimeExceeded,
  currentSessionStart,
  onTimeExceeded,
  onRest
}: TeenModeIndicatorProps) {
  const [showRestModal, setShowRestModal] = useState(false);

  // 计算使用时间
  const sessionDuration = currentSessionStart
    ? Math.floor((Date.now() - currentSessionStart.getTime()) / 60000)
    : 0;

  const usedPercentage = dailyLimit > 0 ? Math.min(100, Math.max(0, (usedToday / dailyLimit) * 100)) : 0;

  const shouldShowRest = usedPercentage >= 45 && !onRest; // 45分钟提醒休息

  if (shouldShowRest) {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-amber-50 border border-amber-200 rounded-lg shadow-lg animate-slide-up">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <p className="font-medium text-gray-900">休息时间到了</p>
          </div>
          <p className="text-sm text-gray-600 mb-3">
            建议休息一下，保护视力
          </p>
          <Button
            onClick={() => setShowRestModal(false)}
            className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-md hover:bg-amber-200"
          >
            知道了
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Shield className={cn(
        "w-5 h-5",
        enabled ? "text-amber-500" : "text-gray-400"
      )} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className={cn(
            "text-sm font-medium",
            isTimeExceeded ? "text-red-600" : enabled ? "text-amber-600" : "text-gray-600"
          )}>
            {isTimeExceeded ? "今日时长已用完" : `剩余 ${remainingMinutes} 分钟`}
          </span>
          <span className="text-xs text-gray-500">
            {usedToday}/{dailyLimit} 分钟
          </span>
        </div>

        {/* 进度条 */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300",
              isTimeExceeded ? "bg-red-500" : enabled ? "bg-amber-500" : "bg-gray-300"
            )}
            style={{ width: `${Math.min(usedPercentage, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
