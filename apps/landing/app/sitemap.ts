import type { MetadataRoute } from 'next';
import { essays } from '../lib/essays';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://socra.cn';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: '2026-04-01',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/essays`,
      lastModified: '2026-04-01',
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: '2026-04-01',
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/start`,
      lastModified: '2026-04-01',
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: '2026-04-01',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: '2026-04-01',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const essayRoutes: MetadataRoute.Sitemap = essays
    .filter((essay) => essay.status === 'published')
    .map((essay) => ({
      url: `${baseUrl}/essays/${essay.slug}`,
      lastModified: essay.publishedAt ?? '2026-04-01',
      changeFrequency: 'monthly' as const,
      priority: 0.85,
    }));

  return [...staticRoutes, ...essayRoutes];
}
