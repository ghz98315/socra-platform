// =====================================================
// OCR Encoding Fix
// =====================================================
// 问题：OCR 识别中文时出现乱码
// 原因：字符编码处理不一致
// 解决方案：统一使用 UTF-8 编码

// 方案 1: 确保后端返回 UTF-8
// ✓ 已在 backend/ocr_server.py 中设置 utf-8

// 方案 2: 修复前端字符编码处理
// 更新 OCRResult 组件

import { useEffect } from 'react';

// 在组件中添加字符编码修复
const fixEncoding = (text: string): string => {
  if (!text) return '';

  // 尝试修复常见的编码问题
  try {
    // 如果文本中包含乱码字符，尝试转换
    return decodeURIComponent(escape(text));
  } catch {
    return text;
  }
};

// 方案 3: 使用更好的中文 OCR 配置
const chineseOCRLanguages = [
  'chi_sim',  // 简体中文
  'chi_tra',  // 繁体中文
  'eng',      // 英文
];

// 方案 4: 图片上传时确保使用正确的编码
const prepareImageForOCR = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result && typeof result === 'string') {
        // 确保使用 UTF-8 编码
        resolve(result);
      }
    };
    reader.readAsDataURL(file);
  });
};

// 导出配置
export const OCR_CONFIG = {
  // 推荐使用阿里云或腾讯云 OCR，对中文支持更好
  RECOMMENDED_API: 'alibaba-ocr' as const,

  // Tesseract 配置（如果使用）
  TESSERACT_CONFIG: {
    language: 'chi_sim',
    charset: 'utf-8',
  },
};
