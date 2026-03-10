// =====================================================
// Project Socrates - Points Display Component
// 积分显示组件
// =====================================================

'use client';

import { Star, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePoints } from '@/hooks/usePoints';

// 等级配置
const LEVEL_CONFIGS = [
  { level: 1, name: '学习新手', icon: '🌱', minPoints: 0 },
  { level: 2, name: '学习达人', icon: '🌿', minPoints: 100 },
  { level: 3, name: '学霸', icon: '🌳', minPoints: 300 },
  { level: 4, name: '学霸达人', icon: '⭐', minPoints: 500 },
  { level: 5, name: '学霸之星', icon: '🌟', minPoints: 800 },
  { level: 6, name: '学习精英', icon: '💫', minPoints: 1200 },
  { level: 7, name: '知识达人', icon: '🔥', minPoints: 1800 },
  { level: 8, name: '智慧之星', icon: '💎', minPoints: 2500 },
  { level: 9, name: '学霸王者', icon: '👑', minPoints: 3500 },
  { level: 10, name: '学神预备', icon: '🏆', minPoints: 5000 },
  { level: 11, name: '学神新秀', icon: '🎖️', minPoints: 7000 },
  { level: 12, name: '学神达人', icon: '🏅', minPoints: 9000 },
  { level: 13, name: '学神大师', icon: '🥇', minPoints: 12000 },
  { level: 14, name: '学神传奇', icon: '🌈', minPoints: 15000 },
  { level: 15, name: '学神至尊', icon: '🎓', minPoints: 20000 },
];

interface PointsDisplayProps {
  compact?: boolean;
  showProgress?: boolean;
  className?: string;
}

export function PointsDisplay({
  compact = false,
  showProgress = false,
  className
}: PointsDisplayProps) {
  const { points, loading } = usePoints();

  if (loading || !points) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  const levelConfig = LEVEL_CONFIGS.find(l => l.level === points.level) || LEVEL_CONFIGS[0];
  const progress = points.next_level_points
    ? Math.min(100, (points.total_earned / points.next_level_points) * 100)
    : 100;

  // 紧凑模式 - 用于导航栏
  if (compact) {
    return (
      <div className={cn("flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-warm-50 to-orange-50 rounded-full border border-warm-200", className)}>
        <span className="text-sm">{levelConfig.icon}</span>
        <span className="text-sm font-medium text-warm-700">{points.balance}</span>
        <Star className="w-3 h-3 text-warm-400" />
      </div>
    );
  }

  // 完整模式
  return (
    <div className={cn("bg-gradient-to-br from-warm-50 to-orange-50 rounded-2xl p-4 border border-warm-100", className)}>
      {/* 等级信息 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{levelConfig.icon}</span>
          <div>
            <p className="font-bold text-gray-900">Lv.{points.level} {levelConfig.name}</p>
            <p className="text-xs text-muted-foreground">连续学习 {points.streak_days} 天</p>
          </div>
        </div>
        <Sparkles className="w-5 h-5 text-warm-400" />
      </div>

      {/* 当前积分 */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 bg-white rounded-xl p-3 border border-warm-100">
          <p className="text-xs text-muted-foreground mb-1">当前积分</p>
          <p className="text-2xl font-bold text-warm-600">{points.balance.toLocaleString()}</p>
        </div>
      </div>

      {/* 升级进度 */}
      {showProgress && points.next_level_points && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">升级进度</span>
            <span className="font-medium text-foreground">
              {points.total_earned.toLocaleString()} / {points.next_level_points.toLocaleString()}
            </span>
          </div>
          <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-warm-400 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            距离下一等级还需 {(points.next_level_points - points.total_earned).toLocaleString()} 积分
          </p>
        </div>
      )}

      {/* 已满级提示 */}
      {showProgress && !points.next_level_points && (
        <div className="flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl">
          <span className="text-xl">🎓</span>
          <span className="font-medium text-warm-700">恭喜！已达最高等级</span>
        </div>
      )}
    </div>
  );
}
