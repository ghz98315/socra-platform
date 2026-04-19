'use client';

import { ArrowRightLeft, Shield, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface RoleSwitcherProps {
  compact?: boolean;
}

function getActiveRoleLabel(role?: string | null) {
  if (role === 'parent') {
    return '家长';
  }

  return '学生';
}

export function RoleSwitcher({ compact = false }: RoleSwitcherProps) {
  const router = useRouter();
  const { profile, availableProfiles } = useAuth();

  if (!profile || availableProfiles.length <= 1) {
    return null;
  }

  const isParent = profile.role === 'parent';
  const Icon = isParent ? Shield : UserRound;

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/select-profile')}
        className={cn(
          'h-9 gap-2 rounded-full border border-warm-200 bg-gradient-to-r from-warm-50 to-orange-50 px-3',
          'transition-all duration-300 hover:from-warm-100 hover:to-orange-100',
        )}
      >
        <ArrowRightLeft className="h-4 w-4 text-warm-500" />
        <span className="hidden text-sm text-warm-700 sm:inline">
          {profile.display_name || getActiveRoleLabel(profile.role)}
        </span>
        <span className="text-xs text-warm-600 sm:hidden">{getActiveRoleLabel(profile.role)}</span>
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => router.push('/select-profile')}
      className={cn(
        'h-9 gap-2 rounded-full border-warm-200 bg-gradient-to-r from-warm-50 to-orange-50 px-3',
        'transition-all duration-300 hover:from-warm-100 hover:to-orange-100',
      )}
    >
      <div
        className={cn(
          'flex h-6 w-6 items-center justify-center rounded-full',
          isParent ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600',
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-sm font-medium text-warm-700">
        {profile.display_name || getActiveRoleLabel(profile.role)}
      </span>
      <ArrowRightLeft className="h-3.5 w-3.5 text-warm-400" />
    </Button>
  );
}

export function RoleSwitcherButton({ className }: { className?: string }) {
  const router = useRouter();
  const { profile, availableProfiles } = useAuth();

  if (!profile || availableProfiles.length <= 1) {
    return null;
  }

  return (
    <button
      onClick={() => router.push('/select-profile')}
      className={cn(
        'flex items-center gap-2 rounded-lg border border-warm-200 bg-gradient-to-r from-warm-50 to-orange-50 px-3 py-2',
        'transition-all duration-300 hover:from-warm-100 hover:to-orange-100 active:scale-95',
        className,
      )}
    >
      <ArrowRightLeft className="h-4 w-4 text-warm-500" />
      <span className="text-sm text-warm-700">切换身份</span>
    </button>
  );
}
