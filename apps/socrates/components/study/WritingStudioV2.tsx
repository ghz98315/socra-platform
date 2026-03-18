'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Languages,
  Lightbulb,
  MessageSquareText,
  RefreshCw,
  Sparkles,
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
import { cn } from '@/lib/utils';

type WritingStudioSubject = 'chinese' | 'english';
type WritingStudioMode = 'idea' | 'review';

interface WritingStudioAction {
  id: string;
  label: string;
  prompt: string;
}

interface WritingStudioPreset {
  badge: string;
  title: string;
  description: string;
  taskLabel: string;
  taskPlaceholder: string;
  draftLabel: string;
  draftPlaceholder: string;
  tips: string[];
  actions: WritingStudioAction[];
  accentClass: string;
  badgeClass: string;
}

interface WritingStudioV2Props {
  subject: WritingStudioSubject;
  mode: WritingStudioMode;
}

const presets: Record<WritingStudioSubject, Record<WritingStudioMode, WritingStudioPreset>> = {
  chinese: {
    idea: {
      badge: '语文写作思路',
      title: '作文审题与立意工作台',
      description: '围绕题目快速生成立意方向、结构框架、素材建议和开头切入点。',
      taskLabel: '作文题目 / 写作任务',
      taskPlaceholder: '例如：以“那一刻，我真正长大了”为题，写一篇记叙文。',
      draftLabel: '补充要求（可选）',
      draftPlaceholder: '例如：年级、字数、文体、老师特别要求、你目前卡住的点。',
      tips: [
        '先把题目和限制条件写清楚，再点下面的快捷动作。',
        '如果已经有想法，可以在补充要求里说明你想写的人物、事件或立意。',
        '这一版优先服务“起稿前”的构思阶段，不会覆盖数学或错题主链。',
      ],
      actions: [
        {
          id: 'idea-review',
          label: '审题立意',
          prompt: '先帮我拆题，判断写作任务、核心立意和容易跑题的风险。',
        },
        {
          id: 'idea-outline',
          label: '文章结构',
          prompt: '请给我一版清晰可写的文章结构，并说明每一段该写什么。',
        },
        {
          id: 'idea-materials',
          label: '素材建议',
          prompt: '请结合题目推荐可用素材、细节和情感转折点。',
        },
        {
          id: 'idea-opening',
          label: '开头结尾',
          prompt: '请给我开头切入和结尾收束的写法建议。',
        },
      ],
      accentClass: 'text-red-600',
      badgeClass: 'bg-red-100 text-red-700',
    },
    review: {
      badge: '语文作文预批改',
      title: '作文草稿快速预批改',
      description: '先在 Socrates 内做一轮语文作文预审，再决定是否进入 Essay 工作台做深度批改。',
      taskLabel: '作文题目 / 写作任务（可选）',
      taskPlaceholder: '例如：命题作文、材料作文题目，或老师给出的写作要求。',
      draftLabel: '作文草稿',
      draftPlaceholder: '把你的作文草稿直接粘贴到这里，支持分段输入。',
      tips: [
        '这里适合先做总评、跑题风险和结构问题排查。',
        '如果要做更完整的批注、历史沉淀和报告资产，仍然建议继续进入 Essay。',
        '这一版先做“预批改闭环”，不替代既有 Essay 主工作台。',
      ],
      actions: [
        {
          id: 'review-overall',
          label: '总评定位',
          prompt: '请先给我整体评价，判断立意、结构和表达最需要优先改哪一块。',
        },
        {
          id: 'review-structure',
          label: '结构问题',
          prompt: '请重点检查段落层次、叙事推进和首尾呼应是否成立。',
        },
        {
          id: 'review-language',
          label: '语言表达',
          prompt: '请重点指出语言表达、病句和重复啰嗦的问题，并给替换建议。',
        },
        {
          id: 'review-upgrade',
          label: '提分改写',
          prompt: '请给我一轮可直接套用的提分改写建议和下一稿修改顺序。',
        },
      ],
      accentClass: 'text-red-600',
      badgeClass: 'bg-red-100 text-red-700',
    },
  },
  english: {
    idea: {
      badge: '英语写作思路',
      title: '英语写作提纲工作台',
      description: '围绕英语作文题快速判断文体、时态、人称和段落提纲，并给出可直接套用的表达。',
      taskLabel: '英文写作题目 / 任务',
      taskPlaceholder:
        '例如：假如你是李华，请写一封邮件邀请交换生参加校园科技节。',
      draftLabel: '补充要求（可选）',
      draftPlaceholder: '例如：考试类型、字数、你最担心的语法点、想突出的人设或观点。',
      tips: [
        '优先把任务场景、收件人、体裁和字数写清楚。',
        '如果想先要提纲，再要高级句型，可以分两次点不同快捷动作。',
        '英语模块这一步先做写作主链，听力入口已经拆到独立工作台。',
      ],
      actions: [
        {
          id: 'english-brief',
          label: '审题与时态',
          prompt: '请先判断这道英语写作题的文体、时态、人称和容易失分的地方。',
        },
        {
          id: 'english-outline',
          label: '段落提纲',
          prompt: '请给我一版三段或四段提纲，并说明每段该写哪些要点。',
        },
        {
          id: 'english-phrases',
          label: '高分表达',
          prompt: '请给我可直接套用的高级句型、连接词和关键词组。',
        },
        {
          id: 'english-opening',
          label: '首段起笔',
          prompt: '请帮我写开头切入思路，并给 2 到 3 个可改写的英文起句。',
        },
      ],
      accentClass: 'text-violet-600',
      badgeClass: 'bg-violet-100 text-violet-700',
    },
    review: {
      badge: '英语作文批改',
      title: '英语作文批改工作台',
      description: '检查语法、拼写、表达自然度和篇章衔接，并给出可直接替换的升级句。',
      taskLabel: '英文写作题目 / 任务（可选）',
      taskPlaceholder: '例如：书信、通知、图表作文或短文写作任务。',
      draftLabel: '英语作文草稿',
      draftPlaceholder: '把英文作文正文粘贴到这里，建议保留原段落。',
      tips: [
        '如果题目也一起填写，批改会更容易判断是否跑题。',
        '这一版优先做语法纠错、表达升级和结构反馈。',
        '后续会再补齐英语听力以及更细的英语专题结果页。',
      ],
      actions: [
        {
          id: 'english-check',
          label: '语法纠错',
          prompt: '请重点找出语法、拼写和基础表达错误，并逐类说明。',
        },
        {
          id: 'english-upgrade',
          label: '表达升级',
          prompt: '请给我表达升级建议，把句子改得更自然、更像高分作文。',
        },
        {
          id: 'english-flow',
          label: '结构衔接',
          prompt: '请重点检查段落组织、逻辑衔接和首尾完整性。',
        },
        {
          id: 'english-rewrite',
          label: '改写示例',
          prompt: '请给我一段示范改写，并列出下一稿修改清单。',
        },
      ],
      accentClass: 'text-violet-600',
      badgeClass: 'bg-violet-100 text-violet-700',
    },
  },
};

function buildQuestionContent(taskInput: string, draftInput: string) {
  return draftInput.trim() || taskInput.trim();
}

function buildInitialPrompt(
  subject: WritingStudioSubject,
  mode: WritingStudioMode,
  action: WritingStudioAction,
  taskInput: string,
  draftInput: string,
) {
  const task = taskInput.trim();
  const draft = draftInput.trim();

  if (subject === 'chinese' && mode === 'idea') {
    return [
      '请作为语文写作教练，帮助我完成作文写前规划。',
      `作文题目或任务：\n${task}`,
      draft ? `补充要求：\n${draft}` : '',
      `本次重点：${action.prompt}`,
      '请按“审题要点、立意方向、文章结构、可用素材、开头建议、容易跑题点、下一步先写什么”输出。',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  if (subject === 'chinese' && mode === 'review') {
    return [
      '请作为语文作文老师，先对这篇作文做一轮预批改。',
      task ? `作文题目或任务：\n${task}` : '',
      `作文草稿：\n${draft}`,
      `本次重点：${action.prompt}`,
      '请按“整体评价、亮点、立意与跑题风险、结构问题、语言表达问题、可直接替换的改写建议、下一稿修改顺序”输出。',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  if (subject === 'english' && mode === 'idea') {
    return [
      '请作为英语写作教练，用中文讲解并在必要处给英文示例，帮助我完成写前准备。',
      `写作任务：\n${task}`,
      draft ? `补充要求：\n${draft}` : '',
      `本次重点：${action.prompt}`,
      '请按“文体判断、时态与人称建议、段落提纲、可直接套用的英文表达、连接词建议、容易失分点、下一步先写哪一段”输出。',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  return [
    '请作为英语作文批改老师，用中文解释问题，并给出必要的英文修改示例。',
    task ? `写作任务：\n${task}` : '',
    `作文草稿：\n${draft}`,
    `本次重点：${action.prompt}`,
    '请按“整体评价、语法与拼写问题、表达升级建议、结构衔接建议、可直接替换的高分句、示范改写、下一稿修改清单”输出。',
  ]
    .filter(Boolean)
    .join('\n\n');
}

function getValidationMessage(mode: WritingStudioMode, taskInput: string, draftInput: string) {
  if (mode === 'idea' && !taskInput.trim()) {
    return '先填写作文题目或写作任务。';
  }

  if (mode === 'review' && !draftInput.trim()) {
    return '先粘贴作文草稿，再开始批改。';
  }

  return '';
}

function createMessage(role: Message['role'], content: string): Message {
  return {
    id: `${role}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    timestamp: new Date(),
  };
}

function getWritingModule(subject: WritingStudioSubject, mode: WritingStudioMode) {
  if (subject === 'chinese' && mode === 'idea') return 'composition-idea';
  if (subject === 'chinese' && mode === 'review') return 'composition-review';
  if (subject === 'english' && mode === 'idea') return 'writing-idea';
  return 'writing-review';
}

function buildWritingTitle(
  subject: WritingStudioSubject,
  mode: WritingStudioMode,
  taskInput: string,
  draftInput: string,
) {
  const primary = taskInput.trim() || draftInput.trim();
  const prefix =
    subject === 'chinese'
      ? mode === 'idea'
        ? '语文写作思路'
        : '语文作文批改'
      : mode === 'idea'
        ? '英语写作思路'
        : '英语作文批改';

  if (!primary) {
    return prefix;
  }

  return `${prefix} · ${primary.slice(0, 24)}`;
}

export function WritingStudioV2({ subject, mode }: WritingStudioV2Props) {
  const { profile } = useAuth();
  const preset = presets[subject][mode];
  const bottomRef = useRef<HTMLDivElement>(null);
  const {
    assetId,
    getSessionId,
    historyRefreshToken,
    persistTurn: persistStudyAssetTurn,
    resetSession,
  } = useStudyAssetSession({
    sessionKey: `study_${subject}_${mode}`,
  });

  const [taskInput, setTaskInput] = useState('');
  const [draftInput, setDraftInput] = useState('');
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
        subject,
        module: getWritingModule(subject, mode),
        inputType: 'text',
        questionType: 'writing',
        title: buildWritingTitle(subject, mode, taskInput, draftInput),
        summary: buildStudyAssetSummary(assistantContent),
        payload: buildStudyAssetPayloadWithSummary({
          subject,
          mode,
          taskInput,
          draftInput,
        }, getWritingModule(subject, mode), assistantContent),
        userMessage,
        assistantContent,
      });
    } catch (error) {
      console.error('[WritingStudioV2] Failed to save study asset:', error);
    }
  }

  async function sendToChatApi(userMessage: string) {
    const questionContent = buildQuestionContent(taskInput, draftInput);
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
          subject,
          userLevel: 'premium',
          subjectConfidence: 1,
          questionContent,
          questionType: 'writing',
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
          '当前写作工作台请求失败了。可以稍后重试，或先保留题目和草稿继续使用现有稳定链路。',
        ),
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAction(action: WritingStudioAction) {
    const validationMessage = getValidationMessage(mode, taskInput, draftInput);
    if (validationMessage) {
      setNotice(validationMessage);
      return;
    }

    await sendToChatApi(buildInitialPrompt(subject, mode, action, taskInput, draftInput));
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

  const resultDescription =
    subject === 'english'
      ? mode === 'idea'
        ? '把最近一次英语写作思路整理成结构化结果卡，方便快速回看文体判断、提纲和表达。'
        : '把最近一次英语作文批改整理成结果卡，方便回看语法问题、结构反馈和改写建议。'
      : mode === 'idea'
        ? '把最近一次语文写作思路整理成结构化结果卡，方便回看立意、结构和素材建议。'
        : '把最近一次语文作文预批改整理成结果卡，方便回看总评、结构和语言问题。';

  const stageCopy =
    subject === 'english'
      ? '这条写作工作台先解决“能直接输入并得到模块化结果”的问题，更深的历史沉淀、报告资产和统一 StudySession 仍放在后续阶段继续收口。'
      : '这条语文写作工作台先解决“审题、构思、预批改可直接在模块内完成”的问题，Essay 深度工作台仍继续保留。';

  return (
    <section className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
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
              {subject === 'english' ? (
                <Languages className="h-5 w-5" />
              ) : (
                <Lightbulb className="h-5 w-5" />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <label className="text-sm font-medium text-slate-900">{preset.taskLabel}</label>
            <textarea
              value={taskInput}
              onChange={(event) => setTaskInput(event.target.value)}
              placeholder={preset.taskPlaceholder}
              className="mt-2 min-h-[112px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/70 p-4">
            <label className="text-sm font-medium text-slate-900">{preset.draftLabel}</label>
            <textarea
              value={draftInput}
              onChange={(event) => setDraftInput(event.target.value)}
              placeholder={preset.draftPlaceholder}
              className="mt-2 min-h-[176px] w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 outline-none transition focus:border-slate-300 focus:ring-2 focus:ring-slate-200"
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
              <CardTitle className="text-xl text-slate-900">写作结果工作区</CardTitle>
              <CardDescription className="mt-2 text-sm leading-6 text-slate-600">
                这一轮先做模块内可用版本，保持现有错题、复习和 Essay 主链不受影响。
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

        <CardContent className="flex min-h-[640px] flex-col px-5 pb-5 pt-5">
          {latestAssistantMessage ? (
            <div className="mb-4">
              <StudyResultSummaryV2
                module={getWritingModule(subject, mode)}
                content={latestAssistantMessage.content}
                title="本轮结果摘要"
                description={resultDescription}
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
              placeholder="例如：把第二段再展开一点，或者给我 3 句可以直接写进正文的话。"
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

          <div className="mt-4 rounded-[24px] border border-blue-200 bg-blue-50/80 p-4 text-sm leading-6 text-slate-700">
            <div className="flex items-center gap-2 font-medium text-slate-900">
              <FileText className="h-4 w-4 text-blue-600" />
              当前阶段说明
            </div>
            <p className="mt-2">{stageCopy}</p>
          </div>
        </CardContent>
      </Card>

      <div className="xl:col-span-2">
        <StudyAssetHistory
          subject={subject}
          module={getWritingModule(subject, mode)}
          refreshToken={historyRefreshToken}
          title="当前模块学习记录"
          description="这里先沉淀新工作台的学习记录，后续再继续并入统一学习资产中心。"
          emptyText="当前模块还没有学习记录。先完成一轮分析，这里会自动出现最近记录。"
        />
      </div>
    </section>
  );
}
