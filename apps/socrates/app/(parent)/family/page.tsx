// =====================================================
// Project Socrates - Family Management Page
// 家庭管理页面
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Users, UserPlus, ChevronRight, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';

interface FamilyMember {
  id: string;
  userId: string;
  role: 'parent' | 'child';
  nickname?: string;
  joinedAt: string;
}

interface FamilyGroup {
  id: string;
  name: string;
  inviteCode: string;
  createdBy: string;
  createdAt: string;
  members: FamilyMember[];
}

export default function FamilyPage() {
  const { user } = useAuth();
  const supabase = createClient();

  const [family, setFamily] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyName, setFamilyName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [creating, setCreating] = useState(false);

  // 获取家庭数据
  useEffect(() => {
    if (!user) return;

    async function fetchFamilyData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/family?user_id=${user!.id}`);
        const data = await response.json();

        if (data.family) {
          setFamily(data.family);
          setMembers(data.members || []);
        } else {
          setFamily(null);
          setMembers([]);
        }
      } catch (error) {
        console.error('Failed to fetch family:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchFamilyData();
  }, [user]);

  // 创建家庭
  const createFamily = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !familyName.trim()) return;

    try {
      setCreating(true);
      // 生成邀请码
      const inviteCode = 'FM' + Math.random().toString(36).slice(2, 8).toUpperCase();

      // 创建家庭
      const { data: familyData, error: createError } = await supabase
        .from('family_groups')
        .insert({
          name: familyName.trim(),
          created_by: user.id,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (createError) {
        console.error('[Family API] Error creating family:', createError);
        throw createError;
      }

      // 添加创建者为家长
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: familyData.id,
          user_id: user.id,
          role: 'parent',
          nickname: user.user_metadata?.display_name || '家长'
        });

      if (memberError) {
        console.error('[Family API] Error adding member:', memberError);
        throw memberError;
      }

      setFamily({
        id: familyData.id,
        name: familyData.name,
        inviteCode: familyData.invite_code,
        createdBy: familyData.created_by,
        createdAt: familyData.created_at,
        members: []
      });
      setFamilyName('');
    } catch (error) {
      console.error('[Family API] Error:', error);
      alert('创建家庭失败，请重试');
    } finally {
      setCreating(false);
    }
  };

  // 搜索用户
  const searchUsers = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.users || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  // 添加成员
  const addMember = async (userId: string, nickname: string, role: 'parent' | 'child' = 'child') => {
    if (!family) return;

    try {
      const { error } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: userId,
          role: role,
          nickname: nickname
        });

      if (error) throw error;

      // 刷新成员列表
      setMembers([...members, {
        id: `member_${Date.now()}`,
        userId,
        role,
        nickname,
        joinedAt: new Date().toISOString()
      }]);
      setSearchResults([]);
      setSearchQuery('');
    } catch (error) {
      console.error('Failed to add member:', error);
      alert('添加成员失败');
    }
  };

  // 移除成员
  const handleRemoveMember = async (memberId: string) => {
    if (!family) return;

    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(members.filter(m => m.id !== memberId));
      setSelectedMember(null);
    } catch (error) {
      console.error('Failed to remove member:', error);
      alert('移除成员失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-warm-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center">
          <Users className="w-5 h-5 text-warm-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">家庭管理</h1>
          <p className="text-sm text-gray-500">创建家庭组，管理家庭成员</p>
        </div>
      </div>

      {/* 创建家庭 */}
      {!family && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">创建新家庭</h3>
            <form onSubmit={createFamily} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  家庭名称
                </label>
                <Input
                  type="text"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="例如：温馨小家"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    创建家庭
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* 家庭信息 */}
      {family && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{family.name}</h3>
                <p className="text-sm text-gray-500">
                  邀请码：<span className="font-mono font-medium">{family.inviteCode}</span>
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {members.length} 位成员
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 添加成员 */}
      {family && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <UserPlus className="w-5 h-5 text-warm-500" />
              <h3 className="font-semibold text-gray-900">添加成员</h3>
            </div>

            <form onSubmit={searchUsers} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="输入用户手机号或昵称搜索"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={searching}>
                  {searching ? '搜索中...' : '搜索'}
                </Button>
              </div>

              {/* 搜索结果 */}
              {searchResults.length > 0 && (
                <div className="space-y-2">
                  {searchResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-warm-700">
                            {result.display_name?.[0] || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{result.display_name}</p>
                          <p className="text-sm text-gray-500">{result.phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addMember(result.id, result.display_name, 'child')}
                        >
                          添加为孩子
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* 成员列表 */}
      {family && members.length > 0 && (
        <Card className="mb-6">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4">家庭成员</h3>
            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center">
                      <span className="text-sm font-medium text-warm-700">
                        {member.nickname?.[0] || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{member.nickname}</p>
                      <p className="text-sm text-gray-500">
                        {member.role === 'parent' ? '家长' : '孩子'}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => setSelectedMember(member)}
                  >
                    移除
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 移除成员确认 */}
      {selectedMember && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-gray-700 mb-4">
              确定要移除 <strong>{selectedMember.nickname}</strong> 吗？此操作不可撤销。
            </p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveMember(selectedMember.id)}
              >
                确认移除
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedMember(null)}
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 空状态 */}
      {family && members.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>还没有家庭成员</p>
          <p className="text-sm">搜索并添加成员开始管理</p>
        </div>
      )}
    </div>
  );
}
