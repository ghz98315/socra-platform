// =====================================================
// Project Socrates - Multi-Device Sync Types
// 多设备同步类型定义
// =====================================================

// 设备信息
export interface DeviceInfo {
  id: string;
  user_id: string;
  device_name: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
  last_active: string;
  is_current: boolean;
}

// 同步状态
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'error';

// 同步数据类型
export type SyncDataType = 'error_sessions' | 'chat_messages' | 'achievements' | 'user_preferences';

// 同步事件
export interface SyncEvent {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record: any;
  timestamp: string;
}

// 同步状态信息
export interface SyncState {
  status: SyncStatus;
  lastSyncTime: string | null;
  pendingChanges: number;
  onlineDevices: DeviceInfo[];
  error: string | null;
}

// 实时订阅配置
export interface RealtimeConfig {
  channel: string;
  table: string;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  filter?: string;
}

// 冲突解决策略
export type ConflictResolution = 'server_wins' | 'client_wins' | 'merge' | 'latest_wins';

// 同步变更记录
export interface SyncChange {
  id: string;
  table: string;
  operation: 'insert' | 'update' | 'delete';
  data: any;
  timestamp: string;
  synced: boolean;
}
