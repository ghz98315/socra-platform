'use client';

import { useEffect, useState, type ElementType } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Brain,
  Check,
  Cpu,
  Eye,
  IdCard,
  Info,
  Loader2,
  MessageSquare,
  RefreshCw,
  Shield,
  Sparkles,
  UserRound,
  Users,
} from 'lucide-react';

import { AvatarPicker } from '@/components/AvatarPicker';
import { LinkRequestsPanel } from '@/components/LinkRequestsPanel';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PROVIDER_CONFIG, getDefaultModel, getModelById, getModelsForPurpose } from '@/lib/ai-models/config';
import type { ModelPurpose, UserModelPreference } from '@/lib/ai-models/types';
import { defaultAvatarByRole } from '@/lib/avatar-options';
import { useAuth } from '@/lib/contexts/AuthContext';
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

const PURPOSE_META: Record<ModelPurpose, { label: string; description: string; icon: ElementType }> = {
  chat: {
    label: '对话模型',
    description: '用于日常提问、引导式对话与学习陪练。',
    icon: MessageSquare,
  },
  vision: {
    label: '图像模型',
    description: '用于拍照识题、OCR 与图片理解。',
    icon: Eye,
  },
  reasoning: {
    label: '推理模型',
    description: '用于多步推理和难题拆解。',
    icon: Brain,
  },
};

const GRADE_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export default function SettingsPage() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [savingModels, setSavingModels] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [preference, setPreference] = useState<UserModelPreference | null>(null);
  const [teenModeData, setTeenModeData] = useState<TeenModeData | null>(null);
  const [selectedModels, setSelectedModels] = useState<Record<ModelPurpose, string>>({
    chat: '',
    vision: '',
    reasoning: '',
  });
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    phone: '',
    gradeLevel: '',
    studentAvatar: defaultAvatarByRole.student,
    parentAvatar: defaultAvatarByRole.parent,
  });

  useEffect(() => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    setProfileForm({
      displayName: profile.display_name || '',
      phone: profile.phone || '',
      gradeLevel: profile.grade_level ? String(profile.grade_level) : '',
      studentAvatar:
        profile.student_avatar_url || profile.avatar_url || defaultAvatarByRole.student,
      parentAvatar:
        profile.parent_avatar_url || profile.avatar_url || defaultAvatarByRole.parent,
    });

    const loadPageData = async () => {
      setLoading(true);
      await Promise.all([loadSettings(profile.id), loadTeenMode(profile.id)]);
      setLoading(false);
    };

    void loadPageData();
  }, [
    profile?.id,
    profile?.display_name,
    profile?.phone,
    profile?.grade_level,
    profile?.student_avatar_url,
    profile?.parent_avatar_url,
    profile?.avatar_url,
  ]);

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
        chat: getDefaultModel('chat').id,
        vision: getDefaultModel('vision').id,
        reasoning: getDefaultModel('reasoning').id,
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

  async function saveModelSettings() {
    if (!profile?.id) {
      return;
    }

    setSavingModels(true);
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
        throw new Error('保存 AI 设置失败');
      }

      const result = await response.json();
      setPreference(result.data);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSavingModels(false);
    }
  }

  async function saveProfileSettings() {
    setProfileError('');
    setProfileMessage('');
    setSavingProfile(true);

    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: profileForm.displayName.trim(),
          phone: profileForm.phone.trim(),
          grade_level: profileForm.gradeLevel ? Number(profileForm.gradeLevel) : null,
          student_avatar_url: profileForm.studentAvatar,
          parent_avatar_url: profileForm.parentAvatar,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '保存资料失败');
      }

      await refreshProfile();
      setProfileMessage('基础资料已更新。');
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : '保存资料失败');
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profileForm.displayName || profile?.display_name || '用户';

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-semibold">设置中心</h1>
            </div>
            <p className="text-sm text-muted-foreground">
              管理基础资料、头像、年级、手机号，以及 AI 模型和家长关联设置。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
          </div>
        </div>

        <Card className="border-warm-200/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IdCard className="h-5 w-5 text-warm-600" />
              基础资料
            </CardTitle>
            <CardDescription>学生头像与家长头像只在这里维护，角色切换时会自动对应展示。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl bg-warm-50/70 p-4 sm:flex-row sm:items-center">
              <Avatar className="size-24 border-2 border-white shadow-sm">
                <AvatarImage src={profile?.avatar_url || profileForm.studentAvatar} alt={displayName} />
                <AvatarFallback className="bg-warm-500/20 text-xl text-warm-700">
                  {displayName.slice(0, 1)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-base font-medium">{displayName}</p>
                <p className="text-sm text-muted-foreground">
                  当前角色：{profile?.role === 'parent' ? '家长' : '学生'}
                </p>
                <p className="text-xs text-muted-foreground">
                  当前显示头像会随角色切换自动变化。
                </p>
              </div>
            </div>

            {profileError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {profileError}
              </div>
            ) : null}
            {profileMessage ? (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">
                {profileMessage}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">昵称</label>
                <Input
                  value={profileForm.displayName}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, displayName: event.target.value }))
                  }
                  placeholder="输入你的昵称"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">手机号</label>
                <Input
                  value={profileForm.phone}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, phone: event.target.value }))
                  }
                  placeholder="更换登录手机号"
                />
                <p className="text-xs text-muted-foreground">
                  修改后，下次登录请使用新的手机号。
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">学生侧年级</label>
                <select
                  value={profileForm.gradeLevel}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, gradeLevel: event.target.value }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">暂不设置</option>
                  {GRADE_OPTIONS.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade} 年级
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">学习阶段</label>
                <div className="flex h-10 items-center rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground">
                  {profileForm.gradeLevel
                    ? Number(profileForm.gradeLevel) <= 6
                      ? '小学模式'
                      : '中学模式'
                    : '将根据年级自动判断'}
                </div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-2">
              <div className="rounded-[28px] border border-warm-100 bg-gradient-to-b from-warm-50 to-white p-5">
                <AvatarPicker
                  selectedAvatar={profileForm.studentAvatar}
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, studentAvatar: value }))
                  }
                  roleFilter="student"
                  title="学生头像"
                  description="学生端工作台、错题本、复习页会显示这套头像。"
                  avatarClassName="size-24"
                />
              </div>
              <div className="rounded-[28px] border border-warm-100 bg-gradient-to-b from-orange-50 to-white p-5">
                <AvatarPicker
                  selectedAvatar={profileForm.parentAvatar}
                  onChange={(value) =>
                    setProfileForm((current) => ({ ...current, parentAvatar: value }))
                  }
                  roleFilter="parent"
                  title="家长头像"
                  description="家长端任务、家庭、报告页会显示这套头像。"
                  avatarClassName="size-24"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveProfileSettings} disabled={savingProfile}>
                {savingProfile ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                保存基础资料
              </Button>
            </div>
          </CardContent>
        </Card>

        {teenModeData?.enabled ? (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5 text-amber-600" />
                青少年模式
              </CardTitle>
              <CardDescription>当前账号受青少年模式限制，以下数据展示今日使用情况。</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">今日已使用</span>
                <span>{teenModeData.usage.usedToday} 分钟</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">每日上限</span>
                <span>{teenModeData.settings.dailyTimeLimit} 分钟</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">剩余时长</span>
                <span className={cn(teenModeData.usage.remaining <= 30 ? 'text-red-600' : '')}>
                  {teenModeData.usage.remaining} 分钟
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
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Info className="h-5 w-5 text-blue-500" />
              AI 模型偏好
            </CardTitle>
            <CardDescription>为对话、拍照识题和推理任务设置默认模型。</CardDescription>
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
                                {model.recommended ? (
                                  <Badge variant="secondary">
                                    <Sparkles className="mr-1 h-3 w-3" />
                                    推荐
                                  </Badge>
                                ) : null}
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

                            {isSelected ? (
                              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                <Check className="h-4 w-4" />
                              </span>
                            ) : null}
                          </div>
                        </button>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex justify-end">
              <Button onClick={saveModelSettings} disabled={savingModels}>
                {savingModels ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                保存 AI 设置
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              家长关联
            </CardTitle>
            <CardDescription>查看待处理的家长关联请求和当前关系状态。</CardDescription>
          </CardHeader>
          <CardContent>
            <LinkRequestsPanel />
          </CardContent>
        </Card>

        {preference ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserRound className="h-5 w-5 text-primary" />
                当前 AI 选择
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">对话模型</span>
                <span>{getModelById(preference.chat_model)?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">图像模型</span>
                <span>{getModelById(preference.vision_model)?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">推理模型</span>
                <span>{getModelById(preference.reasoning_model)?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">最近更新时间</span>
                <span>{new Date(preference.updated_at).toLocaleString('zh-CN')}</span>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
