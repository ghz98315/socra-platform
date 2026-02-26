// =====================================================
// Project Socrates - Multi-Device Sync Service
// 多设备同步服务 - 使用 Supabase Realtime
// =====================================================

import { createClient } from '@supabase/supabase-js';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { DeviceInfo, SyncStatus, SyncState, SyncEvent, RealtimeConfig } from './types';

// 生成设备 ID
function generateDeviceId(): string {
  const stored = localStorage.getItem('socrates_device_id');
  if (stored) return stored;

  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem('socrates_device_id', id);
  return id;
}

// 获取设备信息
function getDeviceInfo(): DeviceInfo {
  const ua = navigator.userAgent;
  let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
  let browser = 'Unknown';
  let os = 'Unknown';

  // 检测设备类型
  if (/tablet|ipad/i.test(ua)) {
    deviceType = 'tablet';
  } else if (/mobile|android|iphone/i.test(ua)) {
    deviceType = 'mobile';
  }

  // 检测浏览器
  if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/edge/i.test(ua)) browser = 'Edge';

  // 检测操作系统
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS';

  return {
    id: generateDeviceId(),
    user_id: '',
    device_name: `${browser} on ${os}`,
    device_type: deviceType,
    browser,
    os,
    last_active: new Date().toISOString(),
    is_current: true,
  };
}

// 同步服务类
export class SyncService {
  private supabase: ReturnType<typeof createClient> | null = null;
  private channels: Map<string, RealtimeChannel> = new Map();
  private deviceId: string;
  private deviceInfo: DeviceInfo;
  private userId: string | null = null;
  private presenceChannel: RealtimeChannel | null = null;
  private listeners: Set<(state: SyncState) => void> = new Set();
  private syncState: SyncState = {
    status: 'offline',
    lastSyncTime: null,
    pendingChanges: 0,
    onlineDevices: [],
    error: null,
  };

  constructor() {
    this.deviceId = generateDeviceId();
    this.deviceInfo = getDeviceInfo();
    this.deviceInfo.id = this.deviceId;
  }

  // 初始化同步服务
  async initialize(supabaseClient: ReturnType<typeof createClient>, userId: string): Promise<void> {
    this.supabase = supabaseClient;
    this.userId = userId;
    this.deviceInfo.user_id = userId;

    // 更新状态为同步中
    this.updateState({ status: 'syncing' });

    // 设置在线状态追踪
    await this.setupPresence();

    // 设置网络状态监听
    this.setupNetworkListener();

    // 标记为已同步
    this.updateState({
      status: 'synced',
      lastSyncTime: new Date().toISOString(),
    });
  }

  // 设置在线状态
  private async setupPresence(): Promise<void> {
    if (!this.supabase || !this.userId) return;

    const channelName = `presence:${this.userId}`;

    this.presenceChannel = this.supabase.channel(channelName, {
      config: {
        presence: {
          key: this.deviceId,
        },
      },
    });

    // 监听在线状态变化
    this.presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = this.presenceChannel?.presenceState();
        const devices: DeviceInfo[] = [];

        if (state) {
          for (const [deviceId, presences] of Object.entries(state)) {
            const presence = (presences as any[])[0];
            if (presence) {
              devices.push({
                id: deviceId,
                user_id: this.userId!,
                device_name: presence.device_name || 'Unknown Device',
                device_type: presence.device_type || 'desktop',
                browser: presence.browser || 'Unknown',
                os: presence.os || 'Unknown',
                last_active: presence.last_active || new Date().toISOString(),
                is_current: deviceId === this.deviceId,
              });
            }
          }
        }

        this.updateState({ onlineDevices: devices });
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Device joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Device left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // 发送当前设备状态
          await this.presenceChannel?.track({
            device_name: this.deviceInfo.device_name,
            device_type: this.deviceInfo.device_type,
            browser: this.deviceInfo.browser,
            os: this.deviceInfo.os,
            last_active: new Date().toISOString(),
          });
        }
      });

    this.channels.set(channelName, this.presenceChannel);

    // 定期更新活跃时间
    setInterval(() => {
      this.updatePresence();
    }, 30000); // 每30秒更新一次
  }

  // 更新在线状态
  private async updatePresence(): Promise<void> {
    if (!this.presenceChannel) return;

    await this.presenceChannel.track({
      device_name: this.deviceInfo.device_name,
      device_type: this.deviceInfo.device_type,
      browser: this.deviceInfo.browser,
      os: this.deviceInfo.os,
      last_active: new Date().toISOString(),
    });
  }

  // 订阅数据变更
  subscribeToTable(config: RealtimeConfig, callback: (event: SyncEvent) => void): RealtimeChannel | null {
    if (!this.supabase || !this.userId) return null;

    const channelName = `${config.table}:${this.userId}:${config.channel}`;

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes' as any,
        {
          event: config.event || '*',
          schema: 'public',
          table: config.table,
          filter: config.filter || `user_id=eq.${this.userId}`,
        },
        (payload: any) => {
          const event: SyncEvent = {
            type: payload.eventType,
            table: payload.table,
            record: payload.new || payload.old,
            timestamp: new Date().toISOString(),
          };
          callback(event);
          this.updateState({ lastSyncTime: event.timestamp });
        }
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  // 订阅错题会话变更
  subscribeToErrorSessions(callback: (event: SyncEvent) => void): RealtimeChannel | null {
    return this.subscribeToTable(
      { channel: 'error_sessions', table: 'error_sessions' },
      callback
    );
  }

  // 订阅聊天消息变更
  subscribeToChatMessages(sessionId: string, callback: (event: SyncEvent) => void): RealtimeChannel | null {
    return this.subscribeToTable(
      { channel: 'chat_messages', table: 'chat_messages', filter: `session_id=eq.${sessionId}` },
      callback
    );
  }

  // 设置网络状态监听
  private setupNetworkListener(): void {
    window.addEventListener('online', () => {
      this.updateState({ status: 'synced', error: null });
    });

    window.addEventListener('offline', () => {
      this.updateState({ status: 'offline' });
    });
  }

  // 更新状态
  private updateState(partial: Partial<SyncState>): void {
    this.syncState = { ...this.syncState, ...partial };
    this.notifyListeners();
  }

  // 添加状态监听器
  addListener(listener: (state: SyncState) => void): () => void {
    this.listeners.add(listener);
    // 立即通知当前状态
    listener(this.syncState);
    // 返回取消订阅函数
    return () => this.listeners.delete(listener);
  }

  // 通知所有监听器
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.syncState));
  }

  // 获取当前状态
  getState(): SyncState {
    return this.syncState;
  }

  // 获取设备信息
  getDeviceInfo(): DeviceInfo {
    return this.deviceInfo;
  }

  // 获取在线设备数量
  getOnlineDeviceCount(): number {
    return this.syncState.onlineDevices.length;
  }

  // 清理资源
  async cleanup(): Promise<void> {
    for (const [name, channel] of this.channels) {
      await channel.unsubscribe();
    }
    this.channels.clear();
    this.presenceChannel = null;
    this.listeners.clear();
  }
}

// 单例实例
let syncServiceInstance: SyncService | null = null;

export function getSyncService(): SyncService {
  if (!syncServiceInstance) {
    syncServiceInstance = new SyncService();
  }
  return syncServiceInstance;
}

// 清理同步服务
export function cleanupSyncService(): void {
  if (syncServiceInstance) {
    syncServiceInstance.cleanup();
    syncServiceInstance = null;
  }
}
