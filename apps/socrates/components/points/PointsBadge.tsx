// =====================================================
// Project Socrates - Points Badge Component
// 积分等级徽章组件
// =====================================================

'use client';

import { cn } from '@/lib/utils';

// 等级配置
const LEVEL_BADGES = [
  { level: 1, name: '学习新手', icon: '🌱', color: 'text-gray-500', bgColor: 'bg-gray-100' },
  { level: 2, name: '学习达人', icon: '🌿', color: 'text-green-600', bgColor: 'bg-green-100' },
  { level: 3, name: '学霸', icon: '🌳', color: 'text-green-500', bgColor: 'bg-green-50' },
  { level: 4, name: '学霸达人', icon: '⭐', color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  { level: 5, name: '学霸之星', icon: '🌟', color: 'text-yellow-600', bgColor: 'bg-yellow-50' },
  { level: 6, name: '学习精英', icon: '💫', color: 'text-purple-500', bgColor: 'bg-purple-100' },
  { level: 7, name: '知识达人', icon: '🔥', color: 'text-orange-500', bgColor: 'bg-orange-100' },
  { level: 8, name: '智慧之星', icon: '💎', color: 'text-blue-500', bgColor: 'bg-blue-100' },
  { level: 9, name: '学霸王者', icon: '👑', color: 'text-amber-500', bgColor: 'bg-amber-100' },
  { level: 10, name: '学神预备', icon: '🏆', color: 'text-warm-500', bgColor: 'bg-warm-100' },
  { level: 11, name: '学神新秀', icon: '🎖️', color: 'text-warm-600', bgColor: 'bg-warm-100' },
  { level: 12, name: '学神达人', icon: '🏅', color: 'text-warm-700', bgColor: 'bg-warm-100' },
  { level: 13, name: '学神大师', icon: '🥇', color: 'text-yellow-500', bgColor: 'bg-yellow-100' },
  { level: 14, name: '学神传奇', icon: '🌈', color: 'text-pink-500', bgColor: 'bg-pink-100' },
  { level: 15, name: '学神至尊', icon: '🎓', color: 'text-warm-600', bgColor: 'bg-warm-100' },
];

function getLevelBadge(level: number) {
  return LEVEL_BADGES.find(b => b.level === level) || LEVEL_BADGES[0];
}

interface PointsBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export function PointsBadge({
  level,
  size = 'md',
  showName = false,
  className
}: PointsBadgeProps) {
  const badge = getLevelBadge(level);

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg'
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          sizeClasses[size],
          badge.bgColor
        )}
        title={badge.name}
      >
        <span>{badge.icon}</span>
      </div>
      {showName && (
        <span className={cn("font-medium", badge.color)}>
          {badge.name}
        </span>
      )}
    </div>
  );
}

interface PointsBadgeWithProgressProps {
  level: number;
  currentXp: number;
  levelStartXp: number;
  levelEndXp: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PointsBadgeWithProgress({
  level,
  currentXp,
  levelStartXp,
  levelEndXp,
  size = 'md',
  className
}: PointsBadgeWithProgressProps) {
  const progress = levelEndXp > levelStartXp
    ? Math.round(((currentXp - levelStartXp) / (levelEndXp - levelStartXp)) * 100)
    : 100;

  const badge = getLevelBadge(level);

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <PointsBadge level={level} size={size} />

      {size === 'lg' && (
        <div className="flex-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>{badge.name}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                badge.bgColor.replace('-100', '-400')
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
