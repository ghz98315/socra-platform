'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Clock, Loader2, Shield } from 'lucide-react';

import { RestReminder } from '@/components/compliance/RestReminder';
import { useUsageTracker } from '@/hooks/useUsageTracker';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getRoleHome } from '@/lib/navigation/role-home';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, profile, accountProfile, loading: authLoading } = useAuth();
  const { stats, isLoading, currentSessionMinutes } = useUsageTracker();
  const [showRestReminder, setShowRestReminder] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!profile) {
      return;
    }

    if (profile.role !== 'student') {
      if (accountProfile?.role === 'parent') {
        router.replace('/select-profile');
        return;
      }

      router.replace(getRoleHome(profile.role));
    }
  }, [accountProfile?.role, authLoading, profile, router, user]);

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

  if (authLoading || !user || !profile || profile.role !== 'student' || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-amber-500" />
          <p className="mt-4 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (stats?.enabled && stats.isTimeExceeded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">今日学习时长已用完</h2>
              <p className="text-sm text-gray-500">青少年模式限制</p>
            </div>
          </div>
          <p className="mb-4 text-gray-600">
            你今天已经学习了 <span className="font-semibold text-red-600">{stats.usedToday}</span>{' '}
            分钟，达到了每日 <span className="font-semibold">{stats.dailyLimit}</span> 分钟的限制。
          </p>
          <p className="text-sm text-gray-500">
            请先休息一下，明天再继续学习。如需调整限制，请联系家长账号处理。
          </p>
        </div>
      </div>
    );
  }

  if (stats?.enabled && !stats.isWithinAllowedHours) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <Clock className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">当前时段不可使用</h2>
              <p className="text-sm text-gray-500">青少年模式限制</p>
            </div>
          </div>
          <p className="text-gray-600">
            当前时间不在允许使用的时段内，请在规定时间内继续使用本应用。
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {stats?.enabled ? (
        <div className="fixed bottom-4 left-4 right-4 z-40 rounded-lg border border-amber-200 bg-amber-50 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-amber-700">青少年模式 | 剩余 {stats.remaining} 分钟</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                今日: {stats.usedToday}/{stats.dailyLimit} 分钟
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {children}

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
