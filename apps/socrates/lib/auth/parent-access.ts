'use client';

const PARENT_ACCESS_PREFIX = 'socrates-parent-access:';

function getStorageKey(userId: string) {
  return `${PARENT_ACCESS_PREFIX}${userId}`;
}

export function markParentAccessVerified(userId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  window.sessionStorage.setItem(getStorageKey(userId), String(Date.now()));
}

export function clearParentAccessVerified(userId?: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (userId) {
    window.sessionStorage.removeItem(getStorageKey(userId));
    return;
  }

  const keysToRemove: string[] = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const key = window.sessionStorage.key(index);
    if (key?.startsWith(PARENT_ACCESS_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
}

export function hasVerifiedParentAccess(userId: string, maxAgeMs = 1000 * 60 * 30) {
  if (typeof window === 'undefined') {
    return false;
  }

  const raw = window.sessionStorage.getItem(getStorageKey(userId));
  if (!raw) {
    return false;
  }

  const timestamp = Number(raw);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  return Date.now() - timestamp <= maxAgeMs;
}
