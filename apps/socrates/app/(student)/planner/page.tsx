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
  RefreshCw,
  X,
  Play,
  Pause,
  AlertTriangle
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
  chinese: 'bg-red-500',
  english: 'bg-cyan-500',
  physics: 'bg-purple-500',
  chemistry: 'bg-green-500',
  science: 'bg-teal-500',
  pe: 'bg-amber-500',
  review: 'bg-orange-500',
  other: 'bg-gray-500',
};

const SUBJECT_LABELS: Record<string, string> = {
  math: '数学',
  chinese: '语文',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
  science: '科学',
  pe: '体育',
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

  // 专注模式状态
  const [showFocusMode, setShowFocusMode] = useState(false);
  const [currentTask, setCurrentTask] = useState<StudyTask | null>(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const [newTask, setNewTask] = useState({
    title: '',
    subject: 'math',
    duration_minutes: 30,
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

  // 专注模式功能
  const startFocusMode = (task: StudyTask) => {
    setCurrentTask(task);
    setRemainingTime(task.duration_minutes * 60);
    setShowFocusMode(true);
    setIsPaused(false);
  };

  const exitFocusMode = () => {
    setShowFocusMode(false);
    setCurrentTask(null);
    setRemainingTime(0);
    setIsPaused(false);
  };

  const completeTask = () => {
    if (!currentTask) return;

    const updatedTasks = tasks.map(t =>
      t.id === currentTask.id ? { ...t, status: 'completed' as const } : t
    );
    setTasks(updatedTasks);
    saveToLocalStorage(updatedTasks);

    // 找下一个任务
    const nextTask = updatedTasks.find(t => t.status !== 'completed' && t.id !== currentTask?.id);
    if (nextTask) {
      setCurrentTask(nextTask);
      setRemainingTime(nextTask.duration_minutes * 60);
    } else {
      exitFocusMode();
    }
  };

  const skipTask = () => {
    const nextTask = tasks.find(t => t.status !== 'completed' && t.id !== currentTask?.id);
    if (nextTask) {
      setCurrentTask(nextTask);
      setRemainingTime(nextTask.duration_minutes * 60);
    } else {
      exitFocusMode();
    }
  };

  // 专注计时器
  useEffect(() => {
    if (!showFocusMode || !currentTask || isPaused) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 0) {
          completeTask();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showFocusMode, currentTask, isPaused]);

  // 计算新任务的开始时间（基于现有任务和学习开始时间）
  const calculateNewTaskTime = () => {
    if (tasks.length === 0) {
      return dayStartTime;
    }

    // 找到最后一个任务，计算其结束时间
    const lastTask = tasks.reduce((latest, task) => {
      const taskTime = parseTime(task.scheduled_time);
      const taskEnd = addMinutes(taskTime, task.duration_minutes);
      const latestTime = parseTime(latest.scheduled_time);
      const latestEnd = addMinutes(latestTime, latest.duration_minutes);

      const taskEndMinutes = taskEnd.hours * 60 + taskEnd.minutes;
      const latestEndMinutes = latestEnd.hours * 60 + latestEnd.minutes;

      return taskEndMinutes > latestEndMinutes ? task : latest;
    });

    const lastTaskTime = parseTime(lastTask.scheduled_time);
    const newStartTime = addMinutes(lastTaskTime, lastTask.duration_minutes);
    return formatTime(newStartTime);
  };

  // 添加任务
  const handleAddTask = async () => {
    if (!profile?.id || !newTask.title.trim()) return;

    const dateStr = selectedDate.toISOString().split('T')[0];
    const tempId = `local_${Date.now()}`;
    const taskScheduledTime = calculateNewTaskTime();

    const newTaskItem: StudyTask = {
      id: tempId,
      title: newTask.title,
      subject: newTask.subject,
      duration_minutes: newTask.duration_minutes,
      scheduled_time: taskScheduledTime,
      status: 'pending',
      difficulty: newTask.difficulty,
      priority: newTask.priority,
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
      difficulty: 'medium',
      priority: 2,
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
          scheduled_time: taskScheduledTime,
          status: 'pending' as const,
          difficulty: newTask.difficulty,
          priority: newTask.priority,
        } as any);

      if (error) {
        console.log('Saved to localStorage (database unavailable)');
      }
    } catch (error) {
      console.log('Saved to localStorage');
    }
  };

  // 更新任务状态
  const handleToggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = (currentStatus === 'completed' ? 'pending' : 'completed') as 'pending' | 'completed';

    // 乐观更新
    const updatedTasks = tasks.map(t =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    setTasks(updatedTasks);
    saveToLocalStorage(updatedTasks);

    // 尝试更新数据库
    try {
      await (supabase as any)
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
      await (supabase as any)
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

        {/* 日期选择器 + 学习开始时间 + AI优化 */}
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
              {/* 日期选择 */}
              <div className="flex items-center justify-between mb-4">
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

              {/* 学习开始时间 + AI优化按钮 */}
              <div className="flex items-center justify-between pt-3 border-t border-warm-100">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-warm-500" />
                    <span className="text-sm text-warm-600">学习开始时间:</span>
                  </div>
                  <input
                    type="time"
                    value={dayStartTime}
                    onChange={(e) => setDayStartTime(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-warm-500 text-warm-900"
                  />
                </div>

                {tasks.length > 0 && (
                  <Button
                    onClick={optimizeSchedule}
                    disabled={isOptimizing}
                    className="gap-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-full shadow-lg"
                  >
                    {isOptimizing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        AI优化中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        AI智能优化
                      </>
                    )}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI优化结果面板 */}
        {showOptimization && optimizationResult && (
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-900">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI优化建议
              </CardTitle>
              <CardDescription>
                基于"要事优先"原则，已为您重新安排学习计划
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* 统计信息 */}
              <div className="flex gap-4 mb-4 p-3 bg-white/50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">{optimizationResult.total_time}</p>
                  <p className="text-xs text-purple-500">总时长(分钟)</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{optimizationResult.break_count}</p>
                  <p className="text-xs text-blue-500">休息次数</p>
                </div>
                <div className="flex-1 flex items-center">
                  <div className="text-sm text-purple-700">
                    {optimizationResult.suggestions.map((s, i) => (
                      <p key={i}>• {s}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* 优化后的任务列表 */}
              <div className="space-y-2 mb-4">
                {optimizationResult.tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg',
                      task.is_break ? 'bg-blue-100/50 border border-blue-200' : 'bg-white border border-warm-200'
                    )}
                  >
                    <div className="text-sm font-mono text-warm-500 w-12">
                      {task.scheduled_time}
                    </div>
                    <div className={cn(
                      'w-2 h-8 rounded-full',
                      task.is_break ? 'bg-blue-400' : SUBJECT_COLORS[task.subject]
                    )} />
                    <div className="flex-1">
                      <span className={cn('font-medium', task.is_break && 'text-blue-700')}>
                        {task.title}
                      </span>
                      {!task.is_break && (
                        <span className="text-xs text-warm-500 ml-2">
                          {task.duration_minutes}分钟
                        </span>
                      )}
                    </div>
                    {task.reason && (
                      <div className="text-xs text-warm-500 max-w-[200px] text-right">
                        {task.reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 操作按钮 */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowOptimization(false);
                    setOptimizationResult(null);
                  }}
                  className="rounded-full"
                >
                  取消
                </Button>
                <Button
                  onClick={applyOptimization}
                  className="bg-purple-500 hover:bg-purple-600 text-white rounded-full"
                >
                  采用此计划
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 添加任务表单 */}
        {showAddTask && (
          <Card className="border-warm-200/50 border-2 border-dashed">
            <CardContent className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2">
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
                    <option value="chinese">语文</option>
                    <option value="english">英语</option>
                    <option value="physics">物理</option>
                    <option value="chemistry">化学</option>
                    <option value="science">科学</option>
                    <option value="pe">体育</option>
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
                    难度
                  </label>
                  <select
                    value={newTask.difficulty}
                    onChange={(e) =>
                      setNewTask({
                        ...newTask,
                        difficulty: e.target.value as 'easy' | 'medium' | 'hard',
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-warm-500"
                  >
                    <option value="easy">简单</option>
                    <option value="medium">中等</option>
                    <option value="hard">困难</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-between items-center mt-4">
                <p className="text-xs text-warm-500">
                  任务将自动安排在 {tasks.length > 0 ? '最后任务之后' : dayStartTime} 开始
                </p>
                <div className="flex gap-2">
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

        {/* 开始专注按钮 */}
        {tasks.filter(t => t.status !== 'completed').length > 0 && (
          <Button
            onClick={() => {
              const firstPending = tasks.find(t => t.status !== 'completed');
              if (firstPending) {
                startFocusMode(firstPending);
              }
            }}
            className="w-full py-4 text-lg bg-gradient-to-r from-warm-500 to-orange-500 hover:from-warm-600 hover:to-orange-600 text-white rounded-xl shadow-lg shadow-warm-500/30 gap-2"
          >
            <Timer className="w-5 h-5" />
            开始专注学习
          </Button>
        )}
      </main>

      {/* 专注计时模式 */}
      {showFocusMode && currentTask && (
        <div className="fixed inset-0 left-0 right-0 bottom-0 z-50 bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
          <div className="w-full max-w-2xl mx-auto px-4">
            {/* 顶部信息栏 */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={exitFocusMode}
                className="p-2 rounded-full hover:bg-white/10 text-white"
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-lg font-medium text-white">专注模式</h2>
              <button
                onClick={exitFocusMode}
                className="p-2 rounded-full bg-white/10 text-red-400 hover:bg-red-500/20"
              >
                退出
              </button>
            </div>

            {/* 倒计时器 */}
            <div className="text-center mb-8">
              <div className="text-9xl font-bold text-white font-mono tracking-wider">
                {String(Math.floor(remainingTime / 60)).padStart(2, '0')}
                <span className="text-5xl text-white/60">:</span>
                {String(remainingTime % 60).padStart(2, '0')}
              </div>
              <p className="text-xl text-warm-200 mt-4">{currentTask.title}</p>
              <div className="flex items-center justify-center gap-2 mt-2">
                {currentTask.difficulty === 'hard' && <AlertTriangle className="w-5 h-5 text-orange-400" />}
                <span className="text-warm-300">
                  {currentTask.difficulty === 'hard' ? '困难' : currentTask.difficulty === 'medium' ? '中等' : '简单'}
                </span>
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={cn(
                  "px-8 py-4 rounded-full text-white font-medium transition-all",
                  isPaused ? "bg-green-500 hover:bg-green-600" : "bg-warm-500 hover:bg-warm-600"
                )}
              >
                {isPaused ? (
                  <>
                    <Play className="w-6 h-6 inline mr-1" />
                    继续
                  </>
                ) : (
                  <>
                    <Pause className="w-6 h-6 inline mr-1" />
                    暂停
                  </>
                )}
              </button>
              <button
                onClick={skipTask}
                className="px-8 py-4 rounded-full border-2 border-white/30 text-white/80 hover:bg-white/10 font-medium transition-all"
              >
                跳过
              </button>
              <button
                onClick={completeTask}
                className="px-8 py-4 rounded-full bg-green-500 hover:bg-green-600 text-white font-medium transition-all"
              >
                <CheckCircle className="w-6 h-6 inline mr-1" />
                完成
              </button>
            </div>

            {/* 任务列表 */}
            <div className="mt-8 w-full max-w-md mx-auto">
              <p className="text-sm text-warm-400 mb-3 text-center">今日计划</p>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {tasks.map((task, index) => (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-3 p-2 rounded-lg transition-all",
                      task.id === currentTask?.id
                        ? "bg-white/20 border-2 border-warm-400"
                        : task.status === "completed"
                        ? "opacity-50"
                        : "opacity-70 hover:bg-white/10"
                    )}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full flex-shrink-0",
                      task.status === "completed" ? "bg-green-500" : SUBJECT_COLORS[task.subject]
                    )} />
                    <span className={cn(
                      "flex-1 text-sm",
                      task.status === "completed" ? "line-through text-warm-400" : "text-white"
                    )}>
                      {task.title}
                    </span>
                    {task.status !== "completed" && task.id !== currentTask?.id && (
                      <button
                        onClick={() => {
                          setCurrentTask(task);
                          setRemainingTime(task.duration_minutes * 60);
                          setIsPaused(false);
                        }}
                        className="text-xs text-warm-300 hover:text-warm-100"
                      >
                        开始
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
