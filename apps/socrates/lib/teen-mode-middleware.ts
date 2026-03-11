// =====================================================
// Project Socrates - Teen Mode Middleware
// 青少年模式检查中间件
// =====================================================

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface TeenModeStatus {
  enabled: boolean;
  dailyLimit: number;
  usedToday: number;
  remaining: number;
  isTimeExceeded: boolean;
  isWithinAllowedHours: boolean;
  contentFilterLevel: string;
  restrictedFeatures: string[];
  restReminderInterval: number;
  forceRestDuration: number;
}

// 检查青少年模式状态
export async function checkTeenMode(userId: string): Promise<TeenModeStatus | null> {
  if (!userId) return null;

  try {
    // 获取青少年模式设置
    const { data: teenSettings, error: teenError } = await supabase
      .from('teen_mode_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (teenError && teenError.code !== 'PGRST116') {
      console.error('[teen-mode-middleware] Error fetching settings:', teenError);
      return null;
    }

    // 获取今日使用时长
    const today = new Date().toISOString().split('T')[0];
    const { data: usageLog } = await supabase
      .from('usage_logs')
      .select('total_minutes')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    const usedToday = usageLog?.total_minutes || 0;
    const dailyLimit = teenSettings?.daily_time_limit || 120;
    const remaining = Math.max(dailyLimit - usedToday, 0);
    const isTimeExceeded = remaining <= 0;

    // 检查是否在允许时段内
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
    const timeSlots = teenSettings?.allowed_time_slots || [{ start: '08:00', end: '22:00' }];

    let isWithinAllowedHours = true;
    if (teenSettings?.enabled && timeSlots.length > 0) {
      isWithinAllowedHours = timeSlots.some((slot: { start: string; end: string }) => {
        return currentTime >= slot.start && currentTime <= slot.end;
      });
    }

    return {
      enabled: teenSettings?.enabled || false,
      dailyLimit,
      usedToday,
      remaining,
      isTimeExceeded,
      isWithinAllowedHours,
      contentFilterLevel: teenSettings?.content_filter_level || 'standard',
      restrictedFeatures: teenSettings?.restricted_features || ['social', 'community'],
      restReminderInterval: teenSettings?.rest_reminder_interval || 45,
      forceRestDuration: teenSettings?.force_rest_duration || 15,
    };
  } catch (error) {
    console.error('[teen-mode-middleware] Error:', error);
    return null;
  }
}

// 检查功能是否被限制
export function isFeatureRestricted(
  teenModeStatus: TeenModeStatus | null,
  feature: string
): boolean {
  if (!teenModeStatus?.enabled) return false;
  return teenModeStatus.restrictedFeatures.includes(feature);
}

// 检查是否可以继续使用
export function canContinueUsing(teenModeStatus: TeenModeStatus | null): {
  allowed: boolean;
  reason?: 'time_exceeded' | 'outside_hours' | 'teen_mode_disabled';
} {
  if (!teenModeStatus?.enabled) {
    return { allowed: true, reason: 'teen_mode_disabled' };
  }

  if (teenModeStatus.isTimeExceeded) {
    return { allowed: false, reason: 'time_exceeded' };
  }

  if (!teenModeStatus.isWithinAllowedHours) {
    return { allowed: false, reason: 'outside_hours' };
  }

  return { allowed: true };
}
