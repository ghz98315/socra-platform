'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, UserPlus, Users } from 'lucide-react';

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

export default function FamilyPage() {
  const { user } = useAuth();
  const [family, setFamily] = useState<FamilyGroup | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [familyName, setFamilyName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [searching, setSearching] = useState(false);
  const [submittingUserId, setSubmittingUserId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const memberIds = useMemo(() => new Set(members.map((member) => member.userId)), [members]);

  const fetchFamily = async () => {
    if (!user?.id) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/family?user_id=${user.id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load family');
      }

      setFamily(data.family || null);
      setMembers(data.members || data.family?.members || []);
    } catch (error: any) {
      console.error('Failed to fetch family:', error);
      setErrorMessage(error.message || 'Failed to load family');
      setFamily(null);
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchFamily();
  }, [user?.id]);

  const createFamily = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.id || !familyName.trim()) {
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
          createdBy: user.id,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create family');
      }

      setFamilyName('');
      setStatusMessage('Family created successfully.');
      await fetchFamily();
    } catch (error: any) {
      console.error('Create family error:', error);
      setErrorMessage(error.message || 'Failed to create family');
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
        throw new Error(data.error || 'Search failed');
      }

      setSearchResults(data.users || []);
    } catch (error: any) {
      console.error('Search failed:', error);
      setErrorMessage(error.message || 'Search failed');
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
        throw new Error(data.error || 'Failed to add member');
      }

      setStatusMessage(`${candidate.display_name} added to family.`);
      setSearchQuery('');
      setSearchResults([]);
      await fetchFamily();
    } catch (error: any) {
      console.error('Add member failed:', error);
      setErrorMessage(error.message || 'Failed to add member');
    } finally {
      setSubmittingUserId(null);
    }
  };

  const removeMember = async (member: FamilyMember) => {
    if (!family?.id || !user?.id) {
      return;
    }

    setSubmittingUserId(member.userId);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const params = new URLSearchParams({
        family_id: family.id,
        user_id: member.userId,
        request_user_id: user.id,
      });
      const response = await fetch(`/api/family?${params}`, { method: 'DELETE' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove member');
      }

      setStatusMessage(`${member.nickname || 'Member'} removed.`);
      await fetchFamily();
    } catch (error: any) {
      console.error('Remove member failed:', error);
      setErrorMessage(error.message || 'Failed to remove member');
    } finally {
      setSubmittingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-warm-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-100">
          <Users className="h-5 w-5 text-warm-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Family management</h1>
          <p className="text-sm text-gray-500">Create a family, search users, and manage members.</p>
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
            <h3 className="mb-4 font-semibold text-gray-900">Create a new family</h3>
            <form onSubmit={createFamily} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Family name</label>
                <Input
                  type="text"
                  value={familyName}
                  onChange={(event) => setFamilyName(event.target.value)}
                  placeholder="For example: Wang Family"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="mr-2 h-4 w-4" />
                    Create family
                  </>
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
                    Invite code: <span className="font-mono font-medium">{family.inviteCode}</span>
                  </p>
                </div>
                <div className="text-sm text-gray-500">{members.length} members</div>
              </div>
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-warm-500" />
                <h3 className="font-semibold text-gray-900">Add member</h3>
              </div>

              <form onSubmit={searchUsers} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Search by display name or phone"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={searching}>
                    {searching ? 'Searching...' : 'Search'}
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
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-100">
                              <span className="text-sm font-medium text-warm-700">
                                {candidate.display_name?.[0] || '?'}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{candidate.display_name}</p>
                              <p className="text-sm text-gray-500">{candidate.phone || 'No phone'}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addMember(candidate)}
                            disabled={submittingUserId === candidate.id}
                          >
                            {submittingUserId === candidate.id ? 'Adding...' : 'Add as child'}
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
              <h3 className="mb-4 font-semibold text-gray-900">Family members</h3>
              {members.length > 0 ? (
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border bg-white p-3 hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warm-100">
                          <span className="text-sm font-medium text-warm-700">
                            {member.nickname?.[0] || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{member.nickname || 'Unnamed member'}</p>
                          <p className="text-sm text-gray-500">
                            {member.role === 'parent' ? 'Parent' : 'Child'}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600"
                        onClick={() => removeMember(member)}
                        disabled={submittingUserId === member.userId || member.userId === user?.id}
                      >
                        {submittingUserId === member.userId ? 'Removing...' : 'Remove'}
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <Users className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                  <p>No members yet.</p>
                  <p className="text-sm">Search for a user above to add them into this family.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
