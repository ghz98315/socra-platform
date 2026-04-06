import { GENERATED_FILE_BACKED_BOOK_CHAPTERS } from './generated/bookChapterRegistry.generated';

const FILE_BACKED_BOOK_CHAPTER_ALIASES = {
  epilogue: 'ch12',
} as const;

export const FILE_BACKED_BOOK_CHAPTERS = GENERATED_FILE_BACKED_BOOK_CHAPTERS;

type GeneratedFileBackedBookChapterId = keyof typeof FILE_BACKED_BOOK_CHAPTERS;

export type FileBackedBookChapterId =
  | GeneratedFileBackedBookChapterId
  | keyof typeof FILE_BACKED_BOOK_CHAPTER_ALIASES;

function resolveFileBackedBookChapterId(chapterId: string): GeneratedFileBackedBookChapterId | null {
  if (chapterId in FILE_BACKED_BOOK_CHAPTERS) {
    return chapterId as GeneratedFileBackedBookChapterId;
  }

  return FILE_BACKED_BOOK_CHAPTER_ALIASES[chapterId as keyof typeof FILE_BACKED_BOOK_CHAPTER_ALIASES] ?? null;
}

export function getBookChapterFileSource(chapterId: string) {
  const resolvedChapterId = resolveFileBackedBookChapterId(chapterId);
  if (!resolvedChapterId) {
    return null;
  }

  return FILE_BACKED_BOOK_CHAPTERS[resolvedChapterId];
}

export function isFileBackedBookChapter(chapterId: string): chapterId is FileBackedBookChapterId {
  return resolveFileBackedBookChapterId(chapterId) !== null;
}
