// =====================================================
// AnalysisResult - 结果展示组件
// =====================================================

import React, { useState } from 'react';
import { Star, Wand2, Gem, Quote, MessageCircle, RotateCcw, ChevronLeft, ChevronRight, HeartHandshake, Sparkles } from 'lucide-react';
import { EssayAnalysis } from '../types';

interface AnalysisResultProps {
  analysis: EssayAnalysis;
  imagePreviews: string[];
  onReset: () => void;
}

const Card: React.FC<{
  title: string;
  icon: React.ReactNode;
  colorClass: string;
  children: React.ReactNode;
}> = ({ title, icon, colorClass, children }) => (
  <div className="bg-white rounded-2xl shadow-sm border border-warm-100 overflow-hidden mb-6 transition-transform hover:scale-[1.01] duration-300">
    <div className={`px-4 py-4 border-b border-gray-50 flex items-center gap-2 ${colorClass} bg-opacity-10`}>
      {icon}
      <h3 className="font-bold text-xl">{title}</h3>
    </div>
    <div className="p-5">
      {children}
    </div>
  </div>
);

const FormattedComment: React.FC<{ text?: string }> = ({ text }) => {
  // 防止 text 为 undefined 或 null
  if (!text) {
    return <p className="text-gray-500">暂无总评</p>;
  }

  const lines = text.split('\n').filter(line => line.trim());

  return (
    <div className="space-y-6">
      {lines.map((line, idx) => {
        const match = line.match(/^.*?【(.*?)】(.*?)[：:](.*)$/);
        const simpleMatch = !match ? line.match(/^.*?【(.*?)】(.*)$/) : null;

        if (match || simpleMatch) {
          const m = match || simpleMatch!;
          const title = m[1];
          const decoration = m[2] || '';
          const content = m[match ? 3 : 2];

          let iconChar = '';
          if (title.includes('温暖抱抱')) iconChar = '🌟';
          else if (title.includes('成长小贴士')) iconChar = '🚀';
          else if (title.includes('未来寄语')) iconChar = '🌈';

          const displayIcon = decoration.trim() || iconChar;

          return (
            <div key={idx} className="block group">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-warm-100 text-warm-600 px-3 py-1 rounded-full font-bold text-base shadow-sm border border-warm-200 flex items-center gap-1">
                   <span>{displayIcon}</span>
                   <span>{title}</span>
                </div>
              </div>
              <div className="text-gray-700 leading-loose text-justify pl-1 bg-warm-50/50 p-3 rounded-xl border border-warm-50 group-hover:bg-warm-50 transition-colors">
                {content}
              </div>
            </div>
          );
        }

        return <p key={idx} className="mb-2 leading-loose text-gray-700">{line}</p>;
      })}
    </div>
  );
};

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, imagePreviews, onReset }) => {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);

  const nextImage = () => {
    setCurrentImageIdx((prev) => (prev + 1) % imagePreviews.length);
  };

  const prevImage = () => {
    setCurrentImageIdx((prev) => (prev - 1 + imagePreviews.length) % imagePreviews.length);
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 pb-24">
      <div className="flex flex-col lg:flex-row gap-8">

        {/* Left Column: Image & OCR Text */}
        <div className="w-full lg:w-5/12 space-y-6">
           {/* Image Gallery */}
           <div className="bg-white rounded-2xl shadow-sm p-4 border border-warm-100">
              <h3 className="font-bold text-warm-800 mb-3 flex justify-between items-center">
                <span>原图预览</span>
                <span className="text-xs text-warm-500 font-normal bg-warm-50 px-2 py-1 rounded-full">
                  {currentImageIdx + 1} / {imagePreviews.length}
                </span>
              </h3>
              <div className="relative group bg-gray-50 rounded-lg overflow-hidden">
                <img
                  src={imagePreviews[currentImageIdx]}
                  alt={`Essay Page ${currentImageIdx + 1}`}
                  className="w-full object-contain max-h-[500px]"
                />
                {imagePreviews.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-all active:scale-95">
                      <ChevronLeft size={20} className="text-gray-700" />
                    </button>
                    <button onClick={nextImage} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-2 rounded-full shadow-lg hover:bg-white transition-all active:scale-95">
                      <ChevronRight size={20} className="text-gray-700" />
                    </button>
                  </>
                )}
              </div>
              {imagePreviews.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2 px-1">
                  {imagePreviews.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentImageIdx(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${currentImageIdx === idx ? 'border-warm-500 ring-2 ring-warm-100' : 'border-transparent opacity-70 hover:opacity-100'}`}
                    >
                      <img src={src} className="w-full h-full object-cover" alt="thumb" />
                    </button>
                  ))}
                </div>
              )}
           </div>

           {/* OCR Result */}
           <div className="bg-white rounded-2xl shadow-sm p-4 border border-warm-100">
             <h3 className="font-bold text-warm-800 mb-3 flex items-center">
               <MessageCircle size={18} className="mr-2" />
               识别内容
             </h3>
             <div className="bg-orange-50/30 p-5 rounded-xl text-gray-700 leading-loose min-h-[200px] max-h-[60vh] overflow-y-auto border border-orange-100 text-base">
                {analysis.title && (
                  <div className="mb-4">
                    <span className="text-warm-600 font-bold text-lg mr-2">🔸 标题：</span>
                    <span className="font-bold text-gray-900 text-lg border-b-2 border-warm-100 pb-1">{analysis.title}</span>
                  </div>
                )}
                <div>
                  <span className="text-warm-600 font-bold text-lg mr-2 block mb-2">🔹 正文：</span>
                  <div className="whitespace-pre-wrap pl-4 border-l-2 border-warm-200 text-justify">
                    {analysis.body || "未能识别到正文内容。"}
                  </div>
                </div>
             </div>
           </div>
        </div>

        {/* Right Column: Analysis Cards */}
        <div className="w-full lg:w-7/12">

          {/* 1. Highlights */}
          <Card
            title="闪光点 ✨"
            icon={<Star className="text-yellow-500" size={24} fill="currentColor" />}
            colorClass="bg-yellow-50 text-yellow-700"
          >
            <div className="space-y-4">
              {(analysis.highlights || []).map((point, idx) => (
                <div key={idx} className="flex items-start gap-3 group">
                  <div className="mt-1 w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-yellow-200 transition-colors">
                    {idx + 1}
                  </div>
                  <div className="bg-yellow-50/50 p-3 rounded-lg w-full text-gray-700 leading-relaxed border border-yellow-100/50 group-hover:bg-yellow-50 transition-colors">
                    {point}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* 2. Magic Corrections */}
          <Card
            title="魔法修改 🪄"
            icon={<Wand2 className="text-purple-500" size={24} />}
            colorClass="bg-purple-50 text-purple-700"
          >
            {(analysis.corrections || []).length > 0 ? (
              <div className="space-y-6">
                {(analysis.corrections || []).map((item, idx) => (
                  <div key={idx} className="relative bg-white border border-purple-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-purple-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>

                    <div className="mb-3 pl-3 border-l-4 border-gray-200">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-1">原句</span>
                      <p className="text-gray-500 text-sm">{item.original}</p>
                    </div>

                    <div className="mb-3 pl-3 border-l-4 border-purple-400 bg-purple-50/30 py-1 rounded-r-lg">
                      <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block mb-1 flex items-center gap-1">
                        <Sparkles size={12} /> 魔法升级
                      </span>
                      <p className="text-purple-900 font-medium text-base leading-relaxed">{item.improved}</p>
                    </div>

                    <div className="text-xs text-purple-600 bg-purple-50 px-3 py-2 rounded-lg inline-block mt-1">
                      <span className="font-bold mr-1">🧙‍♂️ 魔法解密:</span>
                      {item.reason}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p>这篇作文太棒了，魔法老师觉得已经不需要修改啦！🌟</p>
              </div>
            )}
          </Card>

          {/* 3. Golden Sentences */}
          <Card
            title="金句百宝箱 💎"
            icon={<Gem className="text-emerald-500" size={24} />}
            colorClass="bg-emerald-50 text-emerald-700"
          >
             <div className="grid grid-cols-1 gap-4">
               {(analysis.goldenSentences || []).map((item, idx) => (
                 <div key={idx} className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-xl p-4 hover:border-emerald-300 transition-all shadow-sm group">
                   <div className="text-emerald-900 font-medium text-base mb-3 relative pl-6 leading-relaxed">
                     <Quote size={16} className="absolute left-0 top-1 text-emerald-400/50" />
                     {item.sentence}
                     <Quote size={16} className="inline-block ml-2 text-emerald-400/50 rotate-180 align-top" />
                   </div>
                   <div className="flex items-start gap-2 pt-3 border-t border-emerald-100/50">
                     <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 mt-0.5">赏析</span>
                     <p className="text-emerald-600 text-sm italic">{item.benefit}</p>
                   </div>
                 </div>
               ))}
             </div>
          </Card>

          {/* 4. Teacher's Comment */}
          <Card
            title="老师总评 👩‍🏫"
            icon={<HeartHandshake className="text-warm-600" size={24} />}
            colorClass="bg-warm-100 text-warm-800"
          >
            <div className="relative bg-warm-50 p-6 rounded-2xl border border-warm-200/60">
              <FormattedComment text={analysis.overallComment} />
              <div className="mt-6 flex items-center justify-end gap-3 opacity-80">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-warm-300"></div>
                <span className="text-warm-800 font-bold text-lg transform -rotate-2 inline-block">你的AI作文魔法师</span>
              </div>
            </div>
          </Card>

        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50">
        <button
          onClick={onReset}
          className="flex items-center gap-2 bg-warm-500 hover:bg-warm-600 text-white px-8 py-4 rounded-full shadow-xl transition-transform hover:scale-105 font-bold tracking-wide active:scale-95 ring-4 ring-warm-200"
        >
          <RotateCcw size={20} />
          批改下一篇
        </button>
      </div>
    </div>
  );
};

export default AnalysisResult;
