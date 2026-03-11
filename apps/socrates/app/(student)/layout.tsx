// =====================================================
// Project Socrates - Student Layout
// 学生端布局 - 包含青少年模式状态和休息提醒
// =====================================================
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useUsageTracker } from '@/hooks/useUsageTracker';
import { RestReminder } from '@/components/compliance/RestReminder';
import { Shield, Clock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = useAuth();
  const { stats, isLoading, currentSessionMinutes } = useUsageTracker();
  const [showRestReminder, setShowRestReminder] = useState(false);

  // 检查是否需要显示休息提醒
  useEffect(() => {
    if (stats?.enabled && stats.restReminderInterval > 0) {
      if (currentSessionMinutes > 0 && currentSessionMinutes % stats.restReminderInterval === 0) {
        setShowRestReminder(true);
      }
    }
  }, [stats?.enabled, stats?.restReminderInterval, currentSessionMinutes]);

  const handleRestStart = () => {
    console.log('[StudentLayout] Rest started');
  };

  const handleRestEnd = () => {
    console.log('[StudentLayout] Rest ended');
    setShowRestReminder(false);
  };

  const handleCloseRestReminder = () => {
    setShowRestReminder(false);
  };

  // 检查是否可以继续使用
  const canContinueUsing = !stats?.enabled ||
    (stats.isWithinAllowedHours && !stats.isTimeExceeded);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果超出时间限制，显示警告
  if (stats?.enabled && stats.isTimeExceeded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">今日学习时长已用完</h2>
              <p className="text-sm text-gray-500">青少年模式限制</p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            你今天已经学习了 <span className="font-semibold text-red-600">{stats.usedToday}</span> 分钟，
            达到了每日 <span className="font-semibold">{stats.dailyLimit}</span> 分钟的限制。
          </p>
          <p className="text-gray-500 text-sm">
            请休息一下，明天继续学习！如有疑问，请联系家长调整设置。
          </p>
        </div>
      </div>
    );
  }

  // 如果不在允许时段， 显示警告
  if (stats?.enabled && !stats.isWithinAllowedHours) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">当前时段不可用</h2>
              <p className="text-sm text-gray-500">青少年模式限制</p>
            </div>
          </div>
          <p className="text-gray-600">
            当前时间不在允许使用的时段内。请在规定时段内使用本应用。
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* 青少年模式状态指示器 */}
      {stats?.enabled && (
        <div className="fixed bottom-4 left-4 right-4 z-40 bg-amber-50 border border-amber-200 rounded-lg p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-amber-700">
                娡式 | 剩余 {stats.remaining} 分钟
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                今日: {stats.usedToday}/{stats.dailyLimit} 分钟
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 页面内容 */}
      {children}

      {/* 休息提醒弹窗 */}
      <RestReminder
        isOpen={showRestReminder}
        onClose={handleCloseRestReminder}
        currentSessionMinutes={currentSessionMinutes}
        restReminderInterval={stats?.restReminderInterval || 45}
        forceRestDuration={stats?.forceRestDuration || 15}
        onRestStart={handleRestStart}
        onRestEnd={handleRestEnd}
      />
    </>
  );
}
