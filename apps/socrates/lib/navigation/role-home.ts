export type RoleHomeProfile = {
  role?: 'parent' | 'student' | 'admin' | null;
};

export function getRoleHome(role?: RoleHomeProfile['role']) {
  if (role === 'parent') {
    return '/tasks';
  }

  return '/study/math/problem';
}

export function resolveRoleAwareDestination(
  profile: RoleHomeProfile | null | undefined,
  fallbackDestination: string,
) {
  if (fallbackDestination && fallbackDestination !== '/select-profile') {
    return fallbackDestination;
  }

  return getRoleHome(profile?.role);
}
