type AvatarRole = 'student' | 'parent';

interface AvatarProfileLike {
  avatar_url?: string | null;
  student_avatar_url?: string | null;
  parent_avatar_url?: string | null;
}

export function getRoleAvatar(profile: AvatarProfileLike | null | undefined, role: AvatarRole) {
  if (!profile) {
    return null;
  }

  if (role === 'parent') {
    return profile.parent_avatar_url || profile.avatar_url || null;
  }

  return profile.student_avatar_url || profile.avatar_url || null;
}
