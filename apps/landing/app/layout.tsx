import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://socra.cn"),
  title: "Socrates - 中小学生 AI 学习辅导平台",
  description: "Socrates 是面向中小学生的 AI 学习辅导平台，提供错题引导、作文批改、智能复习和学习规划，帮助孩子学会思考，而不是只记答案。",
  keywords: ["AI学习平台", "AI学习辅导", "错题辅导", "作文批改", "智能复习", "学习规划", "Socrates"],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "Socrates - 中小学生 AI 学习辅导平台",
    description: "帮助孩子学会思考，而不是只记答案。连接错题引导、作文批改、智能复习和学习规划。",
    url: "https://socra.cn",
    siteName: "Socrates",
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 512,
        height: 512,
        alt: "Socrates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Socrates - 中小学生 AI 学习辅导平台",
    description: "帮助孩子学会思考，而不是只记答案。",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
