// =====================================================
// Project Socrates - Offline Indicator
// 离线状态指示器组件
// =====================================================

'use client';

import { useState } from 'react';
import {
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw,
  CheckCircle,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useOffline } from '@/lib/offline/OfflineContext';

interface OfflineIndicatorProps {
  compact?: boolean;
}

// 格式化存储大小
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function OfflineIndicator({ compact = false }: OfflineIndicatorProps) {
  const { state, isOffline, pendingCount, syncPendingOperations } = useOffline();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    if (isOffline || isSyncing) return;

    setIsSyncing(true);
    try {
      await syncPendingOperations();
    } finally {
      setIsSyncing(false);
    }
  };

  // 离线状态
  if (isOffline) {
    return (
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs cursor-default',
          'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
        )}
        title="当前处于离线状态 - 数据将在恢复连接后自动同步"
      >
        <WifiOff className="w-3.5 h-3.5" />
        {!compact && <span>离线</span>}
      </div>
    );
  }

  // 有待同步数据
  if (pendingCount > 0) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'gap-2 h-8',
              'bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
            )}
          >
            <CloudUpload className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              {pendingCount} 待同步
            </span>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="flex items-center gap-2">
            <CloudUpload className="w-4 h-4 text-yellow-500" />
            离线数据同步
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div className="px-2 py-1.5 text-sm text-muted-foreground">
            <p>有 {pendingCount} 条数据等待同步到服务器</p>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={handleSync} disabled={isSyncing}>
            {isSyncing ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {isSyncing ? '同步中...' : '立即同步'}
          </DropdownMenuItem>

          {state.lastSyncTime && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground border-t">
              上次同步: {new Date(state.lastSyncTime).toLocaleString('zh-CN')}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // 在线且已同步
  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs cursor-default',
        'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
      )}
      title={`在线 · 已同步${state.storageUsed > 0 ? ` | 本地缓存: ${formatBytes(state.storageUsed)}` : ''}`}
    >
      <Wifi className="w-3.5 h-3.5" />
      {!compact && <CheckCircle className="w-3 h-3" />}
    </div>
  );
}

// 离线横幅提示（用于页面顶部）
export function OfflineBanner() {
  const { isOffline, pendingCount } = useOffline();

  if (!isOffline) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[100]',
        'bg-yellow-500 text-yellow-950',
        'px-4 py-2 text-center text-sm font-medium',
        'animate-slide-down'
      )}
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="w-4 h-4" />
        <span>当前处于离线模式</span>
        {pendingCount > 0 && (
          <Badge variant="secondary" className="ml-2 bg-yellow-600 text-yellow-100">
            {pendingCount} 条数据待同步
          </Badge>
        )}
      </div>
    </div>
  );
}

// 存储使用情况组件
export function StorageInfo() {
  const { state } = useOffline();
  const usagePercent = state.storageQuota > 0
    ? Math.round((state.storageUsed / state.storageQuota) * 100)
    : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <Database className="w-4 h-4 text-muted-foreground" />
          本地存储
        </span>
        <span className="text-muted-foreground">
          {formatBytes(state.storageUsed)} / {formatBytes(state.storageQuota)}
        </span>
      </div>

      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full transition-all',
            usagePercent > 80 ? 'bg-red-500' : usagePercent > 50 ? 'bg-yellow-500' : 'bg-green-500'
          )}
          style={{ width: `${Math.min(usagePercent, 100)}%` }}
        />
      </div>
    </div>
  );
}
