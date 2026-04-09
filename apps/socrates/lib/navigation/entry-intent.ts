type SearchParamsReader = {
  get(name: string): string | null;
};

export type EntryIntent = 'start-tool' | 'subscribe' | 'bundle' | 'continue-reading';

export type EntryParams = {
  source: string | null;
  intent: EntryIntent | null;
  redirect: string | null;
};

const ALLOWED_REDIRECT_PREFIXES = ['/select-profile', '/subscription', '/error-book', '/payment'] as const;

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
  const query = new URLSearchParams();

  if (entryParams.source) {
    query.set('source', entryParams.source);
  }

  if (entryParams.intent) {
    query.set('intent', entryParams.intent);
  }

  if (entryParams.redirect) {
    query.set('redirect', entryParams.redirect);
  }

  const search = query.toString();

  return search ? `${pathname}?${search}` : pathname;
}
