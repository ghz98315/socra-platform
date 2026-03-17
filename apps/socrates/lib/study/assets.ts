export type StudyAssetSubject = 'math' | 'chinese' | 'english' | 'physics' | 'chemistry' | 'generic';
export type StudyAssetStatus = 'draft' | 'active' | 'completed' | 'archived';
export type StudyAssetQuestionType =
  | 'choice'
  | 'fill'
  | 'solution'
  | 'proof'
  | 'calculation'
  | 'reading'
  | 'writing'
  | 'listening'
  | 'unknown';

export interface StudyAssetMessageInput {
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_key: string;
}

export interface StudyAssetRecord {
  id: string;
  student_id: string;
  subject: StudyAssetSubject;
  module: string;
  source_type?: string;
  input_type: string;
  question_type: StudyAssetQuestionType;
  title: string | null;
  summary: string | null;
  status: StudyAssetStatus;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface StudyAssetMessageRecord {
  id: string;
  asset_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  message_key: string;
  created_at: string;
}

export interface StudyAssetLegacyLinks {
  workspaceHref?: string;
  errorBookHref?: string;
  continueStudyHref?: string;
  reviewHref?: string;
}

export interface StudyAssetLegacyDetail {
  kind: 'essay' | 'error_session';
  record: Record<string, unknown>;
  links?: StudyAssetLegacyLinks;
}

export {
  buildStudyResultSummaryPayload,
  readStudyResultSummaryPayload,
} from '@/lib/study/result-summary';

export interface StudyAssetDetailRecord {
  asset: StudyAssetRecord;
  messages: StudyAssetMessageRecord[];
  message_source?: 'study_asset_messages' | 'legacy_chat_messages';
  legacy?: StudyAssetLegacyDetail | null;
}

interface SaveStudyAssetTurnInput {
  assetId?: string | null;
  studentId: string;
  subject: StudyAssetSubject;
  module: string;
  inputType: string;
  questionType: StudyAssetQuestionType;
  title: string;
  summary: string;
  payload: Record<string, unknown>;
  messages: StudyAssetMessageInput[];
}

export const studyAssetModuleLabels: Record<string, string> = {
  problem: '录题分析',
  reading: '阅读理解',
  foundation: '基础知识',
  'composition-review': '作文批改',
  'composition-idea': '写作思路',
  listening: '听力',
  'writing-review': '作文批改',
  'writing-idea': '写作思路',
  geometry: '几何修正',
};

export function buildStudyAssetSummary(content: string, maxLength = 140) {
  const plain = content.replace(/\s+/g, ' ').trim();
  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, maxLength - 1)}...`;
}

export function createStudyAssetMessageKey(prefix: string) {
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return `${prefix}_${randomPart}`;
}

export function getStudyAssetModuleLabel(module: string) {
  return studyAssetModuleLabels[module] || module;
}

export function getStudyAssetStatusLabel(record: Pick<StudyAssetRecord, 'source_type' | 'status'>) {
  if (record.source_type === 'essay') {
    return '旧作文';
  }

  if (record.source_type === 'error_session') {
    return '旧录题';
  }

  if (record.status === 'active') {
    return '进行中';
  }

  if (record.status === 'completed') {
    return '已完成';
  }

  if (record.status === 'archived') {
    return '已归档';
  }

  return '草稿';
}

export function buildStudyAssetDetailHref(assetId: string) {
  return `/study/history/${assetId}`;
}

export async function saveStudyAssetTurn(input: SaveStudyAssetTurnInput): Promise<string> {
  const method = input.assetId ? 'PATCH' : 'POST';
  const body = input.assetId
    ? {
        asset_id: input.assetId,
        title: input.title,
        summary: input.summary,
        status: 'active',
        payload: input.payload,
        messages: input.messages,
      }
    : {
        student_id: input.studentId,
        subject: input.subject,
        module: input.module,
        source_type: 'study_module',
        input_type: input.inputType,
        question_type: input.questionType,
        title: input.title,
        summary: input.summary,
        status: 'active',
        payload: input.payload,
        messages: input.messages,
      };

  const response = await fetch('/api/study/assets', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error('study-asset-save-failed');
  }

  const data = await response.json();
  return data?.data?.asset_id as string;
}

export async function fetchStudyAssets(params: {
  studentId: string;
  subject?: StudyAssetSubject;
  module?: string;
  limit?: number;
  includeLegacy?: boolean;
}): Promise<StudyAssetRecord[]> {
  const search = new URLSearchParams({
    student_id: params.studentId,
    limit: String(params.limit ?? 6),
    include_legacy: params.includeLegacy === false ? '0' : '1',
  });

  if (params.subject) {
    search.set('subject', params.subject);
  }

  if (params.module) {
    search.set('module', params.module);
  }

  const response = await fetch(`/api/study/assets?${search.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('study-assets-fetch-failed');
  }

  const data = await response.json();
  return (data?.data || []) as StudyAssetRecord[];
}

export async function fetchStudyAssetDetail(params: {
  assetId: string;
  studentId: string;
}): Promise<StudyAssetDetailRecord> {
  const search = new URLSearchParams({
    asset_id: params.assetId,
    student_id: params.studentId,
  });

  const response = await fetch(`/api/study/assets?${search.toString()}`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('study-asset-detail-fetch-failed');
  }

  const data = await response.json();
  return data?.data as StudyAssetDetailRecord;
}
