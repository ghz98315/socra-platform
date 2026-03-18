'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileSearch,
  Loader2,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  TextQuote,
} from 'lucide-react';

import { ChatMessageList, type Message } from '@/components/ChatMessage';
import { StudyAssetHistory } from '@/components/study/StudyAssetHistory';
import { StudyAssetResultActionsV2 } from '@/components/study/StudyAssetResultActionsV2';
import { StudyResultSummaryV2 } from '@/components/study/StudyResultSummaryV2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStudyAssetSession } from '@/hooks/useStudyAssetSession';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  bridgeStudyAssetToReview,
  buildStudyAssetDetailHref,
  buildStudyAssetSummary,
  buildStudyAssetPayloadWithSummary,
} from '@/lib/study/assets-v2';
import { cn } from '@/lib/utils';

type ChineseAnalysisMode = 'reading' | 'foundation';

interface ChineseAnalysisAction {
  id: string;
  label: string;
  prompt: string;
}

interface ChineseAnalysisPreset {
  badge: string;
  title: string;
  description: string;
  sourceLabel: string;
  sourcePlaceholder: string;
  questionLabel: string;
  questionPlaceholder: string;
  answerLabel: string;
  answerPlaceholder: string;
  tips: string[];
  actions: ChineseAnalysisAction[];
  accentClass: string;
  badgeClass: string;
  questionType: 'reading' | 'unknown';
}

const presets: Record<ChineseAnalysisMode, ChineseAnalysisPreset> = {
  reading: {
    badge: '语文阅读理解',
    title: '阅读题拆解工作台',
    description:
      '围绕原文、题干和学生答案，快速提炼文章主旨、文本依据、答题框架和失分风险。',
    sourceLabel: '原文 / 阅读材料',
    sourcePlaceholder:
      '粘贴阅读原文、诗文片段或题目材料。内容较长时，至少保留与题目直接相关的段落。',
    questionLabel: '题干 / 小问',
    questionPlaceholder: '例如：第 3 题“结合上下文，分析作者两次写到风的作用。”',
    answerLabel: '你的答案 / 卡住点（可选）',
    answerPlaceholder:
      '可以贴上自己的答案，或说明你不知道该从哪几句、哪几个角度下手。',
    tips: [
      '先把原文和题干贴全，再用快捷动作拆题，结果会更稳。',
      '如果已经写过答案，也一起贴上来，系统更容易定位失分点。',
      '这一版优先服务阅读题分析，不改旧录题主链路。',
    ],
    actions: [
      {
        id: 'reading-main-idea',
        label: '主旨梳理',
        prompt: '先概括文章主旨、情感走向，以及和题目最相关的段落。',
      },
      {
        id: 'reading-question-breakdown',
        label: '拆题定位',
        prompt: '请拆解题干，指出这道题到底在问什么，应该从哪几处文本找依据。',
      },
      {
        id: 'reading-answer-frame',
        label: '答题框架',
        prompt: '请给我一版清晰的答题结构，说明每一步该写什么。',
      },
      {
        id: 'reading-risk-check',
        label: '失分排查',
        prompt: '请结合我的答案或常见误区，指出最容易漏写、跑偏或空泛的地方。',
      },
    ],
    accentClass: 'text-red-600',
    badgeClass: 'bg-red-100 text-red-700',
    questionType: 'reading',
  },
  foundation: {
    badge: '语文基础知识',
    title: '基础知识分析工作台',
    description:
      '适合字词、病句、修辞、古诗文、文言文与语言运用题，先拆考点，再给判断路径。',
    sourceLabel: '题目 / 选项 / 相关材料',
    sourcePlaceholder:
      '粘贴题干、选项、古诗文原句或语言运用材料，尽量保留完整上下文。',
    questionLabel: '你想解决的问题',
    questionPlaceholder:
      '例如：为什么这题选 B？这句病句到底错在哪？这首诗表达了什么情感？',
    answerLabel: '你的答案 / 当前判断（可选）',
    answerPlaceholder: '可以写下你的选择、理由，或者说明你分不清的知识点。',
    tips: [
      '如果是选择题，尽量把四个选项一起贴上来。',
      '如果是古诗文或文言文，建议同时贴出原句和注释范围。',
      '这一版先做“拆考点 + 讲思路”，不直接写入旧错题结构。',
    ],
    actions: [
      {
        id: 'foundation-point',
        label: '识别考点',
        prompt: '请先判断这道题在考什么知识点，并解释命题意图。',
      },
      {
        id: 'foundation-explain',
        label: '逐步讲解',
        prompt: '请按步骤讲清楚这题应该怎么判断，不要只给结论。',
      },
      {
        id: 'foundation-mistake',
        label: '错因排查',
        prompt: '请结合我的答案或常见误区，指出最容易判断错的地方。',
      },
      {
        id: 'foundation-memory',
        label: '记忆提示',
        prompt: '请给我一版容易记住的规律、口诀或辨析方法。',
      },
    ],
    accentClass: 'text-amber-600',
    badgeClass: 'bg-amber-100 text-amber-700',
    questionType: 'unknown',
  },
};

function createMessage(role: Message['role'], content: string): Message {
  return {
    id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: new Date(),
  };
}

function buildQuestionContent(sourceInput: string, questionInput: string, answerInput: string) {
  return [
    sourceInput.trim() ? `材料：\n${sourceInput.trim()}` : '',
    questionInput.trim() ? `问题：\n${questionInput.trim()}` : '',
    answerInput.trim() ? `学生当前答案或卡点：\n${answerInput.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildInitialPrompt(
  mode: ChineseAnalysisMode,
  action: ChineseAnalysisAction,
  sourceInput: string,
  questionInput: string,
  answerInput: string,
) {
  const source = sourceInput.trim();
  const question = questionInput.trim();
  const answer = answerInput.trim();

  if (mode === 'reading') {
    return [
      '请作为语文阅读理解老师，帮助我拆解这道阅读题。',
      `原文或材料：\n${source}`,
      `题干：\n${question}`,
      answer ? `我的答案或卡点：\n${answer}` : '',
      `本次重点：${action.prompt}`,
      '请按“文章主旨、题干拆解、文本依据定位、答题框架、容易失分点、下一步先补哪一句或哪一层”输出。',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  return [
    '请作为语文基础知识老师，帮助我拆解这道语文题。',
    `题目或材料：\n${source}`,
    `我想解决的问题：\n${question}`,
    answer ? `我的答案或当前判断：\n${answer}` : '',
    `本次重点：${action.prompt}`,
    '请按“考查点判断、逐步分析、正确思路、常见误区、记忆提示、下次遇到同类题怎么判断”输出。',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function getValidationMessage(mode: ChineseAnalysisMode, sourceInput: string, questionInput: string) {
  if (!sourceInput.trim()) {
    return mode === 'reading' ? '先贴原文或阅读材料。' : '先贴题目、选项或相关材料。';
  }

  if (!questionInput.trim()) {
    return mode === 'reading' ? '先写清题干或你要解决的小问。' : '先写清你想解决的具体问题。';
  }

  return '';
}

function buildChineseAnalysisTitle(
  mode: ChineseAnalysisMode,
  sourceInput: string,
  questionInput: string,
) {
  const prefix = mode === 'reading' ? '语文阅读理解' : '语文基础知识';
  const primary = questionInput.trim() || sourceInput.trim();

  if (!primary) {
    return prefix;
  }

  return `${prefix} · ${primary.slice(0, 24)}`;
}

export function ChineseAnalysisStudioV2({ mode }: { mode: ChineseAnalysisMode }) {
  const { profile } = useAuth();
  const preset = presets[mode];
  const bottomRef = useRef<HTMLDivElement>(null);
  const {
    assetId,
    getSessionId,
    historyRefreshToken,
    persistTurn: persistStudyAssetTurn,
    resetSession,
  } = useStudyAssetSession({
    sessionKey: `study_chinese_${mode}`,
  });

  const [sourceInput, setSourceInput] = useState('');
  const [questionInput, setQuestionInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [followUpInput, setFollowUpInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [addingToReview, setAddingToReview] = useState(false);
  const [reviewHref, setReviewHref] = useState('');
  const [reviewActionError, setReviewActionError] = useState('');
  const [reviewActionMessage, setReviewActionMessage] = useState('');

  const latestAssistantMessage = useMemo(() => {
    return [...messages]
      .reverse()
      .find((message) => message.role === 'assistant' && message.content.trim().length > 0) || null;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  async function persistTurn(userMessage: string, assistantContent: string) {
    try {
      await persistStudyAssetTurn({
        studentId: profile?.id,
        subject: 'chinese',
        module: mode,
        inputType: 'text',
        questionType: preset.questionType,
        title: buildChineseAnalysisTitle(mode, sourceInput, questionInput),
        summary: buildStudyAssetSummary(assistantContent),
        payload: buildStudyAssetPayloadWithSummary({
          mode,
          sourceInput,
          questionInput,
          answerInput,
        }, mode, assistantContent),
        userMessage,
        assistantContent,
      });
    } catch (error) {
      console.error('[ChineseAnalysisStudioV2] Failed to save study asset:', error);
    }
  }

  async function sendToChatApi(userMessage: string) {
    const questionContent = buildQuestionContent(sourceInput, questionInput, answerInput);
    const userEntry = createMessage('user', userMessage);

    setMessages((current) => [...current, userEntry]);
    setIsLoading(true);
    setNotice('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          sessionId: getSessionId(),
          grade: profile?.theme_preference || 'junior',
          subject: 'chinese',
          userLevel: 'premium',
          subjectConfidence: 1,
          questionContent,
          questionType: preset.questionType,
          userId: profile?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('chat-request-failed');
      }

      const data = await response.json();
      const content =
        typeof data?.content === 'string' && data.content.trim()
          ? data.content
          : '当前没有拿到有效回复，请稍后再试一次。';
      const assistantEntry = createMessage('assistant', content);

      setMessages((current) => [...current, assistantEntry]);
      await persistTurn(userMessage, assistantEntry.content);
    } catch {
      setMessages((current) => [
        ...current,
        createMessage(
          'assistant',
          '当前语文分析工作台请求失败了。可以稍后重试，或先回到旧链路继续使用稳定流程。',
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAction(action: ChineseAnalysisAction) {
    const validationMessage = getValidationMessage(mode, sourceInput, questionInput);
    if (validationMessage) {
      setNotice(validationMessage);
      return;
    }

    await sendToChatApi(buildInitialPrompt(mode, action, sourceInput, questionInput, answerInput));
  }

  async function handleFollowUpSend() {
    if (!followUpInput.trim() || isLoading) {
      return;
    }

    const message = followUpInput.trim();
    setFollowUpInput('');
    await sendToChatApi(message);
  }

  function handleReset() {
    resetSession();
    setMessages([]);
    setFollowUpInput('');
    setNotice('');
    setAddingToReview(false);
    setReviewHref('');
    setReviewActionError('');
    setReviewActionMessage('');
  }

  async function handleAddToReview() {
    if (!profile?.id || !assetId || addingToReview) {
      return;
    }

    setAddingToReview(true);
    setReviewActionError('');
    setReviewActionMessage('');

    try {
      const result = await bridgeStudyAssetToReview({
        assetId,
        studentId: profile.id,
      });

      if (result.reviewHref.trim()) {
        setReviewHref(result.reviewHref);
      }

      setReviewActionMessage(
        result.existed ? '这条结果已在复习清单中。' : '已把本轮结果加入复习清单。',
      );
    } catch (error: any) {
      console.error('[ChineseAnalysisStudioV2] Failed to bridge study asset to review:', error);
      setReviewActionError(error?.message || '加入复习失败，请稍后重试。');
    } finally {
      setAddingToReview(false);
    }
  }

  const resultDescription =
    mode === 'reading'
      ? '把最近一次阅读分析整理成更像结果页的结构卡片，方便直接回看主旨、依据和答题路径。'
      : '把最近一次基础知识分析整理成结果卡片，方便回看考点、判断路径和记忆提示。';

  const followUpPlaceholder =
    mode === 'reading'
      ? '例如：把第二问整理成 3 个得分点，或告诉我哪一句原文最该作为依据。'
      : '例如：把这个病句错因再讲简单一点，或帮我总结一条辨析口诀。';

  const stageNote =
    mode === 'reading'
      ? '这条阅读工作台先解决“能直接拆阅读题、能沉淀记录、能进入复习”的主链路，后续再继续打磨更深的历史回放和统一 Session。'
      : '这条基础知识工作台先解决“能拆考点、能讲判断、能沉淀结果”的主链路，后续再补更细的专题页和统一会话层。';

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
      <Card className="rounded-[28px] border-slate-200 bg-white/90 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div
                className={cn(
                  'inline-flex items-center rounded-full px-3 py-1 text-xs font-medium',
                  preset.badgeClass,
                )}
              >
                {preset.badge}
              </div>
              <CardTitle className="mt-3 text-xl text-slate-900">{preset.title}</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                {preset.description}
              </CardDescription>
            </div>
            <div className="hidden rounded-2xl bg-slate-50 p-3 text-slate-500 sm:block">
              {mode === 'reading' ? (
                <BookOpen className="h-5 w-5" />
              ) : (
                <FileSearch className="h-5 w-5" />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <label className="text-sm font-medium text-slate-900">{preset.sourceLabel}</label>
            <textarea
              value={sourceInput}
              onChange={(event) => setSourceInput(event.target.value)}
              placeholder={preset.sourcePlaceholder}
              className="mt-2 min-h-[160px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <label className="text-sm font-medium text-slate-900">{preset.questionLabel}</label>
            <textarea
              value={questionInput}
              onChange={(event) => setQuestionInput(event.target.value)}
              placeholder={preset.questionPlaceholder}
              className="mt-2 min-h-[112px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <label className="text-sm font-medium text-slate-900">{preset.answerLabel}</label>
            <textarea
              value={answerInput}
              onChange={(event) => setAnswerInput(event.target.value)}
              placeholder={preset.answerPlaceholder}
              className="mt-2 min-h-[120px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <Sparkles className={cn('h-4 w-4', preset.accentClass)} />
              快捷动作
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {preset.actions.map((action) => (
                <Button
                  key={action.id}
                  type="button"
                  variant="outline"
                  disabled={isLoading}
                  onClick={() => void handleAction(action)}
                  className="rounded-full border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                >
                  {action.label}
                </Button>
              ))}
            </div>
            {notice ? <p className="mt-3 text-sm text-amber-600">{notice}</p> : null}
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <CheckCircle2 className={cn('h-4 w-4', preset.accentClass)} />
              当前更适合这样用
            </div>
            <div className="mt-3 space-y-2">
              {preset.tips.map((tip) => (
                <div key={tip} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-slate-300" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-slate-200 bg-white/90 shadow-sm">
        <CardHeader className="border-b border-slate-200">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl text-slate-900">分析结果工作区</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                当前先把阅读与基础知识拆成独立工作台，确保结果可读、可沉淀、可回看，再逐步并回统一学习资产链路。
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              disabled={isLoading}
              onClick={handleReset}
              className="rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              新一轮
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex min-h-[700px] flex-col px-5 pb-5 pt-5">
          {latestAssistantMessage ? (
            <div className="mb-4">
              <StudyResultSummaryV2
                module={mode}
                content={latestAssistantMessage.content}
                title="本轮结果摘要"
                description={resultDescription}
              />

              {assetId ? (
                <div className="mt-3 hidden flex-wrap gap-2">
                  <Link
                    href={buildStudyAssetDetailHref(assetId)}
                    className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    查看详情
                  </Link>
                  <Link
                    href={`/reports?focus_asset_id=${encodeURIComponent(assetId)}`}
                    className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    学习报告
                  </Link>
                  {reviewHref ? (
                    <Link
                      href={reviewHref}
                      className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      打开复习页
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleAddToReview()}
                      disabled={addingToReview}
                      className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {addingToReview ? (
                        <>
                          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                          加入复习中
                        </>
                      ) : (
                        '加入复习'
                      )}
                    </button>
                  )}
                </div>
              ) : null}

              {reviewActionMessage ? (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {reviewActionMessage}
                </div>
              ) : null}
              {reviewActionError ? (
                <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {reviewActionError}
                </div>
              ) : null}

              <StudyAssetResultActionsV2 assetId={assetId} studentId={profile?.id} />
            </div>
          ) : null}

          <div className="flex-1 overflow-auto">
            <ChatMessageList
              messages={messages}
              theme={profile?.theme_preference || 'junior'}
              isLoading={isLoading}
            />
            <div ref={bottomRef} />
          </div>

          <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <MessageSquareText className={cn('h-4 w-4', preset.accentClass)} />
              继续追问
            </div>
            <textarea
              value={followUpInput}
              onChange={(event) => setFollowUpInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleFollowUpSend();
                }
              }}
              placeholder={followUpPlaceholder}
              className="mt-3 min-h-[96px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">`Enter` 发送，`Shift + Enter` 换行。</p>
              <Button
                type="button"
                disabled={isLoading || !followUpInput.trim()}
                onClick={() => void handleFollowUpSend()}
                className="rounded-full bg-slate-900 text-white hover:bg-slate-800"
              >
                发送追问
              </Button>
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-red-200 bg-red-50/80 p-4 text-sm leading-6 text-slate-700">
            <div className="flex items-center gap-2 font-medium text-slate-900">
              <TextQuote className="h-4 w-4 text-red-600" />
              当前阶段说明
            </div>
            <p className="mt-2">{stageNote}</p>
          </div>
        </CardContent>
      </Card>

      <div className="xl:col-span-2">
        <StudyAssetHistory
          subject="chinese"
          module={mode}
          refreshToken={historyRefreshToken}
          title="当前模块学习记录"
          description="新工作台会先把最近分析沉淀到统一索引层，便于详情回看、报告联动和复习桥接。"
          emptyText="当前模块还没有学习记录。先完成一轮分析，这里会自动出现最近记录。"
        />
      </div>
    </section>
  );
}
