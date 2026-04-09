'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { buildSocratesEntryUrl } from '../lib/socratesLinks';

type SiteLayoutProps = {
  children: ReactNode;
};

export default function SiteLayout({ children }: SiteLayoutProps) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const loginHref = buildSocratesEntryUrl({
    source: 'landing-nav',
    intent: 'start-tool',
    redirect: '/select-profile',
  });

  return (
    <div className="min-h-screen flex flex-col selection:bg-neutral-200">
      <header className="sticky top-0 z-50 bg-[#fafafa]/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 font-serif font-bold text-xl tracking-tight">
            <img src="/logo.png" alt="Socrates Logo" className="w-8 h-8 rounded-full object-cover bg-neutral-200" />
            <div className="hidden w-8 h-8 bg-neutral-900 text-white items-center justify-center rounded-sm">
              <span className="text-sm font-sans">S</span>
            </div>
            Socrates
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-600">
            <a href={isHome ? '#articles' : '/#articles'} className="hover:text-neutral-900 transition-colors">文章</a>
            <a href={isHome ? '#book' : '/#book'} className="hover:text-neutral-900 transition-colors">书籍</a>
            <a href={isHome ? '#about' : '/#about'} className="hover:text-neutral-900 transition-colors">关于我</a>
          </nav>
          <div className="flex items-center gap-4">
            <a href={loginHref} target="_blank" rel="noreferrer" className="hidden md:block text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors">登录</a>
            <a href={loginHref} target="_blank" rel="noreferrer" className="text-sm font-medium bg-neutral-900 text-white px-4 py-2 rounded-full hover:bg-neutral-800 transition-colors flex items-center gap-1">
              开始使用<ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow">{children}</main>

      <footer className="bg-white border-t border-neutral-200 py-12 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 font-serif font-bold text-lg text-neutral-900">
              <img src="/logo.png" alt="Socrates Logo" className="w-6 h-6 rounded-full object-cover bg-neutral-200" />
              <div className="hidden w-6 h-6 bg-neutral-900 text-white items-center justify-center rounded-sm">
                <span className="text-xs font-sans">S</span>
              </div>
              Socrates
            </div>
            <div className="flex gap-6 mt-2 flex-wrap">
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 bg-neutral-100 rounded-lg border border-neutral-200 overflow-hidden relative">
                  <img src="/wechat-oa.png" alt="公众号二维码" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-neutral-500">公众号：工程爸的AI进化工厂</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-20 h-20 bg-neutral-100 rounded-lg border border-neutral-200 overflow-hidden relative">
                  <img src="/wechat-personal.png" alt="微信交流二维码" className="w-full h-full object-cover" />
                </div>
                <span className="text-xs text-neutral-500">微信交流</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-2 text-sm text-neutral-500">
            <div className="flex gap-4 mb-2">
              <Link href="/privacy" className="hover:text-neutral-900 transition-colors">隐私政策</Link>
              <Link href="/terms" className="hover:text-neutral-900 transition-colors">服务条款</Link>
              <Link href="/admin" className="hover:text-neutral-900 transition-colors">管理后台</Link>
            </div>
            <p>&copy; {new Date().getFullYear()} Socrates. All rights reserved.</p>
            <p className="text-xs text-neutral-400 mt-1">
              <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer" className="hover:text-neutral-600 transition-colors">
                ICP备案号：[你的备案号]
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
