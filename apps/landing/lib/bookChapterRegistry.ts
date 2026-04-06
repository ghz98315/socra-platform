import { GENERATED_FILE_BACKED_BOOK_CHAPTERS } from './generated/bookChapterRegistry.generated';

export const FILE_BACKED_BOOK_CHAPTERS = GENERATED_FILE_BACKED_BOOK_CHAPTERS;

export type FileBackedBookChapterId = keyof typeof FILE_BACKED_BOOK_CHAPTERS;

export function getBookChapterFileSource(chapterId: string) {
  return FILE_BACKED_BOOK_CHAPTERS[chapterId as FileBackedBookChapterId] ?? null;
}

export function isFileBackedBookChapter(chapterId: string): chapterId is FileBackedBookChapterId {
  return chapterId in FILE_BACKED_BOOK_CHAPTERS;
}
