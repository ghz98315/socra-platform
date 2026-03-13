// =====================================================
// AnalysisResult - 结果展示组件
// =====================================================

import React, { useState } from 'react';
import { Star, Wand2, Gem, Quote, MessageCircle, RotateCcw, ChevronLeft, ChevronRight, HeartHandshake, Sparkles, Download, Loader2, Medal } from 'lucide-react';
import { EssayAnalysis } from '../types';

interface AnalysisResultProps {
  analysis: EssayAnalysis;
  imagePreviews: string[];
  onReset: () => void;
}

// 生成 PDF 报告（使用浏览器打印功能）
const generatePDFReport = async (analysis: EssayAnalysis, title: string): Promise<void> => {
  // 创建打印内容
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>作文批改报告 - ${title || '无题'}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
          color: #333;
          line-height: 1.8;
        }
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #ff8a3d;
        }
        .header h1 {
          font-size: 28px;
          color: #863713;
          margin-bottom: 10px;
        }
        .header .subtitle {
          color: #888;
          font-size: 14px;
        }
        .section {
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        .section-title {
          font-size: 20px;
          font-weight: bold;
          color: #ff8a3d;
          margin-bottom: 15px;
          padding-left: 15px;
          border-left: 4px solid #ff8a3d;
        }
        .essay-title {
          font-size: 22px;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
          text-align: center;
        }
        .essay-body {
          background: #fff9f5;
          padding: 20px;
          border-radius: 10px;
          border: 1px solid #ffe4d1;
          white-space: pre-wrap;
          line-height: 2;
        }
        .highlight-item {
          background: #fffbf0;
          padding: 12px 15px;
          border-radius: 8px;
          margin-bottom: 10px;
          border-left: 3px solid #fbbf24;
        }
        .rating-box {
          background: #f0f9ff;
          border: 1px solid #bae6fd;
          border-radius: 14px;
          padding: 18px;
        }
        .rating-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }
        .rating-score {
          font-size: 28px;
          font-weight: 800;
          color: #0c4a6e;
        }
        .rating-meta {
          text-align: right;
          color: #075985;
          font-size: 14px;
          line-height: 1.6;
        }
        .rating-level {
          display: inline-block;
          background: #0284c7;
          color: #fff;
          padding: 3px 10px;
          border-radius: 999px;
          font-weight: 700;
          margin-left: 8px;
        }
        .rating-summary {
          color: #075985;
          background: #e0f2fe;
          border: 1px solid #bae6fd;
          padding: 10px 12px;
          border-radius: 10px;
          margin-bottom: 14px;
        }
        .breakdown-item {
          background: #ffffff;
          border: 1px solid #e0f2fe;
          border-radius: 12px;
          padding: 12px 12px;
          margin-bottom: 10px;
        }
        .breakdown-row {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 8px;
        }
        .breakdown-name {
          font-weight: 700;
          color: #0c4a6e;
        }
        .breakdown-score {
          font-weight: 700;
          color: #0c4a6e;
          font-size: 13px;
          white-space: nowrap;
        }
        .breakdown-bar {
          height: 8px;
          background: #e0f2fe;
          border-radius: 999px;
          overflow: hidden;
          border: 1px solid #bae6fd;
          margin-bottom: 8px;
        }
        .breakdown-bar > span {
          display: block;
          height: 100%;
          background: linear-gradient(to right, #38bdf8, #0284c7);
          width: 0%;
        }
        .breakdown-comment {
          color: #64748b;
          font-size: 13px;
        }
        .highlight-num {
          display: inline-block;
          width: 24px;
          height: 24px;
          background: #fbbf24;
          color: white;
          border-radius: 50%;
          text-align: center;
          line-height: 24px;
          font-size: 12px;
          font-weight: bold;
          margin-right: 10px;
        }
        .correction-item {
          background: #faf5ff;
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 15px;
          border: 1px solid #e9d5ff;
        }
        .correction-original {
          color: #666;
          margin-bottom: 8px;
          padding-left: 10px;
          border-left: 3px solid #ccc;
        }
        .correction-improved {
          color: #7c3aed;
          font-weight: 500;
          padding-left: 10px;
          border-left: 3px solid #7c3aed;
          background: #f5f3ff;
          padding: 10px;
          border-radius: 5px;
          margin-bottom: 8px;
        }
        .correction-reason {
          color: #888;
          font-size: 13px;
          padding-left: 10px;
        }
        .golden-item {
          background: linear-gradient(to right, #ecfdf5, #fff);
          padding: 15px;
          border-radius: 10px;
          margin-bottom: 15px;
          border: 1px solid #a7f3d0;
        }
        .golden-sentence {
          color: #065f46;
          font-weight: 500;
          font-size: 16px;
          margin-bottom: 8px;
        }
        .golden-benefit {
          color: #059669;
          font-size: 14px;
          font-style: italic;
        }
        .comment-section {
          background: #fff9f5;
          padding: 25px;
          border-radius: 15px;
          border: 1px solid #ffe4d1;
        }
        .comment-block {
          margin-bottom: 20px;
        }
        .comment-title {
          display: inline-block;
          background: #ff8a3d;
          color: white;
          padding: 5px 15px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .comment-content {
          padding-left: 10px;
          color: #555;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #888;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📝 AI 作文批改报告</h1>
        <div class="subtitle">生成时间：${new Date().toLocaleString('zh-CN')}</div>
      </div>

      <div class="section">
        <div class="section-title">原文内容</div>
        ${analysis.title ? `<div class="essay-title">《${analysis.title}》</div>` : ''}
        <div class="essay-body">${analysis.body || '未能识别到正文内容'}</div>
      </div>

      ${analysis.rating ? `
      <div class="section">
        <div class="section-title">🎖️ 等级评定</div>
        <div class="rating-box">
          <div class="rating-top">
            <div class="rating-score">${analysis.rating.score} 分</div>
            <div class="rating-meta">
              <div>${analysis.rating.stage === 'primary' ? '小学标准' : '初中标准'}</div>
              <div>等级<span class="rating-level">${analysis.rating.level}</span></div>
            </div>
          </div>
          ${analysis.rating.oneLineSummary ? `<div class="rating-summary">${analysis.rating.oneLineSummary}</div>` : ''}
          ${(analysis.rating.breakdown || []).map((item) => {
            const max = Number(item?.max) || 0;
            const score = Number(item?.score) || 0;
            const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : 0;
            return `
              <div class="breakdown-item">
                <div class="breakdown-row">
                  <div class="breakdown-name">${item?.name || ''}</div>
                  <div class="breakdown-score">${score} / ${max}</div>
                </div>
                <div class="breakdown-bar"><span style="width:${pct}%"></span></div>
                ${item?.comment ? `<div class="breakdown-comment">${item.comment}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      </div>
      ` : ''}

      ${analysis.highlights && analysis.highlights.length > 0 ? `
      <div class="section">
        <div class="section-title">✨ 闪光点</div>
        ${analysis.highlights.map((point, idx) => `
          <div class="highlight-item">
            <span class="highlight-num">${idx + 1}</span>
            ${point}
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${analysis.corrections && analysis.corrections.length > 0 ? `
      <div class="section">
        <div class="section-title">🪄 魔法修改</div>
        ${analysis.corrections.map((item, idx) => `
          <div class="correction-item">
            <div class="correction-original">
              <strong>原句：</strong>${item.original}
            </div>
            <div class="correction-improved">
              <strong>修改后：</strong>${item.improved}
            </div>
            <div class="correction-reason">
              💡 ${item.reason}
            </div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${analysis.goldenSentences && analysis.goldenSentences.length > 0 ? `
      <div class="section">
        <div class="section-title">💎 金句赏析</div>
        ${analysis.goldenSentences.map((item, idx) => `
          <div class="golden-item">
            <div class="golden-sentence">"${item.sentence}"</div>
            <div class="golden-benefit">📖 ${item.benefit}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${analysis.overallComment ? `
      <div class="section">
        <div class="section-title">👩‍🏫 老师总评</div>
        <div class="comment-section">
          ${analysis.overallComment.split('\n').map(line => {
            const match = line.match(/^.*?【(.*?)】(.*)$/);
            if (match) {
              return `
                <div class="comment-block">
                  <div class="comment-title">${match[1]}</div>
                  <div class="comment-content">${match[2]}</div>
                </div>
              `;
            }
            return line ? `<p style="margin-bottom: 10px;">${line}</p>` : '';
          }).join('')}
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <p>本报告由 AI 作文批改系统自动生成</p>
        <p>Socrates AI 学习助手</p>
      </div>
    </body>
    </html>
  `;

  // 打开新窗口打印
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    // 延迟打印确保内容加载完成
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }
};

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
        const bracket = line.match(/^\s*【([^】]+)】\s*(.*)$/);

        if (bracket) {
          const title = bracket[1].trim();
          let rest = (bracket[2] || '').trim();

          // Support both formats:
          // 1) 【温暖抱抱】🌟：内容...
          // 2) 【温暖抱抱】内容...
          let decoration = '';
          if (rest) {
            const firstChar = rest[0];
            if (['🌟', '🚀', '🌈', '✨', '⭐'].includes(firstChar)) {
              decoration = firstChar;
              rest = rest.slice(1).trim();
            }
          }
          rest = rest.replace(/^[:：]\s*/, '');

          let fallbackIcon = '';
          if (title.includes('温暖抱抱')) fallbackIcon = '🌟';
          else if (title.includes('成长小贴士')) fallbackIcon = '🚀';
          else if (title.includes('未来寄语')) fallbackIcon = '🌈';

          const displayIcon = decoration || fallbackIcon;
          const content = rest;
          if (!content) {
            return <p key={idx} className="mb-2 leading-loose text-gray-700">{line}</p>;
          }

          return (
            <div key={idx} className="block group">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-warm-100 text-warm-600 px-3 py-1 rounded-full font-bold text-base shadow-sm border border-warm-200 flex items-center gap-1">
                   {displayIcon ? <span>{displayIcon}</span> : null}
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
  const [isExporting, setIsExporting] = useState(false);

  const rating = analysis.rating;
  const ratingStageLabel = rating?.stage === 'middle' ? '初中标准' : '小学标准';

  const nextImage = () => {
    setCurrentImageIdx((prev) => (prev + 1) % imagePreviews.length);
  };

  const prevImage = () => {
    setCurrentImageIdx((prev) => (prev - 1 + imagePreviews.length) % imagePreviews.length);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await generatePDFReport(analysis, analysis.title || '');
    } catch (error) {
      console.error('Export error:', error);
      alert('导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
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

          {/* 0. Rating */}
          <Card
            title="等级评定 🎖️"
            icon={<Medal className="text-sky-600" size={24} />}
            colorClass="bg-sky-50 text-sky-800"
          >
            {rating ? (
              <div className="bg-sky-50/60 border border-sky-100 rounded-2xl p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-white border border-sky-200 text-sky-700">
                      {ratingStageLabel}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-600 text-white">
                      等级 {rating.level}
                    </span>
                  </div>
                  <div className="text-sky-900 font-extrabold text-3xl">
                    {rating.score}<span className="text-base font-bold text-sky-700 ml-1">分</span>
                  </div>
                </div>

                {rating.oneLineSummary ? (
                  <div className="mt-4 bg-white/70 border border-sky-100 rounded-xl p-4 text-sky-900 leading-relaxed">
                    {rating.oneLineSummary}
                  </div>
                ) : null}

                {(rating.breakdown || []).length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {(rating.breakdown || []).map((item, idx) => {
                      const max = Number(item?.max) || 0;
                      const score = Number(item?.score) || 0;
                      const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((score / max) * 100))) : 0;
                      return (
                        <div key={idx} className="bg-white rounded-xl border border-sky-100 p-4">
                          <div className="flex items-baseline justify-between gap-3">
                            <div className="font-bold text-sky-900">{item.name}</div>
                            <div className="text-sm font-bold text-sky-900 whitespace-nowrap">
                              {score} / {max}
                            </div>
                          </div>
                          <div className="mt-2 h-2.5 bg-sky-100 rounded-full overflow-hidden border border-sky-200">
                            <div className="h-full bg-gradient-to-r from-sky-400 to-sky-600" style={{ width: `${pct}%` }} />
                          </div>
                          {item.comment ? (
                            <div className="mt-2 text-sm text-slate-600 leading-relaxed">{item.comment}</div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p>暂无等级评定</p>
              </div>
            )}
          </Card>

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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 flex items-center gap-3">
        {/* Export Button */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-6 py-4 rounded-full shadow-lg border border-gray-200 transition-all hover:shadow-xl font-medium active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            <Download size={20} />
          )}
          导出报告
        </button>

        {/* Reset Button */}
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
