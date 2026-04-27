// =====================================================
// Project Socrates - Student Tasks Page
// 学生任务查看页面
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ClipboardList,
  Clock,
  Target,
  CheckCircle,
  Star,
  Calendar,
  BookOpen,
  RefreshCw,
  AlertCircle,
  Loader2,
  ChevronRight,
  Gift,
  Trophy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  subject: string | null;
  target_count: number;
  target_duration: number | null;
  priority: number;
  status: string;
  due_date: string | null;
  reward_points: number;
  created_at: string;
  progress_count: number;
  progress_duration: number;
}

const taskTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
  practice: { label: '练习', icon: BookOpen, color: 'text-blue-600 bg-blue-100' },
  review: { label: '复习', icon: RefreshCw, color: 'text-green-600 bg-green-100' },
  error_book: { label: '错题本', icon: AlertCircle, color: 'text-red-600 bg-red-100' },
  custom: { label: '自定义', icon: Star, color: 'text-purple-600 bg-purple-100' },
};

const priorityColors: Record<number, string> = {
  1: 'border-l-red-500',
  2: 'border-l-yellow-500',
  3: 'border-l-gray-300',
};

export default function StudentTasksPage() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'in_progress' | 'completed'>('pending');

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);
        const response = await fetch('/api/parent-tasks');
        if (response.ok) {
          const result = await response.json();
          setTasks(result.tasks || []);
        }
      } catch (error) {
        console.error('Error loading tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [profile?.id]);

  // Filter tasks by status
  const filteredTasks = tasks.filter((t) => t.status === selectedTab);
  const pendingCount = tasks.filter((t) => t.status === 'pending').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  // Get progress percentage
  const getProgress = (task: Task) => {
    if (task.target_count > 0) {
      return Math.min(100, (task.progress_count / task.target_count) * 100);
    }
    if (task.target_duration && task.target_duration > 0) {
      return Math.min(100, (task.progress_duration / task.target_duration) * 100);
    }
    return 0;
  };

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return `已过期 ${Math.abs(diffDays)} 天`;
    if (diffDays === 0) return '今天截止';
    if (diffDays === 1) return '明天截止';
    if (diffDays <= 7) return `${diffDays} 天后截止`;
    return date.toLocaleDateString('zh-CN');
  };

  // Start task
  const handleStartTask = async (taskId: string) => {
    try {
      await fetch('/api/parent-tasks', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, updates: { status: 'in_progress' } }),
      });

      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: 'in_progress' } : t))
      );
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  // Update progress
  const handleUpdateProgress = async (taskId: string, increment: number) => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      const newProgress = task.progress_count + increment;
      const isCompleted = task.target_count > 0 && newProgress >= task.target_count;

      const response = await fetch('/api/task-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          progressCount: newProgress,
        }),
      });

      if (response.ok) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  progress_count: newProgress,
                  status: isCompleted ? 'completed' : t.status,
                }
              : t
          )
        );
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <PageHeader
          title="我的任务"
          description="查看家长布置的学习任务"
          icon={ClipboardList}
          iconColor="text-blue-500"
        />
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 pb-24">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="bg-white/80">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-gray-600">{pendingCount}</p>
              <p className="text-xs text-gray-500">待开始</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
              <p className="text-xs text-gray-500">进行中</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
              <p className="text-xs text-gray-500">已完成</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <Button
            size="sm"
            variant={selectedTab === 'pending' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('pending')}
            className="whitespace-nowrap"
          >
            待开始 ({pendingCount})
          </Button>
          <Button
            size="sm"
            variant={selectedTab === 'in_progress' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('in_progress')}
            className="whitespace-nowrap"
          >
            进行中 ({inProgressCount})
          </Button>
          <Button
            size="sm"
            variant={selectedTab === 'completed' ? 'default' : 'outline'}
            onClick={() => setSelectedTab('completed')}
            className="whitespace-nowrap"
          >
            已完成 ({completedCount})
          </Button>
        </div>

        {/* Tasks List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">暂无{selectedTab === 'pending' ? '待开始' : selectedTab === 'in_progress' ? '进行中' : '已完成'}的任务</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((task) => {
              const typeInfo = taskTypeLabels[task.task_type] || taskTypeLabels.custom;
              const TypeIcon = typeInfo.icon;
              const progress = getProgress(task);

              return (
                <Card
                  key={task.id}
                  className={cn(
                    'border-l-4',
                    priorityColors[task.priority],
                    task.status === 'completed' && 'opacity-60'
                  )}
                >
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', typeInfo.color)}>
                        <TypeIcon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className={cn('font-medium', task.status === 'completed' && 'line-through')}>
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                          {task.subject && <span>{task.subject}</span>}
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(task.due_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      {task.reward_points > 0 && (
                        <Badge className="bg-yellow-100 text-yellow-700 gap-1">
                          <Gift className="w-3 h-3" />
                          +{task.reward_points}
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    {task.description && (
                      <p className="text-sm text-gray-600 mb-3">{task.description}</p>
                    )}

                    {/* Progress */}
                    {task.status === 'in_progress' && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-500">进度</span>
                          <span className="font-medium">
                            {task.progress_count} / {task.target_count}
                            {task.target_duration && ` (${task.progress_duration}/${task.target_duration}分钟)`}
                          </span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {/* Actions */}
                    {task.status === 'pending' && (
                      <Button
                        onClick={() => handleStartTask(task.id)}
                        className="w-full"
                        size="sm"
                      >
                        开始任务
                      </Button>
                    )}

                    {task.status === 'in_progress' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => handleUpdateProgress(task.id, 1)}
                          className="flex-1"
                          size="sm"
                        >
                          完成 +1
                        </Button>
                        <Button
                          onClick={() => handleUpdateProgress(task.id, task.target_count - task.progress_count)}
                          className="flex-1"
                          size="sm"
                        >
                          全部完成
                        </Button>
                      </div>
                    )}

                    {task.status === 'completed' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">任务已完成</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Tips */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 mb-1">完成任务获得奖励</p>
                <p className="text-sm text-gray-600">
                  完成家长布置的任务可以获得积分奖励，积分可以用来解锁更多功能！
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
