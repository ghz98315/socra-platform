// =====================================================
// Project Socrates - Subject Configs Index
// 科目配置导出
// =====================================================

import type { SubjectConfig, SubjectType } from '../types';
import { mathConfig } from './math';
import { chineseConfig } from './chinese';
import { englishConfig } from './english';
import { genericConfig } from './generic';

// 所有科目配置映射
export const subjectConfigs: Record<SubjectType, SubjectConfig> = {
  math: mathConfig,
  chinese: chineseConfig,
  english: englishConfig,
  generic: genericConfig,
};

/**
 * 获取科目配置
 */
export function getSubjectConfig(subject: SubjectType): SubjectConfig {
  return subjectConfigs[subject] || genericConfig;
}

/**
 * 获取支持的科目列表
 */
export function getSupportedSubjects(): SubjectType[] {
  return ['math', 'chinese', 'english'];
}

/**
 * 判断是否为支持的科目
 */
export function isSupportedSubject(subject: string): subject is SubjectType {
  return ['math', 'chinese', 'english', 'generic'].includes(subject);
}

/**
 * 根据OCR识别结果获取科目类型
 */
export function mapOCRSubjectToType(
  ocrSubject: string | undefined,
  confidence: number
): SubjectType {
  // 置信度过低时使用通用模式
  if (!ocrSubject || confidence < 0.6) {
    return 'generic';
  }

  const subjectMap: Record<string, SubjectType> = {
    math: 'math',
    mathematics: 'math',
    数学: 'math',
    chinese: 'chinese',
    语文: 'chinese',
    english: 'english',
    英语: 'english',
  };

  const normalizedSubject = ocrSubject.toLowerCase();
  return subjectMap[normalizedSubject] || 'generic';
}

// 导出各科目配置
export { mathConfig, chineseConfig, englishConfig, genericConfig };
