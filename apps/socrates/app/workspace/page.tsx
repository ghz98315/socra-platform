'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';
import { getRoleHome } from '@/lib/navigation/role-home';

export default function WorkspacePage() {
  const { profile, accountProfile, availableProfiles, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading || !profile) {
      return;
    }

    if (accountProfile?.role === 'parent' && availableProfiles.length > 1) {
      router.replace('/select-profile');
      return;
    }

    if (!loading && profile) {
      router.replace(getRoleHome(profile.role));
    }
  }, [accountProfile?.role, availableProfiles.length, profile, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="space-y-4 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">正在进入对应工作区...</p>
      </div>
    </div>
  );
}
