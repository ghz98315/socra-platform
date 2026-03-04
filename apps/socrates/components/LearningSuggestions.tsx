// =====================================================
// Project Socrates - Learning Suggestions Component
// 学习建议组件 - 基于学习数据提供个性化建议
// =====================================================

'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  BookOpen,
  Award,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WeakPoint {
  tag: string;
  count: number;
  trend?: 'up' | 'down' | 'stable';
}

interface StudyStats {
  total_sessions: number;
  total_duration_minutes: number;
  today_sessions: number;
  today_duration_minutes: number;
}

interface StudentStats {
  total_errors: number;
  mastered_count: number;
  mastery_rate: number;
}

interface LearningSuggestionsProps {
  studentId: string;
  studentName: string;
  weakPoints: WeakPoint[];
  studyStats: StudyStats | null;
  studentStats: StudentStats | null;
}

interface Suggestion {
  id: string;
  type: 'strength' | 'improvement' | 'warning' | 'action';
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

export function LearningSuggestions({
  studentId,
  studentName,
  weakPoints,
  studyStats,
  studentStats,
}: LearningSuggestionsProps) {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);

  // 基于数据生成建议
  const suggestions = useMemo<Suggestion[]>(() => {
    const result: Suggestion[] = [];

    // 1. 学习时长建议
    if (studyStats) {
      const todayMinutes = studyStats.today_duration_minutes;
      const weeklyMinutes = studyStats.total_duration_minutes;
      const avgDaily = weeklyMinutes / 7;

      if (todayMinutes === 0) {
        result.push({
          id: 'no-today-study',
          type: 'warning',
          title: '今日尚未学习',
          description: `${studentName}今天还没有进行学习，建议安排一些学习时间。`,
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'text-orange-600 bg-orange-100',
          action: {
            label: '开始学习',
          },
        });
      } else if (todayMinutes < 15) {
        result.push({
          id: 'short-today-study',
          type: 'improvement',
          title: '今日学习时间较短',
          description: `今天只学习了 ${todayMinutes} 分钟，建议每天保持 30 分钟以上的学习时间。`,
          icon: <Clock className="w-5 h-5" />,
          color: 'text-yellow-600 bg-yellow-100',
        });
      } else if (todayMinutes >= 30) {
        result.push({
          id: 'good-today-study',
          type: 'strength',
          title: '今日学习表现优秀',
          description: `今天已学习 ${Math.floor(todayMinutes / 60)} 小时 ${todayMinutes % 60} 分钟，保持这个节奏！`,
          icon: <Award className="w-5 h-5" />,
          color: 'text-green-600 bg-green-100',
        });
      }

      if (avgDaily < 20) {
        result.push({
          id: 'low-weekly-average',
          type: 'improvement',
          title: '本周平均学习时间较少',
          description: `本周平均每天学习 ${avgDaily.toFixed(0)} 分钟，建议增加到每天 30 分钟以上以提高学习效果。`,
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-yellow-600 bg-yellow-100',
        });
      }
    }

    // 2. 错题掌握率建议
    if (studentStats) {
      const masteryRate = studentStats.mastery_rate;
      const totalErrors = studentStats.total_errors;

      if (totalErrors === 0) {
        result.push({
          id: 'no-errors',
          type: 'strength',
          title: '暂无错题记录',
          description: '太棒了！继续保持认真学习的好习惯。',
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-green-600 bg-green-100',
        });
      } else if (masteryRate >= 80) {
        result.push({
          id: 'high-mastery',
          type: 'strength',
          title: '错题掌握率优秀',
          description: `已掌握 ${masteryRate}% 的错题，学习效果很好！继续保持。`,
          icon: <TrendingUp className="w-5 h-5" />,
          color: 'text-green-600 bg-green-100',
        });
      } else if (masteryRate < 50) {
        result.push({
          id: 'low-mastery',
          type: 'warning',
          title: '错题掌握率需要提高',
          description: `目前掌握率只有 ${masteryRate}%，建议加强对错题的复习，确保真正理解。`,
          icon: <TrendingDown className="w-5 h-5" />,
          color: 'text-red-600 bg-red-100',
          action: {
            label: '去复习',
          },
        });
      }
    }

    // 3. 薄弱知识点建议
    if (weakPoints && weakPoints.length > 0) {
      const topWeakPoint = weakPoints[0];
      const increasingWeakPoints = weakPoints.filter(wp => wp.trend === 'up');

      if (topWeakPoint) {
        result.push({
          id: 'weak-point-focus',
          type: 'action',
          title: `重点关注：${topWeakPoint.tag}`,
          description: `这个知识点出现了 ${topWeakPoint.count} 次错误，是当前最薄弱的环节。建议针对性地进行练习。`,
          icon: <Target className="w-5 h-5" />,
          color: 'text-warm-600 bg-warm-100',
          action: {
            label: '专项练习',
          },
        });
      }

      if (increasingWeakPoints.length > 0) {
        result.push({
          id: 'increasing-weak-points',
          type: 'warning',
          title: '部分知识点错误增加',
          description: `${increasingWeakPoints.map(wp => wp.tag).join('、')} 等知识点的错误次数在增加，需要注意。`,
          icon: <AlertTriangle className="w-5 h-5" />,
          color: 'text-orange-600 bg-orange-100',
        });
      }
    }

    // 4. 通用建议
    if (result.length === 0) {
      result.push({
        id: 'general-suggestion',
        type: 'action',
        title: '继续保持学习习惯',
        description: '定期复习错题，保持每天的学习节奏，学习效果会越来越好！',
        icon: <Lightbulb className="w-5 h-5" />,
        color: 'text-warm-600 bg-warm-100',
      });
    }

    return result;
  }, [studyStats, studentStats, weakPoints, studentName]);

  const getTypeLabel = (type: Suggestion['type']) => {
    const labels = {
      strength: '优势',
      improvement: '可提升',
      warning: '需注意',
      action: '建议',
    };
    return labels[type];
  };

  const getTypeColor = (type: Suggestion['type']) => {
    const colors = {
      strength: 'bg-green-100 text-green-700',
      improvement: 'bg-yellow-100 text-yellow-700',
      warning: 'bg-red-100 text-red-700',
      action: 'bg-warm-100 text-warm-700',
    };
    return colors[type];
  };

  return (
    <Card className="border-warm-100 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warm-900">
          <Lightbulb className="w-5 h-5 text-warm-500" />
          学习建议
        </CardTitle>
        <CardDescription>
          基于 {studentName} 的学习数据，提供个性化建议
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className={cn(
                'p-4 rounded-xl border border-warm-100 transition-all duration-300',
                'hover:shadow-sm cursor-pointer',
                expandedSuggestion === suggestion.id ? 'bg-white shadow-sm' : 'bg-warm-50/50'
              )}
              onClick={() => setExpandedSuggestion(
                expandedSuggestion === suggestion.id ? null : suggestion.id
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0', suggestion.color)}>
                  {suggestion.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', getTypeColor(suggestion.type))}>
                      {getTypeLabel(suggestion.type)}
                    </span>
                    <h4 className="font-medium text-warm-900 text-sm">{suggestion.title}</h4>
                  </div>
                  <p className="text-xs text-warm-600 line-clamp-2">
                    {suggestion.description}
                  </p>

                  {expandedSuggestion === suggestion.id && suggestion.action && (
                    <div className="mt-3 pt-3 border-t border-warm-100">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-warm-600 hover:text-warm-700 hover:bg-warm-50"
                      >
                        {suggestion.action.label}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-warm-100">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-warm-600">
                {studyStats?.today_duration_minutes || 0}
              </p>
              <p className="text-xs text-warm-400">今日学习(分钟)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-600">
                {studentStats?.mastery_rate || 0}%
              </p>
              <p className="text-xs text-warm-400">掌握率</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-warm-600">
                {weakPoints?.length || 0}
              </p>
              <p className="text-xs text-warm-400">薄弱知识点</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
