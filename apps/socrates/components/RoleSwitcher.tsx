// =====================================================
// Project Socrates - Role Switcher
// 家长/学生角色切换组件
// =====================================================

'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { Users, BookOpen, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

type ViewMode = 'parent' | 'student' | 'learning';

export function RoleSwitcher() {
  const { profile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentView, setCurrentView] = useState<ViewMode>('parent');

  useEffect(() => {
    // 根据当前路径判断视图模式
    if (pathname?.includes('/dashboard') && !pathname?.includes('workbench')) {
      setCurrentView('parent');
    } else if (pathname?.includes('/workbench') || pathname?.includes('/workspace')) {
      setCurrentView('learning');
    } else if (pathname?.includes('/review') || pathname?.includes('/session')) {
      setCurrentView('student');
    }
  }, [pathname]);

  if (!profile) return null;

  // 只有家长账号才显示角色切换器
  if (profile.role !== 'parent') {
    return null;
  }

  const handleSwitchView = (view: ViewMode) => {
    setCurrentView(view);
    switch (view) {
      case 'parent':
        router.push('/dashboard');
        break;
      case 'learning':
        router.push('/workbench');
        break;
      case 'student':
        router.push('/student/review');
        break;
    }
  };

  return (
    <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
      <Button
        variant={currentView === 'parent' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleSwitchView('parent')}
        className="gap-2"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">家长中心</span>
      </Button>
      <Button
        variant={currentView === 'learning' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleSwitchView('learning')}
        className="gap-2"
      >
        <BookOpen className="w-4 h-4" />
        <span className="hidden sm:inline">开始学习</span>
      </Button>
      <Button
        variant={currentView === 'student' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => handleSwitchView('student')}
        className="gap-2"
      >
        <Users className="w-4 h-4" />
        <span className="hidden sm:inline">学习报告</span>
      </Button>
    </div>
  );
}
