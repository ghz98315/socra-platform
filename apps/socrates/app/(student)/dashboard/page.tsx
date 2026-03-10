// =====================================================
// Project Socrates - Student Dashboard Page
// 学生仪表盘首页
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Clock,
  Flame,
  Star,
  ChevronRight,
  Camera,
  Bookmark,
  Calendar,
  BarChart3,
  Target,
  TrendingUp,
  Zap,
  Gift,
  Loader2,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { PointsDisplay } from '@/components/points/PointsDisplay';

// 学科配置
const subjectConfig: Record<string, {
  name: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  math: {
    name: '数学',
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  chinese: {
    name: '语文',
    icon: BookOpen,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  english: {
    name: '英语',
    icon: TrendingUp,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
  physics: {
    name: '物理',
    icon: Zap,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    pro: true,
  },
  chemistry: {
    name: '化学',
    icon: Gift,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    pro: true,
  },
};

interface SubjectProgress {
  subject: string;
  masteryLevel: number;
  pendingReview: number;
  weakPoints: string[];
  todayCount: number;
  totalMastered: number;
  totalNodes: number;
}

interface TodayStats {
  todayErrors: number;
  todayMinutes: number;
  streakDays: number;
  totalPoints: number;
}

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<TodayStats>({
    todayErrors: 0,
    todayMinutes: 0,
    streakDays: 0,
    totalPoints: 0,
  });
  const [subjects, setSubjects] = useState<SubjectProgress[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return '夜深了';
    if (hour < 9) return '早上好';
    if (hour < 12) return '上午好';
    if (hour < 14) return '中午好';
    if (hour < 18) return '下午好';
    if (hour < 22) return '晚上好';
    return '夜深了';
  };

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);

        // 并行请求
        const [statsRes, subjectsRes] = await Promise.all([
          fetch(`/api/dashboard/stats?user_id=${profile.id}`),
          fetch(`/api/dashboard/subjects?user_id=${profile.id}`),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (subjectsRes.ok) {
          const subjectsData = await subjectsRes.json();
          setSubjects(subjectsData.subjects || []);
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile?.id]);

  // 开始学科学习
  const handleStartSubject = (subject: string, isPro?: boolean) => {
    if (isPro) {
      router.push('/subscription');
    } else {
      router.push(`/workbench?subject=${subject}`);
    }
  };

  // 格式化时间
  const formatMinutes = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-white to-orange-50">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()}，{profile?.display_name || '同学'} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              今天也要加油学习哦！
            </p>
          </div>
          <PointsDisplay />
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-24">
        {/* 今日统计 */}
        <div className="grid grid-cols-4 gap-2 mb-6 mt-4">
          <Card className="bg-white/80">
            <CardContent className="p-3 text-center">
              <BookOpen className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{stats.todayErrors}</p>
              <p className="text-xs text-gray-500">今日错题</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80">
            <CardContent className="p-3 text-center">
              <Clock className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{formatMinutes(stats.todayMinutes)}</p>
              <p className="text-xs text-gray-500">今日学习</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80">
            <CardContent className="p-3 text-center">
              <Flame className="w-5 h-5 text-orange-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{stats.streakDays}</p>
              <p className="text-xs text-gray-500">连续天数</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80">
            <CardContent className="p-3 text-center">
              <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
              <p className="text-xl font-bold text-gray-900">{stats.totalPoints}</p>
              <p className="text-xs text-gray-500">总积分</p>
            </CardContent>
          </Card>
        </div>

        {/* 学科卡片 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">学科进度</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/knowledge')}
              className="text-warm-600"
            >
              知识图谱
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(subjectConfig).map(([key, config]) => {
                const progress = subjects.find(s => s.subject === key);
                const Icon = config.icon;
                const isPro = config.pro;
                const mastery = progress?.masteryLevel || 0;
                const pending = progress?.pendingReview || 0;
                const weakPoint = progress?.weakPoints?.[0];

                return (
                  <Card
                    key={key}
                    className={cn(
                      'cursor-pointer transition-all hover:shadow-md',
                      config.borderColor,
                      isPro && 'opacity-90'
                    )}
                    onClick={() => handleStartSubject(key, isPro)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bgColor)}>
                          <Icon className={cn('w-5 h-5', config.color)} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{config.name}</p>
                          {isPro && (
                            <Badge className="text-xs bg-yellow-100 text-yellow-700">Pro</Badge>
                          )}
                        </div>
                      </div>

                      {!isPro && (
                        <>
                          <div className="mb-2">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-500">掌握度</span>
                              <span className={cn('font-medium', config.color)}>{mastery}%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={cn('h-full rounded-full transition-all', config.bgColor.replace('50', '400'))}
                                style={{ width: `${mastery}%` }}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            {pending > 0 && (
                              <span className="text-orange-600">
                                待复习 {pending} 题
                              </span>
                            )}
                            {weakPoint && (
                              <span className="text-gray-400 truncate max-w-[100px]">
                                薄弱: {weakPoint}
                              </span>
                            )}
                          </div>
                        </>
                      )}

                      {isPro && (
                        <p className="text-xs text-gray-500">
                          开通 Pro 解锁更多学科
                        </p>
                      )}

                      <Button
                        size="sm"
                        className={cn('w-full mt-3', isPro ? 'bg-yellow-500 hover:bg-yellow-600' : '')}
                        variant={isPro ? 'default' : 'outline'}
                      >
                        {isPro ? '开通 Pro' : '开始学习'}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* 快捷操作 */}
        <Card className="mb-6 bg-gradient-to-r from-warm-50 to-orange-50 border-warm-200">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3">快捷操作</h3>
            <div className="grid grid-cols-4 gap-3">
              <button
                onClick={() => router.push('/workbench')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white hover:shadow-md transition-all"
              >
                <Camera className="w-6 h-6 text-warm-500" />
                <span className="text-xs text-gray-600">上传错题</span>
              </button>
              <button
                onClick={() => router.push('/error-book')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white hover:shadow-md transition-all"
              >
                <Bookmark className="w-6 h-6 text-blue-500" />
                <span className="text-xs text-gray-600">错题本</span>
              </button>
              <button
                onClick={() => router.push('/review')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white hover:shadow-md transition-all"
              >
                <Calendar className="w-6 h-6 text-green-500" />
                <span className="text-xs text-gray-600">复习计划</span>
              </button>
              <button
                onClick={() => router.push('/knowledge')}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-white hover:shadow-md transition-all"
              >
                <BarChart3 className="w-6 h-6 text-purple-500" />
                <span className="text-xs text-gray-600">知识图谱</span>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* 今日待办 (家长任务) */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">今日待办</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/my-tasks')}
                className="text-warm-600"
              >
                查看全部
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-gray-400 text-sm">
              暂无待办任务
            </div>
          </CardContent>
        </Card>

        {/* 学习提示 */}
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 mb-1">今日学习目标</p>
                <p className="text-sm text-gray-600">
                  每天坚持学习30分钟，掌握3个知识点，进步看得见！
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
