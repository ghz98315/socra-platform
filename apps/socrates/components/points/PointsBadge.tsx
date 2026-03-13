'use client';

import { cn } from '@/lib/utils';

const LEVEL_BADGES = [
  { level: 1, name: 'Starter', icon: '1', color: 'text-slate-600', bgColor: 'bg-slate-100' },
  { level: 2, name: 'Learner', icon: '2', color: 'text-green-600', bgColor: 'bg-green-100' },
  { level: 3, name: 'Builder', icon: '3', color: 'text-emerald-600', bgColor: 'bg-emerald-100' },
  { level: 4, name: 'Explorer', icon: '4', color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  { level: 5, name: 'Achiever', icon: '5', color: 'text-amber-600', bgColor: 'bg-amber-100' },
  { level: 6, name: 'Scholar', icon: '6', color: 'text-purple-600', bgColor: 'bg-purple-100' },
  { level: 7, name: 'Expert', icon: '7', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  { level: 8, name: 'Strategist', icon: '8', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  { level: 9, name: 'Champion', icon: '9', color: 'text-cyan-600', bgColor: 'bg-cyan-100' },
  { level: 10, name: 'Elite', icon: '10', color: 'text-rose-600', bgColor: 'bg-rose-100' },
  { level: 11, name: 'Master', icon: '11', color: 'text-pink-600', bgColor: 'bg-pink-100' },
  { level: 12, name: 'Grandmaster', icon: '12', color: 'text-fuchsia-600', bgColor: 'bg-fuchsia-100' },
  { level: 13, name: 'Legend', icon: '13', color: 'text-indigo-600', bgColor: 'bg-indigo-100' },
  { level: 14, name: 'Sage', icon: '14', color: 'text-violet-600', bgColor: 'bg-violet-100' },
  { level: 15, name: 'Philosopher', icon: '15', color: 'text-red-600', bgColor: 'bg-red-100' },
];

function getLevelBadge(level: number) {
  return LEVEL_BADGES.find((badge) => badge.level === level) ?? LEVEL_BADGES[0];
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
  className,
}: PointsBadgeProps) {
  const badge = getLevelBadge(level);

  const sizeClasses = {
    sm: 'h-6 min-w-6 px-1 text-[10px]',
    md: 'h-8 min-w-8 px-2 text-xs',
    lg: 'h-10 min-w-10 px-3 text-sm',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex items-center justify-center rounded-full font-semibold',
          sizeClasses[size],
          badge.bgColor,
          badge.color
        )}
        title={badge.name}
      >
        {badge.icon}
      </div>
      {showName ? <span className={cn('font-medium', badge.color)}>{badge.name}</span> : null}
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
  className,
}: PointsBadgeWithProgressProps) {
  const badge = getLevelBadge(level);
  const progress =
    levelEndXp > levelStartXp
      ? Math.max(
          0,
          Math.min(100, Math.round(((currentXp - levelStartXp) / (levelEndXp - levelStartXp)) * 100))
        )
      : 100;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <PointsBadge level={level} size={size} />
      {size === 'lg' ? (
        <div className="flex-1">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{badge.name}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
