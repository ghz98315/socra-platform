// =====================================================
// Project Socrates - Prompt System
// Prompt 系统主入口
// =====================================================

// 类型导出
export type {
  SubjectType,
  GradeLevel,
  UserLevel,
  DialogMode,
  QuestionType,
  KnowledgePoint,
  DialogExample,
  SubjectConfig,
  OCRResult,
  PromptBuildOptions,
  ChatResponse,
} from './types';

// 核心函数导出
export {
  buildSystemPrompt,
  getDialogMode,
  shouldUseSpecialistMode,
  hasImageInMessages,
  extractImageFromMessages,
} from './builder';

// 基础 Prompt 导出
export { getBasePrompt, getGenericStrategies, getGradeRoutingBase } from './base';

// 科目配置导出
export {
  subjectConfigs,
  getSubjectConfig,
  getSupportedSubjects,
  isSupportedSubject,
  mapOCRSubjectToType,
  mathConfig,
  chineseConfig,
  englishConfig,
  genericConfig,
} from './subjects';
