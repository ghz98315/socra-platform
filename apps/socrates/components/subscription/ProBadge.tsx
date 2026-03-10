// =====================================================
// Project Socrates - Pro Badge Component
// Pro 会员标识组件
// =====================================================

'use client';

import { Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProBadgeProps {
  variant?: 'default' | 'small' | 'large' | 'glow';
  showLabel?: boolean;
  className?: string;
}

export function ProBadge({
  variant = 'default',
  showLabel = true,
  className
}: ProBadgeProps) {
  const sizeClasses = {
    small: 'text-xs px-1.5 py-0.5 gap-1',
    default: 'text-xs px-2 py-0.5 gap-1',
    large: 'text-sm px-3 py-1 gap-1.5',
    glow: 'text-xs px-2 py-0.5 gap-1'
  };

  const iconSizes = {
    small: 12,
    default: 12,
    large: 14,
    glow: 12
  };

  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold rounded-full",
        "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
        "shadow-sm",
        variant === 'glow' && "shadow-lg shadow-amber-500/40 animate-pulse",
        sizeClasses[variant],
        className
      )}
    >
      {variant === 'glow' ? (
        <Sparkles size={iconSizes[variant]} className="animate-pulse" />
      ) : (
        <Crown size={iconSizes[variant]} />
      )}
      {showLabel && <span>PRO</span>}
    </span>
  );
}

// Pro 角标 - 用于卡片右上角
interface ProCornerBadgeProps {
  className?: string;
}

export function ProCornerBadge({ className }: ProCornerBadgeProps) {
  return (
    <div
      className={cn(
        "absolute -top-1 -right-1 z-10",
        "flex items-center justify-center",
        "w-6 h-6 rounded-full",
        "bg-gradient-to-r from-amber-500 to-orange-500",
        "shadow-lg shadow-amber-500/40",
        className
      )}
    >
      <Crown size={12} className="text-white" />
    </div>
  );
}
