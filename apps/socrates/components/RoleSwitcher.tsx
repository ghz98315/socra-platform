'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowRightLeft, GraduationCap, UserCircle } from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';
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

interface RoleSwitcherProps {
  compact?: boolean;
}

function getViewMode(pathname: string | null, role?: string | null): ViewMode {
  if (
    pathname?.startsWith('/tasks') ||
    pathname?.startsWith('/family') ||
    pathname?.startsWith('/controls') ||
    (pathname === '/tasks' && role === 'parent')
  ) {
    return 'parent';
  }

  return 'student';
}

function getTargetConfig(isParent: boolean) {
  if (isParent) {
    return {
      label: '孩子模式 Student',
      description: '进入学习工作台 Go to the learning workspace',
      icon: GraduationCap,
      href: '/study',
    };
  }

  return {
    label: '家长模式 Parent',
    description: '查看任务与家庭管理 Go to tasks and family controls',
    icon: UserCircle,
    href: '/tasks',
  };
}

export function RoleSwitcher({ compact = false }: RoleSwitcherProps) {
  const { profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState<ViewMode>('student');

  useEffect(() => {
    setCurrentView(getViewMode(pathname, profile?.role));
  }, [pathname, profile?.role]);

  if (!profile) {
    return null;
  }

  const isParent = profile.role === 'parent';
  const targetRole = getTargetConfig(isParent);
  const TargetIcon = targetRole.icon;

  const handleSwitchRole = () => {
    router.push(targetRole.href);
  };

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSwitchRole}
        className={cn(
          'h-9 gap-2 rounded-full border border-warm-200 bg-gradient-to-r from-warm-50 to-orange-50 px-3',
          'transition-all duration-300 hover:from-warm-100 hover:to-orange-100'
        )}
      >
        <ArrowRightLeft className="h-4 w-4 text-warm-500" />
        <span className="hidden text-sm text-warm-700 sm:inline">{targetRole.label}</span>
        <span className="text-xs text-warm-600 sm:hidden">{isParent ? '孩子' : '家长'}</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-2 rounded-full border-warm-200 bg-gradient-to-r from-warm-50 to-orange-50 px-3',
            'transition-all duration-300 hover:from-warm-100 hover:to-orange-100'
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
          <span className="text-sm font-medium text-warm-700">
            {currentView === 'parent' ? '家长 Parent' : '孩子 Student'}
          </span>
          <ArrowRightLeft className="h-3.5 w-3.5 text-warm-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-xl border-warm-200 shadow-lg">
        <DropdownMenuLabel className="text-warm-600">切换视图 Switch view</DropdownMenuLabel>
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
            <p className="text-sm font-medium">
              {currentView === 'parent' ? '家长视图 Parent view' : '孩子视图 Student view'}
            </p>
            <p className="text-xs text-muted-foreground">当前 Current</p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={handleSwitchRole}
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
            <p className="text-sm font-medium">{targetRole.label}</p>
            <p className="text-xs text-muted-foreground">{targetRole.description}</p>
          </div>
          <ArrowRightLeft className="h-4 w-4 text-warm-400" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function RoleSwitcherButton({ className }: { className?: string }) {
  const { profile } = useAuth();
  const router = useRouter();

  if (!profile) {
    return null;
  }

  const isParent = profile.role === 'parent';

  return (
    <button
      onClick={() => router.push(isParent ? '/study' : '/tasks')}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-warm-200 bg-gradient-to-r from-warm-50 to-orange-50 px-3 py-2',
        'transition-all duration-300 hover:from-warm-100 hover:to-orange-100 active:scale-95',
        className
      )}
    >
      <ArrowRightLeft className="h-4 w-4 text-warm-500" />
      <span className="text-sm text-warm-700">
        {isParent ? '切换到孩子模式 Switch to student' : '切换到家长模式 Switch to parent'}
      </span>
    </button>
  );
}
