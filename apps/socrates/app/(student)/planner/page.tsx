// =====================================================
// Project Socrates - Study Planner Page
// 学习时间规划页面
// =====================================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit3,
  CheckCircle,
  Target,
  BookOpen,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Timer,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader, StatCard, StatsRow } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

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

interface StudyTask {
  id: string;
  title: string;
  subject: string;
  duration_minutes: number;
  scheduled_time: string;
  status: 'pending' | 'in_progress' | 'completed';
  difficulty: 'easy' | 'medium' | 'hard';
  priority: number; // 1-3, 3最高
  created_at: string;
}

interface OptimizedTask extends StudyTask {
  is_break?: boolean;
  reason?: string;
}

interface OptimizationResult {
  tasks: OptimizedTask[];
  total_time: number;
  break_count: number;
  suggestions: string[];
}

interface DayStats {
  totalMinutes: number;
  completedMinutes: number;
  taskCount: number;
  completedCount: number;
}

const SUBJECT_COLORS: Record<string, string> = {
  math: 'bg-blue-500',
  physics: 'bg-purple-500',
  chemistry: 'bg-green-500',
  review: 'bg-orange-500',
  other: 'bg-gray-500',
};

const SUBJECT_LABELS: Record<string, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
  review: '复习',
  other: '其他',
};

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7:00 - 20:00

export default function PlannerPage() {
  const { profile } = useAuth();
  const supabase = createClient();

  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddTask, setShowAddTask] = useState(false);
  const [dayStartTime, setDayStartTime] = useState('08:00'); // 每日学习开始时间
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [showOptimization, setShowOptimization] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    subject: 'math',
    duration_minutes: 30,
    scheduled_time: '16:00',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    priority: 2,
  });

  const calendarAnimation = useScrollAnimation();
  const tasksAnimation = useScrollAnimation();

  // 获取日期范围（前后7天）
  const getDateRange = () => {
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date(selectedDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // 格式化日期显示
  const formatDateShort = (date: Date) => {
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return {
      day: date.getDate(),
      weekday: days[date.getDay()],
      isToday: date.toDateString() === new Date().toDateString(),
      isSelected: date.toDateString() === selectedDate.toDateString(),
    };
  };

  // 本地存储键
  const getStorageKey = useCallback(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return `study_plans_${profile?.id}_${dateStr}`;
  }, [profile?.id, selectedDate]);

  // 加载任务
  const loadTasks = useCallback(async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('study_plans')
        .select('*')
        .eq('student_id', profile.id)
        .eq('plan_date', dateStr)
        .order('scheduled_time', { ascending: true });

      if (error) {
        // 数据库失败，尝试从本地存储加载
        console.log('Database not available, using localStorage');
        const localData = localStorage.getItem(getStorageKey());
        if (localData) {
          setTasks(JSON.parse(localData));
        } else {
          setTasks([]);
        }
      } else {
        setTasks((data || []) as StudyTask[]);
      }
    } finally {
      setLoading(false);
    }
  }, [profile?.id, selectedDate, supabase, getStorageKey]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // 保存到本地存储
  const saveToLocalStorage = (tasks: StudyTask[]) => {
    localStorage.setItem(getStorageKey(), JSON.stringify(tasks));
  };

  // AI智能优化计划
  const optimizeSchedule = useCallback(async () => {
    if (tasks.length === 0) return;

    setIsOptimizing(true);
    setShowOptimization(true);

    try {
      // 调用AI优化API
      const response = await fetch('/api/planner/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          start_time: dayStartTime,
          date: selectedDate.toISOString().split('T')[0],
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setOptimizationResult(result.data);
      } else {
        // 如果API不可用，使用本地优化算法
        const localResult = localOptimize(tasks, dayStartTime);
        setOptimizationResult(localResult);
      }
    } catch (error) {
      // 本地优化作为后备
      const localResult = localOptimize(tasks, dayStartTime);
      setOptimizationResult(localResult);
    } finally {
      setIsOptimizing(false);
    }
  }, [tasks, dayStartTime, selectedDate]);

  // 本地优化算法（后备方案）
  const localOptimize = (taskList: StudyTask[], startTime: string): OptimizationResult => {
    const suggestions: string[] = [];
    const optimizedTasks: OptimizedTask[] = [];

    // 1. 按难度和优先级排序（要事优先：高难度任务放在精力最好的时段）
    const difficultyWeight = { hard: 3, medium: 2, easy: 1 };
    const sortedTasks = [...taskList].sort((a, b) => {
      // 先按优先级排序，再按难度
      const priorityDiff = (b.priority || 2) - (a.priority || 2);
      if (priorityDiff !== 0) return priorityDiff;

      const diffA = difficultyWeight[a.difficulty || 'medium'];
      const diffB = difficultyWeight[b.difficulty || 'medium'];
      return diffB - diffA;
    });

    // 2. 计算时间安排
    let currentTime = parseTime(startTime);
    let totalBreakTime = 0;

    sortedTasks.forEach((task, index) => {
      // 添加任务
      optimizedTasks.push({
        ...task,
        scheduled_time: formatTime(currentTime),
        reason: getTaskReason(task, index, sortedTasks.length),
      });

      // 更新时间
      currentTime = addMinutes(currentTime, task.duration_minutes);

      // 添加休息时间（除了最后一个任务）
      if (index < sortedTasks.length - 1) {
        const breakDuration = calculateBreakDuration(task, sortedTasks[index + 1]);
        optimizedTasks.push({
          id: `break_${index}`,
          title: '休息时间',
          subject: 'break',
          duration_minutes: breakDuration,
          scheduled_time: formatTime(currentTime),
          status: 'pending',
          difficulty: 'easy',
          priority: 0,
          created_at: new Date().toISOString(),
          is_break: true,
          reason: `建议休息${breakDuration}分钟，让大脑恢复精力`,
        });
        currentTime = addMinutes(currentTime, breakDuration);
        totalBreakTime += breakDuration;
      }
    });

    // 3. 生成建议
    const totalTime = taskList.reduce((sum, t) => sum + t.duration_minutes, 0) + totalBreakTime;
    suggestions.push(`根据"要事优先"原则，已将高难度任务安排在前段时段`);
    suggestions.push(`共安排了${totalBreakTime}分钟休息时间，帮助保持专注力`);
    suggestions.push(`预计总学习时长：${totalTime}分钟（含休息）`);

    const hardTasks = taskList.filter(t => t.difficulty === 'hard');
    if (hardTasks.length > 2) {
      suggestions.push(`今日有${hardTasks.length}个高难度任务，建议保持充足睡眠`);
    }

    return {
      tasks: optimizedTasks,
      total_time: totalTime,
      break_count: sortedTasks.length - 1,
      suggestions,
    };
  };

  // 应用优化结果
  const applyOptimization = () => {
    if (!optimizationResult) return;

    const realTasks = optimizationResult.tasks.filter(t => !t.is_break);
    setTasks(realTasks);
    saveToLocalStorage(realTasks);
    setShowOptimization(false);
    setOptimizationResult(null);
  };

  // 辅助函数
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hours, minutes };
  };

  const formatTime = (time: { hours: number; minutes: number }) => {
    return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`;
  };

  const addMinutes = (time: { hours: number; minutes: number }, mins: number) => {
    let totalMinutes = time.hours * 60 + time.minutes + mins;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return { hours, minutes };
  };

  const calculateBreakDuration = (currentTask: StudyTask, nextTask: StudyTask) => {
    // 根据任务难度决定休息时长
    if (currentTask.difficulty === 'hard' || nextTask.difficulty === 'hard') {
      return 10; // 高难度后休息10分钟
    }
    return 5; // 默认休息5分钟
  };

  const getTaskReason = (task: StudyTask, index: number, total: number): string => {
    const reasons: string[] = [];
    if (index === 0) {
      reasons.push('安排在第一个，精力最充沛');
    }
    if (task.difficulty === 'hard') {
      reasons.push('高难度任务优先处理');
    }
    if (task.priority === 3) {
      reasons.push('重要任务，优先安排');
    }
    return reasons.join('；') || '按最优顺序安排';
  };

  // 添加任务
  const handleAddTask = async () => {
    if (!profile?.id || !newTask.title.trim()) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const tempId = `local_${Date.now()}`;

    const newTaskItem: StudyTask = {
      id: tempId,
      title: newTask.title,
      subject: newTask.subject,
      duration_minutes: newTask.duration_minutes,
      scheduled_time: newTask.scheduled_time,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    // 先更新UI（乐观更新）
    const updatedTasks = [...tasks, newTaskItem].sort((a, b) =>
      a.scheduled_time.localeCompare(b.scheduled_time)
    );
    setTasks(updatedTasks);
    saveToLocalStorage(updatedTasks);

    // 重置表单
    setNewTask({
      title: '',
      subject: 'math',
      duration_minutes: 30,
      scheduled_time: '16:00',
    });
    setShowAddTask(false);

    // 尝试保存到数据库
    try {
      const { error } = await supabase
        .from('study_plans')
        .insert({
          student_id: profile.id,
          plan_date: dateStr,
          title: newTask.title,
          subject: newTask.subject,
          duration_minutes: newTask.duration_minutes,
          scheduled_time: newTask.scheduled_time,
          status: 'pending',
        });

      if (error) {
        console.log('Saved to localStorage (database unavailable)');
      }
    } catch (error) {
      console.log('Saved to localStorage');
    }
  };

  // 更新任务状态
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';

    // 乐观更新
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);
    saveToLocalStorage(updatedTasks);

    // 尝试更新数据库
    try {
      await supabase
        .from('study_plans')
        .update({ status: newStatus })
        .eq('id', taskId);
    } catch (error) {
      console.log('Updated in localStorage');
    }
  };

  // 删除任务
  const handleDeleteTask = async (taskId: string) => {
    // 乐观更新
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    setTasks(updatedTasks);
    saveToLocalStorage(updatedTasks);

    // 尝试从数据库删除
    try {
      await supabase
        .from('study_plans')
        .delete()
        .eq('id', taskId);
    } catch (error) {
      console.log('Deleted from localStorage');
    }
  };

  // 计算当日统计
  const dayStats: DayStats = tasks.reduce(
    (acc, task) => ({
      totalMinutes: acc.totalMinutes + task.duration_minutes,
      completedMinutes:
        acc.completedMinutes +
        (task.status === 'completed' ? task.duration_minutes : 0),
      taskCount: acc.taskCount + 1,
      completedCount:
        acc.completedCount + (task.status === 'completed' ? 1 : 0),
    }),
    { totalMinutes: 0, completedMinutes: 0, taskCount: 0, completedCount: 0 }
  );

  const completionRate =
    dayStats.totalMinutes > 0
      ? Math.round((dayStats.completedMinutes / dayStats.totalMinutes) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-white to-warm-100">
      {/* 页面标题 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <PageHeader
          title="学习计划"
          description="规划你的学习时间，养成高效学习习惯"
          icon={Calendar}
          iconColor="text-blue-500"
          actions={
            <Button
              onClick={() => setShowAddTask(!showAddTask)}
              className="gap-2 bg-warm-500 hover:bg-warm-600 text-white rounded-full shadow-lg shadow-warm-500/30"
            >
              <Plus className="w-4 h-4" />
              添加任务
            </Button>
          }
        />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 space-y-6">
        {/* 统计卡片 */}
        <StatsRow>
          <StatCard
            label="今日计划"
            value={`${dayStats.totalMinutes}分钟`}
            icon={Clock}
            color="text-blue-500"
            delay={0}
          />
          <StatCard
            label="已完成"
            value={`${dayStats.completedMinutes}分钟`}
            icon={CheckCircle}
            color="text-green-500"
            delay={0.1}
          />
          <StatCard
            label="任务数"
            value={`${dayStats.completedCount}/${dayStats.taskCount}`}
            icon={Target}
            color="text-purple-500"
            delay={0.2}
          />
          <StatCard
            label="完成率"
            value={`${completionRate}%`}
            icon={Timer}
            color="text-orange-500"
            trend={
              completionRate >= 80
                ? { value: completionRate, isPositive: true }
                : undefined
            }
            delay={0.3}
          />
        </StatsRow>

        {/* 日期选择器 */}
        <div
          ref={calendarAnimation.ref}
          style={{
            opacity: calendarAnimation.isVisible ? 1 : 0,
            transform: calendarAnimation.isVisible
              ? 'translateY(0)'
              : 'translateY(20px)',
            transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          }}
        >
          <Card className="border-warm-200/50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() - 7);
                    setSelectedDate(newDate);
                  }}
                  className="rounded-full"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                <div className="flex gap-2">
                  {getDateRange().map((date) => {
                    const formatted = formatDateShort(date);
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          'flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200',
                          formatted.isSelected
                            ? 'bg-warm-500 text-white shadow-lg shadow-warm-500/30'
                            : formatted.isToday
                            ? 'bg-warm-100 text-warm-900'
                            : 'hover:bg-warm-100 text-warm-600'
                        )}
                      >
                        <span className="text-xs opacity-70">
                          {formatted.weekday}
                        </span>
                        <span className="text-lg font-bold">
                          {formatted.day}
                        </span>
                        {formatted.isToday && !formatted.isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-warm-500 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newDate = new Date(selectedDate);
                    newDate.setDate(newDate.getDate() + 7);
                    setSelectedDate(newDate);
                  }}
                  className="rounded-full"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 添加任务表单 */}
        {showAddTask && (
          <Card className="border-warm-200/50 border-2 border-dashed">
            <CardContent className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="text-sm text-warm-600 mb-1 block">
                    任务名称
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) =>
                      setNewTask({ ...newTask, title: e.target.value })
                    }
                    placeholder="例如：复习数学错题"
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-warm-500"
                  />
                </div>
                <div>
                  <label className="text-sm text-warm-600 mb-1 block">
                    科目
                  </label>
                  <select
                    value={newTask.subject}
                    onChange={(e) =>
                      setNewTask({ ...newTask, subject: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-warm-500"
                  >
                    <option value="math">数学</option>
                    <option value="physics">物理</option>
                    <option value="chemistry">化学</option>
                    <option value="review">复习</option>
                    <option value="other">其他</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-warm-600 mb-1 block">
                    时长
                  </label>
                  <select
                    value={newTask.duration_minutes}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        duration_minutes: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-warm-500"
                  >
                    <option value={15}>15 分钟</option>
                    <option value={30}>30 分钟</option>
                    <option value={45}>45 分钟</option>
                    <option value={60}>1 小时</option>
                    <option value={90}>1.5 小时</option>
                    <option value={120}>2 小时</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-warm-600 mb-1 block">
                    开始时间
                  </label>
                  <input
                    type="time"
                    value={newTask.scheduled_time}
                    onChange={(e) =>
                      setNewTask({ ...newTask, scheduled_time: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-warm-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddTask(false)}
                  className="rounded-full"
                >
                  取消
                </Button>
                <Button
                  onClick={handleAddTask}
                  disabled={!newTask.title.trim()}
                  className="bg-warm-500 hover:bg-warm-600 text-white rounded-full"
                >
                  添加任务
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 任务列表 */}
        <div
          ref={tasksAnimation.ref}
          style={{
            opacity: tasksAnimation.isVisible ? 1 : 0,
            transform: tasksAnimation.isVisible
              ? 'translateY(0)'
              : 'translateY(20px)',
            transition: 'opacity 0.5s ease-out 0.2s, transform 0.5s ease-out 0.2s',
          }}
        >
          <Card className="border-warm-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warm-900">
                <BookOpen className="w-5 h-5 text-warm-500" />
                今日任务
              </CardTitle>
              <CardDescription>
                {selectedDate.toDateString() === new Date().toDateString()
                  ? '点击任务可标记完成状态'
                  : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日的学习计划`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-8 h-8 animate-spin text-warm-500" />
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-warm-300 mb-4" />
                  <p className="text-warm-600 mb-2">暂无学习计划</p>
                  <p className="text-sm text-warm-500">
                    点击上方"添加任务"开始规划你的学习时间
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <div
                      key={task.id}
                      className={cn(
                        'flex items-center gap-4 p-4 rounded-xl border transition-all duration-300',
                        task.status === 'completed'
                          ? 'bg-green-50 border-green-200'
                          : 'bg-warm-50/50 border-warm-200/50 hover:border-warm-300'
                      )}
                      style={{
                        opacity: tasksAnimation.isVisible ? 1 : 0,
                        transform: tasksAnimation.isVisible
                          ? 'translateX(0)'
                          : 'translateX(-20px)',
                        transition: `opacity 0.4s ease-out ${
                          0.3 + index * 0.1
                        }s, transform 0.4s ease-out ${0.3 + index * 0.1}s`,
                      }}
                    >
                      {/* 时间 */}
                      <div className="flex-shrink-0 w-16 text-center">
                        <span className="text-lg font-bold text-warm-900">
                          {task.scheduled_time}
                        </span>
                      </div>

                      {/* 科目标签 */}
                      <div
                        className={cn(
                          'w-2 h-12 rounded-full',
                          SUBJECT_COLORS[task.subject]
                        )}
                      />

                      {/* 任务内容 */}
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => handleToggleTask(task.id, task.status)}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'font-medium',
                              task.status === 'completed'
                                ? 'text-green-700 line-through'
                                : 'text-warm-900'
                            )}
                          >
                            {task.title}
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-xs bg-warm-100 text-warm-700"
                          >
                            {SUBJECT_LABELS[task.subject]}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-sm text-warm-600">
                          <Clock className="w-3 h-3" />
                          {task.duration_minutes} 分钟
                        </div>
                      </div>

                      {/* 状态和操作 */}
                      <div className="flex items-center gap-2">
                        {task.status === 'completed' ? (
                          <CheckCircle className="w-6 h-6 text-green-500" />
                        ) : (
                          <button
                            onClick={() => handleToggleTask(task.id, task.status)}
                            className="w-6 h-6 rounded-full border-2 border-warm-300 hover:border-warm-500 transition-colors"
                          />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-warm-400 hover:text-red-500 hover:bg-red-50 rounded-full"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 进度条 */}
        {tasks.length > 0 && (
          <Card className="border-warm-200/50">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-warm-600">今日进度</span>
                <span className="text-sm font-medium text-warm-900">
                  {completionRate}%
                </span>
              </div>
              <Progress value={completionRate} className="h-3" />
              <div className="flex items-center justify-between mt-2 text-xs text-warm-500">
                <span>
                  已完成 {dayStats.completedMinutes} / {dayStats.totalMinutes}{' '}
                  分钟
                </span>
                <span>
                  {dayStats.completedCount} / {dayStats.taskCount} 个任务
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* AI 学习建议 */}
        <Card className="border-warm-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warm-900">
              <Sparkles className="w-5 h-5 text-warm-500" />
              智能建议
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-warm-700">
              {dayStats.totalMinutes === 0 ? (
                <p>开始规划你的学习时间吧！建议每天安排 1-2 小时的学习时间。</p>
              ) : completionRate < 50 ? (
                <p>
                  今日进度还可以更快哦！专注完成每个任务，你会发现效率提升很多。
                </p>
              ) : completionRate < 80 ? (
                <p>做得不错！继续保持，完成剩余的任务吧！</p>
              ) : (
                <p>
                  太棒了！今天的计划完成得很好！记得适当休息，保持学习热情。
                </p>
              )}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700">
                <AlertCircle className="w-4 h-4" />
                <span>建议：每学习 45 分钟休息 10 分钟，效率更高。</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
