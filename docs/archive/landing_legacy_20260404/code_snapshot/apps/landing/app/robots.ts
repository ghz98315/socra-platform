import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://socra.cn/sitemap.xml',
    host: 'https://socra.cn',
  };
}
