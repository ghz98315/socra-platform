// =====================================================
// Project Socrates - Sync Context and Hook
// 同步上下文和 Hook
// =====================================================

'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { getSyncService, cleanupSyncService, SyncService } from './service';
import type { SyncState, DeviceInfo, SyncEvent, SyncStatus } from './types';

interface SyncContextValue {
  syncState: SyncState;
  deviceInfo: DeviceInfo | null;
  isOnline: boolean;
  onlineDevices: DeviceInfo[];
  syncService: SyncService | null;
  userId: string | null;
  initializeSync: (userId: string) => Promise<void>;
}

const SyncContext = createContext<SyncContextValue | null>(null);

interface SyncProviderProps {
  children: ReactNode;
  supabaseClient: any;
  userId: string | null;
}

export function SyncProvider({ children, supabaseClient, userId }: SyncProviderProps) {
  const [syncState, setSyncState] = useState<SyncState>({
    status: 'offline',
    lastSyncTime: null,
    pendingChanges: 0,
    onlineDevices: [],
    error: null,
  });
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [syncService, setSyncService] = useState<SyncService | null>(null);

  // 初始化同步服务
  const initializeSync = useCallback(async (uid: string) => {
    const service = getSyncService();
    setSyncService(service);
    setDeviceInfo(service.getDeviceInfo());

    // 添加状态监听
    service.addListener((state) => {
      setSyncState(state);
    });

    // 初始化
    await service.initialize(supabaseClient, uid);
  }, [supabaseClient]);

  // 当 userId 变化时初始化
  useEffect(() => {
    if (!userId || !supabaseClient) {
      setSyncState(prev => ({ ...prev, status: 'offline' }));
      return;
    }

    initializeSync(userId);

    return () => {
      cleanupSyncService();
    };
  }, [userId, supabaseClient, initializeSync]);

  const value: SyncContextValue = {
    syncState,
    deviceInfo,
    isOnline: syncState.status !== 'offline',
    onlineDevices: syncState.onlineDevices,
    syncService,
    userId,
    initializeSync,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

// 使用同步状态的 Hook
export function useSync(): SyncContextValue {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
}

// 使用在线设备的 Hook
export function useOnlineDevices(): DeviceInfo[] {
  const { onlineDevices } = useSync();
  return onlineDevices;
}

// 使用同步状态的 Hook
export function useSyncStatus(): SyncStatus {
  const { syncState } = useSync();
  return syncState.status;
}

// 订阅表变更的 Hook
export function useTableSubscription(
  table: string,
  callback: (event: SyncEvent) => void,
  filter?: string
) {
  const { syncService, userId } = useSync();

  useEffect(() => {
    if (!syncService || !userId) return;

    const channel = syncService.subscribeToTable(
      { channel: `${table}_sub`, table, filter },
      callback
    );

    return () => {
      channel?.unsubscribe();
    };
  }, [syncService, userId, table, filter, callback]);
}
