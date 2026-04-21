'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Loader2, LogOut, Shield, UserRound, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getRoleHome } from '@/lib/navigation/role-home';

function getGradeLabel(gradeLevel?: number | null) {
  if (!gradeLevel) {
    return '未设置年级';
  }

  return `${gradeLevel} 年级`;
}

export default function SelectProfilePageV3() {
  const router = useRouter();
  const { user, profile, accountProfile, availableProfiles, loading, selectProfile, signOut } = useAuth();
  const [submittingProfileId, setSubmittingProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    if (accountProfile?.role !== 'parent' && availableProfiles.length === 1 && availableProfiles[0]) {
      router.replace(getRoleHome(availableProfiles[0].role));
    }
  }, [accountProfile?.role, availableProfiles, loading, router, user]);

  if (loading || !user || !accountProfile || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-warm-50 px-6">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-warm-600" />
          <p className="mt-4 text-sm text-warm-700">正在读取可用身份...</p>
        </div>
      </div>
    );
  }

  const handleSelectProfile = async (profileId: string, role: 'parent' | 'student' | 'admin') => {
    try {
      setSubmittingProfileId(profileId);
      await selectProfile(profileId);
      router.replace(getRoleHome(role));
    } finally {
      setSubmittingProfileId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fff7ed,_#f8fafc_45%,_#f5f5f4)] px-6 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex flex-col gap-4 rounded-[28px] border border-warm-100 bg-white/90 p-8 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warm-100">
              <Users className="h-6 w-6 text-warm-700" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-warm-950">选择本次使用的身份</h1>
              <p className="mt-1 text-sm text-warm-700">
                当前登录账号下可切换不同 profile。家长进入管理台，孩子进入学习空间。
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-warm-100 bg-warm-50/80 px-4 py-3 text-sm text-warm-700">
            登录账号：{accountProfile.display_name || user.email || user.phone || '当前账号'}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {availableProfiles.map((item) => {
            const isActive = item.id === profile.id;
            const isAccountOwner = item.id === accountProfile.id;
            const isParentView = item.role === 'parent';
            const isSubmitting = submittingProfileId === item.id;

            return (
              <Card
                key={item.id}
                className={`overflow-hidden rounded-[28px] border transition-all ${
                  isActive
                    ? 'border-warm-300 bg-warm-50 shadow-[0_20px_60px_-28px_rgba(245,158,11,0.45)]'
                    : 'border-warm-100 bg-white hover:border-warm-200 hover:shadow-sm'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                          isParentView ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {isParentView ? <Shield className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-slate-900">
                          {item.display_name || (isParentView ? '家长' : '孩子')}
                        </p>
                        <p className="text-sm text-slate-500">
                          {isParentView ? '家长管理视图' : `学生学习视图 · ${getGradeLabel(item.grade_level)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {isAccountOwner ? '账号本人' : '孩子 profile'}
                      </span>
                      {isActive ? (
                        <span className="rounded-full bg-warm-200 px-3 py-1 font-medium text-warm-800">
                          当前激活
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {isParentView
                      ? '用于任务、家庭关系、监管与学习报告等家长侧功能。'
                      : '用于错题学习、复习、变式练习、学习资产与学生侧进度。'}
                  </div>

                  <Button
                    type="button"
                    className="mt-5 h-11 w-full rounded-full"
                    disabled={isSubmitting}
                    onClick={() => handleSelectProfile(item.id, item.role)}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        切换中...
                      </>
                    ) : (
                      <>
                        <UserRound className="mr-2 h-4 w-4" />
                        {isActive ? '继续使用该身份' : '切换到该身份'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button
            type="button"
            variant="ghost"
            className="text-warm-700 hover:text-warm-900"
            onClick={async () => {
              await signOut();
              router.replace('/login');
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </Button>
        </div>
      </div>
    </div>
  );
}
