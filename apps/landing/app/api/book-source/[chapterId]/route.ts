import { NextResponse } from 'next/server';
import { getBookChapterFileSource } from '../../../../lib/bookChapterRegistry';
import { canReadBookChapter } from '../../../../lib/bookAccess';
import { resolveLandingBookAccess } from '../../../../lib/bookAccess.server';
import { getBookChapterContent } from '../../../../lib/bookChapterSource';

type RouteContext = {
  params: Promise<{
    chapterId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { chapterId } = await params;
  const access = await resolveLandingBookAccess();

  if (!canReadBookChapter(chapterId, access.hasFullAccess)) {
    return NextResponse.json({ error: 'Chapter access denied' }, { status: 403 });
  }

  const source = getBookChapterFileSource(chapterId);

  if (!source) {
    return NextResponse.json({ error: 'Chapter source not found' }, { status: 404 });
  }

  const content = await getBookChapterContent(chapterId);
  if (!content) {
    return NextResponse.json({ error: 'Chapter content unavailable' }, { status: 500 });
  }

  return NextResponse.json({
    chapterId,
    sourcePath: source.repoPath,
    content,
  });
}
