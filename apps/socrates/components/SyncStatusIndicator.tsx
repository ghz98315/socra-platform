// =====================================================
// Project Socrates - Sync Status Indicator
// 同步状态指示器组件
// =====================================================

'use client';

import { useState } from 'react';
import {
  Cloud,
  CloudOff,
  CloudUpload,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Users,
  ChevronDown,
  Check,
  AlertCircle,
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
import type { SyncStatus, DeviceInfo } from '@/lib/sync/types';
import { useSync } from '@/lib/sync/SyncContext';

const statusConfig: Record<SyncStatus, { icon: typeof Cloud; label: string; color: string; bgColor: string }> = {
  synced: {
    icon: Cloud,
    label: '已同步',
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  syncing: {
    icon: RefreshCw,
    label: '同步中',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  offline: {
    icon: CloudOff,
    label: '离线',
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
  },
  error: {
    icon: AlertCircle,
    label: '同步错误',
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
};

const deviceIcons: Record<string, typeof Monitor> = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
};

interface SyncStatusIndicatorProps {
  compact?: boolean;
  showDevices?: boolean;
}

export function SyncStatusIndicator({ compact = false, showDevices = true }: SyncStatusIndicatorProps) {
  const { syncState, onlineDevices, deviceInfo } = useSync();
  const [isOpen, setIsOpen] = useState(false);

  const config = statusConfig[syncState.status];
  const StatusIcon = config.icon;
  const otherDevices = onlineDevices.filter(d => !d.is_current);

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5 px-2 py-1 rounded-full text-xs', config.bgColor)}>
        <StatusIcon
          className={cn('w-3.5 h-3.5', config.color, syncState.status === 'syncing' && 'animate-spin')}
        />
        <span className={config.color}>{config.label}</span>
        {onlineDevices.length > 1 && (
          <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">
            {onlineDevices.length}
          </Badge>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-2 h-8', config.bgColor)}
        >
          <StatusIcon
            className={cn('w-4 h-4', config.color, syncState.status === 'syncing' && 'animate-spin')}
          />
          <span className={cn('text-sm', config.color)}>{config.label}</span>
          {showDevices && onlineDevices.length > 1 && (
            <Badge variant="secondary" className="h-5 px-1.5">
              <Users className="w-3 h-3 mr-1" />
              {onlineDevices.length}
            </Badge>
          )}
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>同步状态</span>
          <Badge variant="outline" className={cn('text-xs', config.color)}>
            {config.label}
          </Badge>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* 当前设备 */}
        {deviceInfo && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              当前设备
            </DropdownMenuLabel>
            <DropdownMenuItem className="flex items-center gap-3">
              {(() => {
                const DeviceIcon = deviceIcons[deviceInfo.device_type] || Monitor;
                return (
                  <>
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', config.bgColor)}>
                      <DeviceIcon className={cn('w-4 h-4', config.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{deviceInfo.device_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {deviceInfo.browser} · {deviceInfo.os}
                      </p>
                    </div>
                    <Check className="w-4 h-4 text-green-500" />
                  </>
                );
              })()}
            </DropdownMenuItem>
          </>
        )}

        {/* 其他在线设备 */}
        {showDevices && otherDevices.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
              其他在线设备 ({otherDevices.length})
            </DropdownMenuLabel>
            {otherDevices.map((device) => {
              const DeviceIcon = deviceIcons[device.device_type] || Monitor;
              return (
                <DropdownMenuItem key={device.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted">
                    <DeviceIcon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{device.device_name}</p>
                    <p className="text-xs text-muted-foreground">
                      活跃于 {formatLastActive(device.last_active)}
                    </p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </DropdownMenuItem>
              );
            })}
          </>
        )}

        {/* 同步信息 */}
        {syncState.lastSyncTime && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              上次同步: {new Date(syncState.lastSyncTime).toLocaleString('zh-CN')}
            </div>
          </>
        )}

        {/* 错误信息 */}
        {syncState.error && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-red-500 flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              {syncState.error}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 格式化最后活跃时间
function formatLastActive(timestamp: string): string {
  const now = new Date();
  const lastActive = new Date(timestamp);
  const diffMs = now.getTime() - lastActive.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟前`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} 小时前`;

  return lastActive.toLocaleDateString('zh-CN');
}

// 简单的在线指示器（用于显示在标题栏）
export function OnlineDevicesBadge() {
  const { onlineDevices } = useSync();

  if (onlineDevices.length <= 1) return null;

  return (
    <Badge variant="secondary" className="gap-1 text-xs">
      <Users className="w-3 h-3" />
      {onlineDevices.length} 台设备在线
    </Badge>
  );
}
