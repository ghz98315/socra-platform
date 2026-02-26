// =====================================================
// Project Socrates - Global Navigation Bar
// 全局导航栏 - 方案二：分层卡片设计 + 苹果风格动画
// =====================================================

'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import {
  LogOut,
  Home,
  BookOpen,
  FileText,
  BarChart3,
  Settings,
  User,
  Menu,
  X,
  Trophy,
  ChevronRight,
  Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationCenter } from '@/components/NotificationCenter';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// 导航项配置
const parentNavItems = [
  { href: '/dashboard', icon: Home, label: '仪表盘', shortLabel: '首页', color: 'text-blue-500' },
  { href: '/workbench', icon: BookOpen, label: '学习', shortLabel: '工作', color: 'text-green-500' },
  { href: '/review', icon: FileText, label: '复习', shortLabel: '计划', color: 'text-orange-500' },
  { href: '/reports', icon: BarChart3, label: '报告', shortLabel: '查看', color: 'text-purple-500' },
];

const studentNavItems = [
  { href: '/workbench', icon: BookOpen, label: '学习', shortLabel: '工作', color: 'text-green-500' },
  { href: '/error-book', icon: Bookmark, label: '错题本', shortLabel: '本子', color: 'text-red-500' },
  { href: '/review', icon: FileText, label: '复习', shortLabel: '计划', color: 'text-orange-500' },
  { href: '/achievements', icon: Trophy, label: '成就', shortLabel: '荣誉', color: 'text-yellow-500' },
];

export function GlobalNav() {
  const { profile, user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 预览页面和落地页不显示全局导航
  if (pathname?.startsWith('/preview') || pathname?.startsWith('/landing')) {
    return null;
  }
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 滚动效果
  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 认证页面不显示导航栏
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register');
  if (!user || isAuthPage) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const isParent = profile?.role === 'parent';
  const isStudent = profile?.role === 'student';
  const navItems = isParent ? parentNavItems : studentNavItems;
  const displayName = profile?.display_name || '同学';

  // 检查当前路径是否激活
  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname?.startsWith(href);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        isScrolled
          ? "bg-white/80 dark:bg-black/80 backdrop-blur-xl shadow-sm"
          : "bg-background/95 backdrop-blur-md"
      )}
    >
      {/* 第一层：顶部栏 - Logo + 用户信息 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="h-14 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <div
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300",
                  "bg-gradient-to-br from-primary to-primary/80",
                  "shadow-lg shadow-primary/25",
                  "group-hover:shadow-primary/40"
                )}
              >
                <Trophy className="w-5 h-5 text-white" />
              </div>
            </div>
            <span
              className={cn(
                "font-bold text-xl tracking-tight hidden sm:block transition-all duration-300",
                "group-hover:text-primary"
              )}
            >
              Socrates
            </span>
          </Link>

          {/* 用户信息区域 (桌面端) */}
          <div
            className={cn(
              "hidden sm:flex items-center gap-3 transition-all duration-500",
              mounted ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4"
            )}
          >
            {/* 角色标签 - 学生显示名字，家长显示角色 */}
            <div
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full",
                "bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 transition-colors duration-300",
                "cursor-default border border-primary/20"
              )}
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-sm leading-tight">{displayName}</span>
                {isStudent && (
                  <span className="text-[10px] text-muted-foreground">同学</span>
                )}
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                {isParent ? '家长' : '学生'}
              </span>
            </div>

            {/* 通知中心 */}
            <NotificationCenter />

            {/* 离线状态 */}
            <OfflineIndicator compact />

            {/* 同步状态 */}
            <SyncStatusIndicator compact />

            {/* 设置按钮 */}
            <Link href="/settings">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-muted hover:rotate-90 transition-all duration-300"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </Link>

            {/* 退出按钮 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-300"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>

          {/* 移动端菜单按钮 */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-muted transition-all duration-300 active:scale-95"
            aria-label="打开菜单"
          >
            <div className="w-6 h-6 relative">
              <span
                className={cn(
                  "absolute left-0 w-6 h-0.5 bg-foreground transition-all duration-300",
                  isMobileMenuOpen ? "top-[11px] rotate-45" : "top-1"
                )}
              />
              <span
                className={cn(
                  "absolute left-0 w-6 h-0.5 bg-foreground transition-all duration-300 top-[11px]",
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                )}
              />
              <span
                className={cn(
                  "absolute left-0 w-6 h-0.5 bg-foreground transition-all duration-300",
                  isMobileMenuOpen ? "top-[11px] -rotate-45" : "top-5"
                )}
              />
            </div>
          </button>
        </div>
      </div>

      {/* 第二层：导航卡片栏 (桌面端) */}
      <div
        className={cn(
          "hidden sm:block border-t border-border/30 transition-all duration-500",
          isScrolled ? "bg-muted/10" : "bg-muted/20"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 py-2">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300",
                    "animate-fade-in",
                    active
                      ? "bg-card shadow-sm border border-border/50"
                      : "hover:bg-card/50 border border-transparent"
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Active indicator */}
                  {active && (
                    <span
                      className={cn(
                        "absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full",
                        "bg-primary transition-all duration-300"
                      )}
                    />
                  )}

                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                      active
                        ? "bg-primary/10"
                        : "bg-muted group-hover:bg-muted/80"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-4 h-4 transition-colors duration-300",
                        active ? item.color : "text-muted-foreground group-hover:text-foreground"
                      )}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={cn(
                        "text-sm font-medium transition-colors duration-300",
                        active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground leading-tight">
                      {item.shortLabel}
                    </span>
                  </div>

                  {/* Hover arrow */}
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 text-muted-foreground transition-all duration-300",
                      "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                    )}
                  />
                </Link>
              );
            })}

            {/* 添加更多占位卡片 (可扩展) */}
            <div className="flex-1" />

            {/* 快捷操作提示 */}
            <div
              className={cn(
                "text-xs text-muted-foreground hidden lg:flex items-center gap-2",
                "px-4 py-2 rounded-full bg-muted/50 transition-all duration-300",
                "hover:bg-muted"
              )}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              在线学习中
            </div>
          </nav>
        </div>
      </div>

      {/* 移动端底部导航栏 */}
      <nav
        className={cn(
          "sm:hidden fixed bottom-0 left-0 right-0 z-50",
          "bg-white/95 dark:bg-black/95 backdrop-blur-xl",
          "border-t border-border/50",
          "pb-[env(safe-area-inset-bottom)]"
        )}
      >
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200",
                  "min-w-[60px] min-h-[44px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5", active && item.color)} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* 更多菜单按钮 */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-all duration-200",
              "min-w-[60px] min-h-[44px]",
              isMobileMenuOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            <span className="text-[10px] font-medium">更多</span>
          </button>
        </div>
      </nav>

      {/* 移动端展开菜单 */}
      <div
        className={cn(
          "sm:hidden overflow-hidden transition-all duration-500 ease-out",
          isMobileMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="border-t border-border/50 bg-card/95 backdrop-blur-xl">
          {/* 移动端导航卡片 */}
          <div className="p-4 space-y-4">
            {/* 用户信息 */}
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50",
                "animate-slide-up"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {isParent ? '家长账号' : '学生账号'}
                </p>
              </div>
            </div>

            {/* 导航卡片网格 */}
            <div className="grid grid-cols-3 gap-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300",
                      "animate-scale-in",
                      active
                        ? "bg-primary/10 border border-primary/20"
                        : "bg-muted/50 hover:bg-muted border border-transparent"
                    )}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        active ? "bg-primary/10" : "bg-background"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", active ? item.color : "text-muted-foreground")} />
                    </div>
                    <span
                      className={cn(
                        "text-xs font-medium",
                        active ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* 分隔线 */}
            <div className="border-t border-border/50" />

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <Link href="/settings" className="flex-1">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  设置
                </Button>
              </Link>
              <Button
                variant="ghost"
                className="flex-1 justify-start gap-2 text-muted-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
