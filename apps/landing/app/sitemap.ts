import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.socra.cn';

  return [
    {
      url: `${baseUrl}/`,
      lastModified: '2026-04-04',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/essays`,
      lastModified: '2026-04-04',
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/book`,
      lastModified: '2026-04-04',
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/book-purchase`,
      lastModified: '2026-04-04',
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: '2026-04-04',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: '2026-04-04',
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: '2026-04-04',
      changeFrequency: 'monthly',
      priority: 0.2,
    },
  ];
}
