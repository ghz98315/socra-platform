'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, LockKeyhole, UserPlus, Users } from 'lucide-react';

import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface FamilyMember {
  id: string;
  userId: string;
  role: 'parent' | 'child';
  nickname?: string | null;
  joinedAt?: string | null;
}

interface FamilyGroup {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt?: string | null;
  members: FamilyMember[];
}

interface SearchUser {
  id: string;
  display_name: string;
  phone: string | null;
  role: string;
}

interface StudentAccount {
  id: string;
  display_name: string | null;
  phone: string | null;
  grade_level: number | null;
  avatar_url: string | null;
}

function getGradeLabel(gradeLevel?: number | null) {
  if (!gradeLevel) {
    return '未设置年级';
  }

  return `${gradeLevel} 年级`;
}

export default function FamilyPage() {
  const { user, profile } = useAuth();
  const [family, setFamily] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [managedStudents, setManagedStudents] = useState<StudentAccount[]>([]);
  const [familyName, setFamilyName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [creating, setCreating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submittingUserId, setSubmittingUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const memberIds = useMemo(() => new Set(members.map((member) => member.userId)), [members]);

  const fetchFamily = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/family');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '加载家庭信息失败');
      }

      setFamily(data.family || null);
      setMembers(data.members || data.family?.members || []);
    } catch (error: any) {
      console.error('Failed to fetch family:', error);
      setErrorMessage(error.message || '加载家庭信息失败');
      setFamily(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (profile?.role !== 'parent') {
      setManagedStudents([]);
      return;
    }

    setLoadingStudents(true);

    try {
      const response = await fetch('/api/students');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '加载孩子 profile 失败');
      }

      setManagedStudents((data.data || []) as StudentAccount[]);
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      setManagedStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (!user?.id || !profile) {
      return;
    }

    if (profile.role !== 'parent') {
      setLoading(false);
      return;
    }

    void Promise.all([fetchFamily(), fetchStudents()]);
  }, [profile, user?.id]);

  const createFamily = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!familyName.trim()) {
      return;
    }

    setCreating(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: familyName.trim(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '创建家庭失败');
      }

      setFamilyName('');
      setStatusMessage('家庭已创建');
      await fetchFamily();
    } catch (error: any) {
      console.error('Create family error:', error);
      setErrorMessage(error.message || '创建家庭失败');
    } finally {
      setCreating(false);
    }
  };

  const searchUsers = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!searchQuery.trim()) {
      return;
    }

    setSearching(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery.trim())}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '搜索失败');
      }

      setSearchResults(data.users || []);
    } catch (error: any) {
      console.error('Search failed:', error);
      setErrorMessage(error.message || '搜索失败');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const addMember = async (candidate: SearchUser) => {
    if (!family?.inviteCode) {
      return;
    }

    setSubmittingUserId(candidate.id);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/family', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inviteCode: family.inviteCode,
          userId: candidate.id,
          role: 'child',
          nickname: candidate.display_name,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '添加成员失败');
      }

      setStatusMessage(`${candidate.display_name} 已加入家庭`);
      setSearchQuery('');
      setSearchResults([]);
      await Promise.all([fetchFamily(), fetchStudents()]);
    } catch (error: any) {
      console.error('Add member failed:', error);
      setErrorMessage(error.message || '添加成员失败');
    } finally {
      setSubmittingUserId(null);
    }
  };

  const removeMember = async (member: FamilyMember) => {
    if (!family?.id) {
      return;
    }

    setSubmittingUserId(member.userId);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        family_id: family.id,
        user_id: member.userId,
      });
      const response = await fetch(`/api/family?${params}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '移除成员失败');
      }

      setStatusMessage(`${member.nickname || '成员'} 已移出家庭`);
      await Promise.all([fetchFamily(), fetchStudents()]);
    } catch (error: any) {
      console.error('Remove member failed:', error);
      setErrorMessage(error.message || '移除成员失败');
    } finally {
      setSubmittingUserId(null);
    }
  };

  if (!profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-warm-500" />
      </div>
    );
  }

  if (profile.role !== 'parent') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <Card>
          <CardContent className="p-6 text-center">
            <h1 className="text-lg font-semibold text-gray-900">仅家长身份可查看家庭页面</h1>
            <p className="mt-2 text-sm text-gray-500">
              请先切换到家长 profile，再管理家庭关系与孩子 profile。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-warm-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-100">
          <Users className="h-5 w-5 text-warm-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">家庭管理</h1>
          <p className="text-sm text-gray-500">统一账号下管理家庭成员与孩子 profile。</p>
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {errorMessage}
        </div>
      ) : null}

      {statusMessage ? (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {statusMessage}
        </div>
      ) : null}

      {!family ? (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="mb-4 font-semibold text-gray-900">创建家庭</h3>
            <form onSubmit={createFamily} className="space-y-4">
              <Input
                type="text"
                value={familyName}
                onChange={(event) => setFamilyName(event.target.value)}
                placeholder="例如：王同学家庭"
                required
              />
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : (
                  '创建家庭'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {family ? (
        <>
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">{family.name}</h3>
                  <p className="text-sm text-gray-500">
                    家庭邀请码：<span className="font-mono font-medium">{family.inviteCode}</span>
                  </p>
                </div>
                <div className="text-sm text-gray-500">{members.length} 位成员</div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <LockKeyhole className="h-5 w-5 text-warm-500" />
                <h3 className="font-semibold text-gray-900">孩子 profile</h3>
              </div>

              <div className="mb-4 rounded-xl border border-warm-100 bg-warm-50 px-4 py-3 text-sm text-warm-800">
                孩子不再单独创建登录账号。家长登录后可在选择页切换到对应孩子 profile 进入学习空间。
              </div>

              {loadingStudents ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-warm-500" />
                </div>
              ) : managedStudents.length > 0 ? (
                <div className="space-y-3">
                  {managedStudents.map((student) => (
                    <div
                      key={student.id}
                      className="rounded-xl border border-gray-200 bg-white p-4"
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.display_name || '未命名孩子'}
                          </p>
                          <p className="mt-1 text-sm text-gray-500">
                            {getGradeLabel(student.grade_level)}
                            {student.phone ? ` · ${student.phone}` : ''}
                          </p>
                        </div>
                        <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                          可在“选择身份”页面切换进入
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                  当前还没有绑定的孩子 profile。
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-warm-500" />
                <h3 className="font-semibold text-gray-900">添加家庭成员</h3>
              </div>

              <form onSubmit={searchUsers} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="输入手机号或昵称搜索"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={searching}>
                    {searching ? '搜索中...' : '搜索'}
                  </Button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults
                      .filter((candidate) => !memberIds.has(candidate.id))
                      .map((candidate) => (
                        <div
                          key={candidate.id}
                          className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{candidate.display_name}</p>
                            <p className="text-sm text-gray-500">
                              {candidate.phone || '未绑定手机号'}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addMember(candidate)}
                            disabled={submittingUserId === candidate.id}
                          >
                            {submittingUserId === candidate.id ? '添加中...' : '加入家庭'}
                          </Button>
                        </div>
                      ))}
                  </div>
                ) : null}
              </form>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="mb-4 font-semibold text-gray-900">家庭成员</h3>
              {members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border bg-white p-3 hover:bg-gray-50"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {member.nickname || '未命名成员'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {member.role === 'parent' ? '家长' : '孩子'}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeMember(member)}
                        disabled={submittingUserId === member.userId || member.userId === user?.id}
                      >
                        {submittingUserId === member.userId ? '移除中...' : '移除'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Users className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <p>当前还没有家庭成员</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
