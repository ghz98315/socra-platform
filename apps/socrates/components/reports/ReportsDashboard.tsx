'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BarChart3,
  BookOpen,
  Calendar,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';

import { PageHeader, StatCard, StatsRow } from '@/components/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/contexts/AuthContext';
import { buildStudyAssetDetailHref } from '@/lib/study/assets-v2';
import { cn } from '@/lib/utils';

function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}

interface ReportStats {
  totalErrors: number;
  mastered: number;
  masteryRate: number;
  totalStudyMinutes: number;
  totalReviews: number;
  avgDailyMinutes: number;
  legacyErrorCount: number;
  studyAssetCount: number;
  processedAssetCount: number;
}

interface WeakPoint {
  tag: string;
  count: number;
}

interface BreakdownItem {
  key: string;
  label: string;
  count: number;
}

interface GuardianSignal {
  level: 'green' | 'yellow' | 'red';
  label: string;
  reason: string;
}

interface TopBlocker {
  key: string | null;
  label: string | null;
  count: number;
  root_cause_summary: string | null;
  child_poka_yoke_action: string | null;
  suggested_guardian_action: string | null;
  false_error_gate: boolean;
  analysis_mode: string | null;
  analysis_mode_label: string | null;
  stuck_stage: string | null;
  stuck_stage_label: string | null;
}

interface Report {
  id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  total_errors_analyzed: number;
  total_reviews_completed: number;
  mastery_rate: number;
  total_study_minutes: number;
  generated_at: string;
}

interface FocusAssetSummary {
  id: string;
  subject: string;
  module: string;
  moduleLabel: string;
  title: string;
  summary: string;
  updated_at: string;
  resultSectionTitles: string[];
}

function formatPeriod(days: number) {
  if (days === 7) {
    return '本周';
  }

  if (days === 14) {
    return '近两周';
  }

  return '本月';
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatDateTime(value: string) {
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

function getBarWidth(count: number, total: number) {
  if (total <= 0) {
    return 0;
  }

  return Math.max(8, Math.round((count / total) * 100));
}

export function ReportsDashboard() {
  const { profile } = useAuth();
  const searchParams = useSearchParams();
  const focusAssetId = searchParams.get('focus_asset_id')?.trim() || '';

  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);
  const [guardianSignal, setGuardianSignal] = useState<GuardianSignal | null>(null);
  const [topBlocker, setTopBlocker] = useState<TopBlocker | null>(null);
  const [focusSummary, setFocusSummary] = useState('');
  const [stuckStageSummary, setStuckStageSummary] = useState<BreakdownItem[]>([]);
  const [subjectBreakdown, setSubjectBreakdown] = useState<BreakdownItem[]>([]);
  const [moduleBreakdown, setModuleBreakdown] = useState<BreakdownItem[]>([]);
  const [focusAsset, setFocusAsset] = useState<FocusAssetSummary | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 14 | 30>(7);

  const statsAnimation = useScrollAnimation();
  const analysisAnimation = useScrollAnimation();
  const detailAnimation = useScrollAnimation();

  const totalSubjectCount = useMemo(
    () => subjectBreakdown.reduce((sum, item) => sum + item.count, 0),
    [subjectBreakdown],
  );
  const totalModuleCount = useMemo(
    () => moduleBreakdown.reduce((sum, item) => sum + item.count, 0),
    [moduleBreakdown],
  );
  const getSignalBadgeClassName = (level: GuardianSignal['level']) => {
    switch (level) {
      case 'red':
        return 'bg-red-100 text-red-700';
      case 'yellow':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-emerald-100 text-emerald-700';
    }
  };

  const loadReportData = useCallback(async () => {
    if (!profile?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/reports/study', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: selectedPeriod === 30 ? 'monthly' : 'weekly',
          days: selectedPeriod,
          focus_asset_id: focusAssetId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('reports-study-post-failed');
      }

      const result = await response.json();
      setReportStats((result?.data?.stats || null) as ReportStats | null);
      setWeakPoints((result?.data?.weakPoints || []) as WeakPoint[]);
      setGuardianSignal((result?.data?.guardianSignal || null) as GuardianSignal | null);
      setTopBlocker((result?.data?.topBlocker || null) as TopBlocker | null);
      setFocusSummary(typeof result?.data?.focusSummary === 'string' ? result.data.focusSummary : '');
      setStuckStageSummary((result?.data?.stuckStageSummary || []) as BreakdownItem[]);
      setSubjectBreakdown((result?.data?.subjectBreakdown || []) as BreakdownItem[]);
      setModuleBreakdown((result?.data?.moduleBreakdown || []) as BreakdownItem[]);
      setFocusAsset((result?.data?.focusAsset || null) as FocusAssetSummary | null);
      setAiAnalysis(typeof result?.data?.aiAnalysis === 'string' ? result.data.aiAnalysis : '');

      const historyResponse = await fetch('/api/reports/study?limit=6');
      if (!historyResponse.ok) {
        throw new Error('reports-study-get-failed');
      }

      const historyResult = await historyResponse.json();
      setReports((historyResult?.data || []) as Report[]);
    } catch (error) {
      console.error('[ReportsDashboard] Failed to load report data:', error);
      setReportStats(null);
      setWeakPoints([]);
      setGuardianSignal(null);
      setTopBlocker(null);
      setFocusSummary('');
      setStuckStageSummary([]);
      setSubjectBreakdown([]);
      setModuleBreakdown([]);
      setFocusAsset(null);
      setAiAnalysis('');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [focusAssetId, profile?.id, selectedPeriod]);

  useEffect(() => {
    void loadReportData();
  }, [loadReportData]);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await loadReportData();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-white to-warm-100">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <PageHeader
          title="学习报告"
          description={
            focusAsset
              ? `查看过去${formatPeriod(selectedPeriod)}的学习数据，并聚焦记录「${focusAsset.title}」`
              : `查看过去${formatPeriod(selectedPeriod)}的学习数据和 AI 分析`
          }
          icon={BarChart3}
          iconColor="text-purple-500"
          actions={
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg bg-warm-100/50 p-1">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setSelectedPeriod(days as 7 | 14 | 30)}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm transition-all duration-200',
                      selectedPeriod === days
                        ? 'bg-white font-medium text-warm-900 shadow-sm'
                        : 'text-warm-600 hover:text-warm-900',
                    )}
                  >
                    {formatPeriod(days)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex h-8 items-center gap-2 rounded-full border-2 border-warm-200 bg-white px-4 text-xs font-medium text-warm-700 transition-all hover:border-warm-300 hover:bg-warm-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
                刷新
              </button>
            </div>
          }
        />
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-24 sm:px-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-warm-500" />
            <p className="mt-4 text-warm-600">正在生成最新学习报告...</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div
              ref={statsAnimation.ref}
              style={{
                opacity: statsAnimation.isVisible ? 1 : 0,
                transform: statsAnimation.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
              }}
            >
              <StatsRow>
                <StatCard
                  label="学习记录"
                  value={reportStats?.totalErrors || 0}
                  icon={Target}
                  color="text-red-500"
                  delay={0}
                />
                <StatCard
                  label="完成分析"
                  value={reportStats?.mastered || 0}
                  icon={Award}
                  color="text-green-500"
                  delay={0.1}
                />
                <StatCard
                  label="学习时长"
                  value={`${reportStats?.totalStudyMinutes || 0} 分钟`}
                  icon={Clock}
                  color="text-blue-500"
                  delay={0.2}
                />
                <StatCard
                  label="掌握率"
                  value={`${reportStats?.masteryRate || 0}%`}
                  icon={TrendingUp}
                  color="text-purple-500"
                  trend={
                    reportStats && reportStats.masteryRate >= 70
                      ? { value: 10, isPositive: true }
                      : undefined
                  }
                  delay={0.3}
                />
              </StatsRow>
            </div>

            {focusAsset ? (
              <Card className="border-warm-200/60 bg-gradient-to-r from-white via-warm-50/80 to-amber-50/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-warm-500" />
                    聚焦学习记录
                  </CardTitle>
                  <CardDescription>
                    当前报告已对齐到统一学习记录，可直接回到详情页或继续进入复习。
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{focusAsset.moduleLabel}</Badge>
                    <Badge variant="outline">{formatDateTime(focusAsset.updated_at)}</Badge>
                    {focusAsset.resultSectionTitles.slice(0, 3).map((item) => (
                      <Badge key={item} variant="outline">
                        {item}
                      </Badge>
                    ))}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-warm-900">{focusAsset.title}</p>
                    <p className="mt-2 text-sm leading-6 text-warm-700">{focusAsset.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={buildStudyAssetDetailHref(focusAsset.id)}
                      className="inline-flex items-center rounded-full bg-warm-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-warm-600"
                    >
                      打开学习记录
                    </Link>
                    <Link
                      href={`/reports?focus_asset_id=${encodeURIComponent(focusAsset.id)}`}
                      className="inline-flex items-center rounded-full border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 transition-colors hover:bg-white"
                    >
                      固定当前聚焦
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Card className="border-warm-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-red-500" />
                    本阶段最大卡点
                  </CardTitle>
                  <CardDescription>先看最大的重复问题，再决定后续练什么。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {topBlocker ? (
                    <>
                      <div className="flex flex-wrap items-center gap-2">
                        {topBlocker.label ? <Badge className="bg-red-100 text-red-700">{topBlocker.label}</Badge> : null}
                        {topBlocker.analysis_mode_label ? (
                          <Badge variant="outline">{topBlocker.analysis_mode_label}</Badge>
                        ) : null}
                        {topBlocker.stuck_stage_label ? (
                          <Badge variant="outline">卡在: {topBlocker.stuck_stage_label}</Badge>
                        ) : null}
                        {topBlocker.false_error_gate ? (
                          <Badge className="bg-sky-100 text-sky-700">先排查假错题</Badge>
                        ) : null}
                      </div>
                      <div className="text-lg font-semibold text-warm-900">
                        {topBlocker.root_cause_summary || '已识别到可重复追踪的结构化卡点。'}
                      </div>
                      <div className="text-sm text-warm-700">最近重复出现 {topBlocker.count} 次</div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-warm-200 bg-warm-50/70 px-4 py-5 text-sm text-warm-600">
                      当前阶段还没有形成稳定重复的结构化卡点。
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-warm-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-warm-500" />
                    陪学信号
                  </CardTitle>
                  <CardDescription>把复杂统计先压缩成一个可执行状态。</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {guardianSignal ? (
                    <>
                      <Badge className={getSignalBadgeClassName(guardianSignal.level)}>
                        {guardianSignal.label}
                      </Badge>
                      <div className="text-sm leading-6 text-warm-800">{guardianSignal.reason}</div>
                      <div className="rounded-2xl bg-warm-50/80 px-4 py-3 text-sm text-warm-700">
                        {focusSummary || '先围绕当前最大卡点做单点巩固，不要同时扩太多题。'}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-warm-200 bg-warm-50/70 px-4 py-5 text-sm text-warm-600">
                      当前阶段暂时没有形成明确的陪学信号。
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-warm-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    卡点阶段分布
                  </CardTitle>
                  <CardDescription>判断孩子更常卡在审题、起手、执行还是复述阶段。</CardDescription>
                </CardHeader>
                <CardContent>
                  {stuckStageSummary.length > 0 ? (
                    <div className="space-y-3">
                      {stuckStageSummary.slice(0, 4).map((item) => (
                        <div key={item.key} className="rounded-xl bg-warm-50/70 px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-medium text-warm-900">{item.label}</span>
                            <Badge variant="secondary">{item.count} 次</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-warm-200 bg-warm-50/70 px-4 py-5 text-sm text-warm-600">
                      当前阶段还没有足够的阶段卡点分布数据。
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div
              ref={analysisAnimation.ref}
              className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]"
              style={{
                opacity: analysisAnimation.isVisible ? 1 : 0,
                transform: analysisAnimation.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.15s, transform 0.6s ease-out 0.15s',
              }}
            >
              <Card className="border-warm-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-warm-500" />
                    AI 学习分析
                  </CardTitle>
                  <CardDescription>基于错题、学习记录和复习行为生成的阶段总结。</CardDescription>
                </CardHeader>
                <CardContent>
                  {aiAnalysis ? (
                    <div className="whitespace-pre-wrap text-sm leading-7 text-warm-900">
                      {aiAnalysis}
                    </div>
                  ) : (
                    <p className="text-sm leading-6 text-warm-600">
                      当前数据还不足以生成稳定分析，继续完成几条学习记录后会自动补齐。
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-warm-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-500" />
                    薄弱点追踪
                  </CardTitle>
                  <CardDescription>优先看高频重复出现的知识点和模块标签。</CardDescription>
                </CardHeader>
                <CardContent>
                  {weakPoints.length > 0 ? (
                    <div className="space-y-3">
                      {weakPoints.slice(0, 6).map((point, index) => (
                        <div
                          key={point.tag}
                          className="flex items-center justify-between rounded-xl bg-warm-100/40 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-xs font-semibold text-orange-600">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-warm-900">{point.tag}</span>
                          </div>
                          <Badge variant="secondary">{point.count} 次</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-warm-200 bg-warm-50/80 px-4 py-6 text-sm text-warm-600">
                      当前周期内还没有形成明显薄弱点，可以继续保持学习节奏。
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div
              ref={detailAnimation.ref}
              className="grid grid-cols-1 gap-6 xl:grid-cols-2"
              style={{
                opacity: detailAnimation.isVisible ? 1 : 0,
                transform: detailAnimation.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.25s, transform 0.6s ease-out 0.25s',
              }}
            >
              <Card className="border-warm-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    学科分布
                  </CardTitle>
                  <CardDescription>当前周期内，错题与统一学习记录合并后的学科占比。</CardDescription>
                </CardHeader>
                <CardContent>
                  {subjectBreakdown.length > 0 ? (
                    <div className="space-y-4">
                      {subjectBreakdown.map((item, index) => {
                        const percentage = getBarWidth(item.count, totalSubjectCount);
                        return (
                          <div key={item.key}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="font-medium text-warm-900">{item.label}</span>
                              <span className="text-warm-600">
                                {item.count} 条 ({Math.round((item.count / totalSubjectCount) * 100)}%)
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-warm-100">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-700',
                                  index % 3 === 0 && 'bg-blue-500',
                                  index % 3 === 1 && 'bg-emerald-500',
                                  index % 3 === 2 && 'bg-purple-500',
                                )}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-warm-200 bg-warm-50/80 px-4 py-6 text-sm text-warm-600">
                      当前周期内暂无学科分布数据。
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-warm-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-emerald-500" />
                    模块分布
                  </CardTitle>
                  <CardDescription>统一学习记录的来源模块，可用于判断内测阶段的使用热度。</CardDescription>
                </CardHeader>
                <CardContent>
                  {moduleBreakdown.length > 0 ? (
                    <div className="space-y-4">
                      {moduleBreakdown.map((item, index) => {
                        const percentage = getBarWidth(item.count, totalModuleCount);
                        return (
                          <div key={item.key}>
                            <div className="mb-1 flex items-center justify-between text-sm">
                              <span className="font-medium text-warm-900">{item.label}</span>
                              <span className="text-warm-600">
                                {item.count} 条 ({Math.round((item.count / totalModuleCount) * 100)}%)
                              </span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-warm-100">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all duration-700',
                                  index % 3 === 0 && 'bg-warm-500',
                                  index % 3 === 1 && 'bg-cyan-500',
                                  index % 3 === 2 && 'bg-amber-500',
                                )}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-warm-200 bg-warm-50/80 px-4 py-6 text-sm text-warm-600">
                      当前周期内暂无模块分布数据。
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
              <Card className="border-warm-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    历史报告
                  </CardTitle>
                  <CardDescription>最近生成的报告会持续保存在系统中，便于内测对比。</CardDescription>
                </CardHeader>
                <CardContent>
                  {reports.length > 0 ? (
                    <div className="space-y-3">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between rounded-2xl border border-warm-100 bg-warm-50/60 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-warm-900">
                              {formatDate(report.period_start)} - {formatDate(report.period_end)}
                            </p>
                            <p className="mt-1 text-xs text-warm-600">
                              {report.report_type === 'monthly' ? '月报' : '周报'} · 掌握率 {report.mastery_rate}% ·
                              学习 {report.total_study_minutes} 分钟
                            </p>
                          </div>
                          <Badge variant="outline">{formatDateTime(report.generated_at)}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-warm-200 bg-warm-50/80 px-4 py-6 text-sm text-warm-600">
                      还没有历史报告，当前页刷新后会自动沉淀最新结果。
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-warm-200/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-yellow-500" />
                    内测观察位
                  </CardTitle>
                  <CardDescription>这里展示统一学习记录接入后的关键观测指标。</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-warm-50/80 px-4 py-4">
                      <div className="text-2xl font-semibold text-warm-900">
                        {reportStats?.legacyErrorCount || 0}
                      </div>
                      <div className="mt-1 text-xs text-warm-600">传统错题记录</div>
                    </div>
                    <div className="rounded-2xl bg-warm-50/80 px-4 py-4">
                      <div className="text-2xl font-semibold text-warm-900">
                        {reportStats?.studyAssetCount || 0}
                      </div>
                      <div className="mt-1 text-xs text-warm-600">统一学习记录</div>
                    </div>
                    <div className="rounded-2xl bg-warm-50/80 px-4 py-4">
                      <div className="text-2xl font-semibold text-warm-900">
                        {reportStats?.processedAssetCount || 0}
                      </div>
                      <div className="mt-1 text-xs text-warm-600">已结构化结果</div>
                    </div>
                    <div className="rounded-2xl bg-warm-50/80 px-4 py-4">
                      <div className="text-2xl font-semibold text-warm-900">
                        {reportStats?.totalReviews || 0}
                      </div>
                      <div className="mt-1 text-xs text-warm-600">已生成复习任务</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-2xl border border-warm-200 bg-white/80 px-4 py-4 text-sm leading-6 text-warm-700">
                    日均学习 {reportStats?.avgDailyMinutes || 0} 分钟。当前报告页已经切到统一学习记录链路，适合继续用于内测观察与问题回放。
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-full border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700">
                      PDF 导出将在内测阶段后接入
                    </span>
                    {focusAsset ? (
                      <Link
                        href={buildStudyAssetDetailHref(focusAsset.id)}
                        className="inline-flex items-center gap-2 rounded-full border border-warm-200 px-4 py-2 text-sm font-medium text-warm-700 transition-colors hover:bg-white"
                      >
                        回到学习详情
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ReportsDashboard;
