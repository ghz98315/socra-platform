'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Loader2, LogOut, Shield, UserPlus, UserRound, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  clearParentAccessVerified,
  hasVerifiedParentAccess,
  markParentAccessVerified,
} from '@/lib/auth/parent-access';
import { useAuth } from '@/lib/contexts/AuthContext';
import { getRoleHome } from '@/lib/navigation/role-home';

function getGradeLabel(gradeLevel?: number | null) {
  if (!gradeLevel) {
    return '未设置年级';
  }

  return `${gradeLevel} 年级`;
}

const GRADE_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export default function SelectProfilePageV3() {
  const router = useRouter();
  const {
    user,
    profile,
    accountProfile,
    availableProfiles,
    loading,
    refreshProfile,
    selectProfile,
    signOut,
  } = useAuth();

  const [submittingProfileId, setSubmittingProfileId] = useState<string | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [parentPassword, setParentPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifyingParentPassword, setVerifyingParentPassword] = useState(false);

  const [createStudentDialogOpen, setCreateStudentDialogOpen] = useState(false);
  const [creatingStudent, setCreatingStudent] = useState(false);
  const [createStudentError, setCreateStudentError] = useState('');
  const [studentDisplayName, setStudentDisplayName] = useState('');
  const [studentGradeLevel, setStudentGradeLevel] = useState('');

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    if (accountProfile?.role !== 'parent' && availableProfiles.length === 1 && availableProfiles[0]) {
      router.replace(getRoleHome(availableProfiles[0].role));
    }
  }, [accountProfile?.role, availableProfiles, loading, router, user]);

  useEffect(() => {
    if (!user || !profile) {
      return;
    }

    if (profile.role !== 'parent') {
      clearParentAccessVerified(user.id);
    }
  }, [profile, user]);

  const enterProfile = async (profileId: string, role: 'parent' | 'student' | 'admin') => {
    try {
      setSubmittingProfileId(profileId);
      await selectProfile(profileId);
      router.replace(getRoleHome(role));
    } finally {
      setSubmittingProfileId(null);
    }
  };

  const handleSelectProfile = async (profileId: string, role: 'parent' | 'student' | 'admin') => {
    if (!user) {
      return;
    }

    if (role === 'parent' && !hasVerifiedParentAccess(user.id)) {
      setSubmittingProfileId(profileId);
      setParentPassword('');
      setPasswordError('');
      setPasswordDialogOpen(true);
      return;
    }

    await enterProfile(profileId, role);
  };

  const handleVerifyParentPassword = async () => {
    if (!user || !accountProfile) {
      return;
    }

    setVerifyingParentPassword(true);
    setPasswordError('');

    try {
      const response = await fetch('/api/auth/verify-parent-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          password: parentPassword,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || '家长密码验证失败');
      }

      markParentAccessVerified(user.id);
      setPasswordDialogOpen(false);
      setParentPassword('');
      await enterProfile(accountProfile.id, 'parent');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : '家长密码验证失败');
      setSubmittingProfileId(null);
    } finally {
      setVerifyingParentPassword(false);
    }
  };

  const handleCreateStudent = async () => {
    const nextDisplayName = studentDisplayName.trim();
    const nextGradeLevel = Number(studentGradeLevel);

    if (!nextDisplayName) {
      setCreateStudentError('请先输入学生昵称');
      return;
    }

    if (!Number.isInteger(nextGradeLevel) || nextGradeLevel < 1 || nextGradeLevel > 12) {
      setCreateStudentError('请选择 1 到 12 年级');
      return;
    }

    setCreatingStudent(true);
    setCreateStudentError('');

    try {
      const response = await fetch('/api/students/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          display_name: nextDisplayName,
          grade_level: nextGradeLevel,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error || '新增学生失败');
      }

      await refreshProfile();
      setCreateStudentDialogOpen(false);
      setStudentDisplayName('');
      setStudentGradeLevel('');
    } catch (error) {
      setCreateStudentError(error instanceof Error ? error.message : '新增学生失败');
    } finally {
      setCreatingStudent(false);
    }
  };

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
                当前登录账号下可切换不同 profile。家长进入管理台，学生进入学习空间。
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-warm-100 bg-warm-50/80 px-4 py-3 text-sm text-warm-700">
            登录账号：{accountProfile.display_name || user.email || user.phone || '当前账号'}
          </div>

          {accountProfile.role === 'parent' ? (
            <div className="flex justify-start">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                onClick={() => {
                  setCreateStudentError('');
                  setStudentDisplayName('');
                  setStudentGradeLevel('');
                  setCreateStudentDialogOpen(true);
                }}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                新增学生
              </Button>
            </div>
          ) : null}
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
                          {item.display_name || (isParentView ? '家长' : '学生')}
                        </p>
                        <p className="text-sm text-slate-500">
                          {isParentView ? '家长管理视图' : `学生学习视图 · ${getGradeLabel(item.grade_level)}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 text-xs">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                        {isAccountOwner ? '账号本人' : '学生 profile'}
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

          {accountProfile.role === 'parent' ? (
            <Card className="overflow-hidden rounded-[28px] border border-dashed border-warm-200 bg-white/70 transition-all hover:border-warm-300 hover:shadow-sm">
              <CardContent className="flex h-full flex-col justify-between p-6">
                <div className="space-y-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warm-100 text-warm-700">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">新增学生身份</p>
                    <p className="text-sm text-slate-500">
                      为同一个账号增加新的学生 profile，并给每个学生单独设置年级。
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 h-11 w-full rounded-full"
                  onClick={() => {
                    setCreateStudentError('');
                    setStudentDisplayName('');
                    setStudentGradeLevel('');
                    setCreateStudentDialogOpen(true);
                  }}
                >
                  <UserPlus className="mr-2 h-4 w-4" />
                  添加学生
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="mt-8 text-center">
          <Button
            type="button"
            variant="ghost"
            className="text-warm-700 hover:text-warm-900"
            onClick={async () => {
              clearParentAccessVerified(user.id);
              await signOut();
              router.replace('/login');
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            退出登录
          </Button>
        </div>

        <Dialog
          open={passwordDialogOpen}
          onOpenChange={(open) => {
            setPasswordDialogOpen(open);
            if (!open) {
              setSubmittingProfileId(null);
              setParentPassword('');
              setPasswordError('');
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>进入家长模式</DialogTitle>
              <DialogDescription>
                请输入当前账号密码，验证通过后进入家长管理页面。
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              <label htmlFor="parent-password" className="text-sm font-medium text-warm-800">
                账号密码
              </label>
              <Input
                id="parent-password"
                type="password"
                value={parentPassword}
                onChange={(event) => setParentPassword(event.target.value)}
                placeholder="请输入密码"
                disabled={verifyingParentPassword}
              />
              {passwordError ? <p className="text-sm text-red-600">{passwordError}</p> : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPasswordDialogOpen(false);
                  setSubmittingProfileId(null);
                }}
                disabled={verifyingParentPassword}
              >
                取消
              </Button>
              <Button
                type="button"
                onClick={handleVerifyParentPassword}
                disabled={verifyingParentPassword || parentPassword.length < 6}
              >
                {verifyingParentPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    验证中...
                  </>
                ) : (
                  '验证并进入'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={createStudentDialogOpen}
          onOpenChange={(open) => {
            setCreateStudentDialogOpen(open);
            if (!open) {
              setCreateStudentError('');
              setStudentDisplayName('');
              setStudentGradeLevel('');
            }
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>新增学生身份</DialogTitle>
              <DialogDescription>
                为当前账号增加一个新的学生 profile。每个学生会独立保存自己的年级、错题和复习记录。
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="student-display-name" className="text-sm font-medium text-warm-800">
                  学生昵称
                </label>
                <Input
                  id="student-display-name"
                  value={studentDisplayName}
                  onChange={(event) => setStudentDisplayName(event.target.value)}
                  placeholder="例如：大宝 / 二宝"
                  disabled={creatingStudent}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="student-grade-level" className="text-sm font-medium text-warm-800">
                  年级
                </label>
                <select
                  id="student-grade-level"
                  value={studentGradeLevel}
                  onChange={(event) => setStudentGradeLevel(event.target.value)}
                  disabled={creatingStudent}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">请选择年级</option>
                  {GRADE_OPTIONS.map((grade) => (
                    <option key={grade} value={grade}>
                      {grade} 年级
                    </option>
                  ))}
                </select>
              </div>

              {createStudentError ? <p className="text-sm text-red-600">{createStudentError}</p> : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateStudentDialogOpen(false)}
                disabled={creatingStudent}
              >
                取消
              </Button>
              <Button type="button" onClick={handleCreateStudent} disabled={creatingStudent}>
                {creatingStudent ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : (
                  '创建学生'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
