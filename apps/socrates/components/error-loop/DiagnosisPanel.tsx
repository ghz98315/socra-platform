'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  ListChecks,
  Loader2,
  Save,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DEEP_ERROR_LOOP_V1_SUBJECTS,
  ROOT_CAUSE_CATEGORY_LABELS,
  ROOT_CAUSE_CATEGORY_OPTIONS,
  SURFACE_LABEL_OPTIONS,
  WHY_CHAIN_PROMPTS,
  type ErrorLoopSubject,
  type RootCauseCategory,
  type StructuredDiagnosis,
} from '@/lib/error-loop/taxonomy';
import { cn } from '@/lib/utils';

interface DiagnosisPanelProps {
  sessionId: string;
  studentId: string;
  subject: ErrorLoopSubject;
  closureState?: string | null;
  initialCategory?: RootCauseCategory | null;
  initialStatement?: string | null;
  onSaved?: (diagnosis: StructuredDiagnosis) => void;
}

interface DiagnosisFormState {
  surfaceLabels: string[];
  surfaceError: string;
  rootCauseCategory: RootCauseCategory;
  rootCauseStatement: string;
  whyAnswers: string[];
  evidenceText: string;
  fixActionsText: string;
  knowledgeTagsText: string;
  habitTagsText: string;
  riskFlagsText: string;
}

const DEFAULT_CATEGORY = ROOT_CAUSE_CATEGORY_OPTIONS[0].value;

function createEmptyFormState(
  initialCategory?: RootCauseCategory | null,
  initialStatement?: string | null,
): DiagnosisFormState {
  return {
    surfaceLabels: [],
    surfaceError: '',
    rootCauseCategory: initialCategory || DEFAULT_CATEGORY,
    rootCauseStatement: initialStatement || '',
    whyAnswers: WHY_CHAIN_PROMPTS.map(() => ''),
    evidenceText: '',
    fixActionsText: '',
    knowledgeTagsText: '',
    habitTagsText: '',
    riskFlagsText: '',
  };
}

function splitListField(value: string) {
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinListField(value: string[] | null | undefined) {
  return (value || []).join('\n');
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function diagnosisToFormState(
  diagnosis: StructuredDiagnosis,
  fallbackCategory?: RootCauseCategory | null,
  fallbackStatement?: string | null,
): DiagnosisFormState {
  const nextWhyAnswers = WHY_CHAIN_PROMPTS.map(() => '');

  (diagnosis.why_chain || []).forEach((item, index) => {
    if (index < nextWhyAnswers.length) {
      nextWhyAnswers[index] = item.answer || '';
    }
  });

  return {
    surfaceLabels: diagnosis.surface_labels || [],
    surfaceError: diagnosis.surface_error || '',
    rootCauseCategory: diagnosis.root_cause_category || fallbackCategory || DEFAULT_CATEGORY,
    rootCauseStatement: diagnosis.root_cause_statement || fallbackStatement || '',
    whyAnswers: nextWhyAnswers,
    evidenceText: joinListField(diagnosis.evidence),
    fixActionsText: joinListField(diagnosis.fix_actions),
    knowledgeTagsText: joinListField(diagnosis.knowledge_tags),
    habitTagsText: joinListField(diagnosis.habit_tags),
    riskFlagsText: joinListField(diagnosis.risk_flags),
  };
}

export function DiagnosisPanel({
  sessionId,
  studentId,
  subject,
  closureState,
  initialCategory,
  initialStatement,
  onSaved,
}: DiagnosisPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savedDiagnosis, setSavedDiagnosis] = useState<StructuredDiagnosis | null>(null);
  const [form, setForm] = useState<DiagnosisFormState>(() => createEmptyFormState(initialCategory, initialStatement));

  const isEnabledSubject = DEEP_ERROR_LOOP_V1_SUBJECTS.has(subject);

  useEffect(() => {
    async function loadDiagnosis() {
      if (!sessionId || !studentId || !isEnabledSubject) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const response = await fetch(
          `/api/error-session/diagnose?session_id=${encodeURIComponent(sessionId)}&student_id=${encodeURIComponent(studentId)}`,
        );
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || 'Failed to load diagnosis');
        }

        if (payload.data) {
          setSavedDiagnosis(payload.data);
          setForm(diagnosisToFormState(payload.data, initialCategory, initialStatement));
        } else {
          setSavedDiagnosis(null);
          setForm(createEmptyFormState(initialCategory, initialStatement));
        }
      } catch (error: unknown) {
        console.error('Failed to load structured diagnosis:', error);
        setErrorMessage(getErrorMessage(error, '加载错因诊断失败'));
      } finally {
        setLoading(false);
      }
    }

    loadDiagnosis();
  }, [initialCategory, initialStatement, isEnabledSubject, sessionId, studentId]);

  const whyChain = useMemo(
    () =>
      WHY_CHAIN_PROMPTS.map((question, index) => ({
        level: index + 1,
        question,
        answer: form.whyAnswers[index]?.trim() || '',
      })).filter((item) => item.answer.length > 0),
    [form.whyAnswers],
  );

  const derivedDepth = whyChain.length >= 3 ? 3 : whyChain.length >= 2 ? 2 : 1;

  const handleToggleSurfaceLabel = (label: string) => {
    setSuccessMessage(null);
    setForm((current) => ({
      ...current,
      surfaceLabels: current.surfaceLabels.includes(label)
        ? current.surfaceLabels.filter((item) => item !== label)
        : [...current.surfaceLabels, label],
    }));
  };

  const handleSave = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!form.surfaceError.trim()) {
      setErrorMessage('先写清楚这次题目表面错在了哪里。');
      return;
    }

    if (whyChain.length < 2) {
      setErrorMessage('至少完成前两层追问，不能停在表面原因。');
      return;
    }

    if (form.rootCauseStatement.trim().length < 8) {
      setErrorMessage('根因描述太短，先写到能指导下次防错。');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        session_id: sessionId,
        student_id: studentId,
        subject,
        surface_labels: form.surfaceLabels,
        surface_error: form.surfaceError.trim(),
        root_cause_category: form.rootCauseCategory,
        root_cause_statement: form.rootCauseStatement.trim(),
        root_cause_depth: derivedDepth,
        why_chain: whyChain,
        evidence: splitListField(form.evidenceText),
        fix_actions: splitListField(form.fixActionsText),
        knowledge_tags: splitListField(form.knowledgeTagsText),
        habit_tags: splitListField(form.habitTagsText),
        risk_flags: splitListField(form.riskFlagsText),
      };

      const response = await fetch('/api/error-session/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save diagnosis');
      }

      setSavedDiagnosis(result.data);
      setSuccessMessage('错因诊断已保存，后续可以继续接复盘与复习判断。');
      onSaved?.(result.data);
    } catch (error: unknown) {
      console.error('Failed to save structured diagnosis:', error);
      setErrorMessage(getErrorMessage(error, '保存错因诊断失败'));
    } finally {
      setSaving(false);
    }
  };

  if (!isEnabledSubject) {
    return (
      <Card className="border-dashed border-border/60 bg-muted/30">
        <CardContent className="flex items-start gap-3 py-5">
          <AlertCircle className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">深度错因闭环 V1 先只打数学单点。</p>
            <p className="text-sm text-muted-foreground">当前学科先保留原流程，数学链路打深后再横向扩展。</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50 shadow-sm">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-warm-100 text-warm-700">
                <Brain className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">错因深挖卡</CardTitle>
                <CardDescription>先追到根因，再决定后续 Socrates 提问和复习闭环。</CardDescription>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-warm-100 text-warm-700">
                8 类根因
              </Badge>
              <Badge variant="outline" className="border-warm-200 text-warm-700">
                “粗心”只能做表层标签
              </Badge>
              {closureState ? (
                <Badge variant="outline" className="border-border/60 text-muted-foreground">
                  当前闭环状态: {closureState}
                </Badge>
              ) : null}
            </div>
          </div>

          {savedDiagnosis ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                已有诊断
              </div>
              <p className="mt-1">{ROOT_CAUSE_CATEGORY_LABELS[savedDiagnosis.root_cause_category]}</p>
              <p className="mt-1 line-clamp-2 text-xs text-emerald-600">{savedDiagnosis.root_cause_statement}</p>
            </div>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-dashed border-border/60 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            正在加载已有诊断...
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-800">
              目标不是给题目贴一个“粗心”标签，而是追到会反复制造错误的行为、策略或知识模式。
            </div>

            <section className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Target className="h-4 w-4 text-warm-600" />
                表层现象
              </div>
              <div className="flex flex-wrap gap-2">
                {SURFACE_LABEL_OPTIONS.map((label) => {
                  const selected = form.surfaceLabels.includes(label);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleToggleSurfaceLabel(label)}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-sm transition-colors',
                        selected
                          ? 'border-warm-400 bg-warm-500 text-white'
                          : 'border-warm-200 bg-white text-warm-700 hover:bg-warm-50',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={form.surfaceError}
                onChange={(event) => {
                  setSuccessMessage(null);
                  setForm((current) => ({ ...current, surfaceError: event.target.value }));
                }}
                placeholder="写清楚这次到底错在什么地方，例如：列方程时漏掉了“最简整数比”的限制条件。"
                className="min-h-24 w-full rounded-2xl border-2 border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-900 outline-none transition-colors placeholder:text-warm-400 focus:border-warm-400 focus:bg-white focus:ring-2 focus:ring-warm-400/20"
              />
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-warm-600" />
                5 Why 追问
              </div>
              <div className="grid gap-4">
                {WHY_CHAIN_PROMPTS.map((question, index) => (
                  <div key={question} className="rounded-2xl border border-border/60 bg-background px-4 py-4">
                    <p className="text-sm font-medium text-foreground">
                      Why {index + 1}. {question}
                    </p>
                    <textarea
                      value={form.whyAnswers[index] || ''}
                      onChange={(event) => {
                        setSuccessMessage(null);
                        setForm((current) => {
                          const nextAnswers = [...current.whyAnswers];
                          nextAnswers[index] = event.target.value;
                          return { ...current, whyAnswers: nextAnswers };
                        });
                      }}
                      placeholder={index === 0 ? '还原你当时是怎么想的。' : '继续往下挖，不要重复上一层答案。'}
                      className="mt-3 min-h-24 w-full rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-warm-300 focus:bg-white focus:ring-2 focus:ring-warm-400/10"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ListChecks className="h-4 w-4 text-warm-600" />
                最终根因归类
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {ROOT_CAUSE_CATEGORY_OPTIONS.map((option) => {
                  const active = form.rootCauseCategory === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setSuccessMessage(null);
                        setForm((current) => ({ ...current, rootCauseCategory: option.value }));
                      }}
                      className={cn(
                        'rounded-2xl border px-4 py-4 text-left transition-colors',
                        active
                          ? 'border-warm-400 bg-warm-50 shadow-sm'
                          : 'border-border/60 bg-background hover:border-warm-200 hover:bg-warm-50/50',
                      )}
                    >
                      <p className={cn('text-sm font-semibold', active ? 'text-warm-800' : 'text-foreground')}>
                        {option.label}
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">{option.description}</p>
                    </button>
                  );
                })}
              </div>
              <textarea
                value={form.rootCauseStatement}
                onChange={(event) => {
                  setSuccessMessage(null);
                  setForm((current) => ({ ...current, rootCauseStatement: event.target.value }));
                }}
                placeholder="例如：缺少固定的审题检查动作，简单题一上手就直接列式，导致限制条件反复漏掉。"
                className="min-h-24 w-full rounded-2xl border-2 border-warm-200 bg-warm-50 px-4 py-3 text-sm text-warm-900 outline-none transition-colors placeholder:text-warm-400 focus:border-warm-400 focus:bg-white focus:ring-2 focus:ring-warm-400/20"
              />
              <div className="text-xs text-muted-foreground">
                当前根因深度: {derivedDepth} / 3。至少要到第 2 层，才能说明没有停在表面。
              </div>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="space-y-3 rounded-2xl border border-border/60 bg-background px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <ShieldAlert className="h-4 w-4 text-warm-600" />
                  证据
                </div>
                <textarea
                  value={form.evidenceText}
                  onChange={(event) => {
                    setSuccessMessage(null);
                    setForm((current) => ({ ...current, evidenceText: event.target.value }));
                  }}
                  placeholder="每行一条，例如：题目条件没有进入列式；学生自述直接上手没回头检查。"
                  className="min-h-28 w-full rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-warm-300 focus:bg-white focus:ring-2 focus:ring-warm-400/10"
                />
              </section>

              <section className="space-y-3 rounded-2xl border border-border/60 bg-background px-4 py-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-warm-600" />
                  下次防错动作
                </div>
                <textarea
                  value={form.fixActionsText}
                  onChange={(event) => {
                    setSuccessMessage(null);
                    setForm((current) => ({ ...current, fixActionsText: event.target.value }));
                  }}
                  placeholder="每行一条，例如：先圈条件；列式前口头复述问题；做完后核对问的是什么。"
                  className="min-h-28 w-full rounded-2xl border border-border/60 bg-muted/30 px-4 py-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-warm-300 focus:bg-white focus:ring-2 focus:ring-warm-400/10"
                />
              </section>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <p className="text-sm font-medium">知识点标签</p>
                <Input
                  value={form.knowledgeTagsText}
                  onChange={(event) => {
                    setSuccessMessage(null);
                    setForm((current) => ({ ...current, knowledgeTagsText: event.target.value }));
                  }}
                  placeholder="一元二次方程, 最简比"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">习惯标签</p>
                <Input
                  value={form.habitTagsText}
                  onChange={(event) => {
                    setSuccessMessage(null);
                    setForm((current) => ({ ...current, habitTagsText: event.target.value }));
                  }}
                  placeholder="先圈条件, 复核单位"
                />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">风险标记</p>
                <Input
                  value={form.riskFlagsText}
                  onChange={(event) => {
                    setSuccessMessage(null);
                    setForm((current) => ({ ...current, riskFlagsText: event.target.value }));
                  }}
                  placeholder="反复漏条件, 简单题抢答"
                />
              </div>
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
            ) : null}
            {successMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 border-t border-border/60 pt-5 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-muted-foreground">保存后，当前题目的主根因会同步写回错题 session。</p>
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                保存错因诊断
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
