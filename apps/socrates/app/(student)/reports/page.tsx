// =====================================================
// Project Socrates - Learning Reports Page
// 学习报告页面 - 苹果风格动画
// =====================================================

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  BarChart3,
  Calendar,
  Download,
  Loader2,
  TrendingUp,
  Target,
  Award,
  Clock,
  BookOpen,
  RefreshCw,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader, StatCard, StatsRow } from '@/components/PageHeader';
import { cn } from '@/lib/utils';

// 滚动动画 Hook
function useScrollAnimation(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold }
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
}

interface WeakPoint {
  tag: string;
  count: number;
  trend?: 'up' | 'down' | 'stable';
}

interface Report {
  id: string;
  report_type: string;
  period_start: string;
  period_end: string;
  total_errors_analyzed: number;
  total_reviews_completed: number;
  mastery_rate: number;
  weak_points: WeakPoint[];
  total_study_minutes: number;
  generated_at: string;
}

export default function ReportsPage() {
  const { profile } = useAuth();

  const [reportStats, setReportStats] = useState<ReportStats | null>(null);
  const [weakPoints, setWeakPoints] = useState<WeakPoint[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<7 | 14 | 30>(7);

  // 滚动动画 refs
  const statsAnimation = useScrollAnimation();
  const chartAnimation = useScrollAnimation();
  const historyAnimation = useScrollAnimation();

  const loadReportData = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      // 生成新报告
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: profile.id,
          report_type: selectedPeriod === 7 ? 'weekly' : 'monthly',
          days: selectedPeriod,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setReportStats(result.data.stats);
        setWeakPoints(result.data.weakPoints);
        setAiAnalysis(result.data.aiAnalysis);
      }

      // 获取历史报告
      const historyResponse = await fetch(`/api/reports/generate?student_id=${profile.id}&limit=5`);
      if (historyResponse.ok) {
        const historyResult = await historyResponse.json();
        setReports(historyResult.data || []);
      }
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, selectedPeriod]);

  // 加载报告数据
  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const handleRefresh = async () => {
    setGenerating(true);
    await loadReportData();
    setGenerating(false);
  };

  const formatPeriod = (days: number) => {
    if (days === 7) return '本周';
    if (days === 14) return '两周';
    return '本月';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-white to-warm-100">
      {/* 页面标题卡片 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <PageHeader
          title="学习报告"
          description={`查看过去${formatPeriod(selectedPeriod)}的学习数据和AI分析`}
          icon={BarChart3}
          iconColor="text-purple-500"
          actions={
            <div className="flex items-center gap-2">
              {/* 时间段选择 */}
              <div className="flex bg-warm-100/50 rounded-lg p-1">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setSelectedPeriod(days as 7 | 14 | 30)}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md transition-all duration-200",
                      selectedPeriod === days
                        ? "bg-white shadow-sm font-medium text-warm-900"
                        : "text-warm-600 hover:text-warm-900"
                    )}
                  >
                    {formatPeriod(days)}
                  </button>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={generating}
                className="gap-2 border-warm-200 hover:bg-warm-100 hover:border-warm-300 rounded-full"
              >
                <RefreshCw className={cn("w-4 h-4", generating && "animate-spin")} />
                刷新
              </Button>
            </div>
          }
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-warm-500" />
            <p className="mt-4 text-warm-600">正在生成报告...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 统计卡片行 - 带滚动动画 */}
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
                  label="分析错题"
                  value={reportStats?.totalErrors || 0}
                  icon={Target}
                  color="text-red-500"
                  delay={0}
                />
                <StatCard
                  label="已掌握"
                  value={reportStats?.mastered || 0}
                  icon={Award}
                  color="text-green-500"
                  delay={0.1}
                />
                <StatCard
                  label="学习时长"
                  value={`${reportStats?.totalStudyMinutes || 0}分钟`}
                  icon={Clock}
                  color="text-blue-500"
                  delay={0.2}
                />
                <StatCard
                  label="掌握率"
                  value={`${reportStats?.masteryRate || 0}%`}
                  icon={TrendingUp}
                  color="text-purple-500"
                  trend={reportStats && reportStats.masteryRate >= 70 ? { value: 10, isPositive: true } : undefined}
                  delay={0.3}
                />
              </StatsRow>
            </div>

            {/* AI分析卡片 - 带滚动动画 */}
            <div
              ref={chartAnimation.ref}
              style={{
                opacity: chartAnimation.isVisible ? 1 : 0,
                transform: chartAnimation.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s',
              }}
            >
              <Card className="border-warm-200/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warm-900">
                    <Sparkles className="w-5 h-5 text-warm-500" />
                    AI 学习分析
                  </CardTitle>
                  <CardDescription className="text-warm-600">
                    基于你的学习数据，AI 给出的个性化建议
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {aiAnalysis ? (
                      <div className="whitespace-pre-wrap text-sm leading-relaxed text-warm-900">
                        {aiAnalysis}
                      </div>
                    ) : (
                      <p className="text-warm-600">
                        暂无足够数据生成分析，继续学习后将自动生成报告。
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 薄弱知识点 + 历史报告 */}
            <div
              ref={historyAnimation.ref}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              style={{
                opacity: historyAnimation.isVisible ? 1 : 0,
                transform: historyAnimation.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s',
              }}
            >
              {/* 薄弱知识点 */}
              <Card className="border-warm-200/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-warm-900">
                    <Target className="w-5 h-5 text-orange-500" />
                    薄弱知识点
                  </CardTitle>
                  <CardDescription className="text-warm-600">
                    需要重点复习的知识点
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {weakPoints.length > 0 ? (
                    <div className="space-y-3">
                      {weakPoints.slice(0, 6).map((point, index) => (
                        <div
                          key={point.tag}
                          className="flex items-center justify-between p-3 rounded-xl bg-warm-100/30 hover:bg-warm-100/50 transition-colors"
                          style={{
                            opacity: historyAnimation.isVisible ? 1 : 0,
                            transform: historyAnimation.isVisible ? 'translateX(0)' : 'translateX(-20px)',
                            transition: `opacity 0.4s ease-out ${0.4 + index * 0.1}s, transform 0.4s ease-out ${0.4 + index * 0.1}s`,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-medium">
                              {index + 1}
                            </span>
                            <span className="text-sm font-medium text-warm-900">{point.tag}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs bg-warm-100 text-warm-700">
                            {point.count}次
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-warm-600">
                      <Award className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">太棒了！暂无明显薄弱点</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 历史报告 */}
              <Card className="border-warm-200/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-warm-900">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    历史报告
                  </CardTitle>
                  <CardDescription className="text-warm-600">
                    查看之前的学情分析
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {reports.length > 0 ? (
                    <div className="space-y-3">
                      {reports.slice(0, 5).map((report, index) => (
                        <div
                          key={report.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-warm-100/30 hover:bg-warm-100/50 transition-colors cursor-pointer group"
                          style={{
                            opacity: historyAnimation.isVisible ? 1 : 0,
                            transform: historyAnimation.isVisible ? 'translateX(0)' : 'translateX(20px)',
                            transition: `opacity 0.4s ease-out ${0.4 + index * 0.1}s, transform 0.4s ease-out ${0.4 + index * 0.1}s`,
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                              <BookOpen className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-warm-900">
                                {formatDate(report.period_start)} - {formatDate(report.period_end)}
                              </p>
                              <p className="text-xs text-warm-600">
                                掌握率 {report.mastery_rate}%
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-warm-500 group-hover:text-warm-700 transition-colors" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-warm-600">
                      <Calendar className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">暂无历史报告</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 学习趋势图 */}
            <div
              className="mt-6"
              style={{
                opacity: historyAnimation.isVisible ? 1 : 0,
                transform: historyAnimation.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.4s, transform 0.6s ease-out 0.4s',
              }}
            >
              <Card className="border-warm-200/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-warm-900">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    学习趋势
                  </CardTitle>
                  <CardDescription className="text-warm-600">
                    过去{selectedPeriod}天的学习情况
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Simple Bar Chart Visualization */}
                  <div className="flex items-end justify-between gap-2 h-32 px-2">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const height = Math.max(20, Math.random() * 100);
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className="w-full bg-gradient-to-t from-warm-500 to-warm-400 rounded-t-md transition-all duration-500"
                            style={{
                              height: `${height}%`,
                              animationDelay: `${i * 0.1}s`,
                            }}
                          />
                          <span className="text-xs text-warm-600">
                            {['一', '二', '三', '四', '五', '六', '日'][i]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm bg-warm-500" />
                      <span className="text-warm-600">学习时长 (分钟)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-warm-600">日均:</span>
                      <span className="font-medium text-warm-900">
                        {reportStats?.avgDailyMinutes || 0}分钟
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 科目分布 */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6"
              style={{
                opacity: historyAnimation.isVisible ? 1 : 0,
                transform: historyAnimation.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.5s, transform 0.6s ease-out 0.5s',
              }}
            >
              {/* 科目分布 */}
              <Card className="border-warm-200/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-warm-900">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    科目分布
                  </CardTitle>
                  <CardDescription className="text-warm-600">
                    各科目错题数量占比
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: '数学', count: Math.floor(Math.random() * 20) + 5, color: 'bg-blue-500' },
                      { name: '物理', count: Math.floor(Math.random() * 15) + 3, color: 'bg-purple-500' },
                      { name: '化学', count: Math.floor(Math.random() * 10) + 2, color: 'bg-green-500' },
                    ].map((subject, i) => {
                      const total = reportStats?.totalErrors || 30;
                      const percentage = Math.round((subject.count / total) * 100);
                      return (
                        <div key={subject.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-warm-900">{subject.name}</span>
                            <span className="text-sm text-warm-600">
                              {subject.count}题 ({percentage}%)
                            </span>
                          </div>
                          <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full transition-all duration-1000', subject.color)}
                              style={{
                                width: `${percentage}%`,
                                animationDelay: `${i * 0.2}s`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 学习成就 */}
              <Card className="border-warm-200/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-warm-900">
                    <Award className="w-5 h-5 text-yellow-500" />
                    学习成就
                  </CardTitle>
                  <CardDescription className="text-warm-600">
                    你的学习里程碑
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: '🎯', label: '错题攻克', value: reportStats?.mastered || 0, target: 10 },
                      { icon: '⏰', label: '累计学习', value: `${reportStats?.totalStudyMinutes || 0}分`, target: '300分' },
                      { icon: '🔥', label: '连续学习', value: '3天', target: '7天' },
                    ].map((achievement, i) => (
                      <div
                        key={achievement.label}
                        className="text-center p-3 rounded-xl bg-warm-100/30 hover:bg-warm-100/50 transition-colors"
                      >
                        <div className="text-2xl mb-1">{achievement.icon}</div>
                        <div className="text-lg font-bold text-warm-900">{achievement.value}</div>
                        <div className="text-xs text-warm-600">{achievement.label}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 导出按钮 */}
            <div className="flex justify-center pt-6">
              <Button
                variant="outline"
                className="gap-2 border-warm-200 hover:bg-warm-100 hover:border-warm-300 rounded-full"
                onClick={() => {
                  // TODO: Implement report PDF export
                  alert('报告导出功能即将上线！');
                }}
              >
                <Download className="w-4 h-4" />
                导出PDF报告
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
