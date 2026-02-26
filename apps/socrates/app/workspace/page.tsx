// =====================================================
// Project Socrates - Learning Workspace (Multi-role)
// 家长和学生都可以访问的学习工作区
// =====================================================

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export default function WorkspacePage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 如果认证完成，直接重定向到工作台
    // 家长账号现在也可以访问这个功能
    if (!loading && profile) {
      router.replace('/workbench');
    }
  }, [profile, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mx-auto" />
        <p className="text-muted-foreground">正在进入学习工作区...</p>
      </div>
    </div>
  );
}
