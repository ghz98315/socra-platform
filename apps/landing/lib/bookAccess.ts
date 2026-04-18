export const FREE_BOOK_CHAPTER_IDS = new Set([
  'prologue',
  'part1-cover',
  'ch1',
  'ch2',
]);

export function isFreeBookChapter(chapterId: string) {
  return FREE_BOOK_CHAPTER_IDS.has(chapterId);
}

export function canReadBookChapter(chapterId: string, hasFullAccess: boolean) {
  return hasFullAccess || isFreeBookChapter(chapterId);
}
