import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Socrates - AI 引导学习，培养独立思考",
  description: "告别题海战术，让 AI 成为你的私人学习教练。学会思考，比学会答案更重要。",
  keywords: ["AI教育", "苏格拉底", "学习辅导", "错题分析", "作文批改", "学习规划"],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
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
