'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChartBar, CheckCircle, GraduationCap, Loader2, UserCircle } from 'lucide-react';

import { AvatarPicker } from '@/components/AvatarPicker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { defaultAvatarByRole, type AvatarRole } from '@/lib/avatar-options';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { ThemeType } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface ProfileOption {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  theme: ThemeType;
  gradeLevel?: [number, number];
  role: AvatarRole;
  description: string;
}

const profileOptions: ProfileOption[] = [
  {
    id: 'junior',
    title: '小学模式',
    subtitle: '3-6 年级',
    description: '更贴近小学节奏，适合作文、基础题与习惯养成。',
    icon: <GraduationCap className="h-12 w-12" />,
    theme: 'junior',
    gradeLevel: [3, 6],
    role: 'student',
  },
  {
    id: 'senior',
    title: '中学模式',
    subtitle: '7-9 年级',
    description: '更适合中学推理、错题复盘与结构化提问。',
    icon: <UserCircle className="h-12 w-12" />,
    theme: 'senior',
    gradeLevel: [7, 9],
    role: 'student',
  },
  {
    id: 'parent',
    title: '家长模式',
    subtitle: '任务与家庭协同',
    description: '查看孩子计划、任务推进与复习提醒。',
    icon: <ChartBar className="h-12 w-12" />,
    theme: 'senior',
    role: 'parent',
  },
];

function getCurrentOptionId(role?: string, gradeLevel?: number | null) {
  if (role === 'parent') {
    return 'parent';
  }
  if (gradeLevel && gradeLevel <= 6) {
    return 'junior';
  }
  if (gradeLevel && gradeLevel >= 7) {
    return 'senior';
  }
  return null;
}

export default function SelectProfilePageV2() {
  const router = useRouter();
  const { profile, loading, refreshProfile, user, updateProfile, signOut } = useAuth();
  const [selecting, setSelecting] = useState<string | null>(null);
  const [avatarRoleFilter, setAvatarRoleFilter] = useState<AvatarRole>('student');
  const [selectedAvatar, setSelectedAvatar] = useState(defaultAvatarByRole.student);

  const currentOptionId = getCurrentOptionId(profile?.role, profile?.grade_level);

  useEffect(() => {
    if (!loading && user && !profile) {
      void refreshProfile();
    }
  }, [loading, user, profile, refreshProfile]);

  useEffect(() => {
    if (profile?.avatar_url) {
      setSelectedAvatar(profile.avatar_url);
    }

    if (profile?.role === 'parent') {
      setAvatarRoleFilter('parent');
    }
  }, [profile?.avatar_url, profile?.role]);

  const roleSummary = useMemo(
    () => (avatarRoleFilter === 'parent' ? '家长头像' : '学生头像'),
    [avatarRoleFilter]
  );

  const handleSelectProfile = async (option: ProfileOption) => {
    if (!user || selecting) {
      return;
    }

    const avatarUrl =
      selectedAvatar || defaultAvatarByRole[option.role] || defaultAvatarByRole.student;

    setSelecting(option.id);

    try {
      await updateProfile({
        role: option.role,
        theme_preference: option.theme,
        grade_level: option.gradeLevel?.[0],
        avatar_url: avatarUrl,
        display_name:
          profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0],
      });

      const targetUrl = option.role === 'parent' ? '/tasks' : '/workbench';
      router.push(targetUrl);
      router.refresh();
    } catch (error) {
      console.error('Failed to update profile:', error);
      const message = error instanceof Error ? error.message : String(error);
      window.alert(`设置角色失败：${message}`);
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-50">
        <Loader2 className="h-8 w-8 animate-spin text-warm-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-warm-50 via-white to-warm-50 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-warm-900">选择角色与头像</h1>
          <p className="mt-2 text-warm-600">同一账号可以在学生端和家长端之间切换，头像也会一起同步。</p>
        </div>

        <div className="rounded-[28px] border border-warm-100 bg-white p-6 shadow-sm shadow-warm-100/60">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-warm-900">先确认你的头像风格</h2>
              <p className="text-sm text-warm-500">当前筛选：{roleSummary}，后续在设置页也可以修改。</p>
            </div>

            <div className="inline-flex rounded-full border border-warm-200 bg-warm-50 p-1">
              <button
                type="button"
                onClick={() => setAvatarRoleFilter('student')}
                className={cn(
                  'rounded-full px-4 py-2 text-sm transition-colors',
                  avatarRoleFilter === 'student'
                    ? 'bg-white text-warm-700 shadow-sm'
                    : 'text-warm-500'
                )}
              >
                学生头像
              </button>
              <button
                type="button"
                onClick={() => setAvatarRoleFilter('parent')}
                className={cn(
                  'rounded-full px-4 py-2 text-sm transition-colors',
                  avatarRoleFilter === 'parent'
                    ? 'bg-white text-warm-700 shadow-sm'
                    : 'text-warm-500'
                )}
              >
                家长头像
              </button>
            </div>
          </div>

          <div className="mb-4 flex items-center gap-4 rounded-3xl bg-gradient-to-r from-warm-50 to-orange-50 p-4">
            <Avatar size="lg" className="size-16 border-2 border-white shadow-sm">
              <AvatarImage src={selectedAvatar} alt="已选头像" />
              <AvatarFallback>头像</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-warm-800">已选头像预览</p>
              <p className="text-xs text-warm-500">选择角色时，会将当前头像同步保存到个人资料。</p>
            </div>
          </div>

          <AvatarPicker
            selectedAvatar={selectedAvatar}
            onChange={setSelectedAvatar}
            roleFilter={avatarRoleFilter}
            title="可爱卡通头像"
            description="学生和家长都准备了男女风格头像，可直接点选。"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {profileOptions.map((option) => {
            const isCurrentRole = currentOptionId === option.id;
            const isBusy = selecting !== null;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectProfile(option)}
                onMouseEnter={() => setAvatarRoleFilter(option.role)}
                disabled={isBusy}
                className={cn(
                  'group relative rounded-[28px] border-2 bg-white p-8 text-left transition-all duration-300',
                  'hover:-translate-y-1 hover:shadow-lg hover:shadow-warm-500/10',
                  isCurrentRole
                    ? 'border-warm-500 shadow-lg shadow-warm-500/15'
                    : 'border-warm-100 hover:border-warm-200',
                  isBusy && 'cursor-not-allowed opacity-70'
                )}
              >
                {isCurrentRole ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-warm-500 px-4 py-1 text-xs font-medium text-white shadow-lg">
                    <CheckCircle className="mr-1 inline h-3 w-3" />
                    当前使用中
                  </div>
                ) : null}

                <div
                  className={cn(
                    'mb-6 flex h-20 w-20 items-center justify-center rounded-full',
                    option.role === 'parent'
                      ? 'bg-purple-100 text-purple-600'
                      : 'bg-warm-100 text-warm-600'
                  )}
                >
                  {option.icon}
                </div>

                <h3 className="text-xl font-semibold text-warm-900">{option.title}</h3>
                <p className="mt-1 text-sm text-warm-500">{option.subtitle}</p>
                <p className="mt-3 min-h-12 text-sm leading-6 text-warm-600">{option.description}</p>

                <div
                  className={cn(
                    'mt-6 rounded-full px-4 py-3 text-center text-sm font-medium transition-colors',
                    isCurrentRole
                      ? 'bg-green-500 text-white'
                      : 'bg-warm-500 text-white group-hover:bg-warm-600'
                  )}
                >
                  {selecting === option.id ? (
                    <span className="inline-flex items-center">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      切换中...
                    </span>
                  ) : isCurrentRole ? (
                    '当前使用中'
                  ) : (
                    `进入${option.title}`
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className="text-warm-500 hover:text-warm-700"
          >
            切换账号
          </Button>
        </div>
      </div>
    </div>
  );
}
