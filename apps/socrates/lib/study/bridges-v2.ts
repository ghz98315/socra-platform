import { readStudyResultSummaryPayload } from '@/lib/study/result-summary-clean';

export interface StudyAssetBridgeRecord {
  id: string;
  subject: string;
  module: string;
  title: string | null;
  summary: string | null;
  status: string;
  source_type?: string | null;
  source_id?: string | null;
  payload?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
}

export interface StudyAssetReviewBridge {
  errorSessionId?: string;
  reviewId?: string;
  reviewHref?: string;
  addedAt?: string;
}

const payloadTextLabels: Record<string, string> = {
  sourceInput: '材料',
  questionInput: '问题',
  answerInput: '当前答案',
  taskInput: '任务',
  draftInput: '草稿',
  transcriptInput: '听力转写',
  noteInput: '补充说明',
  content_preview: '内容预览',
  extracted_text_preview: '识别文本',
};

const payloadTextKeys = [
  'taskInput',
  'draftInput',
  'sourceInput',
  'transcriptInput',
  'questionInput',
  'answerInput',
  'noteInput',
  'content_preview',
  'extracted_text_preview',
];

const moduleLabels: Record<string, string> = {
  problem: '题目分析',
  reading: '阅读理解',
  foundation: '基础知识',
  'composition-review': '作文预批改',
  'composition-idea': '写作思路',
  listening: '英语听力',
  'writing-review': '英语作文批改',
  'writing-idea': '英语写作思路',
  geometry: '几何修正',
};

function readObjectValue(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

function readStringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .map((item) => item.trim());
}

function uniqueStrings(values: string[]) {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

export function getStudyAssetModuleDisplayLabel(module: string) {
  return moduleLabels[module] || module;
}

export function readStudyAssetReviewBridge(payload: Record<string, unknown> | null | undefined) {
  const bridge = readObjectValue(payload?.reviewBridge);

  if (!bridge) {
    return null;
  }

  return {
    errorSessionId: readStringValue(bridge.errorSessionId) || undefined,
    reviewId: readStringValue(bridge.reviewId) || undefined,
    reviewHref: readStringValue(bridge.reviewHref) || undefined,
    addedAt: readStringValue(bridge.addedAt) || undefined,
  } satisfies StudyAssetReviewBridge;
}

export function hasStudyAssetStructuredResult(asset: Pick<StudyAssetBridgeRecord, 'summary' | 'payload'>) {
  const payload = asset.payload || {};
  const resultSections = readStudyResultSummaryPayload(
    payload.resultSummary ?? payload.result_summary,
  );

  return resultSections.length > 0 || !!readStringValue(asset.summary);
}

export function buildStudyAssetExtractedText(
  asset: Pick<StudyAssetBridgeRecord, 'title' | 'summary' | 'module' | 'payload'>,
) {
  const payload = asset.payload || {};
  const lines: string[] = [];

  const title = readStringValue(asset.title);
  const summary = readStringValue(asset.summary);

  if (title) {
    lines.push(`标题：${title}`);
  }

  lines.push(`模块：${getStudyAssetModuleDisplayLabel(asset.module)}`);

  if (summary) {
    lines.push(`摘要：${summary}`);
  }

  payloadTextKeys.forEach((key) => {
    const value = readStringValue(payload[key]);
    if (!value) {
      return;
    }

    lines.push(`${payloadTextLabels[key] || key}：${value}`);
  });

  const resultSections = readStudyResultSummaryPayload(
    payload.resultSummary ?? payload.result_summary,
  );

  if (resultSections.length > 0) {
    lines.push(
      `结果摘要：${resultSections.map((section) => `${section.title}：${section.content}`).join('；')}`,
    );
  }

  const text = lines.join('\n').trim();
  return text.length <= 2200 ? text : `${text.slice(0, 2197)}...`;
}

export function buildStudyAssetConceptTags(asset: Pick<StudyAssetBridgeRecord, 'module' | 'payload'>) {
  const payload = asset.payload || {};
  const explicitTags = readStringArray(payload.concept_tags);
  const resultSections = readStudyResultSummaryPayload(
    payload.resultSummary ?? payload.result_summary,
  );
  const sectionTags = resultSections.map((section) => section.title);

  const tags = uniqueStrings([
    ...explicitTags,
    ...sectionTags,
    getStudyAssetModuleDisplayLabel(asset.module),
  ]);

  return tags.length > 0 ? tags.slice(0, 6) : null;
}

export function buildStudyAssetWeakPointTags(asset: Pick<StudyAssetBridgeRecord, 'module' | 'payload'>) {
  const payload = asset.payload || {};
  const explicitTags = readStringArray(payload.concept_tags);
  const resultSections = readStudyResultSummaryPayload(
    payload.resultSummary ?? payload.result_summary,
  );
  const sectionTags = resultSections.map((section) => section.title);

  return uniqueStrings([
    ...explicitTags,
    ...sectionTags,
    getStudyAssetModuleDisplayLabel(asset.module),
  ]);
}

export function buildStudyAssetFocusSummary(
  asset: Pick<
    StudyAssetBridgeRecord,
    'id' | 'subject' | 'module' | 'title' | 'summary' | 'payload' | 'updated_at'
  >,
) {
  const payload = asset.payload || {};
  const resultSections = readStudyResultSummaryPayload(
    payload.resultSummary ?? payload.result_summary,
  );

  return {
    id: asset.id,
    subject: asset.subject,
    module: asset.module,
    moduleLabel: getStudyAssetModuleDisplayLabel(asset.module),
    title: readStringValue(asset.title) || '未命名学习记录',
    summary: readStringValue(asset.summary) || '当前记录暂无摘要。',
    updated_at: asset.updated_at || '',
    resultSectionTitles: resultSections.map((section) => section.title).slice(0, 6),
  };
}
