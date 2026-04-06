import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://socra.cn'),
  title: '从错误中学习，重新理解孩子为什么学不会 | Socrates',
  description:
    '围绕错误、根因、验证和复习展开的闭环学习内容入口，帮助孩子把错误变成理解，把理解变成稳定掌握。',
  keywords: ['闭环学习', '孩子为什么学不会', '粗心怎么办', '错题闭环', '根因分析', '家长陪学', 'Socrates'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    title: '从错误中学习，重新理解孩子为什么学不会 | Socrates',
    description: '围绕错误、根因、验证和复习展开的闭环学习内容入口。',
    url: 'https://socra.cn',
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
    title: '从错误中学习，重新理解孩子为什么学不会 | Socrates',
    description: '围绕错误、根因、验证和复习展开的闭环学习内容入口。',
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
      <head>
        <link rel="icon" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
