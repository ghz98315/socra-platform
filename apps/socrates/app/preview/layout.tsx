import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Socrates - 落地页预览",
};

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 预览页面不需要全局导航，独立展示
  return <>{children}</>;
}
