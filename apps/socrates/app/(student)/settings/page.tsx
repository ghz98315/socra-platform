'use client';

import { useEffect, useState, type ElementType } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Brain,
  Check,
  Cpu,
  Eye,
  Info,
  Loader2,
  MessageSquare,
  RefreshCw,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { AVAILABLE_MODELS, PROVIDER_CONFIG, getModelsForPurpose } from '@/lib/ai-models/config';
import type { ModelPurpose, UserModelPreference } from '@/lib/ai-models/types';
import { LinkRequestsPanel } from '@/components/LinkRequestsPanel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TeenModeData {
  enabled: boolean;
  settings: {
    dailyTimeLimit: number;
    restReminderInterval: number;
    forceRestDuration: number;
  };
  usage: {
    usedToday: number;
    remaining: number;
    isTimeExceeded: boolean;
  };
}

const PURPOSE_META: Record<
  ModelPurpose,
  { label: string; description: string; icon: ElementType }
> = {
  chat: {
    label: 'Chat model',
    description: 'Used for daily tutoring and general dialogue.',
    icon: MessageSquare,
  },
  vision: {
    label: 'Vision model',
    description: 'Used for OCR and image understanding.',
    icon: Eye,
  },
  reasoning: {
    label: 'Reasoning model',
    description: 'Used for harder multi-step problem solving.',
    icon: Brain,
  },
};

export default function SettingsPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preference, setPreference] = useState<UserModelPreference | null>(null);
  const [teenModeData, setTeenModeData] = useState<TeenModeData | null>(null);
  const [selectedModels, setSelectedModels] = useState<Record<ModelPurpose, string>>({
    chat: '',
    vision: '',
    reasoning: '',
  });

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    const loadPageData = async () => {
      setLoading(true);
      await Promise.all([loadSettings(profile.id), loadTeenMode(profile.id)]);
      setLoading(false);
    };

    void loadPageData();
  }, [profile?.id]);

  async function loadSettings(userId: string) {
    try {
      const response = await fetch(`/api/ai-settings?user_id=${userId}`);
      if (!response.ok) {
        return;
      }

      const result = await response.json();
      const nextPreference = result.data?.preference ?? null;
      setPreference(nextPreference);

      if (nextPreference) {
        setSelectedModels({
          chat: nextPreference.chat_model,
          vision: nextPreference.vision_model,
          reasoning: nextPreference.reasoning_model,
        });
        return;
      }

      setSelectedModels({
        chat: getModelsForPurpose('chat')[0]?.id ?? '',
        vision: getModelsForPurpose('vision')[0]?.id ?? '',
        reasoning: getModelsForPurpose('reasoning')[0]?.id ?? '',
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async function loadTeenMode(userId: string) {
    try {
      const response = await fetch(`/api/teen-mode?user_id=${userId}`);
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      setTeenModeData({
        enabled: Boolean(data.enabled),
        settings: {
          dailyTimeLimit: data.settings?.dailyTimeLimit ?? 120,
          restReminderInterval: data.settings?.restReminderInterval ?? 45,
          forceRestDuration: data.settings?.forceRestDuration ?? 15,
        },
        usage: {
          usedToday: data.usage?.usedToday ?? 0,
          remaining: data.usage?.remaining ?? 120,
          isTimeExceeded: Boolean(data.usage?.isTimeExceeded),
        },
      });
    } catch (error) {
      console.error('Failed to load teen mode:', error);
    }
  }

  async function saveSettings() {
    if (!profile?.id) {
      return;
    }

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

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      const result = await response.json();
      setPreference(result.data);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-semibold">Settings</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage AI model preferences, teen mode status, and parent link requests.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>

        {teenModeData?.enabled && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-amber-600" />
                Teen mode
              </CardTitle>
              <CardDescription>
                Usage is currently being limited by teen mode settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Used today</span>
                <span>{teenModeData.usage.usedToday} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Daily limit</span>
                <span>{teenModeData.settings.dailyTimeLimit} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Remaining</span>
                <span
                  className={cn(
                    teenModeData.usage.remaining <= 30 ? 'text-red-600' : 'text-foreground'
                  )}
                >
                  {teenModeData.usage.remaining} min
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-amber-100">
                <div
                  className={cn(
                    'h-full rounded-full',
                    teenModeData.usage.isTimeExceeded ? 'bg-red-500' : 'bg-amber-500'
                  )}
                  style={{
                    width: `${Math.min(
                      (teenModeData.usage.usedToday / teenModeData.settings.dailyTimeLimit) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-blue-500" />
              AI model preferences
            </CardTitle>
            <CardDescription>
              Pick a default model for chat, vision, and reasoning tasks.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['chat', 'vision', 'reasoning'] as ModelPurpose[]).map((purpose) => {
              const meta = PURPOSE_META[purpose];
              const Icon = meta.icon;
              const models = getModelsForPurpose(purpose);
              const selectedId = selectedModels[purpose];

              return (
                <Card key={purpose} className="border-border/60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4 text-primary" />
                      {meta.label}
                    </CardTitle>
                    <CardDescription>{meta.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-3">
                    {models.map((model) => {
                      const provider = PROVIDER_CONFIG[model.provider];
                      const isSelected = selectedId === model.id;

                      return (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() =>
                            setSelectedModels((current) => ({ ...current, [purpose]: model.id }))
                          }
                          className={cn(
                            'rounded-xl border-2 p-4 text-left transition-colors',
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border/60 hover:border-primary/40'
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-medium">{model.name}</span>
                                {model.recommended && (
                                  <Badge variant="secondary">
                                    <Sparkles className="mr-1 h-3 w-3" />
                                    Recommended
                                  </Badge>
                                )}
                                <Badge variant="outline" className={provider.color}>
                                  {provider.name}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{model.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {model.features.map((feature) => (
                                  <Badge key={feature} variant="secondary" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {isSelected && (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-4 w-4" />
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Parent link requests
            </CardTitle>
            <CardDescription>
              Review pending parent link requests and current relationship status.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LinkRequestsPanel />
          </CardContent>
        </Card>

        {preference && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Chat</span>
                <span>{AVAILABLE_MODELS.find((model) => model.id === preference.chat_model)?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Vision</span>
                <span>{AVAILABLE_MODELS.find((model) => model.id === preference.vision_model)?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reasoning</span>
                <span>
                  {AVAILABLE_MODELS.find((model) => model.id === preference.reasoning_model)?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Updated</span>
                <span>{new Date(preference.updated_at).toLocaleString('zh-CN')}</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
