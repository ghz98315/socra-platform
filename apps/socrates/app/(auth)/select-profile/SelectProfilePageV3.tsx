'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ChartBar, CheckCircle, GraduationCap, Loader2, UserCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getRoleAvatar } from '@/lib/profile-avatar';
import type { ThemeType } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface ProfileOption {
  id: string;
  title: string;
  subtitle: string;
  role: 'student' | 'parent';
  theme: ThemeType;
  gradeLevel?: [number, number];
  description: string;
  icon: React.ReactNode;
  notes: string[];
}

const profileOptions: ProfileOption[] = [
  {
    id: 'junior',
    title: '小学模式',
    subtitle: '3-6 年级',
    role: 'student',
    theme: 'junior',
    gradeLevel: [3, 6],
    description: '适合作文批改、基础题引导、错题复习与学习习惯养成。',
    icon: <GraduationCap className="h-12 w-12" />,
    notes: ['AI 提问更温和', '更强调步骤提示', '适合基础巩固'],
  },
  {
    id: 'senior',
    title: '中学模式',
    subtitle: '7-9 年级',
    role: 'student',
    theme: 'senior',
    gradeLevel: [7, 9],
    description: '适合多步推理、几何题讲解、结构化复盘与提分训练。',
    icon: <UserCircle className="h-12 w-12" />,
    notes: ['AI 推理更深入', '适合综合题拆解', '更强调举一反三'],
  },
  {
    id: 'parent',
    title: '家长模式',
    subtitle: '任务与家庭协同',
    role: 'parent',
    theme: 'senior',
    description: '查看孩子计划、任务推进、学习报告与家庭协同提醒。',
    icon: <ChartBar className="h-12 w-12" />,
    notes: ['查看任务进展', '管理家庭协同', '追踪复习与报告'],
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

export default function SelectProfilePageV3() {
  const router = useRouter();
  const { profile, loading, refreshProfile, user, updateProfile, signOut } = useAuth();
  const [selecting, setSelecting] = useState<string | null>(null);

  const currentOptionId = getCurrentOptionId(profile?.role, profile?.grade_level);

  useEffect(() => {
    if (!loading && user && !profile) {
      void refreshProfile();
    }
  }, [loading, user, profile, refreshProfile]);

  const avatarHint = useMemo(() => {
    if (!profile) {
      return '已在注册时保存头像，可在设置页继续修改。';
    }

    return `切换到学生端会使用学生头像，切换到家长端会使用家长头像。当前展示的是${profile.role === 'parent' ? '家长' : '学生'}头像。`;
  }, [profile]);

  const handleSelectProfile = async (option: ProfileOption) => {
    if (!user || selecting) {
      return;
    }

    const nextAvatarUrl = getRoleAvatar(profile, option.role) || profile?.avatar_url || null;

    setSelecting(option.id);

    try {
      await updateProfile({
        role: option.role,
        theme_preference: option.theme,
        grade_level: option.gradeLevel?.[0] ?? profile?.grade_level,
        avatar_url: nextAvatarUrl || undefined,
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
          <h1 className="text-3xl font-semibold tracking-tight text-warm-900">选择进入方式</h1>
          <p className="mt-2 text-warm-600">
            {avatarHint}
          </p>
          <p className="mt-1 text-sm text-warm-400">头像与昵称后续都可以在设置页修改。</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {profileOptions.map((option) => {
            const isCurrent = currentOptionId === option.id;
            const isBusy = selecting !== null;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectProfile(option)}
                disabled={isBusy}
                className={cn(
                  'group relative rounded-[30px] border-2 bg-white p-8 text-left transition-all duration-300',
                  'hover:-translate-y-1 hover:shadow-lg hover:shadow-warm-500/10',
                  isCurrent
                    ? 'border-warm-500 shadow-lg shadow-warm-500/15'
                    : 'border-warm-100 hover:border-warm-200',
                  isBusy && 'cursor-not-allowed opacity-80'
                )}
              >
                {isCurrent ? (
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
                <p className="mt-4 min-h-16 text-sm leading-6 text-warm-600">{option.description}</p>

                <div className="mt-4 space-y-2">
                  {option.notes.map((note) => (
                    <div key={note} className="flex items-center gap-2 text-sm text-warm-500">
                      <span className="h-1.5 w-1.5 rounded-full bg-warm-400" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>

                <div
                  className={cn(
                    'mt-6 inline-flex items-center rounded-full px-4 py-3 text-sm font-medium transition-colors',
                    isCurrent
                      ? 'bg-green-500 text-white'
                      : 'bg-warm-500 text-white group-hover:bg-warm-600'
                  )}
                >
                  {selecting === option.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      切换中...
                    </>
                  ) : isCurrent ? (
                    '当前使用中'
                  ) : (
                    <>
                      进入{option.title}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
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
