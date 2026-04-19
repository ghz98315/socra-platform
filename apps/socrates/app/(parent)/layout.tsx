'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';
import { getRoleHome } from '@/lib/navigation/role-home';

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, accountProfile, loading, selectProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      router.replace('/login');
      return;
    }

    if (!accountProfile || !profile) {
      return;
    }

    if (accountProfile.role !== 'parent') {
      router.replace(getRoleHome(profile.role));
      return;
    }

    if (profile.id !== accountProfile.id) {
      void selectProfile(accountProfile.id).then(() => {
        router.replace('/tasks');
      });
    }
  }, [accountProfile, loading, profile, router, selectProfile, user]);

  if (
    loading ||
    !user ||
    !accountProfile ||
    !profile ||
    accountProfile.role !== 'parent' ||
    profile.role !== 'parent'
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
