'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Clock3,
  ExternalLink,
  FileText,
  Loader2,
  MessageSquareText,
  Sparkles,
} from 'lucide-react';

import { ChatMessageList, type Message } from '@/components/ChatMessage';
import { StudyResultSummary } from '@/components/study/StudyResultSummary';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  fetchStudyAssetDetail,
  getStudyAssetModuleLabel,
  getStudyAssetStatusLabel,
  type StudyAssetDetailRecord,
} from '@/lib/study/assets';
import { readStudyAssetReviewBridge } from '@/lib/study/bridges';
import { readStudyResultSummaryPayload } from '@/lib/study/result-summary';

interface StudyAssetDetailProps {
  assetId: string;
}

const payloadFieldLabels: Record<string, string> = {
  transcriptInput: '听力原文 / 转写稿',
  questionInput: '题目 / 问题',
  answerInput: '学生答案 / 当前判断',
  noteInput: '补充信息',
  sourceInput: '原文 / 材料',
  taskInput: '任务 / 题目',
  draftInput: '草稿 / 原文',
  content_preview: '内容预览',
  extracted_text_preview: '识别题面',
};

const preferredPayloadKeys = [
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

const subjectLabels: Record<string, string> = {
  math: '数学',
  chinese: '语文',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  generic: '综合',
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function hasDisplayValue(value: unknown) {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).length > 0;
  }

  return value !== null && value !== undefined;
}

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

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function renderPayloadValue(value: unknown) {
  if (typeof value === 'string') {
    return <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{value}</p>;
  }

  if (Array.isArray(value) && value.every((item) => typeof item === 'string' || typeof item === 'number')) {
    return <p className="text-sm leading-6 text-slate-700">{value.join('、')}</p>;
  }

  return (
    <pre className="overflow-x-auto rounded-2xl bg-slate-950/95 p-4 text-xs leading-6 text-slate-100">
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function buildModuleHref(subject: string, module: string) {
  if (module === 'problem') {
    return `/study/${subject}/problem`;
  }

  return `/study/${subject}/${module}`;
}

export function StudyAssetDetail({ assetId }: StudyAssetDetailProps) {
  const { loading: authLoading, profile } = useAuth();
  const [detail, setDetail] = useState<StudyAssetDetailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToReview, setAddingToReview] = useState(false);
  const [reviewActionError, setReviewActionError] = useState('');
  const [reviewActionMessage, setReviewActionMessage] = useState('');
  const [reviewHrefState, setReviewHrefState] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDetail() {
      if (authLoading) {
        return;
      }

      if (!profile?.id) {
        if (active) {
          setLoading(false);
          setError('当前未识别到学生身份，无法读取学习记录。');
        }
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await fetchStudyAssetDetail({ assetId, studentId: profile.id });
        if (!active) {
          return;
        }

        setDetail(data);
      } catch (requestError) {
        console.error('[StudyAssetDetail] Failed to load study asset detail:', requestError);
        if (active) {
          setDetail(null);
          setError('学习记录详情读取失败，请稍后重试。');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      active = false;
    };
  }, [assetId, authLoading, profile?.id]);

  useEffect(() => {
    setAddingToReview(false);
    setReviewActionError('');
    setReviewActionMessage('');
    setReviewHrefState('');
  }, [assetId]);

  const chatMessages = useMemo<Message[]>(() => {
    if (!detail?.messages?.length) {
      return [];
    }

    return detail.messages.map((message) => ({
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: new Date(message.created_at),
    }));
  }, [detail?.messages]);

  const latestAssistantContent = useMemo(() => {
    return [...chatMessages]
      .reverse()
      .find((message) => message.role === 'assistant' && message.content.trim().length > 0)?.content || '';
  }, [chatMessages]);

  if (loading) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-sm">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          正在读取学习记录详情...
        </div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="rounded-[28px] border border-slate-200 bg-white/90 p-8 shadow-sm">
        <div className="flex flex-col gap-4">
          <Link
            href="/reports"
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            生成学习报告
          </Link>
          <Link
            href="/study/history"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            返回统一学习记录
          </Link>
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            {error || '未找到对应的学习记录。'}
          </div>
        </div>
      </div>
    );
  }

  const record = detail.asset;
  const payload = record.payload || {};
  const structuredResultSummary = readStudyResultSummaryPayload(payload.resultSummary ?? payload.result_summary);
  const visiblePayloadEntries = preferredPayloadKeys
    .map((key) => [key, payload[key]] as const)
    .filter(([, value]) => hasDisplayValue(value));
  const usedPayloadKeys = new Set(visiblePayloadEntries.map(([key]) => key));
  if (structuredResultSummary.length > 0) {
    usedPayloadKeys.add('resultSummary');
    usedPayloadKeys.add('result_summary');
  }

  const extraPayloadEntries = Object.entries(payload).filter(
    ([key, value]) => !usedPayloadKeys.has(key) && hasDisplayValue(value),
  );
  const moduleHref = buildModuleHref(record.subject, record.module);
  const legacy = detail.legacy;
  const legacyLinks = legacy?.links || {};
  const legacyRecord = readObjectValue(legacy?.record);
  const reviewBridge = readStudyAssetReviewBridge(payload);
  const reviewHref = reviewHrefState || legacyLinks.reviewHref || reviewBridge?.reviewHref || '';
  const reportHref = `/reports?focus_asset_id=${encodeURIComponent(record.id)}`;
  const messageDescription =
    detail.message_source === 'legacy_chat_messages'
      ? '当前展示的是旧链路中的 chat_messages，对话内容来自 legacy 数据。'
      : '当前展示的是统一学习记录沉淀下来的消息记录。';

  async function handleAddToReview() {
    if (!profile?.id || addingToReview) {
      return;
    }

    setAddingToReview(true);
    setReviewActionError('');
    setReviewActionMessage('');

    try {
      const response = await fetch('/api/study/assets/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id: record.id,
          student_id: profile.id,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'failed-to-add-study-asset-review');
      }

      if (typeof data?.review_href === 'string' && data.review_href.trim()) {
        setReviewHrefState(data.review_href);
      }

      setReviewActionMessage(data?.existed ? '该学习记录已在复习清单中。' : '已加入复习清单，可以直接进入复习。');
    } catch (requestError: any) {
      console.error('[StudyAssetDetail] Failed to add study asset to review:', requestError);
      setReviewActionError(requestError?.message || '加入复习失败，请稍后重试。');
    } finally {
      setAddingToReview(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-4xl">
            <Link
              href="/study/history"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              返回统一学习记录
            </Link>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {subjectLabels[record.subject] || record.subject}
              </span>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                {getStudyAssetModuleLabel(record.module)}
              </span>
              <span className="rounded-full bg-slate-900 px-3 py-1 text-white">
                {getStudyAssetStatusLabel(record)}
              </span>
              <span className="rounded-full bg-amber-100 px-3 py-1 text-amber-700">{record.input_type}</span>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-blue-700">{record.question_type}</span>
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
              {record.title?.trim() || '未命名学习记录'}
            </h1>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600 lg:text-base">
              {record.summary?.trim() || '当前还没有生成摘要。'}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-600">
            <div className="flex items-center gap-2 text-slate-900">
              <Clock3 className="h-4 w-4 text-warm-500" />
              <span className="font-medium">时间信息</span>
            </div>
            <div className="mt-2 space-y-1">
              <p>创建于 {formatDate(record.created_at)}</p>
              <p>更新于 {formatDate(record.updated_at)}</p>
              <p className="text-xs text-slate-400">ID: {record.id}</p>
            </div>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href={moduleHref}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            打开对应模块
          </Link>
          {legacyLinks.continueStudyHref ? (
            <Link
              href={legacyLinks.continueStudyHref}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              回到原学习会话
            </Link>
          ) : null}
          {legacyLinks.errorBookHref ? (
            <Link
              href={legacyLinks.errorBookHref}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              打开旧详情页
            </Link>
          ) : null}
          {reviewHref ? (
            <Link
              href={reviewHref}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              打开复习页
            </Link>
          ) : (
            <button
              type="button"
              onClick={handleAddToReview}
              disabled={addingToReview}
              className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {addingToReview ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  加入复习中
                </>
              ) : (
                '加入复习清单'
              )}
            </button>
          )}
          <Link
            href={reportHref}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            生成学习报告
          </Link>
          {legacyLinks.workspaceHref ? (
            <Link
              href={legacyLinks.workspaceHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              打开作文工作台
              <ExternalLink className="ml-2 h-4 w-4" />
            </Link>
          ) : null}
        </div>

        {reviewActionMessage ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {reviewActionMessage}
          </div>
        ) : null}
        {reviewActionError ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {reviewActionError}
          </div>
        ) : null}
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <FileText className="h-4 w-4 text-slate-500" />
            输入快照
          </div>

          {visiblePayloadEntries.length === 0 && extraPayloadEntries.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-sm text-slate-500">
              当前记录没有可直接展示的输入快照，常见于旧数据懒同步或仅保留摘要的记录。
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              {visiblePayloadEntries.map(([key, value]) => (
                <article key={key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <h2 className="text-sm font-medium text-slate-900">{payloadFieldLabels[key] || key}</h2>
                  <div className="mt-3">{renderPayloadValue(value)}</div>
                </article>
              ))}

              {extraPayloadEntries.length > 0 ? (
                <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="text-sm font-medium text-slate-900">补充元数据</div>
                  <div className="mt-3 space-y-4">
                    {extraPayloadEntries.map(([key, value]) => (
                      <div key={key}>
                        <h3 className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                          {payloadFieldLabels[key] || key}
                        </h3>
                        <div className="mt-2">{renderPayloadValue(value)}</div>
                      </div>
                    ))}
                  </div>
                </article>
              ) : null}

              {legacyRecord ? (
                <article className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                  <div className="text-sm font-medium text-slate-900">旧链路数据</div>
                  <div className="mt-3 space-y-3">
                    {readStringValue(legacyRecord.original_image_url) ? (
                      <img
                        src={readStringValue(legacyRecord.original_image_url) || ''}
                        alt="legacy preview"
                        className="w-full rounded-2xl border border-slate-200 object-cover"
                      />
                    ) : null}
                    <pre className="overflow-x-auto rounded-2xl bg-slate-950/95 p-4 text-xs leading-6 text-slate-100">
                      {JSON.stringify(legacyRecord, null, 2)}
                    </pre>
                  </div>
                </article>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <MessageSquareText className="h-4 w-4 text-slate-500" />
            对话回看
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">{messageDescription}</p>

          {structuredResultSummary.length > 0 || latestAssistantContent ? (
            <div className="mt-4">
              <StudyResultSummary
                module={structuredResultSummary.length > 0 ? undefined : record.module}
                content={structuredResultSummary.length > 0 ? undefined : latestAssistantContent}
                sections={structuredResultSummary}
                title="结构化结果摘要"
                description="便于在统一学习记录详情里快速回看关键结论。"
              />
            </div>
          ) : null}

          {chatMessages.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-4 py-5 text-sm leading-6 text-slate-500">
              这条记录当前没有可回看的对话消息。常见原因是它来自旧作文 / 旧错题懒同步，或旧链路当时没有写入统一消息表。
            </div>
          ) : (
            <div className="mt-4 rounded-[24px] border border-slate-200 bg-slate-50/60 p-4">
              <ChatMessageList messages={chatMessages} theme={profile?.theme_preference || 'junior'} />
            </div>
          )}
        </section>
      </div>

      <section className="rounded-[28px] border border-blue-200 bg-blue-50/80 p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
          <Sparkles className="h-4 w-4 text-blue-600" />
          当前阶段说明
        </div>
        <div className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          <p>统一学习记录中心现在已经具备列表浏览、详情回看、模块回跳、报告联动和复习桥接，足够支撑第一轮内测读写闭环。</p>
          <p>下一步仍应继续细化结果结构、旧链路映射和自动化回测，而不是重新拆掉当前已稳定的记录层。</p>
          {legacy ? (
            <p>
              当前记录来源于 legacy `{legacy.kind}` 数据，详情页优先保证可读、可回跳，再逐步补齐更细粒度展示。
            </p>
          ) : null}
          {readStringArray(payload.concept_tags).length > 0 ? (
            <p>当前记录识别到的标签：{readStringArray(payload.concept_tags).join('、')}。</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
