import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  type?: 'website' | 'article' | 'book';
  image?: string;
  author?: string;
  publishDate?: string;
  structuredData?: Record<string, any>;
}

export default function SEO({
  title = 'Socrates - 错题闭环管理系统',
  description = 'Socrates 是一个专注于「错题闭环管理」的工具系统。我们通过记录、分析、重构，帮你把每一次错误转化为成长的阶梯。由一位在比亚迪做了10年质量管理的工程师爸爸打造。',
  keywords = '错题本, 错题管理, 学习方法, 错题闭环, Socrates, 工程师爸爸, 8D分析法, PDCA',
  canonical,
  type = 'website',
  image = 'https://socrates.socra.cn/og-image.jpg', // Placeholder for actual OG image
  author = '关博 / 工程爸',
  publishDate,
  structuredData,
}: SEOProps) {
  const siteTitle = title.includes('Socrates') ? title : `${title} | Socrates`;
  const currentUrl = canonical || (typeof window !== 'undefined' ? window.location.href : 'https://socrates.socra.cn');

  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': type === 'article' ? 'Article' : type === 'book' ? 'Book' : 'WebSite',
    name: siteTitle,
    description: description,
    url: currentUrl,
    author: {
      '@type': 'Person',
      name: author,
    },
    ...(publishDate && { datePublished: publishDate }),
    ...(type === 'website' && {
      publisher: {
        '@type': 'Organization',
        name: 'Socrates',
        logo: {
          '@type': 'ImageObject',
          url: 'https://socrates.socra.cn/logo.png',
        },
      },
    }),
  };

  const finalStructuredData = structuredData || baseStructuredData;

  return (
    <Helmet>
      {/* Basic HTML Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {canonical && <link rel="canonical" href={canonical} />}

      {/* GEO Tags for Domestic SEO */}
      <meta name="geo.region" content="CN" />
      <meta name="geo.placename" content="China" />

      {/* Open Graph / WeChat / Social Meta Tags */}
      <meta property="og:title" content={siteTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content="Socrates" />

      {/* Twitter Card Meta Tags (Good for general social sharing) */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={siteTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>
    </Helmet>
  );
}
