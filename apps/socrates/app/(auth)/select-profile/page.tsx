export { default } from './SelectProfilePageV3';
/*
// =====================================================
// Project Socrates - Profile Selection Page
// =====================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { ThemeType } from '@/lib/supabase/types';
import { GraduationCap, UserCircle, ChartBar, Loader2, CheckCircle } from 'lucide-react';

interface ProfileOption {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  theme: ThemeType;
  gradeLevel?: [number, number];
  role: 'student' | 'parent';
  description: string;
}
* /

const getProfileOptions = (currentRole?: string, currentTheme?: string): ProfileOption[] => [
  {
    id: 'junior',
    title: 'Junior 小学',
    subtitle: '3-6年级',
    description: '适合小学3-6年级学生，AI辅导错题学习',
    icon: <GraduationCap className="w-12 h-12" />,
    theme: 'junior',
    gradeLevel: [3, 6],
    role: 'student',
  },
  {
    id: 'senior',
    title: 'Senior 中学',
    subtitle: '7-9年级',
    description: '适合初中7-9年级学生，AI辅导错题学习',
    icon: <UserCircle className="w-12 h-12" />,
    theme: 'senior',
    gradeLevel: [7, 9],
    role: 'student',
  },
  {
    id: 'parent',
    title: 'Parent 家长',
    subtitle: '管理控制台',
    description: '查看孩子学习报告，管理学习计划',
    icon: <ChartBar className="w-12 h-12" />,
    theme: 'senior',
    role: 'parent',
  },
];

export default function SelectProfilePage() {
  const router = useRouter();
  const { profile, loading, refreshProfile, user, updateProfile, signOut } = useAuth();
  const [selecting, setSelecting] = useState<string | null>(null);

  // 获取当前用户的角色选项
  const profileOptions = getProfileOptions(profile?.role);

  // 判断当前选中的角色
  const getCurrentOptionId = () => {
    if (profile?.role === 'parent') return 'parent';
    if (profile?.grade_level && profile.grade_level <= 6) return 'junior';
    if (profile?.grade_level && profile.grade_level >= 7) return 'senior';
    return null;
  };

  const currentOptionId = getCurrentOptionId();

  // 如果用户已登录但没有 profile，重试获取
  useEffect(() => {
    if (!loading && user && !profile) {
      console.log('User logged in but no profile, retrying...');
      refreshProfile();
    }
  }, [loading, user, profile, refreshProfile]);

  const handleSelectProfile = async (option: ProfileOption) => {
    if (!user) {
      console.error('No user found');
      return;
    }

    // 防止重复点击
    if (selecting) {
      console.log('Already selecting, ignoring click');
      return;
    }

    setSelecting(option.id);

    try {
      await updateProfile({
        role: option.role,
        theme_preference: option.theme,
        grade_level: option.gradeLevel?.[0],
        display_name: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0],
      });

      console.log('Profile updated, navigating to:', option.role === 'parent' ? '/tasks' : '/workbench');

      const targetUrl = option.role === 'parent' ? '/tasks' : '/workbench';
      router.push(targetUrl);
      router.refresh();
    } catch (error) {
      console.error('Failed to update profile:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`设置角色失败: ${errorMessage}`);
      setSelecting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <Loader2 className="w-8 h-8 animate-spin text-warm-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-warm-50 p-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header * /}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-warm-900">
            选择角色
          </h1>
          <p className="text-warm-600">
            同一账号可自由切换角色
          </p>
        </div>

        {/* Profile Cards * /}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {profileOptions.map((option) => {
            const isCurrentRole = currentOptionId === option.id;

            return (
              <button
                key={option.id}
                onClick={() => handleSelectProfile(option)}
                disabled={selecting !== null}
                className={`
                  group relative bg-white rounded-2xl p-8
                  transition-all duration-300 ease-out
                  hover:shadow-lg hover:shadow-warm-500/10
                  active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                  border-2
                  ${isCurrentRole
                    ? 'border-warm-500 shadow-lg shadow-warm-500/20'
                    : 'border-warm-100 hover:border-warm-200'
                  }
                `}
              >
                {/* Current Role Badge * /}
                {isCurrentRole && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-warm-500 text-white text-xs font-medium rounded-full shadow-lg">
                    <CheckCircle className="w-3 h-3 inline mr-1" />
                    当前角色
                  </div>
                )}

                {/* Icon * /}
                <div className={`
                  w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center
                  transition-colors duration-200
                  ${option.theme === 'junior'
                    ? 'bg-warm-100 text-warm-500 group-hover:bg-warm-200'
                    : 'bg-warm-100 text-warm-600 group-hover:bg-warm-200'
                  }
                `}>
                  {option.icon}
                </div>

                {/* Title & Subtitle * /}
                <h3 className="text-center text-xl font-semibold mb-1 text-warm-900">
                  {option.title}
                </h3>
                <p className="text-center text-sm text-warm-500 mb-2">
                  {option.subtitle}
                </p>
                <p className="text-center text-xs text-warm-400 mb-6">
                  {option.description}
                </p>

                {/* Button * /}
                <div className={`
                  py-3 rounded-full text-sm font-medium transition-all
                  ${isCurrentRole
                    ? 'bg-green-500 text-white'
                    : 'bg-warm-500 text-white hover:bg-warm-600 hover:shadow-lg hover:shadow-warm-500/30'
                  }
                `}>
                  {selecting === option.id ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      切换中...
                    </div>
                  ) : isCurrentRole ? (
                    '当前使用中'
                  ) : (
                    '切换角色'
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Sign Out * /}
        <div className="text-center">
          <button
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className="text-sm text-warm-500 hover:text-warm-700 transition-colors underline underline-offset-4"
          >
            切换账户
          </button>
        </div>
      </div>
    </div>
  );
}
*/
