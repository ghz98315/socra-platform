// =====================================================
// LoadingView - 加载动画组件
// =====================================================

import React, { useEffect, useState } from 'react';
import { BookOpen, Sparkles } from 'lucide-react';

const LoadingView: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);
  const texts = [
    "AI老师正在阅读中...",
    "正在识别字迹...",
    "正在寻找闪光点...",
    "正在构思魔法修改...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % texts.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center animate-in fade-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-warm-300 rounded-full blur-xl opacity-50 animate-pulse"></div>
        <div className="relative bg-white p-6 rounded-full shadow-lg border-4 border-warm-100">
          <BookOpen size={48} className="text-warm-500 animate-bounce" />
        </div>
        <Sparkles
          size={24}
          className="absolute -top-2 -right-2 text-yellow-400 animate-spin"
          style={{ animationDuration: '3s' }}
        />
      </div>

      <h2 className="text-2xl font-bold text-warm-800 mb-2 transition-all duration-500">
        {texts[textIndex]}
      </h2>
      <p className="text-warm-600 text-sm">请耐心等待，好作文值得细细品味...</p>

      <div className="mt-8 w-64 h-2 bg-warm-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-warm-500 rounded-full animate-pulse"
          style={{
            animation: 'progress 8s ease-in-out infinite'
          }}
        />
      </div>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default LoadingView;
