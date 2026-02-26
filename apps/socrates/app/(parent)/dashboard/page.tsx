// =====================================================
// Project Socrates - Parent Dashboard
// 方案二：分层卡片设计 + 苹果风格动画
// =====================================================

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  Users,
  TrendingUp,
  CheckCircle,
  Loader2,
  Plus,
  Trash2,
  Home,
  Clock,
  Target,
  Award,
  BarChart3,
  UserPlus,
  Sparkles,
  BookOpen,
  Lock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { StudentStats } from '@/lib/supabase/types';
import { LearningHeatmap } from '@/components/LearningHeatmap';
import { WeakKnowledgePoints } from '@/components/WeakKnowledgePoints';
import { TodayStats, WeeklyStats } from '@/components/StudyTimeCards';
import { Input } from '@/components/ui/input';
import { PageHeader, StatCard, StatsRow } from '@/components/PageHeader';
import { cn } from '@/lib/utils';

interface StudyTimeStats {
  total_sessions: number;
  total_duration_minutes: number;
  today_sessions: number;
  today_duration_minutes: number;
}

// 滚动淡入动画 Hook
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

export default function DashboardPage() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);

  // 权限检查：只有家长角色才能访问此页面
  useEffect(() => {
    if (!authLoading && profile) {
      if (profile.role !== 'parent') {
        setAccessDenied(true);
      }
    }
  }, [authLoading, profile]);

  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [students, setStudents] = useState<Array<{ id: string; display_name: string; grade_level: number }>>([]);
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [heatmapData, setHeatmapData] = useState<{ date: string; count: number }[]>([]);
  const [weakPoints, setWeakPoints] = useState<{ tag: string; count: number; trend?: 'up' | 'down' | 'stable' }[]>([]);
  const [studyStats, setStudyStats] = useState<StudyTimeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);

  // 滚动动画 refs
  const statsAnimation = useScrollAnimation();
  const studyTimeAnimation = useScrollAnimation();
  const chartsAnimation = useScrollAnimation();
  const studentsAnimation = useScrollAnimation();
  const activityAnimation = useScrollAnimation();

  const handleAddStudent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const display_name = formData.get('studentName') as string;
    const phone = formData.get('phone') as string;
    const password = formData.get('password') as string;
    const grade_level = formData.get('grade') as string;

    try {
      const response = await fetch('/api/students/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ display_name, phone, password, grade_level }),
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`添加失败: ${error.error || '未知错误'}`);
        return;
      }

      const result = await response.json();
      alert(`学生 ${result.data.display_name} 添加成功！`);
      setShowAddStudentModal(false);
      window.location.reload();
    } catch (error) {
      console.error('Error adding student:', error);
      alert(`添加失败: ${error}`);
    }
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;

    try {
      const response = await fetch(`/api/students/${studentToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(`删除失败: ${error.error || '未知错误'}`);
        return;
      }

      alert(`学生 ${studentToDelete.name} 已删除`);
      setShowDeleteConfirm(false);
      setStudentToDelete(null);

      if (selectedStudent === studentToDelete.id) {
        setSelectedStudent(null);
        setSelectedStudentName('');
        setStats(null);
      }

      window.location.reload();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert(`删除失败: ${error}`);
    }
  };

  // 加载学习时长统计
  const loadStudyTimeStats = useCallback(async () => {
    if (!selectedStudent) {
      setStudyStats(null);
      return;
    }

    try {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const response = await fetch(`/api/study/session?student_id=${selectedStudent}&start_date=${weekAgo}`);

      if (!response.ok) {
        console.error('Failed to load study stats');
        return;
      }

      const result = await response.json();
      setStudyStats(result.data || null);
    } catch (error) {
      console.error('Error loading study stats:', error);
    }
  }, [selectedStudent]);

  // 加载学生列表
  useEffect(() => {
    const loadStudents = async () => {
      if (authLoading || !profile) return;

      try {
        const response = await fetch('/api/students');
        if (!response.ok) {
          console.error('Failed to load students');
          return;
        }
        const result = await response.json();
        setStudents(result.data || []);
      } catch (error) {
        console.error('Error loading students:', error);
      }
    };
    loadStudents();
  }, [profile, authLoading]);

  // 加载仪表板数据
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!selectedStudent) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/student/stats?student_id=${selectedStudent}&days=30`);

        if (!response.ok) {
          console.error('Failed to load student stats');
          setLoading(false);
          return;
        }

        const result = await response.json();
        const data = result.data;

        setStats({
          student_id: selectedStudent,
          total_errors: data.total_errors,
          mastered_count: data.mastered_count,
          mastery_rate: data.mastery_rate,
        });

        setHeatmapData(data.heatmap_data);
        setWeakPoints(data.weak_points);
        await loadStudyTimeStats();
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }

      setLoading(false);
    };

    loadDashboardData();
  }, [selectedStudent, loadStudyTimeStats]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950/30">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-40 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-cyan-200/20 dark:bg-cyan-900/20 rounded-full blur-3xl" />
      </div>

      {/* 页面标题卡片 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <PageHeader
          title={selectedStudent ? `${selectedStudentName} 的学习报告` : '家长中心'}
          description={selectedStudent ? '查看详细学习数据和进度' : '管理学生账户，查看学习进度'}
          icon={Home}
          iconColor="text-blue-500"
          actions={
            <div className="flex items-center gap-2">
              {selectedStudent && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setStudentToDelete({ id: selectedStudent, name: selectedStudentName });
                      setShowDeleteConfirm(true);
                    }}
                    className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    删除学生
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedStudent(null);
                      setSelectedStudentName('');
                    }}
                  >
                    切换学生
                  </Button>
                </>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowAddStudentModal(true)}
                className="gap-2"
              >
                <UserPlus className="w-4 h-4" />
                添加学生
              </Button>
            </div>
          }
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-muted-foreground" />
          </div>
        ) : selectedStudent ? (
          /* Individual Student View */
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
                  label="错题总数"
                  value={stats?.total_errors || 0}
                  icon={Target}
                  color="text-red-500"
                  delay={0}
                />
                <StatCard
                  label="已掌握"
                  value={stats?.mastered_count || 0}
                  icon={CheckCircle}
                  color="text-green-500"
                  trend={{ value: 12, isPositive: true }}
                  delay={0.1}
                />
                <StatCard
                  label="复习完成"
                  value="0"
                  icon={Award}
                  color="text-orange-500"
                  delay={0.2}
                />
                <StatCard
                  label="掌握率"
                  value={`${stats?.mastery_rate || 0}%`}
                  icon={TrendingUp}
                  color="text-purple-500"
                  trend={{ value: 8, isPositive: true }}
                  delay={0.3}
                />
              </StatsRow>
            </div>

            {/* 学习时长统计卡片 - 带滚动动画 */}
            <div
              ref={studyTimeAnimation.ref}
              style={{
                opacity: studyTimeAnimation.isVisible ? 1 : 0,
                transform: studyTimeAnimation.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s',
              }}
            >
              <Card className="border-border/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-blue-500" />
                    学习时长统计
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {studyStats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <TodayStats
                        todayDuration={studyStats.today_duration_minutes.toString()}
                        todaySessions={studyStats.today_sessions}
                        todayStreak={3}
                      />
                      <WeeklyStats
                        totalDuration={studyStats.total_duration_minutes > 0 ? (studyStats.total_duration_minutes / 60).toFixed(1) : '0'}
                        totalSessions={studyStats.total_sessions}
                        avgDaily={studyStats.total_sessions > 0 ? (studyStats.total_duration_minutes / 60 / 7).toFixed(1) : '0'}
                        weeklyTrend={studyStats.total_sessions > 5 ? 'up' : 'stable'}
                      />
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      暂无学习时长数据
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 图表行 - 带滚动动画 */}
            <div
              ref={chartsAnimation.ref}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              style={{
                opacity: chartsAnimation.isVisible ? 1 : 0,
                transform: chartsAnimation.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.3s, transform 0.6s ease-out 0.3s',
              }}
            >
              <LearningHeatmap data={heatmapData} />
              <WeakKnowledgePoints data={weakPoints} />
            </div>
          </div>
        ) : (
          /* Overview - Select Student */
          <div className="space-y-6">
            {/* 学生选择卡片 - 带滚动动画 */}
            <div
              ref={studentsAnimation.ref}
              style={{
                opacity: studentsAnimation.isVisible ? 1 : 0,
                transform: studentsAnimation.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
              }}
            >
              <Card className="border-border/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary" />
                    我的学生
                  </CardTitle>
                  <CardDescription>
                    选择查看学生详细学习报告
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {students.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                      {students.map((student, index) => (
                        <div
                          key={student.id}
                          className="relative group"
                          style={{
                            opacity: studentsAnimation.isVisible ? 1 : 0,
                            transform: studentsAnimation.isVisible ? 'translateY(0)' : 'translateY(20px)',
                            transition: `opacity 0.5s ease-out ${0.1 + index * 0.1}s, transform 0.5s ease-out ${0.1 + index * 0.1}s`,
                          }}
                        >
                          <button
                            onClick={() => {
                              setSelectedStudent(student.id);
                              setSelectedStudentName(student.display_name);
                            }}
                            className={cn(
                              "w-full p-4 rounded-xl border border-border/50 bg-card",
                              "flex flex-col items-center gap-3 transition-all duration-300",
                              "hover:shadow-lg hover:border-primary/30",
                              "active:scale-[0.98]",
                              selectedStudent === student.id && "border-primary bg-primary/5"
                            )}
                          >
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center transition-transform duration-300">
                              <span className="text-xl font-bold text-primary">
                                {student.display_name.charAt(0)}
                              </span>
                            </div>
                            <div className="text-center">
                              <p className="font-medium">{student.display_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {student.grade_level}年级
                              </p>
                            </div>
                            {selectedStudent === student.id && (
                              <Button
                                size="sm"
                                className="mt-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.location.href = `/workbench?student=${student.id}&name=${encodeURIComponent(student.display_name)}`;
                                }}
                              >
                                <BookOpen className="w-4 h-4 mr-2" />
                                开始辅导
                              </Button>
                            )}
                          </button>
                          {/* Delete button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setStudentToDelete({ id: student.id, name: student.display_name });
                              setShowDeleteConfirm(true);
                            }}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-100 hover:bg-red-500 hover:text-white text-red-500 rounded-lg shadow-sm transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                            title="删除学生"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                        <Users className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">还没有添加学生</p>
                      <Button onClick={() => setShowAddStudentModal(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        添加第一个学生
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 最近活动卡片 - 带滚动动画 */}
            <div
              ref={activityAnimation.ref}
              style={{
                opacity: activityAnimation.isVisible ? 1 : 0,
                transform: activityAnimation.isVisible ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s',
              }}
            >
              <Card className="border-border/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    最近活动
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { icon: BarChart3, color: 'text-blue-500', bg: 'bg-blue-100', name: '小明', action: '完成了数学题学习', time: '2 小时前' },
                      { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100', name: '小红', action: '完成了化学方程式复习', time: '1 小时前' },
                      { icon: Award, color: 'text-purple-500', bg: 'bg-purple-100', name: '小刚', action: '获得了学习达人徽章', time: '3 小时前' },
                    ].map((activity, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl bg-muted/30",
                          "transition-all duration-300 hover:bg-muted/50 hover:shadow-sm"
                        )}
                        style={{
                          opacity: activityAnimation.isVisible ? 1 : 0,
                          transform: activityAnimation.isVisible ? 'translateX(0)' : 'translateX(-20px)',
                          transition: `opacity 0.5s ease-out ${0.3 + index * 0.1}s, transform 0.5s ease-out ${0.3 + index * 0.1}s`,
                        }}
                      >
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", activity.bg)}>
                          <activity.icon className={cn("w-5 h-5", activity.color)} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">
                            {activity.name} {activity.action}
                          </p>
                          <p className="text-sm text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>

      {/* Development Notice */}
      <div className="fixed bottom-4 left-0 right-0 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto">
          <div className="mx-auto bg-card/80 backdrop-blur-xl rounded-full px-4 py-2 text-sm text-muted-foreground shadow-sm border border-border/50 w-fit">
            Dashboard 开发中...更多统计功能即将上线
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-md border-border/50 shadow-xl animate-scale-in bg-white dark:bg-slate-900">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>添加学生</CardTitle>
                <CardDescription>创建新的学生账户</CardDescription>
              </div>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddStudent} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">学生姓名</label>
                  <Input
                    id="studentName"
                    name="studentName"
                    placeholder="请输入学生姓名"
                    required
                    className="transition-all duration-200 focus:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">手机号</label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="请输入手机号"
                    pattern="[0-9]{11}"
                    required
                    className="transition-all duration-200 focus:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">密码</label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="至少6位"
                    minLength={6}
                    required
                    className="transition-all duration-200 focus:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">年级</label>
                  <select
                    id="grade"
                    name="grade"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="">请选择</option>
                    <option value="1">一年级</option>
                    <option value="2">二年级</option>
                    <option value="3">三年级</option>
                    <option value="4">四年级</option>
                    <option value="5">五年级</option>
                    <option value="6">六年级</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAddStudentModal(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit" className="flex-1">
                    添加学生
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Student Confirmation Modal */}
      {showDeleteConfirm && studentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 animate-fade-in">
          <Card className="w-full max-w-md border-border/50 shadow-xl animate-scale-in bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="text-red-500">确认删除</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                确定要删除学生 <span className="font-medium text-foreground">{studentToDelete.name}</span> 吗？
              </p>
              <p className="text-xs text-destructive bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                此操作将永久删除该学生的所有数据（错题记录、学习报告等），无法恢复。
              </p>
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setStudentToDelete(null);
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeleteStudent}
                >
                  确认删除
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Access Denied Modal */}
      {accessDenied && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
          <Card className="w-full max-w-md border-border/50 shadow-xl bg-white dark:bg-slate-900">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="w-20 h-20 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Lock className="w-10 h-10 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">访问受限</h3>
                  <p className="text-muted-foreground">
                    家长控制台仅限家长账号访问。
                    <br /><br />
                    当前账号角色为「{profile?.role === 'student' ? '学生' : profile?.role}」，无法访问此页面。
                    <br /><br />
                    如需管理学生账号，请联系管理员注册家长账号。
                  </p>
                </div>
                <div className="flex gap-3 w-full pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push('/select-profile')}
                  >
                    切换角色
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => router.push('/workbench')}
                  >
                    去学习
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
