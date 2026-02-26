// =====================================================
// Project Socrates - Sync Status Wrapper
// 同步状态包装器 - 在 AuthProvider 内部使用
// =====================================================

'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SyncProvider, useSync } from '@/lib/sync/SyncContext';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { useAuth } from '@/lib/contexts/AuthContext';

// 内部组件 - 显示同步状态
function SyncStatusInner() {
  const { syncState } = useSync();

  // 只在已同步状态下显示
  if (syncState.status === 'offline' && typeof window !== 'undefined' && navigator.onLine) {
    return null;
  }

  return <SyncStatusIndicator compact />;
}

// 同步管理器组件
export function SyncManager({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const supabase = createClient();

  // 如果没有用户登录，直接渲染子组件
  if (!user) {
    return <>{children}</>;
  }

  return (
    <SyncProvider supabaseClient={supabase} userId={user.id}>
      {children}
    </SyncProvider>
  );
}

// 导出一个可以在导航栏中显示的同步状态组件
export function NavSyncStatus() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <SyncProvider supabaseClient={createClient()} userId={user.id}>
      <SyncStatusInner />
    </SyncProvider>
  );
}
