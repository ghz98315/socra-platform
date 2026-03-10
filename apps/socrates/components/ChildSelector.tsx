// =====================================================
// Project Socrates - Child Selector Component
// 子女选择下拉组件
// =====================================================

'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, User, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export interface ChildInfo {
  id: string;
  display_name: string;
  grade_level?: number;
  avatar_url?: string;
  streak_days?: number;
  today_minutes?: number;
}

interface ChildSelectorProps {
  children: ChildInfo[];
  selectedChildId: string | null;
  onSelect: (child: ChildInfo) => void;
  onAddChild?: () => void;
  showStats?: boolean;
  compact?: boolean;
  className?: string;
}

export function ChildSelector({
  children,
  selectedChildId,
  onSelect,
  onAddChild,
  showStats = false,
  compact = false,
  className,
}: ChildSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedChild = children.find((c) => c.id === selectedChildId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  const getGradeLabel = (grade?: number) => {
    if (!grade) return '';
    return `${grade}年级`;
  };

  if (compact) {
    return (
      <div ref={dropdownRef} className={cn('relative', className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'bg-white border border-gray-200 hover:border-gray-300',
            'transition-all duration-200'
          )}
        >
          <Avatar className="w-6 h-6">
            <AvatarFallback className="text-xs bg-warm-100 text-warm-700">
              {selectedChild ? getInitials(selectedChild.display_name) : '?'}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-gray-700">
            {selectedChild?.display_name || '选择孩子'}
          </span>
          <ChevronDown
            className={cn('w-4 h-4 text-gray-400 transition-transform', isOpen && 'rotate-180')}
          />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => {
                  onSelect(child);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left',
                  'hover:bg-gray-50 transition-colors',
                  child.id === selectedChildId && 'bg-warm-50'
                )}
              >
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-warm-100 text-warm-700">
                    {getInitials(child.display_name)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-gray-700 flex-1">{child.display_name}</span>
                {child.id === selectedChildId && (
                  <Check className="w-4 h-4 text-warm-500" />
                )}
              </button>
            ))}
            {onAddChild && (
              <button
                onClick={() => {
                  onAddChild();
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-left',
                  'hover:bg-gray-50 transition-colors text-gray-500'
                )}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">添加孩子</span>
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center gap-3 px-4 py-3 rounded-xl',
          'bg-white border border-gray-200 hover:border-gray-300',
          'transition-all duration-200 shadow-sm'
        )}
      >
        <Avatar className="w-10 h-10">
          <AvatarFallback className="bg-gradient-to-br from-warm-400 to-warm-600 text-white">
            {selectedChild ? getInitials(selectedChild.display_name) : <User className="w-5 h-5" />}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-left">
          <p className="font-medium text-gray-900">
            {selectedChild?.display_name || '选择孩子'}
          </p>
          {selectedChild && showStats && (
            <p className="text-xs text-gray-500">
              {getGradeLabel(selectedChild.grade_level)}
              {selectedChild.streak_days !== undefined && ` · 连续${selectedChild.streak_days}天`}
            </p>
          )}
        </div>
        <ChevronDown
          className={cn('w-5 h-5 text-gray-400 transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          {children.length === 0 ? (
            <div className="px-4 py-3 text-center text-gray-500 text-sm">
              还没有添加孩子
            </div>
          ) : (
            children.map((child) => (
              <button
                key={child.id}
                onClick={() => {
                  onSelect(child);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left',
                  'hover:bg-gray-50 transition-colors',
                  child.id === selectedChildId && 'bg-warm-50'
                )}
              >
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-gradient-to-br from-warm-400 to-warm-600 text-white text-sm">
                    {getInitials(child.display_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{child.display_name}</p>
                  <p className="text-xs text-gray-500">
                    {getGradeLabel(child.grade_level)}
                    {showStats && child.today_minutes !== undefined && (
                      <span className="ml-2">今日学习 {child.today_minutes}分钟</span>
                    )}
                  </p>
                </div>
                {child.id === selectedChildId && (
                  <Check className="w-5 h-5 text-warm-500" />
                )}
              </button>
            ))
          )}
          {onAddChild && (
            <>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  onAddChild();
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 text-left',
                  'hover:bg-gray-50 transition-colors'
                )}
              >
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-gray-500" />
                </div>
                <span className="font-medium text-gray-600">添加孩子</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
