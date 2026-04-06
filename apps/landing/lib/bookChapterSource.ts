import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { getBookChapterFileSource } from './bookChapterRegistry';

function extractChapterArticle(html: string): string | null {
  const articleMatch = html.match(/<article[^>]*class="chapter"[^>]*>([\s\S]*?)<\/article>/i);
  return articleMatch?.[1]?.trim() ?? null;
}

export async function getBookChapterContent(chapterId: string): Promise<string | null> {
  const source = getBookChapterFileSource(chapterId);
  if (!source) {
    return null;
  }

  try {
    const filePath = fileURLToPath(new URL(source.relativeFilePathFromSource, import.meta.url));
    const html = await readFile(filePath, 'utf8');
    return extractChapterArticle(html);
  } catch {
    return null;
  }
}
