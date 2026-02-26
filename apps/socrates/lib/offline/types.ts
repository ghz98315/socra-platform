// =====================================================
// Project Socrates - Offline Mode Types
// 离线模式类型定义
// =====================================================

// 离线数据存储类型
export interface OfflineData {
  id: string;
  type: 'error_session' | 'chat_message' | 'user_preference' | 'achievement';
  data: any;
  createdAt: string;
  syncedAt: string | null;
  syncStatus: 'pending' | 'synced' | 'failed';
}

// 离线操作队列
export interface OfflineOperation {
  id: string;
  operation: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

// 离线状态
export interface OfflineState {
  isOnline: boolean;
  isServiceWorkerReady: boolean;
  pendingOperations: number;
  lastSyncTime: string | null;
  storageUsed: number; // bytes
  storageQuota: number; // bytes
}

// 缓存策略
export type CacheStrategy = 'network-first' | 'cache-first' | 'stale-while-revalidate';

// 缓存配置
export interface CacheConfig {
  name: string;
  strategy: CacheStrategy;
  maxAge: number; // seconds
  maxEntries?: number;
}

// 同步结果
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}
