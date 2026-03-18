'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Headphones,
  MessageSquareText,
  RefreshCw,
  Sparkles,
  Waves,
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
  buildStudyAssetSummary,
  buildStudyAssetPayloadWithSummary,
} from '@/lib/study/assets-v2';

interface ListeningAction {
  id: string;
  label: string;
  prompt: string;
}

const actions: ListeningAction[] = [
  {
    id: 'listening-main-idea',
    label: '场景主旨',
    prompt: '先判断这段听力的场景、人物关系、任务目标和核心主旨。',
  },
  {
    id: 'listening-answer-locate',
    label: '答案定位',
    prompt: '请结合题目定位答案依据，指出关键词和容易忽略的转折信息。',
  },
  {
    id: 'listening-mistakes',
    label: '错因分析',
    prompt: '请结合我的答案或常见误区，分析最容易听错、误判或漏听的地方。',
  },
  {
    id: 'listening-repractice',
    label: '复练建议',
    prompt: '请给我一轮复练方案，包括该再听哪几句、该记哪些表达、下次怎么更快抓重点。',
  },
];

function createMessage(role: Message['role'], content: string): Message {
  return {
    id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: new Date(),
  };
}

function buildQuestionContent(
  transcriptInput: string,
  questionInput: string,
  answerInput: string,
  noteInput: string,
) {
  return [
    transcriptInput.trim() ? `听力原文或转写稿：\n${transcriptInput.trim()}` : '',
    questionInput.trim() ? `题目：\n${questionInput.trim()}` : '',
    answerInput.trim() ? `我的答案或当前判断：\n${answerInput.trim()}` : '',
    noteInput.trim() ? `补充信息：\n${noteInput.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function buildInitialPrompt(
  action: ListeningAction,
  transcriptInput: string,
  questionInput: string,
  answerInput: string,
  noteInput: string,
) {
  const transcript = transcriptInput.trim();
  const question = questionInput.trim();
  const answer = answerInput.trim();
  const note = noteInput.trim();

  return [
    '请作为英语听力老师，用中文讲解，并在必要时保留英文原句，帮助我拆解这道英语听力题。',
    `听力原文、转写稿或老师口述要点：\n${transcript}`,
    question ? `题目：\n${question}` : '',
    answer ? `我的答案或当前判断：\n${answer}` : '',
    note ? `补充信息：\n${note}` : '',
    `本次重点：${action.prompt}`,
    '请按“场景与主旨、关键词与信号词、答案定位、易错点、该再听哪一部分、下次怎么更快抓重点”输出。',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function getValidationMessage(transcriptInput: string) {
  if (!transcriptInput.trim()) {
    return '先贴听力原文、转写稿或老师口述要点。';
  }

  return '';
}

function buildListeningTitle(transcriptInput: string, questionInput: string) {
  const primary = questionInput.trim() || transcriptInput.trim();
  if (!primary) {
    return '英语听力';
  }

  return `英语听力 · ${primary.slice(0, 24)}`;
}

export function EnglishListeningStudioV2() {
  const { profile } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);
  const {
    assetId,
    getSessionId,
    historyRefreshToken,
    persistTurn: persistStudyAssetTurn,
    resetSession,
  } = useStudyAssetSession({
    sessionKey: 'study_english_listening',
  });

  const [transcriptInput, setTranscriptInput] = useState('');
  const [questionInput, setQuestionInput] = useState('');
  const [answerInput, setAnswerInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [followUpInput, setFollowUpInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notice, setNotice] = useState('');

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
        subject: 'english',
        module: 'listening',
        inputType: 'transcript',
        questionType: 'listening',
        title: buildListeningTitle(transcriptInput, questionInput),
        summary: buildStudyAssetSummary(assistantContent),
        payload: buildStudyAssetPayloadWithSummary({
          transcriptInput,
          questionInput,
          answerInput,
          noteInput,
        }, 'listening', assistantContent),
        userMessage,
        assistantContent,
      });
    } catch (error) {
      console.error('[EnglishListeningStudioV2] Failed to save study asset:', error);
    }
  }

  async function sendToChatApi(userMessage: string) {
    const questionContent = buildQuestionContent(
      transcriptInput,
      questionInput,
      answerInput,
      noteInput,
    );
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
          subject: 'english',
          userLevel: 'premium',
          subjectConfidence: 1,
          questionContent,
          questionType: 'listening',
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
          '当前英语听力工作台请求失败了。可以稍后重试，或先保留转写稿继续使用其它学习模块。',
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAction(action: ListeningAction) {
    const validationMessage = getValidationMessage(transcriptInput);
    if (validationMessage) {
      setNotice(validationMessage);
      return;
    }

    await sendToChatApi(
      buildInitialPrompt(action, transcriptInput, questionInput, answerInput, noteInput),
    );
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
  }

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
      <Card className="rounded-[28px] border-slate-200 bg-white/90 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                英语听力轻量版
              </div>
              <CardTitle className="mt-3 text-xl text-slate-900">英语听力拆解工作台</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                先用听力原文、转写稿或老师口述要点完成题目拆解、答案定位和复练建议，不直接引入新的音频上传链路。
              </CardDescription>
            </div>
            <div className="hidden rounded-2xl bg-slate-50 p-3 text-slate-500 sm:block">
              <Headphones className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <label className="text-sm font-medium text-slate-900">听力原文 / 转写稿 / 口述要点</label>
            <textarea
              value={transcriptInput}
              onChange={(event) => setTranscriptInput(event.target.value)}
              placeholder="例如：Woman: Why are you late again? Man: Sorry, the bus broke down halfway..."
              className="mt-2 min-h-[176px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <label className="text-sm font-medium text-slate-900">题目 / 小问（可选）</label>
            <textarea
              value={questionInput}
              onChange={(event) => setQuestionInput(event.target.value)}
              placeholder="例如：What does the man mean? / Why was the man late?"
              className="mt-2 min-h-[96px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <label className="text-sm font-medium text-slate-900">你的答案 / 当前判断（可选）</label>
            <textarea
              value={answerInput}
              onChange={(event) => setAnswerInput(event.target.value)}
              placeholder="例如：我选 C，但不确定 because 和 although 后面那句是不是转折。"
              className="mt-2 min-h-[96px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <label className="text-sm font-medium text-slate-900">补充信息（可选）</label>
            <textarea
              value={noteInput}
              onChange={(event) => setNoteInput(event.target.value)}
              placeholder="例如：这是七年级期中听力；老师要求我顺便记固定搭配；原音里语速很快。"
              className="mt-2 min-h-[88px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <Sparkles className="h-4 w-4 text-sky-600" />
              快捷动作
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {actions.map((action) => (
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
              <CheckCircle2 className="h-4 w-4 text-sky-600" />
              当前更适合这样用
            </div>
            <div className="mt-3 space-y-2">
              {[
                '先用转写稿或老师口述内容验证听力分析链路是否可用，再决定是否补音频输入。',
                '如果有题干和自己的答案，一起贴上来，系统更容易定位失分原因。',
                '这一版先做“拆解 + 复练建议”，不直接改写旧录题和错题主链。',
              ].map((tip) => (
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
              <CardTitle className="text-xl text-slate-900">听力结果工作区</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                这一阶段先把英语从“只有录题和写作”推进到“有独立听力工作台可直接使用”。
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
              <StudyResultSummaryV2
                module="listening"
                content={latestAssistantMessage.content}
                title="本轮结果摘要"
                description="把最近一次听力回复整理成结构化结果卡，方便快速回看主旨、定位和复练重点。"
              />

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
              <MessageSquareText className="h-4 w-4 text-sky-600" />
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
              placeholder="例如：把关键转折句再解释一遍，或者给我一轮二刷这段听力的步骤。"
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

          <div className="mt-4 rounded-[24px] border border-sky-200 bg-sky-50/80 p-4 text-sm leading-6 text-slate-700">
            <div className="flex items-center gap-2 font-medium text-slate-900">
              <Waves className="h-4 w-4 text-sky-600" />
              当前阶段说明
            </div>
            <p className="mt-2">
              这个模块先不做新的音频上传、播放器和转写链路，而是先把“听力题能被拆解、能定位答案、能复盘错因”的工作台建起来。等这条主链稳定，再决定是否补音频输入和复练播放器。
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="xl:col-span-2">
        <StudyAssetHistory
          subject="english"
          module="listening"
          refreshToken={historyRefreshToken}
          title="当前模块学习记录"
          description="英语听力轻量版会先沉淀转写稿驱动的分析记录，后续再决定是否补音频链路。"
          emptyText="当前模块还没有学习记录。先完成一轮听力分析，这里会自动出现最近记录。"
        />
      </div>
    </section>
  );
}
