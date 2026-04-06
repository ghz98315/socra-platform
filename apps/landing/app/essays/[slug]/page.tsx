import type { Metadata } from 'next';
import ArticlePageClient from '../../../components/ArticlePageClient';
import SiteLayout from '../../../components/SiteLayout';
import { buildMetadata } from '../../../lib/metadata';

type EssayDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({ params }: EssayDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  return buildMetadata({
    title: '系列文章',
    description: 'Socrates 错题管理心法系列文章。',
    canonical: `/essays/${slug}`,
    type: 'article',
  });
}

export default async function EssayDetailPage({ params }: EssayDetailPageProps) {
  const { slug } = await params;

  return (
    <SiteLayout>
      <ArticlePageClient slug={slug} />
    </SiteLayout>
  );
}
