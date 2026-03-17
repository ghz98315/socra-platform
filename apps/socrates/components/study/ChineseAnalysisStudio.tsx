'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  FileSearch,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  TextQuote,
} from 'lucide-react';

import { ChatMessageList, type Message } from '@/components/ChatMessage';
import { StudyAssetHistory } from '@/components/study/StudyAssetHistory';
import { StudyResultSummary } from '@/components/study/StudyResultSummary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  buildStudyResultSummaryPayload,
  buildStudyAssetSummary,
  createStudyAssetMessageKey,
  saveStudyAssetTurn,
} from '@/lib/study/assets';
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
    description: '围绕文章、题干和学生答案，输出主旨、答题切口、文本依据和更稳的作答框架。',
    sourceLabel: '文章原文 / 题目材料',
    sourcePlaceholder: '粘贴阅读材料、诗文片段或题目原文。文章较长时，至少保留题目相关段落。',
    questionLabel: '题干 / 小问',
    questionPlaceholder: '例如：第 3 题“结合上下文，分析作者两次写到风的作用。”',
    answerLabel: '你的答案 / 卡住点（可选）',
    answerPlaceholder: '可以粘贴自己的答案，或说明你不知道该从哪几句、哪几个角度下手。',
    tips: [
      '先把文章和题干贴全，再用快捷动作拆题，结果会更稳定。',
      '如果已经写过答案，把自己的答案也贴上来，系统会更容易定位失分点。',
      '这一版优先服务阅读题分析，不改旧录题主链。',
    ],
    actions: [
      { id: 'reading-main-idea', label: '主旨梳理', prompt: '先概括文章主旨、情感走向和题目最相关的段落。' },
      { id: 'reading-question-breakdown', label: '拆题定位', prompt: '请拆解题干，指出这题到底在问什么、应该从哪几处文本找依据。' },
      { id: 'reading-answer-frame', label: '作答框架', prompt: '请给我一版清晰的答题结构，说明每一步该写什么。' },
      { id: 'reading-risk-check', label: '失分排查', prompt: '请结合我的答案或常见误区，指出最容易漏写、跑偏或空泛的地方。' },
    ],
    accentClass: 'text-red-600',
    badgeClass: 'bg-red-100 text-red-700',
    questionType: 'reading',
  },
  foundation: {
    badge: '语文基础知识',
    title: '基础知识分析工作台',
    description: '适合字词、病句、修辞、古诗文、文言文与语言运用题，先拆考点，再给稳妥的判断路径。',
    sourceLabel: '题目 / 选项 / 相关材料',
    sourcePlaceholder: '粘贴题干、选项、古诗文原句或语言运用材料，尽量保留完整上下文。',
    questionLabel: '你想解决的问题',
    questionPlaceholder: '例如：为什么这题选 B？这句病句到底错在哪？这句诗表达了什么情感？',
    answerLabel: '你的答案 / 当前判断（可选）',
    answerPlaceholder: '可以写你的选项、理由，或者说明你分不清的知识点。',
    tips: [
      '如果是选择题，尽量把四个选项一起贴上来。',
      '如果是古诗文或文言文，建议同时贴出原句和注释范围。',
      '这一版先做“拆考点 + 讲思路”，不直接写入旧错题结构。',
    ],
    actions: [
      { id: 'foundation-point', label: '识别考点', prompt: '请先判断这题在考什么知识点，并解释命题意图。' },
      { id: 'foundation-explain', label: '逐步讲解', prompt: '请按步骤讲清楚这题应该怎么判断，不要只给结论。' },
      { id: 'foundation-mistake', label: '错因排查', prompt: '请结合我的答案或常见误区，指出最容易判断错的地方。' },
      { id: 'foundation-memory', label: '记忆提示', prompt: '请给我一版容易记住的规律、口诀或辨析方法。' },
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
      `文章或材料：\n${source}`,
      `题干：\n${question}`,
      answer ? `我的答案或卡点：\n${answer}` : '',
      `本次重点：${action.prompt}`,
      '请按“文章主旨、题干拆解、文本依据定位、答题框架、容易失分点、下一步先补哪一句/哪一层”输出。',
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
    '请按“考查点判断、逐步分析、正确思路、常见误区、记忆提示、下一次遇到同类题怎么判断”输出。',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function getValidationMessage(mode: ChineseAnalysisMode, sourceInput: string, questionInput: string) {
  if (!sourceInput.trim()) {
    return mode === 'reading' ? '先贴文章或阅读材料。' : '先贴题目、选项或相关材料。';
  }

  if (!questionInput.trim()) {
    return mode === 'reading' ? '先填写题干或你要解决的小问。' : '先写清楚你想解决的具体问题。';
  }

  return '';
}

function buildChineseAnalysisTitle(mode: ChineseAnalysisMode, sourceInput: string, questionInput: string) {
  const prefix = mode === 'reading' ? '语文阅读理解' : '语文基础知识';
  const primary = questionInput.trim() || sourceInput.trim();

  if (!primary) {
    return prefix;
  }

  return `${prefix} · ${primary.slice(0, 24)}`;
}

export function ChineseAnalysisStudio({ mode }: { mode: ChineseAnalysisMode }) {
  const { profile } = useAuth();
  const preset = presets[mode];
  const sessionIdRef = useRef(`study_chinese_${mode}_${Date.now()}`);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [sourceInput, setSourceInput] = useState('');
  const [questionInput, setQuestionInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [followUpInput, setFollowUpInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [assetId, setAssetId] = useState<string | null>(null);
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);

  const latestAssistantMessage = useMemo(() => {
    return [...messages]
      .reverse()
      .find((message) => message.role === 'assistant' && message.content.trim().length > 0) || null;
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  async function persistTurn(userMessage: string, assistantContent: string) {
    if (!profile?.id) {
      return;
    }

    try {
      const nextAssetId = await saveStudyAssetTurn({
        assetId,
        studentId: profile.id,
        subject: 'chinese',
        module: mode,
        inputType: 'text',
        questionType: preset.questionType,
        title: buildChineseAnalysisTitle(mode, sourceInput, questionInput),
        summary: buildStudyAssetSummary(assistantContent),
        payload: {
          mode,
          sourceInput,
          questionInput,
          answerInput,
          resultSummary: buildStudyResultSummaryPayload(mode, assistantContent),
        },
        messages: [
          {
            role: 'user',
            content: userMessage,
            message_key: createStudyAssetMessageKey(`${sessionIdRef.current}_user`),
          },
          {
            role: 'assistant',
            content: assistantContent,
            message_key: createStudyAssetMessageKey(`${sessionIdRef.current}_assistant`),
          },
        ],
      });

      if (!assetId) {
        setAssetId(nextAssetId);
      }
      setHistoryRefreshToken((current) => current + 1);
    } catch (error) {
      console.error('[ChineseAnalysisStudio] Failed to save study asset:', error);
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
          sessionId: sessionIdRef.current,
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
          '当前语文分析工作台请求失败了。可以稍后重试，或先回到录题分析主链继续使用稳定流程。',
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
    sessionIdRef.current = `study_chinese_${mode}_${Date.now()}`;
    setAssetId(null);
    setMessages([]);
    setFollowUpInput('');
    setNotice('');
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
      <Card className="rounded-[28px] border-slate-200 bg-white/90 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-medium', preset.badgeClass)}>
                {preset.badge}
              </div>
              <CardTitle className="mt-3 text-xl text-slate-900">{preset.title}</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                {preset.description}
              </CardDescription>
            </div>
            <div className="hidden rounded-2xl bg-slate-50 p-3 text-slate-500 sm:block">
              {mode === 'reading' ? <BookOpen className="h-5 w-5" /> : <FileSearch className="h-5 w-5" />}
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
              当前适合这样用
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
              <CardTitle className="text-xl text-slate-900">语文分析工作区</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                当前先把阅读和基础知识拆成独立工作台，再逐步回收进统一学习资产与复习系统。
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

        <CardContent className="flex min-h-[680px] flex-col px-5 pb-5 pt-5">
          {latestAssistantMessage ? (
            <div className="mb-4">
              <StudyResultSummary
                module={mode}
                content={latestAssistantMessage.content}
                title="本轮结果摘要"
                description={
                  mode === 'reading'
                    ? '把最近一次阅读分析提炼成更好扫读的结果卡，先用于当前工作台和学习记录详情页。'
                    : '把最近一次基础知识分析提炼成更好扫读的结果卡，先用于当前工作台和学习记录详情页。'
                }
              />
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
              placeholder={mode === 'reading'
                ? '例如：把第二问的答案写成 3 个得分点，或者告诉我这句原文为什么能做依据。'
                : '例如：把这个病句错因再讲简单一点，或者帮我总结一条辨析口诀。'}
              className="mt-3 min-h-[96px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                `Enter` 发送，`Shift + Enter` 换行。
              </p>
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
            <p className="mt-2">
              这两个语文工作台优先解决“阅读题和基础知识题能在学科模块里直接拆解”的问题。更深的历史沉淀、
              错题回流和统一 StudySession 仍放在后续阶段继续收口。
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="xl:col-span-2">
        <StudyAssetHistory
          subject="chinese"
          module={mode}
          refreshToken={historyRefreshToken}
          title="当前模块学习记录"
          description="阅读理解和基础知识工作台会先把最近分析记录沉淀到统一索引层。"
          emptyText="当前模块还没有学习记录。先完成一轮分析，这里会自动出现最近记录。"
        />
      </div>
    </section>
  );
}
