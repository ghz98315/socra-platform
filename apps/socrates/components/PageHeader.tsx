// =====================================================
// Project Socrates - Page Header Component
// 页面标题卡片组件 - 配合分层卡片设计 + 暖色风格
// =====================================================

'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'text-warm-500',
  actions,
  children,
  className,
}: PageHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      ref={ref}
      className={cn("mb-6", className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
      }}
    >
      {/* 页面标题卡片 */}
      <div
        className={cn(
          "bg-white border border-warm-100 rounded-2xl p-6 shadow-sm",
          "transition-all duration-300 hover:shadow-md"
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* 标题区域 */}
          <div className="flex items-center gap-4">
            {Icon && (
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                  iconColor.includes('warm') && "bg-warm-100",
                  iconColor.includes('blue') && "bg-blue-100",
                  iconColor.includes('green') && "bg-green-100",
                  iconColor.includes('orange') && "bg-orange-100",
                  iconColor.includes('purple') && "bg-purple-100",
                  iconColor.includes('red') && "bg-red-100",
                  !iconColor.includes('warm') && !iconColor.includes('blue') &&
                  !iconColor.includes('green') && !iconColor.includes('orange') &&
                  !iconColor.includes('purple') && !iconColor.includes('red') && "bg-warm-100"
                )}
              >
                <Icon className={cn("w-6 h-6", iconColor)} />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-warm-900">{title}</h1>
              {description && (
                <p className="text-warm-600 mt-1">{description}</p>
              )}
            </div>
          </div>

          {/* 操作按钮区域 */}
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>

        {/* 附加内容区域 */}
        {children && (
          <div className="mt-6 pt-6 border-t border-warm-100">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}

// 统计卡片组件
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: string;
  delay?: number;
}

export function StatCard({ label, value, icon: Icon, trend, color = 'text-warm-500', delay = 0 }: StatCardProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        "bg-warm-50 rounded-xl p-4 border border-warm-100",
        "transition-all duration-300 hover:bg-warm-100 hover:shadow-md"
      )}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: `opacity 0.5s ease-out ${delay}s, transform 0.5s ease-out ${delay}s`,
      }}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300",
              color.includes('warm') && "bg-warm-100",
              color.includes('blue') && "bg-blue-100",
              color.includes('green') && "bg-green-100",
              color.includes('orange') && "bg-orange-100",
              color.includes('purple') && "bg-purple-100",
              color.includes('red') && "bg-red-100",
              color.includes('yellow') && "bg-yellow-100"
            )}
          >
            <Icon className={cn("w-5 h-5", color)} />
          </div>
        )}
        <div className="flex-1">
          <p className="text-sm text-warm-600">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold text-warm-900">{value}</p>
            {trend && (
              <span
                className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded-full",
                  trend.isPositive
                    ? "text-green-600 bg-green-100"
                    : "text-red-600 bg-red-100"
                )}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 统计行组件
interface StatsRowProps {
  children: React.ReactNode;
}

export function StatsRow({ children }: StatsRowProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {children}
    </div>
  );
}

// 滚动淡入容器
interface ScrollFadeContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollFadeContainer({ children, className }: ScrollFadeContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
      }}
    >
      {children}
    </div>
  );
}

// 交错动画容器
interface StaggerGridProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function StaggerGrid({ children, className, staggerDelay = 0.1 }: StaggerGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: `opacity 0.5s ease-out ${index * staggerDelay}s, transform 0.5s ease-out ${index * staggerDelay}s`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
}
