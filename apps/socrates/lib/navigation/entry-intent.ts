type SearchParamsReader = {
  get(name: string): string | null;
};

export type EntryIntent = 'start-tool' | 'subscribe' | 'bundle' | 'continue-reading';

export type EntryParams = {
  source: string | null;
  intent: EntryIntent | null;
  redirect: string | null;
};

const ALLOWED_REDIRECT_PREFIXES = [
  '/select-profile',
  '/subscription',
  '/error-book',
  '/payment',
  '/study',
  '/review',
  '/dashboard',
  '/workbench',
] as const;

function isEntryIntent(value: string | null): value is EntryIntent {
  return value === 'start-tool' || value === 'subscribe' || value === 'bundle' || value === 'continue-reading';
}

function isAllowedRedirect(value: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return false;
  }

  return ALLOWED_REDIRECT_PREFIXES.some(
    (prefix) =>
      value === prefix ||
      value.startsWith(`${prefix}/`) ||
      value.startsWith(`${prefix}?`) ||
      value.startsWith(`${prefix}#`),
  );
}

export function readEntryParams(searchParams: SearchParamsReader): EntryParams {
  const intentParam = searchParams.get('intent');
  const redirectParam = searchParams.get('redirect');

  return {
    source: searchParams.get('source'),
    intent: isEntryIntent(intentParam) ? intentParam : null,
    redirect: isAllowedRedirect(redirectParam) ? redirectParam : null,
  };
}

export function normalizeEntryParams(entryParams: Partial<EntryParams>): EntryParams {
  return {
    source: entryParams.source ?? null,
    intent: isEntryIntent(entryParams.intent ?? null) ? entryParams.intent ?? null : null,
    redirect: isAllowedRedirect(entryParams.redirect ?? null) ? entryParams.redirect ?? null : null,
  };
}

export function buildEntryQuery(entryParams: Partial<EntryParams>) {
  const normalized = normalizeEntryParams(entryParams);
  const query = new URLSearchParams();

  if (normalized.source) {
    query.set('source', normalized.source);
  }

  if (normalized.intent) {
    query.set('intent', normalized.intent);
  }

  if (normalized.redirect) {
    query.set('redirect', normalized.redirect);
  }

  return query.toString();
}

export function buildEntryHref(pathname: string, entryParams: Partial<EntryParams>) {
  const search = buildEntryQuery(entryParams);
  return search ? `${pathname}?${search}` : pathname;
}

export function resolveEntryDestination(entryParams: EntryParams) {
  if (entryParams.redirect) {
    return entryParams.redirect;
  }

  switch (entryParams.intent) {
    case 'subscribe':
      return '/subscription';
    case 'continue-reading':
      return '/error-book';
    case 'bundle':
    case 'start-tool':
    default:
      return '/select-profile';
  }
}

export function buildAuthPageHref(pathname: '/login' | '/register', entryParams: EntryParams) {
  return buildEntryHref(pathname, entryParams);
}
