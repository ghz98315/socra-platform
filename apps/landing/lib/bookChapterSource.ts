import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { getBookChapterFileSource } from './bookChapterRegistry';

function extractChapterArticle(html: string): string | null {
  const articleMatch = html.match(/<article[^>]*class="chapter"[^>]*>([\s\S]*?)<\/article>/i);
  return articleMatch?.[1]?.trim() ?? null;
}

async function resolveChapterFilePath(repoPath: string): Promise<string | null> {
  const candidateRoots = [
    process.cwd(),
    path.resolve(process.cwd(), '..'),
    path.resolve(process.cwd(), '../..'),
    path.resolve(process.cwd(), '../../..'),
  ];
  const visitedRoots = new Set<string>();

  for (const root of candidateRoots) {
    const normalizedRoot = path.resolve(root);
    if (visitedRoots.has(normalizedRoot)) {
      continue;
    }
    visitedRoots.add(normalizedRoot);

    const candidatePath = path.resolve(normalizedRoot, repoPath);
    try {
      await access(candidatePath);
      return candidatePath;
    } catch {
      continue;
    }
  }

  return null;
}

export async function getBookChapterContent(chapterId: string): Promise<string | null> {
  const source = getBookChapterFileSource(chapterId);
  if (!source) {
    return null;
  }

  try {
    const filePath = await resolveChapterFilePath(source.repoPath);
    if (!filePath) {
      return null;
    }

    const html = await readFile(filePath, 'utf8');
    return extractChapterArticle(html);
  } catch {
    return null;
  }
}

