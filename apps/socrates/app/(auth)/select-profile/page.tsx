// =====================================================
// Project Socrates - Profile Selection Page
// =====================================================

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { ThemeType } from '@/lib/supabase/types';
import { GraduationCap, UserCircle, ChartBar, Loader2, Lock } from 'lucide-react';

interface ProfileOption {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  theme: ThemeType;
  gradeLevel?: [number, number];
  role: 'student' | 'parent';
  locked?: boolean; // 是否锁定（无权限访问）
}

const getProfileOptions = (currentRole?: string): ProfileOption[] => [
  {
    id: 'junior',
    title: 'Junior',
    subtitle: '3-6 Grade',
    icon: <GraduationCap className="w-12 h-12" />,
    theme: 'junior',
    gradeLevel: [3, 6],
    role: 'student',
  },
  {
    id: 'senior',
    title: 'Senior',
    subtitle: '7-9 Grade',
    icon: <UserCircle className="w-12 h-12" />,
    theme: 'senior',
    gradeLevel: [7, 9],
    role: 'student',
  },
  {
    id: 'parent',
    title: 'Parent',
    subtitle: 'Dashboard',
    icon: <ChartBar className="w-12 h-12" />,
    theme: 'senior',
    role: 'parent',
    // 只有已经是 parent 角色的用户才能选择 parent
    locked: currentRole !== 'parent',
  },
];

export default function SelectProfilePage() {
  const router = useRouter();
  const { profile, loading, refreshProfile, user, updateProfile, signOut } = useAuth();
  const [selecting, setSelecting] = useState<string | null>(null);
  const [showAccessDenied, setShowAccessDenied] = useState(false);

  // 根据 当前角色获取可用的选项
  const profileOptions = getProfileOptions(profile?.role);

  // 只有当 profile 已经设置了 theme_preference 和 grade_level 时才自动跳转
  // 如果这些字段为空，说明用户还没有选择角色，需要显示选择界面
  // 修改：即使有角色，也显示选择界面，允许用户重新选择
  useEffect(() => {
    if (!loading && profile) {
      // 检查是否已经设置过角色（有 theme_preference 或 grade_level）
      // 注释掉自动跳转逻辑，始终显示角色选择界面
      // const hasSelectedRole = profile.theme_preference || profile.grade_level;
    }
  }, [profile, loading, router]);

  // 如果用户已登录但没有 profile，重试获取
  useEffect(() => {
    if (!loading && user && !profile) {
      console.log('User logged in but no profile, retrying...');
      refreshProfile();
    }
  }, [loading, user, profile, refreshProfile]);

  const handleSelectProfile = async (option: ProfileOption) => {
    // 检查是否锁定（无权限）
    if (option.locked) {
      setShowAccessDenied(true);
      return;
    }

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
      // 直接使用 updateProfile（从 AuthContext），无论 profile 是否存在
      // AuthContext 的 updateProfile 会处理新创建或更新
      await updateProfile({
        role: option.role,
        theme_preference: option.theme,
        grade_level: option.gradeLevel?.[0],
        display_name: profile?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0],
      });

      console.log('Profile updated, navigating to:', option.role === 'parent' ? '/dashboard' : '/workbench');

      // 使用 replace 而不是 push，避免返回时重新触发
      const targetUrl = option.role === 'parent' ? '/dashboard' : '/workbench';
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">
            Select your profile
          </h1>
          <p className="text-muted-foreground">
            选择你的学习空间
          </p>
        </div>

        {/* Profile Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {profileOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSelectProfile(option)}
              disabled={selecting !== null}
              className={`
                group relative bg-card rounded-2xl p-8
                transition-all duration-300 ease-out
                hover:shadow-apple-hover
                active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                border border-transparent hover:border-gray-100
                ${option.theme === 'junior' ? 'theme-junior' : 'theme-senior'}
                ${option.locked ? 'opacity-60' : ''}
              `}
            >
              {/* Lock overlay for locked options */}
              {option.locked && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-2xl z-10">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Lock className="w-8 h-8" />
                    <span className="text-xs font-medium">需要家长权限</span>
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={`
                w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center
                transition-colors duration-200
                ${option.theme === 'junior'
                  ? 'bg-orange-50 text-orange-500 group-hover:bg-orange-100'
                  : 'bg-blue-50 text-blue-500 group-hover:bg-blue-100'
                }
                ${option.locked ? 'opacity-50' : ''}
              `}>
                {option.icon}
              </div>

              {/* Title & Subtitle */}
              <h3 className="text-center text-xl font-semibold mb-1 text-card-foreground">
                {option.title}
              </h3>
              <p className="text-center text-sm text-muted-foreground mb-6">
                {option.subtitle}
              </p>

              {/* Continue Button */}
              <div className={`
                py-3 rounded-full text-sm font-medium transition-colors
                ${option.locked
                  ? 'bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  : option.theme === 'junior'
                    ? 'bg-orange-500 text-white hover:bg-orange-600'
                    : 'bg-gray-900 text-white hover:bg-gray-800'
                }
              `}>
                {selecting === option.id ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    切换中...
                  </div>
                ) : option.locked ? (
                  '无权限'
                ) : (
                  'Continue'
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <div className="text-center">
          <button
            onClick={async () => {
              await signOut();
              router.push('/login');
            }}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            切换账户
          </button>
        </div>
      </div>

      {/* Access Denied Modal */}
      {showAccessDenied && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full shadow-xl animate-scale-in">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <Lock className="w-8 h-8 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">温馨提示</h3>
                <p className="text-sm text-muted-foreground">
                  家长控制台需要使用家长账号登录。
                  <br /><br />
                  如果你是学生，请选择 Junior 或 Senior 学习空间。
                  <br /><br />
                  如果你需要管理学生账号，请联系管理员注册家长账号。
                </p>
              </div>
              <button
                onClick={() => setShowAccessDenied(false)}
                className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                我知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
