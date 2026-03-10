// =====================================================
// Project Socrates - Parent Tasks Page
// 家长任务布置页面
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ClipboardList,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Target,
  CheckCircle,
  AlertCircle,
  Loader2,
  BookOpen,
  RefreshCw,
  Star,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { ChildSelector, type ChildInfo } from '@/components/ChildSelector';

interface Task {
  id: string;
  child_id: string;
  child_name: string;
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

interface Student {
  id: string;
  display_name: string;
  grade_level: number;
}

const taskTypeLabels: Record<string, { label: string; icon: any; color: string }> = {
  practice: { label: '练习', icon: BookOpen, color: 'text-blue-600 bg-blue-100' },
  review: { label: '复习', icon: RefreshCw, color: 'text-green-600 bg-green-100' },
  error_book: { label: '错题本', icon: AlertCircle, color: 'text-red-600 bg-red-100' },
  custom: { label: '自定义', icon: Star, color: 'text-purple-600 bg-purple-100' },
};

const priorityLabels: Record<number, { label: string; color: string }> = {
  1: { label: '高', color: 'bg-red-100 text-red-700' },
  2: { label: '中', color: 'bg-yellow-100 text-yellow-700' },
  3: { label: '低', color: 'bg-gray-100 text-gray-700' },
};

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待开始', color: 'bg-gray-100 text-gray-600' },
  in_progress: { label: '进行中', color: 'bg-blue-100 text-blue-600' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-600' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-600' },
};

export default function ParentTasksPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState<ChildInfo[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    childId: '',
    title: '',
    description: '',
    taskType: 'practice',
    subject: '',
    targetCount: 1,
    targetDuration: '',
    priority: 2,
    dueDate: '',
    rewardPoints: 0,
  });

  // Load students
  useEffect(() => {
    const loadStudents = async () => {
      try {
        const response = await fetch('/api/students');
        if (response.ok) {
          const result = await response.json();
          const studentList = (result.data || []).map((s: Student) => ({
            id: s.id,
            display_name: s.display_name,
            grade_level: s.grade_level,
          }));
          setStudents(studentList);
          if (studentList.length > 0 && !formData.childId) {
            setFormData((prev) => ({ ...prev, childId: studentList[0].id }));
          }
        }
      } catch (error) {
        console.error('Error loading students:', error);
      }
    };

    if (profile) {
      loadStudents();
    }
  }, [profile]);

  // Load tasks
  useEffect(() => {
    const loadTasks = async () => {
      if (!profile?.id) return;

      try {
        setLoading(true);
        const response = await fetch(`/api/parent-tasks?parent_id=${profile.id}`);
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

  // Create task
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.id || !formData.childId || !formData.title) {
      alert('请填写必填项');
      return;
    }

    try {
      const response = await fetch('/api/parent-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: profile.id,
          childId: formData.childId,
          title: formData.title,
          description: formData.description || null,
          taskType: formData.taskType,
          subject: formData.subject || null,
          targetCount: formData.targetCount,
          targetDuration: formData.targetDuration ? parseInt(formData.targetDuration) : null,
          priority: formData.priority,
          dueDate: formData.dueDate || null,
          rewardPoints: formData.rewardPoints,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create task');
      }

      // Refresh tasks
      const tasksResponse = await fetch(`/api/parent-tasks?parent_id=${profile.id}`);
      if (tasksResponse.ok) {
        const result = await tasksResponse.json();
        setTasks(result.tasks || []);
      }

      setShowAddModal(false);
      setFormData({
        childId: students[0]?.id || '',
        title: '',
        description: '',
        taskType: 'practice',
        subject: '',
        targetCount: 1,
        targetDuration: '',
        priority: 2,
        dueDate: '',
        rewardPoints: 0,
      });
    } catch (error: any) {
      console.error('Error creating task:', error);
      alert(error.message);
    }
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('确定要删除这个任务吗？')) return;

    try {
      const response = await fetch(`/api/parent-tasks?task_id=${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete task');

      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('删除失败');
    }
  };

  // Filter tasks by child
  const filteredTasks = selectedChildId
    ? tasks.filter((t) => t.child_id === selectedChildId)
    : tasks;

  // Group tasks by status
  const pendingTasks = filteredTasks.filter((t) => t.status === 'pending');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

  // Calculate progress percentage
  const getProgressPercentage = (task: Task) => {
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
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-warm-50 via-white to-warm-100">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <PageHeader
          title="任务管理"
          description="给孩子布置学习任务"
          icon={ClipboardList}
          iconColor="text-warm-500"
          actions={
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              布置任务
            </Button>
          }
        />
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-24">
        {/* Child Filter */}
        {students.length > 1 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">筛选孩子:</span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={selectedChildId === null ? 'default' : 'outline'}
                    onClick={() => setSelectedChildId(null)}
                  >
                    全部
                  </Button>
                  {students.map((student) => (
                    <Button
                      key={student.id}
                      size="sm"
                      variant={selectedChildId === student.id ? 'default' : 'outline'}
                      onClick={() => setSelectedChildId(student.id)}
                    >
                      {student.display_name}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有添加孩子</h3>
              <p className="text-gray-500 mb-4">请先添加孩子再布置任务</p>
              <Button onClick={() => (window.location.href = '/dashboard')}>
                去添加孩子
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Pending Tasks */}
            {pendingTasks.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gray-500" />
                    待开始 ({pendingTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onDelete={handleDeleteTask} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* In Progress Tasks */}
            {inProgressTasks.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-500" />
                    进行中 ({inProgressTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {inProgressTasks.map((task) => (
                      <TaskCard key={task.id} task={task} onDelete={handleDeleteTask} showProgress />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    已完成 ({completedTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {completedTasks.slice(0, 5).map((task) => (
                      <TaskCard key={task.id} task={task} onDelete={handleDeleteTask} completed />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {filteredTasks.length === 0 && (
              <Card>
                <CardContent className="p-8 text-center">
                  <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无任务</h3>
                  <p className="text-gray-500 mb-4">点击上方按钮布置第一个任务</p>
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    布置任务
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg border-border/50 shadow-xl bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>布置新任务</CardTitle>
                <CardDescription>为孩子设置学习任务</CardDescription>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
              >
                ✕
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateTask} className="space-y-4">
                {/* Child Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">选择孩子 *</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg"
                    value={formData.childId}
                    onChange={(e) => setFormData({ ...formData, childId: e.target.value })}
                    required
                  >
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">任务标题 *</label>
                  <Input
                    placeholder="例如: 完成10道数学练习题"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">任务描述</label>
                  <textarea
                    className="w-full px-3 py-2 border rounded-lg resize-none"
                    rows={2}
                    placeholder="详细说明任务内容..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {/* Task Type & Subject */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">任务类型</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.taskType}
                      onChange={(e) => setFormData({ ...formData, taskType: e.target.value })}
                    >
                      <option value="practice">练习</option>
                      <option value="review">复习</option>
                      <option value="error_book">错题本</option>
                      <option value="custom">自定义</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">科目</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    >
                      <option value="">选择科目</option>
                      <option value="math">数学</option>
                      <option value="chinese">语文</option>
                      <option value="english">英语</option>
                      <option value="physics">物理</option>
                      <option value="chemistry">化学</option>
                    </select>
                  </div>
                </div>

                {/* Target & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">目标数量</label>
                    <Input
                      type="number"
                      min={1}
                      value={formData.targetCount}
                      onChange={(e) =>
                        setFormData({ ...formData, targetCount: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">目标时长(分钟)</label>
                    <Input
                      type="number"
                      min={1}
                      placeholder="可选"
                      value={formData.targetDuration}
                      onChange={(e) => setFormData({ ...formData, targetDuration: e.target.value })}
                    />
                  </div>
                </div>

                {/* Priority & Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">优先级</label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: parseInt(e.target.value) })
                      }
                    >
                      <option value={1}>高</option>
                      <option value={2}>中</option>
                      <option value={3}>低</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">截止日期</label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    />
                  </div>
                </div>

                {/* Reward Points */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">完成奖励积分</label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.rewardPoints}
                    onChange={(e) =>
                      setFormData({ ...formData, rewardPoints: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAddModal(false)}
                  >
                    取消
                  </Button>
                  <Button type="submit" className="flex-1">
                    创建任务
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Task Card Component
function TaskCard({
  task,
  onDelete,
  showProgress = false,
  completed = false,
}: {
  task: Task;
  onDelete: (id: string) => void;
  showProgress?: boolean;
  completed?: boolean;
}) {
  const typeInfo = taskTypeLabels[task.task_type] || taskTypeLabels.custom;
  const TypeIcon = typeInfo.icon;
  const progress = showProgress ? Math.round((task.progress_count / task.target_count) * 100) : 0;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border border-gray-100 bg-white',
        'flex items-center gap-4',
        completed && 'opacity-60'
      )}
    >
      {/* Type Icon */}
      <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', typeInfo.color)}>
        <TypeIcon className="w-5 h-5" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className={cn('font-medium', completed && 'line-through')}>{task.title}</h4>
          <Badge className={priorityLabels[task.priority]?.color || priorityLabels[2].color}>
            {priorityLabels[task.priority]?.label || '中'}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{task.child_name}</span>
          {task.subject && <span>· {task.subject}</span>}
          {task.due_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(task.due_date)}
            </span>
          )}
          {task.reward_points > 0 && (
            <span className="flex items-center gap-1 text-yellow-600">
              <Star className="w-3 h-3" />
              +{task.reward_points}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && !completed && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>
                {task.progress_count} / {task.target_count}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Status Badge */}
      <Badge className={statusLabels[task.status]?.color || statusLabels.pending.color}>
        {statusLabels[task.status]?.label || '待开始'}
      </Badge>

      {/* Delete Button */}
      {!completed && (
        <button
          onClick={() => onDelete(task.id)}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
