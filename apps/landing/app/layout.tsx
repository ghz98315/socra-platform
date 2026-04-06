import type { Metadata } from 'next';
import './globals.css';
import './reader.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://www.socra.cn'),
  title: 'Socrates',
  description: 'Socrates 错题闭环管理系统',
  keywords: ['Socrates', '错题管理', '学习方法', '错题闭环', '8D', 'PDCA'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: 'Socrates',
    description: 'Socrates 错题闭环管理系统',
    url: 'https://www.socra.cn',
    siteName: 'Socrates',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Socrates',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Socrates',
    description: 'Socrates 错题闭环管理系统',
    images: ['/logo.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
