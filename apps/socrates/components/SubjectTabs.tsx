// =====================================================
// Project Socrates - Subject Tabs Component
// 学科切换标签组件
// =====================================================

'use client';

import { cn } from '@/lib/utils';
import {
  Target,
  BookOpen,
  TrendingUp,
  Zap,
  Gift,
  type LucideIcon,
} from 'lucide-react';

export type SubjectType = 'math' | 'chinese' | 'english' | 'physics' | 'chemistry';

export interface SubjectConfig {
  id: SubjectType;
  name: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  pro?: boolean;
}

// 学科配置
export const subjectConfigs: Record<SubjectType, SubjectConfig> = {
  math: {
    id: 'math',
    name: '数学',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: '数学题辅导',
  },
  chinese: {
    id: 'chinese',
    name: '语文',
    icon: BookOpen,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    description: '语文阅读写作',
  },
  english: {
    id: 'english',
    name: '英语',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    description: '英语学习辅导',
  },
  physics: {
    id: 'physics',
    name: '物理',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    description: '物理题辅导',
    pro: true,
  },
  chemistry: {
    id: 'chemistry',
    name: '化学',
    icon: Gift,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: '化学题辅导',
    pro: true,
  },
};

// 获取支持的学科列表（非Pro）
export function getSupportedSubjects(): SubjectConfig[] {
  return Object.values(subjectConfigs).filter(s => !s.pro);
}

// 获取所有学科列表
export function getAllSubjects(): SubjectConfig[] {
  return Object.values(subjectConfigs);
}

// 根据ID获取学科配置
export function getSubjectConfig(id: string): SubjectConfig | undefined {
  return subjectConfigs[id as SubjectType];
}

interface SubjectTabsProps {
  activeSubject: SubjectType;
  onSubjectChange: (subject: SubjectType) => void;
  showPro?: boolean;
  className?: string;
  compact?: boolean;
}

export function SubjectTabs({
  activeSubject,
  onSubjectChange,
  showPro = false,
  className,
  compact = false,
}: SubjectTabsProps) {
  const subjects = showPro ? getAllSubjects() : getSupportedSubjects();

  return (
    <div className={cn('flex gap-2 overflow-x-auto pb-1', className)}>
      {subjects.map((subject) => {
        const isActive = activeSubject === subject.id;
        const Icon = subject.icon;

        return (
          <button
            key={subject.id}
            onClick={() => onSubjectChange(subject.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap',
              isActive
                ? `${subject.bgColor} ${subject.borderColor} ${subject.color} font-medium shadow-sm`
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300',
              subject.pro && !isActive && 'opacity-70',
              compact && 'px-3 py-1.5 text-sm'
            )}
          >
            <Icon className={cn('w-4 h-4', isActive ? subject.color : 'text-gray-400')} />
            <span>{subject.name}</span>
            {subject.pro && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                isActive ? 'bg-yellow-200 text-yellow-700' : 'bg-gray-100 text-gray-500'
              )}>
                Pro
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// 学科徽章组件
interface SubjectBadgeProps {
  subject: SubjectType;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  className?: string;
}

export function SubjectBadge({
  subject,
  size = 'md',
  showName = true,
  className,
}: SubjectBadgeProps) {
  const config = getSubjectConfig(subject);
  if (!config) return null;

  const Icon = config.icon;
  const sizes = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full',
        config.bgColor,
        config.color,
        sizes[size],
        className
      )}
    >
      <div className={cn('flex items-center justify-center')}>
        <Icon className={iconSizes[size]} />
      </div>
      {showName && <span className="font-medium pr-1">{config.name}</span>}
    </div>
  );
}
