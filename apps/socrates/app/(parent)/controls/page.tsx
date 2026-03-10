// =====================================================
// Project Socrates - Parental Controls Page
// 家长管控设置页面
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Shield,
  Clock,
  Timer,
  AlertTriangle,
  Info,
  ChevronRight,
  Moon,
  Sun,
  Calendar
} from 'lucide-react';

export default function ParentalControlsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 获取设置
  useEffect(() => {
    async function fetchSettings() {
      if (!user) return;

      try {
        const response = await fetch(`/api/teen-mode?user_id=${user.id}`);
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Failed to fetch teen mode settings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [user?.id]);

  // 保存设置
  const handleSave = async () => {
    if (!settings || !user) return;

    try {
      const response = await fetch('/api/teen-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          ...settings
        })
      });

      if (response.ok) {
        alert('设置已保存');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('保存失败，请重试');
    }
  };

  // 快速预设
  const quickPresets = [
    {
      name: '轻度保护',
      daily_limit: 90,
      rest_interval: 30,
      filter_level: 'light',
      description: '适合低年级学生'
    },
    {
      name: '标准模式',
      daily_limit: 120,
      rest_interval: 45,
      filter_level: 'standard',
      description: '适合大多数学生'
    },
    {
      name: '严格保护',
      daily_limit: 60,
      rest_interval: 20,
      filter_level: 'strict',
      description: '适合需要更多限制的学生'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-warm-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-8 h-8 text-warm-500" />
        <div>
          <h1 className="text-xl font-bold text-gray-900">青少年模式</h1>
          <p className="text-gray-600">保护孩子的健康成长</p>
        </div>
      </div>

      {/* 主开关 */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="w-6 h-6 text-warm-500" />
              <div>
                <h2 className="font-semibold text-gray-900">启用青少年模式</h2>
                <p className="text-sm text-gray-500">
                  限制每日使用时长和过滤不适当内容
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.enabled}
              onCheckedChange={(enabled: boolean) => {
                setSettings({ ...settings, enabled });
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* 使用时长限制 */}
      {settings?.enabled && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">每日使用时长</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-2">时长限制 (分钟)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={30}
                    max={180}
                    value={settings?.daily_time_limit || 120}
                    onChange={(e) => setSettings({
                      ...settings,
                      daily_time_limit: parseInt(e.target.value)
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">
                    {settings?.daily_time_limit} 分钟/天
                  </span>
                </div>
              </div>

              {/* 休息提醒 */}
              <div>
                <label className="text-sm text-gray-600 mb-2">休息提醒间隔 (分钟)</label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min={15}
                    max={60}
                    value={settings?.rest_reminder_interval || 45}
                    onChange={(e) => setSettings({
                      ...settings,
                      rest_reminder_interval: parseInt(e.target.value)
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">
                    每 {settings?.rest_reminder_interval} 分钟提醒休息
                  </span>
                </div>
              </div>
            </div>

            {/* 预设按钮 */}
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">快速预设</p>
              <div className="grid grid-cols-3 gap-2">
                {quickPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => setSettings({
                      ...settings,
                      daily_time_limit: preset.daily_limit,
                      rest_reminder_interval: preset.rest_interval,
                    })}
                    className={cn(
                      "p-3 text-left text-sm border rounded-lg hover:bg-gray-50",
                      settings?.daily_time_limit === preset.daily_limit &&
                      "bg-warm-50 border-warm-200"
                    )}
                  >
                    <div className="font-medium text-gray-900">{preset.name}</div>
                    <div className="text-xs text-gray-500">{preset.description}</div>
                    <div className="text-xs text-warm-600">
                      {preset.daily_limit}分钟/天
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 使用时段 */}
      {settings?.enabled && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">使用时段</h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Sun className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium">工作日</span>
                </div>
                <div className="text-sm text-gray-600">
                  08:00 - 22:00
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">周末</span>
                </div>
                <div className="text-sm text-gray-600">
                  08:00 - 23:00
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              在此时段外，应用将无法使用
            </p>
          </CardContent>
        </Card>
      )}

      {/* 保存按钮 */}
      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => window.history.back()}>
          取消
        </Button>
        <Button onClick={handleSave}>
          保存设置
        </Button>
      </div>
    </div>
  );
}
