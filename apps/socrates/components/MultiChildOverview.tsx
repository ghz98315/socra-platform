// =====================================================
// Project Socrates - Multi-Child Overview Component
// 多子女概览组件
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  TrendingUp,
  Clock,
  Target,
  CheckCircle,
  Flame,
  BookOpen,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChildStats {
  id: string;
  display_name: string;
  grade_level?: number;
  total_errors: number;
  mastered_count: number;
  mastery_rate: number;
  today_minutes: number;
  streak_days: number;
  last_active: string | null;
  weak_points: string[];
  guardian_signal: {
    level: 'green' | 'yellow' | 'red';
    label: string;
    reason: string;
  } | null;
  top_blocker_label: string | null;
  top_blocker_summary: string | null;
}

interface MultiChildOverviewProps {
  parentId: string;
  onSelectChild: (childId: string, childName: string) => void;
  onAddChild: () => void;
  className?: string;
}

export function MultiChildOverview({
  parentId,
  onSelectChild,
  onAddChild,
  className,
}: MultiChildOverviewProps) {
  const [children, setChildren] = useState<ChildStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getSignalBadgeClassName = (level: 'green' | 'yellow' | 'red') => {
    switch (level) {
      case 'red':
        return 'bg-red-100 text-red-700';
      case 'yellow':
        return 'bg-amber-100 text-amber-700';
      default:
        return 'bg-emerald-100 text-emerald-700';
    }
  };

  useEffect(() => {
    const fetchChildrenStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // 获取子女列表
        const studentsRes = await fetch('/api/students');
        if (!studentsRes.ok) throw new Error('Failed to fetch students');
        const studentsData = await studentsRes.json();
        const students = studentsData.data || [];

        // 获取每个子女的统计数据
        const childrenWithStats = await Promise.all(
          students.map(async (student: any) => {
            try {
              const statsRes = await fetch(
                `/api/student/stats?student_id=${student.id}&days=7`
              );
              if (!statsRes.ok) {
                return {
                  ...student,
                  total_errors: 0,
                  mastered_count: 0,
                  mastery_rate: 0,
                  today_minutes: 0,
                  streak_days: 0,
                  last_active: null,
                  weak_points: [],
                  guardian_signal: null,
                  top_blocker_label: null,
                  top_blocker_summary: null,
                };
              }
              const statsData = await statsRes.json();

              return {
                id: student.id,
                display_name: student.display_name,
                grade_level: student.grade_level,
                total_errors: statsData.data?.total_errors || 0,
                mastered_count: statsData.data?.mastered_count || 0,
                mastery_rate: statsData.data?.mastery_rate || 0,
                today_minutes: statsData.data?.today_minutes || 0,
                streak_days: statsData.data?.streak_days || 0,
                last_active: statsData.data?.last_active || null,
                weak_points: ((statsData.data?.weak_points || []) as Array<{ tag: string }>)
                  .slice(0, 3)
                  .map((item) => item.tag),
                guardian_signal: statsData.data?.guardian_signal || null,
                top_blocker_label: statsData.data?.top_blocker?.label || null,
                top_blocker_summary:
                  statsData.data?.top_blocker?.root_cause_summary || statsData.data?.focus_summary || null,
              };
            } catch {
              return {
                ...student,
                total_errors: 0,
                mastered_count: 0,
                mastery_rate: 0,
                today_minutes: 0,
                streak_days: 0,
                last_active: null,
                weak_points: [],
                guardian_signal: null,
                top_blocker_label: null,
                top_blocker_summary: null,
              };
            }
          })
        );

        setChildren(childrenWithStats);
      } catch (err) {
        console.error('Error fetching children stats:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (parentId) {
      fetchChildrenStats();
    }
  }, [parentId]);

  // 计算汇总数据
  const totalStats = {
    totalChildren: children.length,
    totalErrors: children.reduce((sum, c) => sum + c.total_errors, 0),
    totalMastered: children.reduce((sum, c) => sum + c.mastered_count, 0),
    totalTodayMinutes: children.reduce((sum, c) => sum + c.today_minutes, 0),
    avgMasteryRate: children.length > 0
      ? Math.round(children.reduce((sum, c) => sum + c.mastery_rate, 0) / children.length)
      : 0,
    activeToday: children.filter((c) => c.today_minutes > 0).length,
  };

  // 获取年级标签
  const getGradeLabel = (grade?: number) => {
    if (!grade) return '';
    return `${grade}年级`;
  };

  // 获取首字母
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  // 格式化时间
  const formatLastActive = (dateStr: string | null) => {
    if (!dateStr) return '暂无记录';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (loading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-8 bg-gray-200 rounded mb-2" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">{error}</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => window.location.reload()}>
            重试
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (children.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有添加孩子</h3>
          <p className="text-gray-500 mb-4">添加孩子后可以查看他们的学习进度</p>
          <Button onClick={onAddChild}>
            添加第一个孩子
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* 汇总统计卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700">{totalStats.totalChildren}</p>
                <p className="text-xs text-blue-600">孩子总数</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700">{totalStats.totalMastered}</p>
                <p className="text-xs text-green-600">已掌握题目</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-700">{totalStats.totalTodayMinutes}</p>
                <p className="text-xs text-orange-600">今日学习(分钟)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700">{totalStats.avgMasteryRate}%</p>
                <p className="text-xs text-purple-600">平均掌握率</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 孩子列表卡片 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-warm-500" />
              孩子学习概览
            </CardTitle>
            <Badge variant="secondary">
              {totalStats.activeToday}/{totalStats.totalChildren} 今日活跃
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {children.map((child, index) => (
              <div
                key={child.id}
                className={cn(
                  'p-4 rounded-xl border border-gray-100 bg-white',
                  'hover:shadow-md hover:border-warm-200 transition-all cursor-pointer',
                  'flex items-center gap-4'
                )}
                onClick={() => onSelectChild(child.id, child.display_name)}
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* 头像 */}
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-br from-warm-400 to-warm-600 text-white text-lg font-bold">
                    {getInitials(child.display_name)}
                  </AvatarFallback>
                </Avatar>

                {/* 基本信息 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900 truncate">{child.display_name}</h4>
                    {child.grade_level && (
                      <Badge variant="outline" className="text-xs">
                        {getGradeLabel(child.grade_level)}
                      </Badge>
                    )}
                    {child.streak_days > 0 && (
                      <Badge className="bg-orange-100 text-orange-700 text-xs gap-1">
                        <Flame className="w-3 h-3" />
                        {child.streak_days}天
                      </Badge>
                    )}
                    {child.guardian_signal ? (
                      <Badge className={getSignalBadgeClassName(child.guardian_signal.level)}>
                        {child.guardian_signal.label}
                      </Badge>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      错题: {child.total_errors}
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      掌握: {child.mastered_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      今日: {child.today_minutes}分钟
                    </span>
                  </div>
                  {/* 薄弱点提示 */}
                  {child.weak_points.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                      <AlertCircle className="w-3 h-3" />
                      <span>薄弱点: {child.weak_points.join(', ')}</span>
                    </div>
                  )}
                  {child.top_blocker_label || child.top_blocker_summary ? (
                    <div className="mt-2 rounded-lg bg-warm-50 px-3 py-2 text-xs text-warm-700">
                      <div className="font-medium text-warm-800">
                        {child.top_blocker_label ? `当前最大卡点: ${child.top_blocker_label}` : '当前卡点摘要'}
                      </div>
                      {child.top_blocker_summary ? (
                        <div className="mt-1 line-clamp-2">{child.top_blocker_summary}</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {/* 掌握率进度 */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{child.mastery_rate}%</p>
                    <p className="text-xs text-gray-500">掌握率</p>
                  </div>
                  <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        child.mastery_rate >= 70 ? 'bg-green-500' :
                        child.mastery_rate >= 40 ? 'bg-yellow-500' : 'bg-orange-500'
                      )}
                      style={{ width: `${child.mastery_rate}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-400">{formatLastActive(child.last_active)}</p>
                </div>

                {/* 箭头 */}
                <ChevronRight className="w-5 h-5 text-gray-300" />
              </div>
            ))}
          </div>

          {/* 添加孩子按钮 */}
          <Button
            variant="outline"
            className="w-full mt-4 border-dashed"
            onClick={onAddChild}
          >
            <Users className="w-4 h-4 mr-2" />
            添加更多孩子
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
