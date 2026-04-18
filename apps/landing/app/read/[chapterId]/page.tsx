import type { Metadata } from 'next';
import BookReaderClient from '../../../components/BookReaderClient';
import { redirect } from 'next/navigation';
import { canReadBookChapter } from '../../../lib/bookAccess';
import { resolveLandingBookAccess } from '../../../lib/bookAccess.server';
import { getBookChapterContent } from '../../../lib/bookChapterSource';
import { buildMetadata } from '../../../lib/metadata';

type ReaderPageProps = {
  params: Promise<{
    chapterId: string;
  }>;
};

export async function generateMetadata({ params }: ReaderPageProps): Promise<Metadata> {
  const { chapterId } = await params;

  return buildMetadata({
    title: '章节阅读',
    description: '阅读《从错误开始》章节内容。',
    canonical: `/read/${chapterId}`,
    type: 'book',
  });
}

export default async function ReaderPage({ params }: ReaderPageProps) {
  const { chapterId } = await params;
  const access = await resolveLandingBookAccess();

  if (!canReadBookChapter(chapterId, access.hasFullAccess)) {
    redirect('/book-purchase');
  }

  const chapterContentOverride = await getBookChapterContent(chapterId);

  return (
    <BookReaderClient
      chapterId={chapterId}
      chapterContentOverride={chapterContentOverride ?? undefined}
      hasFullAccess={access.hasFullAccess}
    />
  );
}
