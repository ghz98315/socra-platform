const SOCRATES_APP_URL =
  process.env.NEXT_PUBLIC_SOCRATES_APP_URL || 'https://socrates.socra.cn';

export type SocratesEntrySource =
  | 'landing-home'
  | 'landing-nav'
  | 'landing-book'
  | 'landing-book-purchase'
  | 'landing-essay-list'
  | 'landing-article'
  | 'landing-reader';

export type SocratesEntryIntent =
  | 'start-tool'
  | 'subscribe'
  | 'bundle'
  | 'continue-reading';

export type SocratesRedirectPath =
  | '/select-profile'
  | '/subscription'
  | '/error-book'
  | '/bundle-start';

type BuildSocratesEntryUrlOptions = {
  pathname?: '/login' | '/register';
  source: SocratesEntrySource;
  intent: SocratesEntryIntent;
  redirect?: SocratesRedirectPath;
};

export function buildSocratesEntryUrl({
  pathname = '/login',
  source,
  intent,
  redirect,
}: BuildSocratesEntryUrlOptions) {
  const url = new URL(pathname, SOCRATES_APP_URL);

  url.searchParams.set('source', source);
  url.searchParams.set('intent', intent);

  if (redirect) {
    url.searchParams.set('redirect', redirect);
  }

  return url.toString();
}
