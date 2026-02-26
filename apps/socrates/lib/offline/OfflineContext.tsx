// =====================================================
// Project Socrates - Offline Context and Hook
// 离线模式上下文和 Hook
// =====================================================

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  initOfflineDB,
  getPendingOperations,
  getStorageInfo,
  queueOperation,
  deleteOperation,
  saveOfflineData,
  getPendingData,
  generateOfflineId,
} from './storage';
import type { OfflineState, OfflineOperation, OfflineData, SyncResult } from './types';

interface OfflineContextValue {
  state: OfflineState;
  isOffline: boolean;
  pendingCount: number;
  queueOfflineOperation: (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) => Promise<void>;
  syncPendingOperations: () => Promise<SyncResult>;
  saveOfflineData: (data: Omit<OfflineData, 'id' | 'createdAt' | 'syncedAt' | 'syncStatus'>) => Promise<string>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isServiceWorkerReady: false,
    pendingOperations: 0,
    lastSyncTime: null,
    storageUsed: 0,
    storageQuota: 0,
  });

  // 初始化
  useEffect(() => {
    const init = async () => {
      try {
        await initOfflineDB();
        const pending = await getPendingOperations();
        const storage = await getStorageInfo();

        setState(prev => ({
          ...prev,
          pendingOperations: pending.length,
          storageUsed: storage.used,
          storageQuota: storage.quota,
        }));
      } catch (error) {
        console.error('Failed to initialize offline storage:', error);
      }
    };

    init();
  }, []);

  // 网络状态监听
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // 网络恢复时自动同步
      syncPendingOperations();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 添加离线操作到队列
  const queueOfflineOperation = useCallback(
    async (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>) => {
      const fullOperation: OfflineOperation = {
        ...operation,
        id: generateOfflineId(),
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      await queueOperation(fullOperation);

      setState(prev => ({
        ...prev,
        pendingOperations: prev.pendingOperations + 1,
      }));
    },
    []
  );

  // 同步待处理操作
  const syncPendingOperations = useCallback(async (): Promise<SyncResult> => {
    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      const operations = await getPendingOperations();

      for (const op of operations) {
        try {
          // 这里应该调用实际的 API 来同步数据
          // 暂时只删除本地操作记录
          await deleteOperation(op.id);
          result.syncedCount++;

          setState(prev => ({
            ...prev,
            pendingOperations: Math.max(0, prev.pendingOperations - 1),
            lastSyncTime: new Date().toISOString(),
          }));
        } catch (error: any) {
          result.failedCount++;
          result.errors.push(`${op.table}:${op.id} - ${error.message}`);
          result.success = false;
        }
      }
    } catch (error: any) {
      result.success = false;
      result.errors.push(error.message);
    }

    return result;
  }, []);

  // 保存离线数据
  const saveData = useCallback(
    async (data: Omit<OfflineData, 'id' | 'createdAt' | 'syncedAt' | 'syncStatus'>): Promise<string> => {
      const id = generateOfflineId();
      const offlineData: OfflineData = {
        ...data,
        id,
        createdAt: new Date().toISOString(),
        syncedAt: null,
        syncStatus: 'pending',
      };

      await saveOfflineData(offlineData);
      return id;
    },
    []
  );

  const value: OfflineContextValue = {
    state,
    isOffline: !state.isOnline,
    pendingCount: state.pendingOperations,
    queueOfflineOperation,
    syncPendingOperations,
    saveOfflineData: saveData,
  };

  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

// 使用离线状态的 Hook
export function useOffline(): OfflineContextValue {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
}

// 简单的在线状态 Hook
export function useOnlineStatus(): boolean {
  const { state } = useOffline();
  return state.isOnline;
}

// 待同步数量 Hook
export function usePendingCount(): number {
  const { pendingCount } = useOffline();
  return pendingCount;
}
