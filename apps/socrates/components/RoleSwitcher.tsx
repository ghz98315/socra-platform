// =====================================================
// Project Socrates - Role Switcher
// 家长/学生角色切换组件 - 双向切换
// =====================================================

'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { Users, BookOpen, Home, ArrowRightLeft, GraduationCap, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type ViewMode = 'parent' | 'student';

interface RoleSwitcherProps {
  compact?: boolean;
}

export function RoleSwitcher({ compact = false }: RoleSwitcherProps) {
  const { profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState<ViewMode>('student');

  useEffect(() => {
    // 根据当前路径判断视图模式
    if (pathname?.startsWith('/tasks') ||
        pathname?.startsWith('/family') ||
        pathname?.startsWith('/controls') ||
        (pathname === '/dashboard' && profile?.role === 'parent')) {
      setCurrentView('parent');
    } else {
      setCurrentView('student');
    }
  }, [pathname, profile?.role]);

  if (!profile) return null;

  const isParent = profile.role === 'parent';
  const isStudent = profile.role === 'student';

  // 切换到对方角色
  const handleSwitchRole = () => {
    if (isParent) {
      // 家长切换到学生视图
      router.push('/workbench');
    } else {
      // 学生切换到家长视图
      router.push('/dashboard');
    }
  };

  // 获取目标角色信息
  const getTargetRole = () => {
    if (isParent) {
      return {
        label: '学生视图',
        description: '查看学习工作台',
        icon: GraduationCap,
        href: '/workbench',
      };
    } else {
      return {
        label: '家长视图',
        description: '管理家庭和任务',
        icon: UserCircle,
        href: '/dashboard',
      };
    }
  };

  const targetRole = getTargetRole();
  const TargetIcon = targetRole.icon;

  // 紧凑模式 - 只显示一个切换按钮
  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSwitchRole}
        className={cn(
          "gap-2 h-9 px-3 rounded-full",
          "bg-gradient-to-r from-warm-50 to-orange-50",
          "hover:from-warm-100 hover:to-orange-100",
          "border border-warm-200",
          "transition-all duration-300"
        )}
      >
        <ArrowRightLeft className="w-4 h-4 text-warm-500" />
        <span className="text-sm text-warm-700 hidden sm:inline">
          切换为{targetRole.label}
        </span>
        <span className="text-xs text-warm-600 sm:hidden">
          {isParent ? '学生' : '家长'}
        </span>
      </Button>
    );
  }

  // 完整模式 - 下拉菜单
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 h-9 px-3 rounded-full",
            "bg-gradient-to-r from-warm-50 to-orange-50",
            "hover:from-warm-100 hover:to-orange-100",
            "border-warm-200",
            "transition-all duration-300"
          )}
        >
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center",
            currentView === 'parent' ? "bg-purple-100" : "bg-blue-100"
          )}>
            {currentView === 'parent' ? (
              <UserCircle className="w-3.5 h-3.5 text-purple-600" />
            ) : (
              <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            )}
          </div>
          <span className="text-sm font-medium text-warm-700">
            {currentView === 'parent' ? '家长' : '学生'}
          </span>
          <ArrowRightLeft className="w-3.5 h-3.5 text-warm-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-xl border-warm-200 shadow-lg"
      >
        <DropdownMenuLabel className="text-warm-600">
          切换视图
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-warm-100" />

        {/* 当前角色 */}
        <DropdownMenuItem
          disabled
          className="flex items-center gap-3 py-3 opacity-60"
        >
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            currentView === 'parent' ? "bg-purple-100" : "bg-blue-100"
          )}>
            {currentView === 'parent' ? (
              <UserCircle className="w-4 h-4 text-purple-600" />
            ) : (
              <GraduationCap className="w-4 h-4 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">
              {currentView === 'parent' ? '家长视图' : '学生视图'}
            </p>
            <p className="text-xs text-muted-foreground">当前</p>
          </div>
        </DropdownMenuItem>

        {/* 目标角色 */}
        <DropdownMenuItem
          onClick={handleSwitchRole}
          className="flex items-center gap-3 py-3 cursor-pointer hover:bg-warm-50"
        >
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            currentView === 'parent' ? "bg-blue-100" : "bg-purple-100"
          )}>
            <TargetIcon className={cn(
              "w-4 h-4",
              currentView === 'parent' ? "text-blue-600" : "text-purple-600"
            )} />
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">{targetRole.label}</p>
            <p className="text-xs text-muted-foreground">{targetRole.description}</p>
          </div>
          <ArrowRightLeft className="w-4 h-4 text-warm-400" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 简洁版切换按钮 - 用于移动端
export function RoleSwitcherButton({ className }: { className?: string }) {
  const { profile } = useAuth();
  const router = useRouter();

  if (!profile) return null;

  const isParent = profile.role === 'parent';

  const handleSwitchRole = () => {
    if (isParent) {
      router.push('/workbench');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <button
      onClick={handleSwitchRole}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg",
        "bg-gradient-to-r from-warm-50 to-orange-50",
        "hover:from-warm-100 hover:to-orange-100",
        "border border-warm-200",
        "transition-all duration-300",
        "active:scale-95",
        className
      )}
    >
      <ArrowRightLeft className="w-4 h-4 text-warm-500" />
      <span className="text-sm text-warm-700">
        {isParent ? '切换学生' : '切换家长'}
      </span>
    </button>
  );
}
