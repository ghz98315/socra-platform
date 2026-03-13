// =====================================================
// AnalysisResult - 结果展示组件
// =====================================================

import React, { useEffect, useRef, useState } from 'react';
import { Star, Wand2, Gem, Quote, MessageCircle, RotateCcw, ChevronLeft, ChevronRight, HeartHandshake, Sparkles, Download, Loader2, Medal } from 'lucide-react';
import { EssayAnalysis, HighlightItem } from '../types';

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
        .magic-box {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 14px;
          padding: 18px;
        }
        .magic-label {
          display: inline-block;
          font-size: 12px;
          font-weight: 700;
          color: #9a3412;
          background: #ffedd5;
          border: 1px solid #fed7aa;
          padding: 3px 10px;
          border-radius: 999px;
          margin-bottom: 8px;
        }
        .magic-para {
          white-space: pre-wrap;
          line-height: 2;
          background: #fff;
          border: 1px solid #ffedd5;
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 10px;
        }
        .magic-upgraded {
          border-left: 4px solid #f97316;
          background: #fff7ed;
        }
        .material-item {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 12px;
        }
        .material-quote {
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .material-how {
          color: #475569;
          font-size: 14px;
          line-height: 1.8;
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
        ${analysis.highlights.map((point: any, idx) => {
          const isObj = point && typeof point === 'object';
          const dimension = isObj ? (point.dimension || '') : '';
          const description = isObj ? (point.description || '') : (point || '');
          const text = dimension ? `【${dimension}】${description}` : `${description}`;
          return `
            <div class="highlight-item">
              <span class="highlight-num">${idx + 1}</span>
              ${text}
            </div>
          `;
        }).join('')}
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

      ${analysis.magicModification && (analysis.magicModification.originalPara || analysis.magicModification.upgradedPara) ? `
      <div class="section">
        <div class="section-title">🧙 段落魔法升级</div>
        <div class="magic-box">
          <div class="magic-label">原段落（保持原样）</div>
          <div class="magic-para">${analysis.magicModification.originalPara || ''}</div>
          <div class="magic-label">升格示范（更生动/更高级）</div>
          <div class="magic-para magic-upgraded">${analysis.magicModification.upgradedPara || ''}</div>
          ${analysis.magicModification.secret ? `<div class="magic-label">修改秘籍</div><div class="material-how">${analysis.magicModification.secret}</div>` : ''}
        </div>
      </div>
      ` : ''}

      ${analysis.goldenSentences && analysis.goldenSentences.length > 0 ? `
      <div class="section">
        <div class="section-title">💎 原文金句赏析</div>
        ${analysis.goldenSentences.map((item, idx) => `
          <div class="golden-item">
            <div class="golden-sentence">"${item.sentence}"</div>
            <div class="golden-benefit">📖 ${item.benefit}</div>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${analysis.materialBox && analysis.materialBox.length > 0 ? `
      <div class="section">
        <div class="section-title">📚 素材百宝箱</div>
        ${(analysis.materialBox || []).map((item, idx) => `
          <div class="material-item">
            <div class="material-quote">素材${idx + 1}：${item.quote}</div>
            <div class="material-how">怎么用：${item.howToUse}</div>
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

type AnnotationKind = 'correction' | 'highlight' | 'golden' | 'magic';
type AnnotationFilter = 'all' | AnnotationKind;

interface AnnotationDraft {
  id: string;
  kind: AnnotationKind;
  anchorText: string;
  title: string;
  chipLabel: string;
  priority: number;
  item: any;
}

interface EssayAnnotation extends AnnotationDraft {
  start: number;
  end: number;
}

interface TextSegment {
  key: string;
  text: string;
  annotation?: EssayAnnotation;
}

const hasOccupiedRange = (occupied: boolean[], start: number, end: number) => {
  for (let i = start; i < end; i++) {
    if (occupied[i]) return true;
  }
  return false;
};

const markOccupiedRange = (occupied: boolean[], start: number, end: number) => {
  for (let i = start; i < end; i++) occupied[i] = true;
};

const buildEssayAnnotations = (body: string, drafts: AnnotationDraft[]): EssayAnnotation[] => {
  if (!body) return [];

  const occupied = new Array(body.length).fill(false);
  const searchState = new Map<string, number>();
  const matched: EssayAnnotation[] = [];

  const orderedDrafts = [...drafts].sort((a, b) => {
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.anchorText.length - a.anchorText.length;
  });

  for (const draft of orderedDrafts) {
    const anchorText = draft.anchorText.trim();
    if (!anchorText) continue;

    let from = searchState.get(anchorText) ?? 0;
    while (from < body.length) {
      const start = body.indexOf(anchorText, from);
      if (start < 0) break;

      const end = start + anchorText.length;
      if (!hasOccupiedRange(occupied, start, end)) {
        markOccupiedRange(occupied, start, end);
        searchState.set(anchorText, end);
        matched.push({ ...draft, anchorText, start, end });
        break;
      }

      from = start + 1;
    }
  }

  return matched.sort((a, b) => a.start - b.start || a.end - b.end);
};

const buildTextSegments = (
  body: string,
  annotations: EssayAnnotation[]
): TextSegment[] => {
  if (!body) return [];

  if (annotations.length === 0) {
    return [{ key: 'plain', text: body }];
  }

  const segments: TextSegment[] = [];
  let cursor = 0;

  annotations.forEach((annotation, idx) => {
    if (annotation.start > cursor) {
      segments.push({
        key: `plain-${idx}-${cursor}`,
        text: body.slice(cursor, annotation.start),
      });
    }

    segments.push({
      key: annotation.id,
      text: body.slice(annotation.start, annotation.end),
      annotation,
    });

    cursor = annotation.end;
  });

  if (cursor < body.length) {
    segments.push({
      key: `plain-tail-${cursor}`,
      text: body.slice(cursor),
    });
  }

  return segments;
};

const getAnnotationClasses = (kind: AnnotationKind, isSelected: boolean) => {
  if (kind === 'correction') {
    return isSelected
      ? 'bg-rose-100 text-rose-950 underline decoration-rose-500 decoration-wavy underline-offset-4 shadow-[inset_0_-2px_0_0_rgba(244,63,94,0.45)]'
      : 'bg-rose-50/80 text-slate-800 underline decoration-rose-400 decoration-wavy underline-offset-4 hover:bg-rose-100/90';
  }

  if (kind === 'golden') {
    return isSelected
      ? 'bg-emerald-100 text-emerald-950 shadow-[inset_0_-2px_0_0_rgba(16,185,129,0.45)]'
      : 'bg-emerald-50/90 text-slate-800 hover:bg-emerald-100/90';
  }

  if (kind === 'highlight') {
    return isSelected
      ? 'bg-yellow-100 text-yellow-950 shadow-[inset_0_-2px_0_0_rgba(234,179,8,0.45)]'
      : 'bg-yellow-50/90 text-slate-800 hover:bg-yellow-100/90';
  }

  return isSelected
    ? 'bg-orange-100 text-orange-950 border-b-2 border-orange-500 shadow-[inset_0_-2px_0_0_rgba(249,115,22,0.4)]'
    : 'bg-orange-50/90 text-slate-800 border-b-2 border-orange-300 hover:bg-orange-100/80';
};

const getFilterButtonClasses = (
  buttonFilter: AnnotationFilter,
  activeFilter: AnnotationFilter
) => {
  const isActive = buttonFilter === activeFilter;
  const base =
    'px-3 py-1.5 rounded-full text-xs font-bold border transition-colors';

  if (buttonFilter === 'correction') {
    return `${base} ${isActive ? 'bg-rose-500 text-white border-rose-500' : 'bg-white text-rose-700 border-rose-200 hover:bg-rose-50'}`;
  }

  if (buttonFilter === 'golden') {
    return `${base} ${isActive ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-emerald-700 border-emerald-200 hover:bg-emerald-50'}`;
  }

  if (buttonFilter === 'highlight') {
    return `${base} ${isActive ? 'bg-yellow-500 text-white border-yellow-500' : 'bg-white text-yellow-700 border-yellow-200 hover:bg-yellow-50'}`;
  }

  if (buttonFilter === 'magic') {
    return `${base} ${isActive ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-700 border-orange-200 hover:bg-orange-50'}`;
  }

  return `${base} ${isActive ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`;
};

const getAnnotationBadgeClasses = (kind: AnnotationKind) => {
  if (kind === 'correction') {
    return 'bg-rose-100 text-rose-700 border border-rose-200';
  }

  if (kind === 'highlight') {
    return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
  }

  if (kind === 'golden') {
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
  }

  return 'bg-orange-100 text-orange-700 border border-orange-200';
};

const getAnnotationSidebarClasses = (kind: AnnotationKind, isSelected: boolean) => {
  const base =
    'w-full rounded-2xl border p-4 text-left transition-all duration-200';

  if (kind === 'correction') {
    return `${base} ${
      isSelected
        ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-100 shadow-sm'
        : 'bg-white border-rose-100 hover:border-rose-200 hover:bg-rose-50/50'
    }`;
  }

  if (kind === 'highlight') {
    return `${base} ${
      isSelected
        ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-100 shadow-sm'
        : 'bg-white border-yellow-100 hover:border-yellow-200 hover:bg-yellow-50/50'
    }`;
  }

  if (kind === 'golden') {
    return `${base} ${
      isSelected
        ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-100 shadow-sm'
        : 'bg-white border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50/50'
    }`;
  }

  return `${base} ${
    isSelected
      ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-100 shadow-sm'
      : 'bg-white border-orange-100 hover:border-orange-200 hover:bg-orange-50/50'
  }`;
};

const getAnnotationPreview = (annotation: EssayAnnotation) => {
  if (annotation.kind === 'correction') {
    return {
      heading: annotation.item.improved || annotation.item.original || annotation.anchorText,
      detail: annotation.item.reason || '建议替换为更准确、更通顺的表达。',
      anchor: annotation.item.original || annotation.anchorText,
    };
  }

  if (annotation.kind === 'highlight') {
    return {
      heading: annotation.item.dimension || annotation.chipLabel || '闪光点',
      detail: annotation.item.description || '这里是这篇作文最出彩的表达。',
      anchor: annotation.item.anchorText || annotation.anchorText,
    };
  }

  if (annotation.kind === 'golden') {
    return {
      heading: annotation.item.sentence || annotation.anchorText,
      detail: annotation.item.benefit || '这句话值得保留并积累为自己的表达素材。',
      anchor: annotation.item.sentence || annotation.anchorText,
    };
  }

  return {
    heading: annotation.item.upgradedPara || annotation.item.originalPara || annotation.anchorText,
    detail: annotation.item.secret || '这一段已经给出更生动、更完整的升格示范。',
    anchor: annotation.item.originalPara || annotation.anchorText,
  };
};

const AnnotationDetail: React.FC<{ annotation?: EssayAnnotation }> = ({ annotation }) => {
  if (!annotation) {
    return (
      <div className="text-sm text-slate-500 leading-relaxed">
        点击正文中的高亮片段，查看对应批注。
      </div>
    );
  }

  if (annotation.kind === 'correction') {
    return (
      <div className="space-y-3 text-sm leading-relaxed">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">原句</div>
          <div className="bg-white border border-rose-100 rounded-xl p-3 text-slate-700">
            {annotation.item.original}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">修改后</div>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-900 font-medium">
            {annotation.item.improved}
          </div>
        </div>
        <div className="bg-white/80 border border-rose-100 rounded-xl p-3 text-slate-600">
          <span className="font-bold text-rose-700 mr-2">修改理由</span>
          {annotation.item.reason}
        </div>
      </div>
    );
  }

  if (annotation.kind === 'golden') {
    return (
      <div className="space-y-3 text-sm leading-relaxed">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">原文金句</div>
          <div className="bg-white border border-emerald-100 rounded-xl p-3 text-emerald-900 font-medium">
            {annotation.item.sentence}
          </div>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-700">
          <span className="font-bold mr-2">赏析</span>
          {annotation.item.benefit}
        </div>
      </div>
    );
  }

  if (annotation.kind === 'highlight') {
    return (
      <div className="space-y-3 text-sm leading-relaxed">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">原文锚点</div>
          <div className="bg-white border border-yellow-100 rounded-xl p-3 text-slate-700">
            {annotation.item.anchorText || annotation.anchorText}
          </div>
        </div>
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-yellow-700 mb-1">闪光维度</div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-yellow-900 font-medium">
            {annotation.item.dimension || '闪光点'}
          </div>
        </div>
        <div className="bg-white/80 border border-yellow-100 rounded-xl p-3 text-slate-600">
          <span className="font-bold text-yellow-700 mr-2">亮点说明</span>
          {annotation.item.description}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">原段落</div>
        <div className="bg-white border border-orange-100 rounded-xl p-3 text-slate-700 whitespace-pre-wrap">
          {annotation.item.originalPara}
        </div>
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-1">升格示范</div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-orange-900 whitespace-pre-wrap">
          {annotation.item.upgradedPara}
        </div>
      </div>
      {annotation.item.secret ? (
        <div className="bg-white/80 border border-orange-100 rounded-xl p-3 text-slate-600">
          <span className="font-bold text-orange-700 mr-2">修改秘籍</span>
          {annotation.item.secret}
        </div>
      ) : null}
    </div>
  );
};

const AnalysisResult: React.FC<AnalysisResultProps> = ({ analysis, imagePreviews, onReset }) => {
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [annotationFilter, setAnnotationFilter] = useState<AnnotationFilter>('all');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [hoveredAnnotationId, setHoveredAnnotationId] = useState<string | null>(null);
  const [reviewedAnnotationIds, setReviewedAnnotationIds] = useState<string[]>([]);
  const annotationRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const sidebarRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const rating = analysis.rating;
  const ratingStageLabel = rating?.stage === 'middle' ? '初中标准' : '小学标准';
  const essayBody = analysis.body || '';

  const highlights = (analysis.highlights || []).map((h) => {
    if (typeof h === 'string') return { dimension: '', description: h };
    return h as HighlightItem;
  });

  const correctionDrafts: AnnotationDraft[] = (analysis.corrections || []).map((item, idx) => ({
    id: `correction-${idx}`,
    kind: 'correction',
    anchorText: item.original || '',
    title: `错别字 / 病句 ${idx + 1}`,
    chipLabel: '错别字',
    priority: 1,
    item,
  }));

  const goldenDrafts: AnnotationDraft[] = (analysis.goldenSentences || []).map((item, idx) => ({
    id: `golden-${idx}`,
    kind: 'golden',
    anchorText: item.sentence || '',
    title: `原文金句 ${idx + 1}`,
    chipLabel: '金句',
    priority: 2,
    item,
  }));

  const magicDrafts: AnnotationDraft[] =
    analysis.magicModification?.originalPara?.trim()
      ? [{
          id: 'magic-0',
          kind: 'magic',
          anchorText: analysis.magicModification.originalPara,
          title: '段落魔法升级',
          chipLabel: '段落升级',
          priority: 3,
          item: analysis.magicModification,
        }]
      : [];

  const highlightAnnotationDrafts: AnnotationDraft[] = highlights
    .map((item, idx) => ({
      id: `highlight-${idx}`,
      kind: 'highlight' as const,
      anchorText: item.anchorText || '',
      title: `闪光点 ${idx + 1}`,
      chipLabel: item.dimension || '闪光点',
      priority: 2,
      item,
    }))
    .filter((item) => item.anchorText.trim());

  const allAnnotations = buildEssayAnnotations(essayBody, [
    ...correctionDrafts,
    ...highlightAnnotationDrafts,
    ...goldenDrafts,
    ...magicDrafts,
  ]);
  const visibleAnnotations =
    annotationFilter === 'all'
      ? allAnnotations
      : allAnnotations.filter((item) => item.kind === annotationFilter);
  const annotationSegments = buildTextSegments(essayBody, visibleAnnotations);
  const annotationOrder = new Map(allAnnotations.map((item, idx) => [item.id, idx + 1]));
  const selectedAnnotation =
    visibleAnnotations.find((item) => item.id === selectedAnnotationId) || visibleAnnotations[0];
  const focusedAnnotationId = hoveredAnnotationId || selectedAnnotation?.id || null;
  const selectedAnnotationIndex = selectedAnnotation
    ? visibleAnnotations.findIndex((item) => item.id === selectedAnnotation.id)
    : -1;
  const reviewedVisibleCount = visibleAnnotations.filter((item) =>
    reviewedAnnotationIds.includes(item.id)
  ).length;
  const reviewProgressPct = visibleAnnotations.length
    ? Math.round((reviewedVisibleCount / visibleAnnotations.length) * 100)
    : 0;

  useEffect(() => {
    if (!visibleAnnotations.length) {
      if (selectedAnnotationId !== null) setSelectedAnnotationId(null);
      return;
    }

    const selectedStillExists = visibleAnnotations.some((item) => item.id === selectedAnnotationId);
    if (!selectedStillExists) {
      setSelectedAnnotationId(visibleAnnotations[0].id);
    }
  }, [visibleAnnotations, selectedAnnotationId]);

  useEffect(() => {
    if (!selectedAnnotationId) return;
    const el = annotationRefs.current[selectedAnnotationId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }
  }, [selectedAnnotationId]);

  useEffect(() => {
    if (!selectedAnnotation?.id) return;

    setReviewedAnnotationIds((current) => {
      if (current.includes(selectedAnnotation.id)) return current;
      return [...current, selectedAnnotation.id];
    });
  }, [selectedAnnotation]);

  useEffect(() => {
    setHoveredAnnotationId(null);
  }, [annotationFilter]);

  const selectAnnotation = (id: string, source: 'text' | 'card' | 'sidebar') => {
    const targetAnnotation = allAnnotations.find((item) => item.id === id);
    if (!targetAnnotation) return;

    if (annotationFilter !== 'all' && targetAnnotation.kind !== annotationFilter) {
      setAnnotationFilter(targetAnnotation.kind);
    }

    setSelectedAnnotationId(id);

    if (source === 'text') {
      const sidebarEl = sidebarRefs.current[id];
      if (sidebarEl) {
        sidebarEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }

      const detailCardEl = cardRefs.current[id];
      if (detailCardEl) {
        detailCardEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const jumpToAdjacentAnnotation = (direction: 'prev' | 'next') => {
    if (!visibleAnnotations.length) return;

    const fallbackIndex = direction === 'next' ? 0 : visibleAnnotations.length - 1;
    const currentIndex = selectedAnnotation
      ? visibleAnnotations.findIndex((item) => item.id === selectedAnnotation.id)
      : fallbackIndex;

    if (currentIndex < 0) {
      selectAnnotation(visibleAnnotations[fallbackIndex].id, 'sidebar');
      return;
    }

    const delta = direction === 'next' ? 1 : -1;
    const targetIndex = (currentIndex + delta + visibleAnnotations.length) % visibleAnnotations.length;
    selectAnnotation(visibleAnnotations[targetIndex].id, 'sidebar');
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      const isTyping =
        tagName === 'input' ||
        tagName === 'textarea' ||
        target?.isContentEditable;

      if (isTyping || !visibleAnnotations.length) return;

      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'j') {
        event.preventDefault();
        jumpToAdjacentAnnotation('next');
      }

      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'k') {
        event.preventDefault();
        jumpToAdjacentAnnotation('prev');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visibleAnnotations, selectedAnnotation, annotationFilter]);

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

           {/* Annotated Essay */}
           <div className="bg-white rounded-2xl shadow-sm p-4 border border-warm-100">
             <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
               <div>
                 <h3 className="font-bold text-warm-800 flex items-center">
                   <MessageCircle size={18} className="mr-2" />
                   原文批注工作台
                 </h3>
                 <p className="mt-1 text-sm text-slate-500">
                   像 Word 一样直接点正文高亮，看对应的错别字、闪光点和段落升级。
                 </p>
               </div>
               <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                 <div className="rounded-2xl border border-rose-100 bg-rose-50 px-3 py-2 text-rose-700">
                   <div className="font-bold text-base leading-none">{correctionDrafts.length}</div>
                   <div className="mt-1">错别字</div>
                 </div>
                 <div className="rounded-2xl border border-yellow-100 bg-yellow-50 px-3 py-2 text-yellow-700">
                   <div className="font-bold text-base leading-none">{highlightAnnotationDrafts.length}</div>
                   <div className="mt-1">闪光点</div>
                 </div>
                 <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-emerald-700">
                   <div className="font-bold text-base leading-none">{goldenDrafts.length}</div>
                   <div className="mt-1">金句</div>
                 </div>
                 <div className="rounded-2xl border border-orange-100 bg-orange-50 px-3 py-2 text-orange-700">
                   <div className="font-bold text-base leading-none">{magicDrafts.length}</div>
                   <div className="mt-1">段落升级</div>
                 </div>
               </div>
             </div>
             <div className="bg-orange-50/30 p-5 rounded-xl text-gray-700 leading-loose border border-orange-100 text-base">
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    type="button"
                    className={getFilterButtonClasses('all', annotationFilter)}
                    onClick={() => setAnnotationFilter('all')}
                  >
                    全部批注
                  </button>
                  <button
                    type="button"
                    className={getFilterButtonClasses('correction', annotationFilter)}
                    onClick={() => setAnnotationFilter('correction')}
                  >
                    错别字 {correctionDrafts.length}
                  </button>
                  <button
                    type="button"
                    className={getFilterButtonClasses('highlight', annotationFilter)}
                    onClick={() => setAnnotationFilter('highlight')}
                  >
                    闪光点 {highlightAnnotationDrafts.length}
                  </button>
                  <button
                    type="button"
                    className={getFilterButtonClasses('golden', annotationFilter)}
                    onClick={() => setAnnotationFilter('golden')}
                  >
                    金句 {goldenDrafts.length}
                  </button>
                  <button
                    type="button"
                    className={getFilterButtonClasses('magic', annotationFilter)}
                    onClick={() => setAnnotationFilter('magic')}
                  >
                    段落升级 {magicDrafts.length}
                  </button>
                </div>
                {visibleAnnotations.length > 0 ? (
                  <div className="mb-4 rounded-2xl border border-warm-100 bg-white/80 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-warm-800">批注导航</div>
                        <div className="text-xs text-slate-500">
                          先看总览，再逐条审阅。点击编号可直接跳转到原文对应位置。
                        </div>
                      </div>
                      <div className="min-w-[180px]">
                        <div className="mb-1 flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.18em] text-warm-500">
                          <span>Review Progress</span>
                          <span>{reviewedVisibleCount}/{visibleAnnotations.length}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full border border-warm-100 bg-warm-50">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-warm-400 to-warm-600 transition-all duration-300"
                            style={{ width: `${reviewProgressPct}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => jumpToAdjacentAnnotation('prev')}
                          className="inline-flex items-center rounded-full border border-warm-200 bg-white px-3 py-1.5 text-xs font-bold text-warm-700 hover:bg-warm-50"
                        >
                          <ChevronLeft size={14} className="mr-1" />
                          上一条
                        </button>
                        <button
                          type="button"
                          onClick={() => jumpToAdjacentAnnotation('next')}
                          className="inline-flex items-center rounded-full border border-warm-200 bg-white px-3 py-1.5 text-xs font-bold text-warm-700 hover:bg-warm-50"
                        >
                          下一条
                          <ChevronRight size={14} className="ml-1" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                      {visibleAnnotations.map((annotation) => {
                        const order = annotationOrder.get(annotation.id);
                        const isCurrent = focusedAnnotationId === annotation.id;

                        return (
                          <button
                            key={annotation.id}
                            type="button"
                            onClick={() => selectAnnotation(annotation.id, 'sidebar')}
                            onMouseEnter={() => setHoveredAnnotationId(annotation.id)}
                            onMouseLeave={() => setHoveredAnnotationId((current) => current === annotation.id ? null : current)}
                            className={`flex min-w-fit items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition-all ${
                              isCurrent
                                ? 'border-slate-800 bg-slate-800 text-white shadow-sm'
                                : 'border-warm-200 bg-white text-slate-700 hover:border-warm-300 hover:bg-warm-50'
                            }`}
                          >
                            {order ? (
                              <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-black ${
                                isCurrent ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
                              }`}>
                                {order}
                              </span>
                            ) : null}
                            <span>{annotation.chipLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_320px]">
                  <div className="min-w-0">
                    {analysis.title && (
                      <div className="mb-4 rounded-2xl border border-warm-100 bg-white/80 p-4">
                        <span className="text-warm-600 font-bold text-sm tracking-wide">作文标题</span>
                        <div className="mt-2 font-bold text-gray-900 text-xl border-b border-warm-100 pb-2">
                          《{analysis.title}》
                        </div>
                      </div>
                    )}
                    <div className="rounded-[28px] border border-[#ead7c6] bg-[#fffdfa] p-4 shadow-[0_18px_50px_rgba(140,89,40,0.08)]">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-warm-700 font-bold text-base">正文标注</span>
                          <div className="mt-1 text-xs text-slate-500">
                            键盘可用 `←/→` 或 `K/J` 连续翻阅批注。
                          </div>
                        </div>
                        <span className="rounded-full bg-warm-50 px-3 py-1 text-xs font-bold text-warm-700 border border-warm-100">
                          当前显示 {visibleAnnotations.length} 条批注
                        </span>
                      </div>
                      <div
                        className="relative min-h-[260px] max-h-[72vh] overflow-y-auto rounded-[24px] border border-[#f1dfcf] bg-[#fffaf5] pr-2"
                        style={{
                          backgroundImage:
                            'repeating-linear-gradient(to bottom, transparent 0, transparent 34px, rgba(233, 213, 191, 0.45) 34px, rgba(233, 213, 191, 0.45) 35px)',
                          backgroundSize: '100% 35px',
                        }}
                      >
                        <div className="pointer-events-none absolute bottom-0 right-0 h-14 w-14 rounded-tl-[22px] bg-gradient-to-tl from-[#f6e4d2] to-transparent opacity-70" />
                        <div className="pointer-events-none absolute left-5 top-0 h-full w-px bg-rose-200/80" />
                        <div className="pl-9 pr-4 py-5">
                        {essayBody ? (
                          <div className="whitespace-pre-wrap text-justify leading-loose text-[15px]">
                            {annotationSegments.map((segment) => {
                              if (!segment.annotation) {
                                return <span key={segment.key}>{segment.text}</span>;
                              }

                              const isSelected = focusedAnnotationId === segment.annotation.id;
                              const isBlock = segment.text.includes('\n');
                              const badgeNumber = annotationOrder.get(segment.annotation.id);

                              return (
                                <button
                                  key={segment.key}
                                  type="button"
                                  ref={(el) => {
                                    annotationRefs.current[segment.annotation!.id] = el;
                                  }}
                                  onClick={() => selectAnnotation(segment.annotation!.id, 'text')}
                                  onMouseEnter={() => setHoveredAnnotationId(segment.annotation!.id)}
                                  onMouseLeave={() => setHoveredAnnotationId((current) => current === segment.annotation!.id ? null : current)}
                                  className={`${isBlock ? 'block w-full my-2 text-left' : 'inline text-left'} rounded-md px-1 transition-all duration-200 ${getAnnotationClasses(segment.annotation.kind, isSelected)}`}
                                >
                                  {segment.text}
                                  {badgeNumber ? (
                                    <span className={`ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full align-super text-[10px] font-black ${
                                      isSelected ? 'bg-slate-900 text-white' : 'bg-white text-slate-500 border border-slate-200'
                                    }`}>
                                      {badgeNumber}
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div>未能识别到正文内容。</div>
                        )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="rounded-2xl border border-warm-100 bg-white/85 p-4 xl:sticky xl:top-4">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="text-sm font-bold text-warm-800">侧边批注栏</div>
                          <div className="text-xs text-slate-500">
                            高亮和批注一一对应，点击任一条会自动定位原文。
                          </div>
                        </div>
                        <span className="rounded-full bg-warm-50 px-2.5 py-1 text-xs font-bold text-warm-700 border border-warm-100">
                          {annotationFilter === 'all' ? '全部' : selectedAnnotation?.chipLabel || '筛选中'}
                        </span>
                      </div>
                      {selectedAnnotation ? (
                        <div className="mb-4 rounded-2xl border border-warm-100 bg-warm-50/70 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs font-bold uppercase tracking-[0.18em] text-warm-500">
                                Review Flow
                              </div>
                              <div className="mt-1 text-sm font-bold text-warm-900">
                                第 {selectedAnnotationIndex + 1} / {visibleAnnotations.length} 条批注
                              </div>
                              <div className="mt-1 text-xs text-slate-500">
                                已审阅 {reviewedVisibleCount} 条，完成度 {reviewProgressPct}%
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => jumpToAdjacentAnnotation('prev')}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-warm-200 bg-white text-warm-700 hover:bg-warm-100"
                                aria-label="上一条批注"
                              >
                                <ChevronLeft size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => jumpToAdjacentAnnotation('next')}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-warm-200 bg-white text-warm-700 hover:bg-warm-100"
                                aria-label="下一条批注"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                      {visibleAnnotations.length > 0 ? (
                        <div className="space-y-3 max-h-[56vh] overflow-y-auto pr-1">
                          {visibleAnnotations.map((annotation) => {
                            const preview = getAnnotationPreview(annotation);
                            const isSelected = focusedAnnotationId === annotation.id;
                            const order = annotationOrder.get(annotation.id);
                            const isReviewed = reviewedAnnotationIds.includes(annotation.id);

                            return (
                              <button
                                key={annotation.id}
                                type="button"
                                ref={(el) => {
                                  sidebarRefs.current[annotation.id] = el;
                                }}
                                onClick={() => selectAnnotation(annotation.id, 'sidebar')}
                                onMouseEnter={() => setHoveredAnnotationId(annotation.id)}
                                onMouseLeave={() => setHoveredAnnotationId((current) => current === annotation.id ? null : current)}
                                className={getAnnotationSidebarClasses(annotation.kind, isSelected)}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                      {order ? (
                                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[11px] font-black text-white">
                                          {order}
                                        </span>
                                      ) : null}
                                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${getAnnotationBadgeClasses(annotation.kind)}`}>
                                        {annotation.chipLabel}
                                      </span>
                                    </div>
                                    <div className="mt-3 line-clamp-2 text-sm font-bold text-slate-900">
                                      {preview.heading}
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    {isSelected ? (
                                      <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-bold text-white">
                                        当前
                                      </span>
                                    ) : null}
                                    {isReviewed ? (
                                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                        已阅
                                      </span>
                                    ) : (
                                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                                        待看
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600">
                                  {preview.detail}
                                </div>
                                <div className="mt-3 border-t border-slate-100 pt-3">
                                  <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
                                    对应原文
                                  </div>
                                  <div className="mt-1 line-clamp-3 text-sm leading-relaxed text-slate-700">
                                    {preview.anchor}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-warm-200 bg-warm-50/60 p-5 text-sm leading-relaxed text-slate-500">
                          当前筛选下没有可显示的批注，切回“全部批注”可以查看完整联动。
                        </div>
                      )}
                      <div className="mt-4 border-t border-warm-100 pt-4">
                        <div className="text-sm font-bold text-warm-800 mb-2">当前批注详情</div>
                        <AnnotationDetail annotation={selectedAnnotation} />
                      </div>
                    </div>
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
              {highlights.map((point, idx) => (
                <div
                  key={idx}
                  ref={(el) => {
                    cardRefs.current[`highlight-${idx}`] = el;
                  }}
                  onClick={() => {
                    if (highlightAnnotationDrafts.some((item) => item.id === `highlight-${idx}`)) {
                      selectAnnotation(`highlight-${idx}`, 'card');
                    }
                  }}
                  className={`flex items-start gap-3 group ${point.anchorText ? 'cursor-pointer' : ''}`}
                >
                  <div className="mt-1 w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-xs font-bold flex-shrink-0 group-hover:bg-yellow-200 transition-colors">
                    {idx + 1}
                  </div>
                  <div
                    className={`bg-yellow-50/50 p-3 rounded-lg w-full text-gray-700 leading-relaxed border group-hover:bg-yellow-50 transition-colors ${
                      selectedAnnotation?.id === `highlight-${idx}` ? 'border-yellow-300 ring-2 ring-yellow-100' : 'border-yellow-100/50'
                    }`}
                  >
                    {point.dimension ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-white border border-yellow-200 text-yellow-700 mr-2">
                        {point.dimension}
                      </span>
                    ) : null}
                    <span>{point.description}</span>
                    {point.anchorText ? (
                      <div className="mt-2 text-xs text-yellow-700 bg-white/70 border border-yellow-100 rounded-lg px-2.5 py-2">
                        对应原文：{point.anchorText}
                      </div>
                    ) : null}
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
                  <div
                    key={idx}
                    ref={(el) => {
                      cardRefs.current[`correction-${idx}`] = el;
                    }}
                    onClick={() => selectAnnotation(`correction-${idx}`, 'card')}
                    className={`relative bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden cursor-pointer ${
                      selectedAnnotation?.id === `correction-${idx}` ? 'border-purple-300 ring-2 ring-purple-100' : 'border-purple-100'
                    }`}
                  >
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

          {/* 2.5 Magic Modification */}
          <Card
            title="段落魔法升级 🧙"
            icon={<Sparkles className="text-orange-500" size={24} />}
            colorClass="bg-orange-50 text-orange-700"
          >
            {analysis.magicModification?.originalPara || analysis.magicModification?.upgradedPara ? (
              <div
                ref={(el) => {
                  cardRefs.current['magic-0'] = el;
                }}
                onClick={() => selectAnnotation('magic-0', 'card')}
                className={`bg-orange-50/50 border rounded-2xl p-5 cursor-pointer transition-colors ${
                  selectedAnnotation?.id === 'magic-0' ? 'border-orange-300 ring-2 ring-orange-100' : 'border-orange-100'
                }`}
              >
                <div className="space-y-4">
                  <div>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-white border border-orange-200 text-orange-700">
                      原段落（保持原样）
                    </div>
                    <div className="mt-2 whitespace-pre-wrap leading-loose bg-white border border-orange-100 rounded-xl p-4 text-gray-700">
                      {analysis.magicModification?.originalPara || '暂无'}
                    </div>
                  </div>
                  <div>
                    <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-600 text-white">
                      升格示范（更生动/更高级）
                    </div>
                    <div className="mt-2 whitespace-pre-wrap leading-loose bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-xl p-4 text-orange-900">
                      {analysis.magicModification?.upgradedPara || '暂无'}
                    </div>
                  </div>
                  {analysis.magicModification?.secret ? (
                    <div className="bg-white/70 border border-orange-100 rounded-xl p-4 text-sm text-slate-700 leading-relaxed">
                      <span className="font-bold text-orange-700 mr-2">修改秘籍</span>
                      {analysis.magicModification.secret}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p>暂无段落魔法升级示范</p>
              </div>
            )}
          </Card>

          {/* 3. Golden Sentences */}
          <Card
            title="原文金句赏析 💎"
            icon={<Gem className="text-emerald-500" size={24} />}
            colorClass="bg-emerald-50 text-emerald-700"
          >
             <div className="grid grid-cols-1 gap-4">
               {(analysis.goldenSentences || []).map((item, idx) => (
                 <div
                   key={idx}
                   ref={(el) => {
                     cardRefs.current[`golden-${idx}`] = el;
                   }}
                   onClick={() => selectAnnotation(`golden-${idx}`, 'card')}
                   className={`bg-gradient-to-br from-emerald-50 to-white border rounded-xl p-4 hover:border-emerald-300 transition-all shadow-sm group cursor-pointer ${
                     selectedAnnotation?.id === `golden-${idx}` ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-emerald-100'
                   }`}
                 >
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

          {/* 3.5 Material Box */}
          <Card
            title="素材百宝箱 📚"
            icon={<Quote className="text-slate-700" size={24} />}
            colorClass="bg-slate-50 text-slate-800"
          >
            {(analysis.materialBox || []).length > 0 ? (
              <div className="space-y-4">
                {(analysis.materialBox || []).map((item, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                        素材 {idx + 1}
                      </span>
                      <span className="text-xs text-slate-400">下次写作可直接迁移</span>
                    </div>
                    <div className="text-slate-900 font-bold leading-relaxed">
                      {item.quote}
                    </div>
                    <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 leading-relaxed">
                      <span className="font-bold text-slate-800 mr-2">怎么用</span>
                      {item.howToUse}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p>暂无素材推荐</p>
              </div>
            )}
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
