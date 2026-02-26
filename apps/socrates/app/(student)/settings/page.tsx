// =====================================================
// Project Socrates - Settings Page
// 设置页面 - 包含 AI 模型选择
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  Settings,
  Cpu,
  MessageSquare,
  Eye,
  Brain,
  Check,
  Loader2,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { AVAILABLE_MODELS, PROVIDER_CONFIG, getModelsForPurpose } from '@/lib/ai-models/config';
import type { AIModelConfig, UserModelPreference, ModelPurpose } from '@/lib/ai-models/types';

export default function SettingsPage() {
  const { profile } = useAuth();
  const [preference, setPreference] = useState<UserModelPreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedModels, setSelectedModels] = useState({
    chat: '',
    vision: '',
    reasoning: '',
  });

  useEffect(() => {
    if (profile?.id) {
      loadSettings();
    }
  }, [profile?.id]);

  const loadSettings = async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/ai-settings?user_id=${profile.id}`);
      if (response.ok) {
        const result = await response.json();
        setPreference(result.data.preference);

        if (result.data.preference) {
          setSelectedModels({
            chat: result.data.preference.chat_model,
            vision: result.data.preference.vision_model,
            reasoning: result.data.preference.reasoning_model,
          });
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!profile?.id) return;
    setSaving(true);

    try {
      const response = await fetch('/api/ai-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: profile.id,
          chat_model: selectedModels.chat,
          vision_model: selectedModels.vision,
          reasoning_model: selectedModels.reasoning,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setPreference(result.data);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const purposeConfig: Record<ModelPurpose, { label: string; icon: React.ElementType; description: string }> = {
    chat: {
      label: '对话模型',
      icon: MessageSquare,
      description: '用于日常对话和苏格拉底式引导学习',
    },
    vision: {
      label: '视觉模型',
      icon: Eye,
      description: '用于图片识别、OCR文字提取',
    },
    reasoning: {
      label: '推理模型',
      icon: Brain,
      description: '用于复杂数学物理问题的深度推理',
    },
  };

  const renderModelSelector = (purpose: ModelPurpose) => {
    const config = purposeConfig[purpose];
    const Icon = config.icon;
    const models = getModelsForPurpose(purpose);
    const selectedId = selectedModels[purpose];
    const selectedModel = AVAILABLE_MODELS.find(m => m.id === selectedId);

    return (
      <Card key={purpose} className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Icon className="w-5 h-5 text-primary" />
            {config.label}
          </CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {models.map((model) => {
              const providerConfig = PROVIDER_CONFIG[model.provider];
              const isSelected = selectedId === model.id;

              return (
                <button
                  key={model.id}
                  onClick={() => setSelectedModels(prev => ({ ...prev, [purpose]: model.id }))}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{model.name}</span>
                        {model.recommended && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            推荐
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={cn("text-xs", providerConfig.color)}
                        >
                          {providerConfig.name}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {model.description}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {model.features.map((feature, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const themeClass = profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior';

  if (loading) {
    return (
      <div className={cn('min-h-screen bg-background flex items-center justify-center', themeClass)}>
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">加载设置...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-slate-50 via-white to-gray-50 dark:from-slate-950 dark:via-slate-900 dark:to-gray-950', themeClass)}>
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gray-200/30 dark:bg-gray-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-slate-200/20 dark:bg-slate-900/20 rounded-full blur-3xl" />
      </div>

      {/* 页面标题 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <PageHeader
          title="设置"
          description="配置你的学习偏好和 AI 模型"
          icon={Settings}
          iconColor="text-gray-500"
          actions={
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              保存设置
            </Button>
          }
        />
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-24 space-y-6">
        {/* AI 模型设置 */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">AI 模型设置</h2>
          </div>

          <div className="p-4 bg-muted/30 rounded-xl flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p>选择适合你的 AI 模型。不同模型有不同的特点：</p>
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li><strong>DeepSeek</strong> - 推理能力强，适合数学物理</li>
                <li><strong>通义千问</strong> - 中文能力强，支持图片识别</li>
                <li><strong>豆包</strong> - 响应快，中文对话自然</li>
              </ul>
            </div>
          </div>

          {(['chat', 'vision', 'reasoning'] as ModelPurpose[]).map(renderModelSelector)}
        </div>

        {/* 当前配置摘要 */}
        {preference && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">当前配置</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">对话模型</span>
                  <span className="font-medium">{AVAILABLE_MODELS.find(m => m.id === preference.chat_model)?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">视觉模型</span>
                  <span className="font-medium">{AVAILABLE_MODELS.find(m => m.id === preference.vision_model)?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">推理模型</span>
                  <span className="font-medium">{AVAILABLE_MODELS.find(m => m.id === preference.reasoning_model)?.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">最后更新</span>
                  <span className="text-muted-foreground">
                    {new Date(preference.updated_at).toLocaleString('zh-CN')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
