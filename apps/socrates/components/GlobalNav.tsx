'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Bookmark,
  Calendar,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Settings,
  Trophy,
  User,
  Users,
  X,
} from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';
import { NotificationCenter } from '@/components/NotificationCenter';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { PointsDisplay } from '@/components/points/PointsDisplay';
import { RoleSwitcher, RoleSwitcherButton } from '@/components/RoleSwitcher';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  color: string;
};

const parentNavItems: NavItem[] = [
  { href: '/tasks', icon: Home, label: 'Dashboard', color: 'text-warm-500' },
  { href: '/tasks', icon: ClipboardList, label: 'Tasks', color: 'text-blue-500' },
  { href: '/family', icon: Users, label: 'Family', color: 'text-purple-500' },
  { href: '/reports', icon: BarChart3, label: 'Reports', color: 'text-warm-400' },
];

const studentNavItems: NavItem[] = [
  { href: '/workbench', icon: BookOpen, label: 'Study', color: 'text-warm-500' },
  { href: '/planner', icon: Calendar, label: 'Planner', color: 'text-blue-500' },
  { href: '/error-book', icon: Bookmark, label: 'Errors', color: 'text-warm-600' },
  { href: '/review', icon: ClipboardList, label: 'Review', color: 'text-warm-500' },
  { href: '/achievements', icon: Trophy, label: 'Achievements', color: 'text-warm-500' },
  { href: '/community', icon: Users, label: 'Community', color: 'text-warm-500' },
];

export function GlobalNav() {
  const { profile, user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (pathname?.startsWith('/preview') || pathname?.startsWith('/landing')) {
    return null;
  }

  if (!user || pathname?.includes('/login') || pathname?.includes('/register')) {
    return null;
  }

  const isParent = profile?.role === 'parent';
  const isStudent = profile?.role === 'student';
  const navItems = isParent ? parentNavItems : studentNavItems;
  const displayName = profile?.display_name || 'User';

  const isActive = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-warm-100 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Socrates Logo" width={36} height={36} />
            <span className="hidden text-xl font-bold tracking-tight text-warm-900 sm:block">
              Socrates
            </span>
          </Link>

          <div
            className={cn(
              'hidden items-center gap-3 transition-all duration-300 sm:flex',
              mounted ? 'opacity-100' : 'opacity-0'
            )}
          >
            <RoleSwitcher compact />
            <div className="flex items-center gap-2 rounded-full border border-warm-200 bg-warm-50 px-4 py-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-warm-500/20">
                <User className="h-4 w-4 text-warm-600" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium leading-tight">{displayName}</span>
                <span className="text-[10px] text-muted-foreground">
                  {isParent ? 'Parent' : 'Student'}
                </span>
              </div>
            </div>
            <NotificationCenter />
            <OfflineIndicator compact />
            <SyncStatusIndicator compact />
            {isStudent ? <PointsDisplay /> : null}
            <Link href="/settings">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="rounded-full">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>

          <button
            onClick={() => setMobileOpen((current) => !current)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg transition-colors hover:bg-muted sm:hidden"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <div className="hidden border-t border-warm-100 bg-warm-50 sm:block">
          <nav className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 sm:px-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-xl border px-4 py-2 text-sm transition-all',
                    active
                      ? 'border-warm-200 bg-white shadow-sm'
                      : 'border-transparent hover:bg-white/60'
                  )}
                >
                  <Icon className={cn('h-4 w-4', active ? item.color : 'text-warm-600')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="flex-1" />
          </nav>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-warm-100 bg-white/95 backdrop-blur-xl sm:hidden">
        <div className="flex h-16 items-center justify-around">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={`${item.href}-${item.label}-mobile`}
                href={item.href}
                className={cn(
                  'flex min-h-[44px] min-w-[60px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-[10px] font-medium',
                  active ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className={cn('h-5 w-5', active && item.color)} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMobileOpen((current) => !current)}
            className={cn(
              'flex min-h-[44px] min-w-[60px] flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-[10px] font-medium',
              mobileOpen ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span>More</span>
          </button>
        </div>
      </nav>

      {mobileOpen ? (
        <div className="border-t border-warm-100 bg-white/95 p-4 pb-24 backdrop-blur-xl sm:hidden">
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-muted/40 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{displayName}</p>
              <p className="text-xs text-muted-foreground">{isParent ? 'Parent' : 'Student'}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={`${item.href}-${item.label}-drawer`}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all',
                    active
                      ? 'border-primary/20 bg-primary/10'
                      : 'border-transparent bg-muted/40 hover:bg-muted'
                  )}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background">
                    <Icon className={cn('h-5 w-5', active ? item.color : 'text-muted-foreground')} />
                  </div>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="mt-4 border-t border-border/50 pt-4">
            <RoleSwitcherButton className="w-full" />
          </div>

          <div className="mt-4 flex gap-2">
            <Link href="/settings" className="flex-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="flex-1 justify-start gap-2 text-muted-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
