'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { PageHeader, StatCard, StatsRow } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  Flame,
  Loader2,
  RotateCcw,
  Shield,
  Sparkles,
  Target,
} from 'lucide-react';
import {
  buildConversationRiskInterventionTaskDraft,
  type ConversationRiskCategory,
} from '@/lib/error-loop/conversation-risk';

type StudentInfo = {
  id: string;
  display_name: string | null;
  grade_level: number | null;
};

type RootCauseItem = {
  category: string;
  label: string;
  subtype: string | null;
  subtype_label: string | null;
  count: number;
  recent_count: number;
  reopened_count: number;
  pseudo_mastery_count: number;
  pending_count: number;
  heat_score: number;
  heat_level: 'high' | 'medium' | 'low';
  sample_root_statements: string[];
  playbook: {
    title: string;
    summary: string;
    actions: string[];
    watchFors: string[];
  };
};

type HotspotItem = {
  tag: string;
  count: number;
  recent_count: number;
  reopened_count: number;
  pseudo_mastery_count: number;
  pending_count: number;
  heat_score: number;
  heat_level: 'high' | 'medium' | 'low';
  sample_root_statements: string[];
};

type RecentRiskItem = {
  session_id: string;
  title: string;
  excerpt: string;
  root_cause_label: string;
  root_cause_subtype_label: string | null;
  root_cause_display_label: string;
  root_cause_statement: string | null;
  mastery_judgement: string | null;
  reopened_count: number;
  next_review_at: string | null;
  risk_score: number;
  created_at: string;
};

type ConversationAlertItem = {
  session_id: string;
  message_id: string;
  created_at: string;
  category: ConversationRiskCategory;
  severity: 'low' | 'medium' | 'high';
  score: number;
  title: string;
  summary: string;
  message_excerpt: string;
  question_excerpt: string;
  root_cause_label: string | null;
  root_cause_subtype_label: string | null;
  root_cause_display_label: string | null;
  root_cause_statement: string | null;
  parent_opening: string;
  parent_actions: string[];
  intervention_task_id: string | null;
  intervention_status: string | null;
  intervention_feedback_note: string | null;
  intervention_completed_at: string | null;
  intervention_effect: 'pending' | 'risk_lowered' | 'risk_persisting' | null;
  post_intervention_repeat_count: number;
};

type ParentActionItem = {
  title: string;
  summary: string;
  priority: 'high' | 'medium' | 'low';
  actions?: string[];
  watch_fors?: string[];
};

type InsightResponse = {
  students: StudentInfo[];
  selected_student: StudentInfo | null;
  subject: string;
  summary: {
    total_errors: number;
    open_errors: number;
    pending_review_count: number;
    overdue_review_count: number;
    mastered_closed_count: number;
    provisional_mastered_count: number;
    pseudo_mastery_count: number;
    reopened_total: number;
  };
  root_cause_heatmap: RootCauseItem[];
  knowledge_hotspots: HotspotItem[];
  habit_hotspots: HotspotItem[];
  recent_risks: RecentRiskItem[];
  conversation_alerts: ConversationAlertItem[];
  intervention_summary: {
    total: number;
    pending: number;
    completed: number;
    risk_lowered: number;
    risk_persisting: number;
    conversation_total: number;
    review_total: number;
    review_pending: number;
  };
  intervention_outcomes: Array<{
    task_id: string;
    session_id: string;
    category: string;
    task_type: 'conversation_intervention' | 'review_intervention';
    task_type_label: string;
    title: string;
    status: string;
    feedback_note: string | null;
    completed_at: string | null;
    updated_at: string | null;
    effect: 'pending' | 'risk_lowered' | 'risk_persisting';
    post_intervention_repeat_count: number;
    root_cause_display_label: string | null;
    root_cause_statement: string | null;
  }>;
  parent_actions: ParentActionItem[];
  scoring_model: {
    countWeight: number;
    recentWeight: number;
    reopenedWeight: number;
    pseudoMasteryWeight: number;
    pendingWeight: number;
    explanation: string;
  };
};

type TeenModeState = {
  enabled: boolean;
  dailyTimeLimit: number;
  restReminderInterval: number;
};

const DEFAULT_TEEN_MODE: TeenModeState = {
  enabled: false,
  dailyTimeLimit: 120,
  restReminderInterval: 45,
};

function formatDateTime(value: string | null) {
  if (!value) {
    return '未设置';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '未设置';
  }

  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function priorityBadge(priority: ParentActionItem['priority']) {
  switch (priority) {
    case 'high':
      return 'bg-red-100 text-red-700';
    case 'medium':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function heatBadge(level: RootCauseItem['heat_level'] | HotspotItem['heat_level']) {
  switch (level) {
    case 'high':
      return 'bg-red-100 text-red-700';
    case 'medium':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-emerald-100 text-emerald-700';
  }
}

function severityBadge(level: ConversationAlertItem['severity']) {
  switch (level) {
    case 'high':
      return 'bg-red-100 text-red-700';
    case 'medium':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function interventionEffectBadge(effect: ConversationAlertItem['intervention_effect']) {
  switch (effect) {
    case 'risk_lowered':
      return 'bg-emerald-100 text-emerald-700';
    case 'risk_persisting':
      return 'bg-red-100 text-red-700';
    case 'pending':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-100 text-slate-700';
  }
}

function interventionEffectLabel(effect: ConversationAlertItem['intervention_effect']) {
  switch (effect) {
    case 'risk_lowered':
      return '风险暂时下降';
    case 'risk_persisting':
      return '风险仍在重复';
    case 'pending':
      return '待反馈';
    default:
      return '未开始';
  }
}

function interventionStatusLabel(status: string | null) {
  switch (status) {
    case 'completed':
      return '已沟通';
    case 'in_progress':
      return '进行中';
    case 'pending':
      return '待执行';
    default:
      return '未建任务';
  }
}

function getInterventionTaskKey(item: { session_id: string; category: string }) {
  return `${item.session_id}:${item.category}`;
}

export default function ParentInsightControlPage() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const [insights, setInsights] = useState<InsightResponse | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [teenMode, setTeenMode] = useState<TeenModeState>(DEFAULT_TEEN_MODE);
  const [loading, setLoading] = useState(true);
  const [savingTeenMode, setSavingTeenMode] = useState(false);
  const [creatingTaskKeys, setCreatingTaskKeys] = useState<string[]>([]);
  const [createdTaskKeys, setCreatedTaskKeys] = useState<string[]>([]);
  const [interventionTaskSummary, setInterventionTaskSummary] = useState({
    total: 0,
    pending: 0,
    review_total: 0,
  });
  const [savingFeedbackKeys, setSavingFeedbackKeys] = useState<string[]>([]);
  const [interventionNotes, setInterventionNotes] = useState<Record<string, string>>({});
  const [insightReloadToken, setInsightReloadToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const conversationSectionRef = useRef<HTMLDivElement | null>(null);
  const reviewSectionRef = useRef<HTMLDivElement | null>(null);

  const focusStudentId = searchParams.get('student_id');
  const focusSessionId = searchParams.get('session_id');
  const focusRiskCategory = searchParams.get('risk_category');
  const focusSection = searchParams.get('focus');

  useEffect(() => {
    if (focusStudentId) {
      setSelectedChildId(focusStudentId);
    }
  }, [focusStudentId]);

  useEffect(() => {
    let cancelled = false;

    async function loadInsights() {
      if (!profile?.id) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (selectedChildId) {
          params.set('student_id', selectedChildId);
        }
        params.set('subject', 'math');

        const response = await fetch(`/api/parent/insights?${params.toString()}`);
        const payload = (await response.json()) as InsightResponse & { error?: string };

        if (!response.ok) {
          throw new Error(payload.error || '加载家长洞察失败');
        }

        if (cancelled) {
          return;
        }

        setInsights(payload);
        setSelectedChildId((current) => current ?? payload.selected_student?.id ?? null);
      } catch (loadError) {
        if (cancelled) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : '加载家长洞察失败');
        setInsights(null);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadInsights();

    return () => {
      cancelled = true;
    };
  }, [insightReloadToken, profile?.id, selectedChildId]);

  useEffect(() => {
    let cancelled = false;

    async function loadTeenMode() {
      if (!selectedChildId) {
        setTeenMode(DEFAULT_TEEN_MODE);
        return;
      }

      try {
        const response = await fetch(`/api/teen-mode?user_id=${selectedChildId}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || '加载陪学节奏设置失败');
        }

        if (cancelled) {
          return;
        }

        setTeenMode({
          enabled: payload.enabled ?? false,
          dailyTimeLimit: payload.settings?.dailyTimeLimit ?? DEFAULT_TEEN_MODE.dailyTimeLimit,
          restReminderInterval:
            payload.settings?.restReminderInterval ?? DEFAULT_TEEN_MODE.restReminderInterval,
        });
      } catch (loadError) {
        if (!cancelled) {
          console.error('[ParentInsightControlPage] Failed to load teen mode:', loadError);
          setTeenMode(DEFAULT_TEEN_MODE);
        }
      }
    }

    loadTeenMode();

    return () => {
      cancelled = true;
    };
  }, [selectedChildId]);

  useEffect(() => {
    let cancelled = false;

    async function loadExistingInterventionTasks() {
      if (!selectedChildId || !profile?.id) {
        setCreatedTaskKeys([]);
        setInterventionTaskSummary({ total: 0, pending: 0, review_total: 0 });
        return;
      }

      try {
        const response = await fetch(`/api/parent-tasks?parent_id=${profile.id}`);
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || '加载家长任务失败');
        }

        if (cancelled) {
          return;
        }

        const interventionTasks = (payload.tasks || []).filter(
          (task: { child_id?: string; description?: string | null; task_type?: string | null }) =>
            task.child_id === selectedChildId &&
            ((task.description || '').includes('[conversation-risk:') || task.task_type === 'review_intervention'),
        );

        const taskKeys = interventionTasks
          .map((task: { description?: string | null }) => {
            const description = task.description || '';
            const sessionMatch = description.match(/\[conversation-session:([^\]]+)\]/);
            const categoryMatch = description.match(/\[conversation-risk:([^\]]+)\]/);
            if (!sessionMatch || !categoryMatch) {
              return null;
            }

            return `${sessionMatch[1]}:${categoryMatch[1]}`;
          })
          .filter(Boolean) as string[];

        setCreatedTaskKeys(taskKeys);
        setInterventionTaskSummary({
          total: interventionTasks.length,
          pending: interventionTasks.filter((task: { status?: string }) => task.status !== 'completed').length,
          review_total: interventionTasks.filter(
            (task: { task_type?: string | null }) => task.task_type === 'review_intervention',
          ).length,
        });
      } catch (loadError) {
        if (!cancelled) {
          console.error('[ParentInsightControlPage] Failed to load existing intervention tasks:', loadError);
        }
      }
    }

    loadExistingInterventionTasks();

    return () => {
      cancelled = true;
    };
  }, [insightReloadToken, profile?.id, selectedChildId]);

  useEffect(() => {
    if (!insights?.conversation_alerts.length) {
      return;
    }

    setInterventionNotes((current) => {
      const next = { ...current };

      for (const item of insights.conversation_alerts) {
        const taskKey = getInterventionTaskKey(item);
        if (item.intervention_feedback_note && !next[taskKey]) {
          next[taskKey] = item.intervention_feedback_note;
        }
      }

      return next;
    });
  }, [insights?.conversation_alerts]);

  useEffect(() => {
    if (
      loading ||
      focusSection !== 'conversation' ||
      !focusSessionId ||
      !conversationSectionRef.current ||
      (focusStudentId && selectedChildId !== focusStudentId)
    ) {
      return;
    }

    const target = insights?.conversation_alerts.find(
      (item) =>
        item.session_id === focusSessionId &&
        (!focusRiskCategory || item.category === focusRiskCategory),
    );

    if (!target) {
      return;
    }

    conversationSectionRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [
    focusRiskCategory,
    focusSection,
    focusSessionId,
    focusStudentId,
    insights?.conversation_alerts,
    loading,
    selectedChildId,
  ]);

  useEffect(() => {
    if (
      loading ||
      focusSection !== 'review' ||
      !focusSessionId ||
      !reviewSectionRef.current ||
      (focusStudentId && selectedChildId !== focusStudentId)
    ) {
      return;
    }

    const target = insights?.recent_risks.find((item) => item.session_id === focusSessionId);
    if (!target) {
      return;
    }

    reviewSectionRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, [focusSection, focusSessionId, focusStudentId, insights?.recent_risks, loading, selectedChildId]);

  async function saveTeenMode() {
    if (!selectedChildId) {
      return;
    }

    try {
      setSavingTeenMode(true);

      const response = await fetch('/api/teen-mode', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: selectedChildId,
          enabled: teenMode.enabled,
          daily_time_limit: teenMode.dailyTimeLimit,
          rest_reminder_interval: teenMode.restReminderInterval,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || '保存陪学节奏设置失败');
      }
    } catch (saveError) {
      console.error('[ParentInsightControlPage] Failed to save teen mode:', saveError);
      window.alert(saveError instanceof Error ? saveError.message : '保存陪学节奏设置失败');
    } finally {
      setSavingTeenMode(false);
    }
  }

  async function createInterventionTask(alert: ConversationAlertItem) {
    if (!profile?.id || !selectedStudent) {
      return;
    }

    const taskKey = getInterventionTaskKey(alert);
    if (creatingTaskKeys.includes(taskKey) || createdTaskKeys.includes(taskKey) || alert.intervention_task_id) {
      return;
    }

    try {
      setCreatingTaskKeys((current) => [...current, taskKey]);
      const taskDraft = buildConversationRiskInterventionTaskDraft(alert);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 1);

      const response = await fetch('/api/parent-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: profile.id,
          childId: selectedStudent.id,
          title: taskDraft.title,
          description: taskDraft.description,
          taskType: taskDraft.taskType,
          subject: taskDraft.subject,
          targetCount: taskDraft.targetCount,
          targetDuration: taskDraft.targetDuration,
          priority: taskDraft.priority,
          dueDate: dueDate.toISOString().split('T')[0],
          rewardPoints: taskDraft.rewardPoints,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || '创建干预任务失败');
      }

      setCreatedTaskKeys((current) => Array.from(new Set([...current, taskKey])));
      setInsightReloadToken((current) => current + 1);
    } catch (taskError) {
      console.error('[ParentInsightControlPage] Failed to create intervention task:', taskError);
      window.alert(taskError instanceof Error ? taskError.message : '创建干预任务失败');
    } finally {
      setCreatingTaskKeys((current) => current.filter((item) => item !== taskKey));
    }
  }

  async function saveInterventionFeedback(alert: ConversationAlertItem) {
    if (!selectedStudent || !alert.intervention_task_id) {
      return;
    }

    const taskKey = getInterventionTaskKey(alert);
    if (savingFeedbackKeys.includes(taskKey)) {
      return;
    }

    try {
      setSavingFeedbackKeys((current) => [...current, taskKey]);

      const response = await fetch('/api/task-progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: alert.intervention_task_id,
          childId: selectedStudent.id,
          progressCount: 1,
          notes: interventionNotes[taskKey]?.trim() || null,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || '淇濆瓨骞查鍙嶉澶辫触');
      }

      setInsightReloadToken((current) => current + 1);
    } catch (saveError) {
      console.error('[ParentInsightControlPage] Failed to save intervention feedback:', saveError);
      window.alert(saveError instanceof Error ? saveError.message : '淇濆瓨骞查鍙嶉澶辫触');
    } finally {
      setSavingFeedbackKeys((current) => current.filter((item) => item !== taskKey));
    }
  }

  const students = insights?.students ?? [];
  const selectedStudent =
    students.find((student) => student.id === selectedChildId) ?? insights?.selected_student ?? null;

  const hasFocusedConversationAlert = Boolean(
    insights?.conversation_alerts.some(
      (item) =>
        item.session_id === focusSessionId &&
        (!focusRiskCategory || item.category === focusRiskCategory),
    ),
  );
  const hasFocusedReviewRisk = Boolean(
    insights?.recent_risks.some((item) => item.session_id === focusSessionId),
  );

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.12),_transparent_30%),linear-gradient(180deg,_#fffaf2_0%,_#ffffff_42%,_#fff7ed_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <PageHeader
          title="家长洞察与陪学管控"
          description="先看根因和假会风险，再决定今天陪什么、怎么陪。"
          icon={Shield}
          iconColor="text-warm-500"
          showSiteLogo={false}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-slate-100 text-slate-700">数学 V1</Badge>
              {focusSection === 'conversation' && hasFocusedConversationAlert ? (
                <Badge className="bg-red-100 text-red-700">已聚焦对话风险</Badge>
              ) : null}
              {focusSection === 'review' && hasFocusedReviewRisk ? (
                <Badge className="bg-amber-100 text-amber-700">已聚焦复习风险</Badge>
              ) : null}
              {selectedStudent ? (
                <select
                  value={selectedStudent.id}
                  onChange={(event) => setSelectedChildId(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.display_name || '未命名孩子'}
                    </option>
                  ))}
                </select>
              ) : null}
            </div>
          }
        />

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-warm-500" />
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="flex items-center gap-3 p-6 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <div>{error}</div>
            </CardContent>
          </Card>
        ) : !selectedStudent ? (
          <Card>
            <CardContent className="p-8 text-center text-slate-600">
              当前家长账号还没有绑定孩子。
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <StatsRow>
              <StatCard
                label="待处理错题"
                value={insights?.summary.open_errors ?? 0}
                icon={Brain}
                color="text-blue-600"
              />
              <StatCard
                label="到期复习"
                value={insights?.summary.overdue_review_count ?? 0}
                icon={Clock3}
                color="text-amber-600"
              />
              <StatCard
                label="假会信号"
                value={insights?.summary.pseudo_mastery_count ?? 0}
                icon={Flame}
                color="text-red-600"
              />
              <StatCard
                label="已稳定关闭"
                value={insights?.summary.mastered_closed_count ?? 0}
                icon={CheckCircle2}
                color="text-emerald-600"
              />
            </StatsRow>

            <div className="grid gap-6 lg:grid-cols-[1.35fr_0.95fr]">
              <Card
                ref={reviewSectionRef}
                className={`border-warm-100 bg-white/90 ${
                  focusSection === 'review' && hasFocusedReviewRisk ? 'ring-2 ring-amber-300' : ''
                }`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Target className="h-5 w-5 text-warm-500" />
                    错因热区
                  </CardTitle>
                  <CardDescription>热力值越高，越值得家长优先陪练。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights?.root_cause_heatmap.length ? (
                    insights.root_cause_heatmap.map((item) => (
                      <div key={`${item.category}:${item.subtype ?? 'none'}`} className="rounded-2xl border border-slate-100 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-slate-900">{item.subtype_label || item.label}</h3>
                              <Badge className={heatBadge(item.heat_level)}>
                                热力 {item.heat_score}
                              </Badge>
                            </div>
                            {item.subtype_label ? (
                              <p className="mt-1 text-xs text-slate-500">归属主类: {item.label}</p>
                            ) : null}
                            <p className="mt-1 text-sm text-slate-600">{item.playbook.summary}</p>
                          </div>
                          <div className="text-right text-sm text-slate-500">
                            <div>累计 {item.count} 次</div>
                            <div>复开 {item.reopened_count} 次</div>
                          </div>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"
                            style={{ width: `${item.heat_score}%` }}
                          />
                        </div>
                        {item.sample_root_statements.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {item.sample_root_statements.map((statement) => (
                              <Badge key={statement} className="bg-slate-100 text-slate-700">
                                {statement}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                      还没有形成结构化错因数据，先让孩子完成错因诊断和反思流程。
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-warm-100 bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Sparkles className="h-5 w-5 text-warm-500" />
                    家长本周动作
                  </CardTitle>
                  <CardDescription>先做高优先级动作，避免陪学发散。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {insights?.parent_actions.length ? (
                    insights.parent_actions.map((action) => (
                      <div key={action.title} className="rounded-2xl border border-slate-100 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="font-semibold text-slate-900">{action.title}</h3>
                          <Badge className={priorityBadge(action.priority)}>
                            {action.priority === 'high' ? '高优先级' : '中优先级'}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">{action.summary}</p>
                        {action.actions?.length ? (
                          <div className="mt-3 space-y-2 text-sm text-slate-600">
                            {action.actions.map((item) => (
                              <div key={item}>• {item}</div>
                            ))}
                          </div>
                        ) : null}
                        {action.watch_fors?.length ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {action.watch_fors.map((item) => (
                              <Badge key={item} className="bg-amber-50 text-amber-700">
                                留意: {item}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                      暂时没有可执行动作，说明当前这个孩子的错题闭环压力较低。
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="border-warm-100 bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    知识点热点
                  </CardTitle>
                  <CardDescription>把高热知识点拆小后连续追踪，比泛泛刷题更有效。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights?.knowledge_hotspots.length ? (
                    insights.knowledge_hotspots.map((item) => (
                      <div key={item.tag} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-slate-900">{item.tag}</div>
                          <Badge className={heatBadge(item.heat_level)}>{item.heat_score}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-slate-500">
                          出现 {item.count} 次，复开 {item.reopened_count} 次，假会 {item.pseudo_mastery_count} 次
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                      暂无知识点聚合数据。
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-warm-100 bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <RotateCcw className="h-5 w-5 text-amber-600" />
                    习惯热点
                  </CardTitle>
                  <CardDescription>这里看的是反复导致错题复发的行为模式。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights?.habit_hotspots.length ? (
                    insights.habit_hotspots.map((item) => (
                      <div key={item.tag} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-medium text-slate-900">{item.tag}</div>
                          <Badge className={heatBadge(item.heat_level)}>{item.heat_score}</Badge>
                        </div>
                        <div className="mt-2 text-sm text-slate-500">
                          出现 {item.count} 次，待处理 {item.pending_count} 次
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                      暂无习惯聚合数据。
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card
              ref={conversationSectionRef}
              className={`border-warm-100 bg-white/90 ${
                focusSection === 'conversation' && hasFocusedConversationAlert
                  ? 'ring-2 ring-red-300'
                  : ''
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  对话风险信号
                </CardTitle>
                <CardDescription>只展示学生消息中的风险表达，用于家长及时纠偏沟通方式。</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {insights?.conversation_alerts.length ? (
                  insights.conversation_alerts.map((item) => (
                    <div
                      key={item.message_id}
                      className={`rounded-2xl border p-4 ${
                        item.session_id === focusSessionId &&
                        (!focusRiskCategory || item.category === focusRiskCategory)
                          ? 'border-red-300 bg-red-50/60'
                          : 'border-slate-100'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Badge className={severityBadge(item.severity)}>
                            {item.severity === 'high'
                              ? '高风险'
                              : item.severity === 'medium'
                                ? '中风险'
                                : '低风险'}
                          </Badge>
                          <span className="font-medium text-slate-900">{item.title}</span>
                          {item.root_cause_display_label ? (
                            <span className="text-sm text-slate-500">{item.root_cause_display_label}</span>
                          ) : null}
                          {item.root_cause_subtype_label && item.root_cause_label ? (
                            <span className="text-xs text-slate-400">归属: {item.root_cause_label}</span>
                          ) : null}
                        </div>
                        <span className="text-xs text-slate-400">{formatDateTime(item.created_at)}</span>
                      </div>
                      <div className="mt-2 text-sm text-slate-600">{item.summary}</div>
                      {item.root_cause_statement ? (
                        <div className="mt-2 text-sm text-slate-500">{item.root_cause_statement}</div>
                      ) : null}
                      <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                        学生原话: {item.message_excerpt}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">关联题目: {item.question_excerpt}</div>
                      <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                        家长切入话术: {item.parent_opening}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {item.parent_actions.map((action) => (
                          <Badge key={action} className="bg-slate-100 text-slate-700">
                            {action}
                          </Badge>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button
                          size="sm"
                          variant={
                            createdTaskKeys.includes(`${item.session_id}:${item.category}`) || item.intervention_task_id
                              ? 'outline'
                              : 'default'
                          }
                          disabled={
                            creatingTaskKeys.includes(`${item.session_id}:${item.category}`) || Boolean(item.intervention_task_id)
                          }
                          onClick={() => createInterventionTask(item)}
                        >
                          {createdTaskKeys.includes(`${item.session_id}:${item.category}`)
                            ? '已创建干预任务'
                            : creatingTaskKeys.includes(`${item.session_id}:${item.category}`)
                              ? '创建中...'
                              : '转为家长任务'}
                        </Button>
                      </div>
                      {item.intervention_task_id ? (
                        <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className="bg-slate-100 text-slate-700">
                              {interventionStatusLabel(item.intervention_status)}
                            </Badge>
                            <Badge className={interventionEffectBadge(item.intervention_effect)}>
                              {interventionEffectLabel(item.intervention_effect)}
                            </Badge>
                            {item.intervention_completed_at ? (
                              <span className="text-xs text-slate-500">
                                沟通时间: {formatDateTime(item.intervention_completed_at)}
                              </span>
                            ) : null}
                          </div>
                          {item.intervention_effect === 'risk_persisting' ? (
                            <div className="mt-2 text-sm text-red-600">
                              干预后又出现 {item.post_intervention_repeat_count} 次同类风险信号，需要继续跟进。
                            </div>
                          ) : null}
                          {item.intervention_feedback_note ? (
                            <div className="mt-2 text-sm text-slate-600">
                              上次反馈: {item.intervention_feedback_note}
                            </div>
                          ) : null}
                          <div className="mt-3 space-y-3">
                            <Input
                              value={interventionNotes[getInterventionTaskKey(item)] ?? ''}
                              onChange={(event) =>
                                setInterventionNotes((current) => ({
                                  ...current,
                                  [getInterventionTaskKey(item)]: event.target.value,
                                }))
                              }
                              placeholder="记录沟通结果，例如：孩子能复述原因，但遇到追问仍会逃避"
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                variant={item.intervention_status === 'completed' ? 'outline' : 'default'}
                                disabled={savingFeedbackKeys.includes(getInterventionTaskKey(item))}
                                onClick={() => saveInterventionFeedback(item)}
                              >
                                {savingFeedbackKeys.includes(getInterventionTaskKey(item))
                                  ? '保存中...'
                                  : item.intervention_status === 'completed'
                                    ? '更新反馈'
                                    : '标记已沟通'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                    最近没有识别到明显对话风险信号。
                  </div>
                )}
                {interventionTaskSummary.total > 0 ? (
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div>
                      <div className="font-medium text-slate-900">已生成干预任务</div>
                      <div className="mt-1 text-sm text-slate-600">
                        当前孩子共有 {interventionTaskSummary.total} 条干预任务，其中 {interventionTaskSummary.pending} 条待完成，
                        {interventionTaskSummary.review_total} 条属于复习补救。
                      </div>
                    </div>
                    <Button variant="outline" onClick={() => (window.location.href = '/tasks')}>
                      去任务页
                    </Button>
                  </div>
                ) : null}
                {insights?.intervention_summary.total ? (
                  <div className="space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="font-medium text-slate-900">干预反馈闭环</div>
                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-xs text-slate-500">待执行</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">
                          {insights.intervention_summary.pending}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-xs text-slate-500">已沟通</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">
                          {insights.intervention_summary.completed}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-xs text-slate-500">风险下降</div>
                        <div className="mt-1 text-lg font-semibold text-emerald-600">
                          {insights.intervention_summary.risk_lowered}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-xs text-slate-500">仍在重复</div>
                        <div className="mt-1 text-lg font-semibold text-red-600">
                          {insights.intervention_summary.risk_persisting}
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-xs text-slate-500">沟通干预</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">
                          {insights.intervention_summary.conversation_total}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-xs text-slate-500">复习补救</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">
                          {insights.intervention_summary.review_total}
                        </div>
                      </div>
                      <div className="rounded-xl bg-white p-3">
                        <div className="text-xs text-slate-500">待补救复习</div>
                        <div className="mt-1 text-lg font-semibold text-amber-600">
                          {insights.intervention_summary.review_pending}
                        </div>
                      </div>
                    </div>
                    {insights.intervention_outcomes.length ? (
                      <div className="space-y-2">
                        {insights.intervention_outcomes.map((outcome) => (
                          <div
                            key={outcome.task_id}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3"
                          >
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="font-medium text-slate-900">{outcome.title}</div>
                                <Badge className="bg-slate-100 text-slate-700">{outcome.task_type_label}</Badge>
                                {outcome.root_cause_display_label ? (
                                  <Badge className="bg-warm-100 text-warm-700">{outcome.root_cause_display_label}</Badge>
                                ) : null}
                              </div>
                              <div className="mt-1 text-sm text-slate-600">
                                {outcome.feedback_note || '暂无家长反馈备注'}
                              </div>
                              {outcome.root_cause_statement ? (
                                <div className="mt-1 text-sm text-slate-500">{outcome.root_cause_statement}</div>
                              ) : null}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={interventionEffectBadge(outcome.effect)}>
                                {interventionEffectLabel(outcome.effect)}
                              </Badge>
                              <span className="text-xs text-slate-500">
                                {formatDateTime(outcome.completed_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <Card className="border-warm-100 bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    最近风险事件
                  </CardTitle>
                  <CardDescription>这些点最容易影响“真会 / 假会”判定。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {insights?.recent_risks.length ? (
                    insights.recent_risks.map((item) => (
                      <div
                        key={`${item.session_id}-${item.title}`}
                        className={`rounded-2xl border p-4 ${
                          focusSection === 'review' && item.session_id === focusSessionId
                            ? 'border-amber-300 bg-amber-50/60'
                            : 'border-slate-100'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-red-100 text-red-700">{item.title}</Badge>
                            <span className="text-sm text-slate-500">{item.root_cause_display_label}</span>
                            {item.root_cause_subtype_label ? (
                              <span className="text-xs text-slate-400">归属: {item.root_cause_label}</span>
                            ) : null}
                          </div>
                          <span className="text-xs text-slate-400">{formatDateTime(item.created_at)}</span>
                        </div>
                        <div className="mt-2 font-medium text-slate-900">{item.excerpt}</div>
                        {item.root_cause_statement ? (
                          <div className="mt-2 text-sm text-slate-600">{item.root_cause_statement}</div>
                        ) : null}
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                          <Badge className="bg-slate-100 text-slate-700">
                            复开 {item.reopened_count} 次
                          </Badge>
                          {item.mastery_judgement ? (
                            <Badge className="bg-slate-100 text-slate-700">
                              判定: {item.mastery_judgement}
                            </Badge>
                          ) : null}
                          {item.next_review_at ? (
                            <Badge className="bg-slate-100 text-slate-700">
                              下次复习: {formatDateTime(item.next_review_at)}
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-sm text-slate-500">
                      近期没有高风险复习事件。
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-warm-100 bg-white/90">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <Shield className="h-5 w-5 text-warm-500" />
                    陪学节奏设置
                  </CardTitle>
                  <CardDescription>当前默认作用在所选孩子身上。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center justify-between rounded-2xl border border-slate-100 p-4">
                    <div>
                      <div className="font-medium text-slate-900">开启陪学节奏管控</div>
                      <div className="mt-1 text-sm text-slate-500">
                        控制单日学习时长和休息提醒频率。
                      </div>
                    </div>
                    <Switch
                      checked={teenMode.enabled}
                      onCheckedChange={(enabled: boolean) =>
                        setTeenMode((current) => ({ ...current, enabled }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>单日学习上限</span>
                      <span>{teenMode.dailyTimeLimit} 分钟</span>
                    </div>
                    <input
                      type="range"
                      min={30}
                      max={180}
                      step={15}
                      value={teenMode.dailyTimeLimit}
                      onChange={(event) =>
                        setTeenMode((current) => ({
                          ...current,
                          dailyTimeLimit: Number(event.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>休息提醒间隔</span>
                      <span>{teenMode.restReminderInterval} 分钟</span>
                    </div>
                    <input
                      type="range"
                      min={15}
                      max={60}
                      step={5}
                      value={teenMode.restReminderInterval}
                      onChange={(event) =>
                        setTeenMode((current) => ({
                          ...current,
                          restReminderInterval: Number(event.target.value),
                        }))
                      }
                      className="w-full"
                    />
                  </div>

                  <Button onClick={saveTeenMode} disabled={!selectedChildId || savingTeenMode} className="w-full">
                    {savingTeenMode ? '保存中...' : '保存设置'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="border-warm-100 bg-white/90">
              <CardContent className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold text-slate-900">热力图逻辑</div>
                  <div className="mt-1 text-sm text-slate-600">
                    {insights?.scoring_model.explanation}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                  <Badge className="bg-slate-100 text-slate-700">
                    频次 {insights?.scoring_model.countWeight}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-700">
                    近期 {insights?.scoring_model.recentWeight}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-700">
                    复开 {insights?.scoring_model.reopenedWeight}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-700">
                    假会 {insights?.scoring_model.pseudoMasteryWeight}
                  </Badge>
                  <Badge className="bg-slate-100 text-slate-700">
                    待处理 {insights?.scoring_model.pendingWeight}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
