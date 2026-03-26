'use client';

import { useEffect, useState } from 'react';
import { BrainCircuit, CheckCircle2, Loader2, MessageSquareQuote, RefreshCw } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DEEP_ERROR_LOOP_V1_SUBJECTS,
  ROOT_CAUSE_CATEGORY_LABELS,
  getRootCauseSubtypeOption,
  type ErrorLoopSubject,
  type RootCauseCategory,
  type RootCauseSubtype,
} from '@/lib/error-loop/taxonomy';

interface GuidedReflectionState {
  current_step: number;
  completed: boolean;
  steps: Array<{
    key: string;
    title: string;
    question: string;
    answer: string;
    answered_at?: string;
  }>;
  student_summary: string | null;
  updated_at?: string;
}

interface GuidedReflectionResponse {
  guided_reflection: GuidedReflectionState;
  next_step: number | null;
  next_question: {
    key: string;
    title: string;
    question: string;
    description: string;
  } | null;
  is_ready_to_summarize: boolean;
  student_summary: string | null;
  diagnosis_snapshot?: {
    root_cause_category: RootCauseCategory;
    root_cause_subtype: RootCauseSubtype | null;
    root_cause_subtype_label: string | null;
    root_cause_statement: string;
    fix_actions: string[];
  };
}

export function GuidedReflectionPanel({
  sessionId,
  studentId,
  subject,
  rootCauseCategory,
  rootCauseSubtype,
  rootCauseStatement,
}: {
  sessionId: string;
  studentId: string;
  subject: ErrorLoopSubject;
  rootCauseCategory?: RootCauseCategory | null;
  rootCauseSubtype?: RootCauseSubtype | null;
  rootCauseStatement?: string | null;
}) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [payload, setPayload] = useState<GuidedReflectionResponse | null>(null);

  const enabled = DEEP_ERROR_LOOP_V1_SUBJECTS.has(subject);
  const diagnosisReady = Boolean(rootCauseCategory && rootCauseStatement);
  const effectiveSubtypeLabel =
    payload?.diagnosis_snapshot?.root_cause_subtype_label ||
    (rootCauseSubtype ? getRootCauseSubtypeOption(rootCauseSubtype)?.label ?? null : null);

  useEffect(() => {
    async function loadReflection() {
      if (!enabled || !diagnosisReady) {
        setLoading(false);
        setPayload(null);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          `/api/error-session/guided-reflection?session_id=${encodeURIComponent(sessionId)}&student_id=${encodeURIComponent(studentId)}`,
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load guided reflection');
        }

        setPayload(result.data);
        setAnswerDraft('');
      } catch (error) {
        console.error('Failed to load guided reflection:', error);
        setErrorMessage(error instanceof Error ? error.message : '加载引导反思失败');
      } finally {
        setLoading(false);
      }
    }

    void loadReflection();
  }, [diagnosisReady, enabled, sessionId, studentId]);

  const handleSubmit = async () => {
    if (!payload?.next_question || !answerDraft.trim()) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/error-session/guided-reflection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          student_id: studentId,
          current_step: payload.next_step,
          student_answer: answerDraft.trim(),
        }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save guided reflection');
      }

      setPayload(result.data);
      setAnswerDraft('');
    } catch (error) {
      console.error('Failed to save guided reflection:', error);
      setErrorMessage(error instanceof Error ? error.message : '保存引导反思失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (!enabled) {
    return null;
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
            <BrainCircuit className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Socrates 式引导反思</CardTitle>
            <CardDescription>不是直接给结论，而是把“我为什么会这样错”一步步说透。</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!diagnosisReady ? (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-sm text-muted-foreground">
            先完成上面的错因诊断，锁定主根因后，再进入引导反思。
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载引导反思...
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  当前主根因
                </Badge>
                {rootCauseCategory ? (
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    {ROOT_CAUSE_CATEGORY_LABELS[rootCauseCategory]}
                  </Badge>
                ) : null}
                {effectiveSubtypeLabel ? (
                  <Badge variant="outline" className="border-blue-200 text-blue-700">
                    {effectiveSubtypeLabel}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-3 text-sm leading-6 text-blue-900">{rootCauseStatement}</p>
            </div>

            {payload?.guided_reflection.steps?.length ? (
              <div className="space-y-3">
                {payload.guided_reflection.steps.map((step, index) => (
                  <div key={`${step.key}-${index}`} className="rounded-2xl border border-border/60 px-4 py-4">
                    <p className="text-sm font-medium">
                      {index + 1}. {step.title}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">{step.question}</p>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{step.answer}</p>
                  </div>
                ))}
              </div>
            ) : null}

            {payload?.next_question ? (
              <div className="rounded-2xl border border-warm-200 bg-warm-50/80 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-warm-900">{payload.next_question.title}</p>
                    <p className="mt-1 text-xs text-warm-700">{payload.next_question.description}</p>
                  </div>
                  <Badge variant="outline" className="border-warm-200 text-warm-700">
                    第 {(payload.next_step || 0) + 1} 步
                  </Badge>
                </div>

                <div className="mt-4 rounded-2xl bg-white/80 px-4 py-4">
                  <div className="flex items-start gap-2">
                    <MessageSquareQuote className="mt-0.5 h-4 w-4 text-warm-700" />
                    <p className="text-sm leading-6 text-warm-900">{payload.next_question.question}</p>
                  </div>
                </div>

                <textarea
                  value={answerDraft}
                  onChange={(event) => setAnswerDraft(event.target.value)}
                  placeholder="把你当时真实的想法写出来，不要只写“粗心”或“以后认真一点”。"
                  className="mt-4 min-h-28 w-full rounded-2xl border border-warm-200 bg-white px-4 py-3 text-sm outline-none transition-colors placeholder:text-warm-400 focus:border-warm-400 focus:ring-2 focus:ring-warm-400/10"
                />

                <div className="mt-4 flex justify-end">
                  <Button onClick={handleSubmit} disabled={submitting || !answerDraft.trim()} className="gap-2">
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    提交这一问
                  </Button>
                </div>
              </div>
            ) : null}

            {payload?.student_summary ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-sm font-semibold">我的总结</p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-emerald-900">{payload.student_summary}</p>
              </div>
            ) : null}

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
