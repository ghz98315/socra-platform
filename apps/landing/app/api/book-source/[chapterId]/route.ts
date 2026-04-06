import { NextResponse } from 'next/server';
import { getBookChapterFileSource } from '../../../../lib/bookChapterRegistry';
import { getBookChapterContent } from '../../../../lib/bookChapterSource';

type RouteContext = {
  params: Promise<{
    chapterId: string;
  }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const { chapterId } = await params;
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
