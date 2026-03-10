// =====================================================
// Project Socrates - Family Management Page
// 家庭管理页面
// =====================================================

'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Users, UserPlus, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
  const [family, setFamily] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchFamilyData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/family?user_id=${user.id}`);
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
  }, [user?.id]);

  fetchFamilyData();

  const createFamily = async () => {
    if (!user) return;

    try {
      // 生成邀请码
      const inviteCode = 'FM' + Math.random().toString(36).slice(2, 6).toUpperCase();
      const familyId = family.id || `FM_${inviteCode}`;

      // 创建家庭
      const { error: createError } = await supabase
        .from('family_groups')
        .insert({
          name: `我的家庭`,
          created_by: user.id,
          invite_code,
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
        family_id: familyId,
        user_id: user.id,
        role: 'parent',
        nickname: user.display_name || '家长'
      });

      if (memberError) {
        console.error('[Family API] Error adding member:', memberError);
        throw memberError;
      }

      setFamily({
        id: familyId,
        name: family.name,
        inviteCode: family.inviteCode,
        members: members,
      });
    } catch (error) {
      console.error('[Family API] Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const inviteChild = async () => {
    if (!user) return;

    try {
      // 生成邀请码
      const inviteCode = 'CH' + Math.random().toString(36).slice(2, 6).toUpperCase();

      const familyId = family.id || `CH_${inviteCode}`;

      // 创建家庭
      const { error: createError } = await supabase
        .from('family_groups')
        .insert({
        name: `${childName}的家庭`,
        created_by: user.id,
        invite_code
      })
        .select()
        .single();

      if (createError) {
        console.error('[Family API] Error creating family:', createError);
        throw createError;
      }

      // 添加孩子
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
        family_id: familyId,
        user_id: childId,
        role: 'child',
        nickname: childName
      });

      if (memberError) {
        console.error('[Family API] Error adding child:', memberError);
        throw memberError;
      }

      // 获取更新后的家庭信息
      const { data: updatedFamily } = await supabase
        .from('family_groups')
        .select('*')
        .eq('id', familyId)
        .single();

      setFamily(updatedFamily);
      setMembers(members || []);
    } catch (error) {
      console.error('[Family API] Error fetching updated family:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between mb-6">
        <Users className="w-8 h-8 text-warm-500" />
        <h1 className="text-xl font-bold text-gray-900">家庭管理</h1>
        <p className="text-gray-600">创建家庭组，管理家庭成员</p>
      </div>

      {/* 创建/加入家庭 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <form onSubmit={createFamily} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                家庭名称
              </label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                <Users className="w-4 h-4 mr-2" />
                创建家庭
              </Button>
              <Button type="button" variant="outline" onClick={() => setFamilyName('')}>
                取消
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 鷻加成员 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <UserPlus className="w-5 h-5 text-warm-500" />
            <h3 className="font-semibold text-gray-900">添加成员</h3>
          </div>

          <form onSubmit={addMember} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                鐜索用户
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="输入用户 ID 或手机号"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg"
                />
                <Button type="submit" className="flex-1">
                  搜索
                </Button>
                <Button type="button" variant="outline" onClick={() => setSearchQuery('')}>
                  取消
                </Button>
              </div>
            </div>

            {searching ? (
              <p className="text-center text-gray-500 py-4">搜索中...</p>
            ) : members.length > 0 ? (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border"
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
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                还没有家庭成员
              </p>
            )}
          </form>
        </CardContent>
      </Card>

      {/* 移除成员 */}
      {selectedMember && (
        <Card className="mb-4 border-red-200">
          <CardContent className="p-4">
            <p className="text-gray-700 mb-4">确定要移除此成员吗？此操作不可撤销。</p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleRemoveMember(selectedMember.id)}
              >
                移除
              </Button>
              <Button variant="outline" size="sm" onClick={() => setSelectedMember(null)}>
              >
                取消
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
