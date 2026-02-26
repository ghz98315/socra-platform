import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/contexts/AuthContext";
import { GlobalNav } from "@/components/GlobalNav";
import { SyncManager } from "@/components/SyncManager";
import { OfflineProvider } from "@/lib/offline/OfflineContext";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  title: "Socrates - AI Learning Companion",
  description: "An AI-powered Socratic learning companion for students",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>
          <OfflineProvider>
            <SyncManager>
              <GlobalNav />
              {children}
            </SyncManager>
          </OfflineProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
