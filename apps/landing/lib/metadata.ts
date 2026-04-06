import type { Metadata } from 'next';

export const SITE_URL = 'https://www.socra.cn';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.png`;

type MetadataInput = {
  title?: string;
  description?: string;
  keywords?: string[];
  canonical?: string;
  type?: 'website' | 'article' | 'book';
};

export function buildMetadata({
  title = 'Socrates',
  description = 'Socrates 错题闭环管理系统',
  keywords = ['Socrates', '错题管理', '学习方法', '错题闭环'],
  canonical = '/',
  type = 'website',
}: MetadataInput): Metadata {
  const url = canonical.startsWith('http') ? canonical : `${SITE_URL}${canonical}`;
  const siteTitle = title.includes('Socrates') ? title : `${title} | Socrates`;

  return {
    title: siteTitle,
    description,
    keywords,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: siteTitle,
      description,
      url,
      siteName: 'Socrates',
      locale: 'zh_CN',
      type,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 512,
          height: 512,
          alt: 'Socrates',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: siteTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
