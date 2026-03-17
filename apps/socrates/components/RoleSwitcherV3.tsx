'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRightLeft, GraduationCap, UserCircle } from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';
import { getRoleAvatar } from '@/lib/profile-avatar';
import { Button } from '@/components/ui/button';
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
type SwitchableRole = 'parent' | 'student';

interface RoleSwitcherProps {
  compact?: boolean;
}

function getViewMode(pathname: string | null): ViewMode {
  if (
    pathname?.startsWith('/tasks') ||
    pathname?.startsWith('/family') ||
    pathname?.startsWith('/controls') ||
    pathname?.startsWith('/reports')
  ) {
    return 'parent';
  }

  return 'student';
}

function getRoleLabel(role: SwitchableRole) {
  return role === 'parent' ? '家长' : '学生';
}

function getTargetConfig(targetRole: SwitchableRole) {
  if (targetRole === 'student') {
    return {
      role: 'student' as const,
      label: '切换到学生端',
      description: '进入学习工作台与错题复习流程',
      icon: GraduationCap,
      href: '/study',
    };
  }

  return {
    role: 'parent' as const,
    label: '切换到家长端',
    description: '进入任务、家庭与监督视图',
    icon: UserCircle,
    href: '/tasks',
  };
}

function useRoleSwitch() {
  const { profile, updateProfile } = useAuth();
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);

  const currentRole: SwitchableRole | null = profile
    ? profile.role === 'parent'
      ? 'parent'
      : 'student'
    : null;

  const targetConfig = currentRole
    ? getTargetConfig(currentRole === 'parent' ? 'student' : 'parent')
    : null;

  const handleSwitchRole = async () => {
    if (!targetConfig || isSwitching) {
      return;
    }

    try {
      setIsSwitching(true);
      await updateProfile({
        role: targetConfig.role,
        avatar_url: getRoleAvatar(profile, targetConfig.role) || undefined,
      });
      router.replace(targetConfig.href);
      router.refresh();
    } catch (error) {
      console.error('[RoleSwitcher] Failed to switch role:', error);
      window.alert('角色切换失败，请稍后重试。');
      setIsSwitching(false);
    }
  };

  return {
    currentRole,
    targetConfig,
    isSwitching,
    handleSwitchRole,
  };
}

export function RoleSwitcher({ compact = false }: RoleSwitcherProps) {
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState<ViewMode>('student');
  const { currentRole, targetConfig, isSwitching, handleSwitchRole } = useRoleSwitch();

  useEffect(() => {
    setCurrentView(getViewMode(pathname));
  }, [pathname]);

  if (!currentRole || !targetConfig) {
    return null;
  }

  const TargetIcon = targetConfig.icon;

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSwitchRole}
        disabled={isSwitching}
        className={cn(
          'h-9 gap-2 rounded-full border border-warm-200 bg-gradient-to-r from-warm-50 to-orange-50 px-3',
          'transition-all duration-300 hover:from-warm-100 hover:to-orange-100',
          'disabled:cursor-wait disabled:opacity-70'
        )}
      >
        <ArrowRightLeft className="h-4 w-4 text-warm-500" />
        <span className="hidden text-sm text-warm-700 sm:inline">
          {isSwitching ? '切换中...' : targetConfig.label}
        </span>
        <span className="text-xs text-warm-600 sm:hidden">
          {isSwitching ? '切换中' : getRoleLabel(targetConfig.role)}
        </span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isSwitching}
          className={cn(
            'h-9 gap-2 rounded-full border-warm-200 bg-gradient-to-r from-warm-50 to-orange-50 px-3',
            'transition-all duration-300 hover:from-warm-100 hover:to-orange-100',
            'disabled:cursor-wait disabled:opacity-70'
          )}
        >
          <div
            className={cn(
              'flex h-6 w-6 items-center justify-center rounded-full',
              currentView === 'parent' ? 'bg-purple-100' : 'bg-blue-100'
            )}
          >
            {currentView === 'parent' ? (
              <UserCircle className="h-3.5 w-3.5 text-purple-600" />
            ) : (
              <GraduationCap className="h-3.5 w-3.5 text-blue-600" />
            )}
          </div>
          <span className="text-sm font-medium text-warm-700">{getRoleLabel(currentRole)}端</span>
          <ArrowRightLeft className="h-3.5 w-3.5 text-warm-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border-warm-200 shadow-lg">
        <DropdownMenuLabel className="text-warm-600">切换角色</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-warm-100" />

        <DropdownMenuItem disabled className="flex items-center gap-3 py-3 opacity-60">
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              currentView === 'parent' ? 'bg-purple-100' : 'bg-blue-100'
            )}
          >
            {currentView === 'parent' ? (
              <UserCircle className="h-4 w-4 text-purple-600" />
            ) : (
              <GraduationCap className="h-4 w-4 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{getRoleLabel(currentRole)}端</p>
            <p className="text-xs text-muted-foreground">当前身份</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleSwitchRole}
          disabled={isSwitching}
          className="flex cursor-pointer items-center gap-3 py-3 hover:bg-warm-50"
        >
          <div
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg',
              currentView === 'parent' ? 'bg-blue-100' : 'bg-purple-100'
            )}
          >
            <TargetIcon
              className={cn(
                'h-4 w-4',
                currentView === 'parent' ? 'text-blue-600' : 'text-purple-600'
              )}
            />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              {isSwitching ? '正在切换...' : targetConfig.label}
            </p>
            <p className="text-xs text-muted-foreground">{targetConfig.description}</p>
          </div>
          <ArrowRightLeft className="h-4 w-4 text-warm-400" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RoleSwitcherButton({ className }: { className?: string }) {
  const { currentRole, targetConfig, isSwitching, handleSwitchRole } = useRoleSwitch();

  if (!currentRole || !targetConfig) {
    return null;
  }

  return (
    <button
      onClick={handleSwitchRole}
      disabled={isSwitching}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-warm-200 bg-gradient-to-r from-warm-50 to-orange-50 px-3 py-2',
        'transition-all duration-300 hover:from-warm-100 hover:to-orange-100 active:scale-95',
        'disabled:cursor-wait disabled:opacity-70',
        className
      )}
    >
      <ArrowRightLeft className="h-4 w-4 text-warm-500" />
      <span className="text-sm text-warm-700">
        {isSwitching ? '切换中...' : targetConfig.label}
      </span>
    </button>
  );
}
