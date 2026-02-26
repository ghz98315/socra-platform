'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import LandingPage from '@/components/landing/LandingPage';

// 风格选择器组件
function StyleSelector() {
  const searchParams = useSearchParams();
  const currentStyle = searchParams.get('style') || 'A';

  const styles = [
    { id: 'A', name: '科技简约', desc: '类似苹果官网，简洁现代' },
    { id: 'B', name: '教育温馨', desc: '亲和力强，适合K12' },
    { id: 'C', name: '活力年轻', desc: '色彩丰富，吸引学生' },
  ];

  return (
    <div className="fixed top-20 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border">
      <div className="text-sm font-medium mb-2 text-gray-700">选择风格</div>
      <div className="flex gap-2">
        {styles.map((style) => (
          <a
            key={style.id}
            href={`?style=${style.id}`}
            className={`px-3 py-2 rounded-lg text-sm transition ${
              currentStyle === style.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={style.desc}
          >
            {style.name}
          </a>
        ))}
      </div>
    </div>
  );
}

// 动态渲染落地页
function LandingContent() {
  const searchParams = useSearchParams();
  const style = (searchParams.get('style') || 'A') as 'A' | 'B' | 'C';

  return <LandingPage initialStyle={style} />;
}

export default function PreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <StyleSelector />
      <LandingContent />
    </Suspense>
  );
}
