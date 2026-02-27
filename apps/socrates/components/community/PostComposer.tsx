'use client';

import { useState } from 'react';
import { Send, Image, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// 帖子类型配置
const POST_TYPES = [
  { id: 'insight', label: '学习心得', emoji: '😊', description: '分享你的学习感悟' },
  { id: 'question', label: '求助问题', emoji: '❓', description: '遇到困惑来问问' },
  { id: 'tip', label: '技巧分享', emoji: '💡', description: '分享你的学习方法' },
  { id: 'mastery', label: '这题我懂了', emoji: '🎯', description: '记录你的成就时刻' },
  { id: 'error_share', label: '错题分享', emoji: '📝', description: '分享典型错题' },
];

// 学科选项
const SUBJECTS = [
  { id: 'math', label: '数学', emoji: '📐' },
  { id: 'chinese', label: '语文', emoji: '📖' },
  { id: 'english', label: '英语', emoji: '🔤' },
  { id: 'physics', label: '物理', emoji: '⚡' },
  { id: 'chemistry', label: '化学', emoji: '🧪' },
  { id: 'biology', label: '生物', emoji: '🌱' },
  { id: 'history', label: '历史', emoji: '📜' },
  { id: 'geography', label: '地理', emoji: '🌍' },
  { id: 'other', label: '其他', emoji: '📚' },
];

// 年级选项
const GRADES = [
  '一年级', '二年级', '三年级', '四年级', '五年级', '六年级',
  '初一', '初二', '初三', '高一', '高二', '高三',
];

interface PostComposerProps {
  userId: string;
  errorSessionId?: string;
  onSuccess?: (post: any) => void;
  className?: string;
}

export function PostComposer({
  userId,
  errorSessionId,
  onSuccess,
  className,
}: PostComposerProps) {
  const [postType, setPostType] = useState('insight');
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          post_type: postType,
          content: content.trim(),
          subject: subject || undefined,
          grade_level: grade || undefined,
          error_session_id: errorSessionId,
          is_anonymous: isAnonymous,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || '发布失败，请稍后重试');
        return;
      }

      // 重置表单
      setContent('');
      setSubject('');
      setGrade('');
      setIsAnonymous(false);
      setShowOptions(false);

      alert(data.message || '发布成功！');
      onSuccess?.(data.data);
    } catch (error) {
      console.error('Error posting:', error);
      alert('发布失败，请检查网络后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentType = POST_TYPES.find(t => t.id === postType) || POST_TYPES[0];
  const charCount = content.length;
  const maxChars = 500;

  return (
    <div className={cn('bg-white/90 dark:bg-slate-800/90 rounded-3xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-lg', className)}>
      {/* 类型选择 */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide">
        {POST_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setPostType(type.id)}
            className={cn(
              'flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
              postType === type.id
                ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
            )}
          >
            <span className="mr-1">{type.emoji}</span>
            {type.label}
          </button>
        ))}
      </div>

      {/* 当前类型描述 */}
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
        {currentType.emoji} {currentType.description}
      </p>

      {/* 输入区域 */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxChars))}
          placeholder="写下你的想法..."
          className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-transparent transition-all text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
        />
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className={cn(
            'text-xs',
            charCount > maxChars * 0.9 ? 'text-orange-500' : 'text-slate-400'
          )}>
            {charCount}/{maxChars}
          </span>
        </div>
      </div>

      {/* 更多选项 */}
      <div className="mt-4">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-orange-500 transition-colors"
        >
          {showOptions ? '收起选项 ▲' : '更多选项 ▼'}
        </button>

        {showOptions && (
          <div className="mt-3 space-y-4 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl">
            {/* 学科选择 */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                学科（可选）
              </label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSubject(subject === s.id ? '' : s.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-sm transition-all',
                      subject === s.id
                        ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border border-orange-300 dark:border-orange-700'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:border-orange-300'
                    )}
                  >
                    {s.emoji} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 年级选择 */}
            <div>
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                年级（可选）
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
              >
                <option value="">选择年级</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            {/* 匿名选项 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isAnonymous ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                <span className="text-sm text-slate-600 dark:text-slate-300">匿名发布</span>
              </div>
              <button
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={cn(
                  'w-12 h-6 rounded-full transition-colors relative',
                  isAnonymous ? 'bg-orange-400' : 'bg-slate-300 dark:bg-slate-600'
                )}
              >
                <div className={cn(
                  'absolute top-1 w-4 h-4 bg-white rounded-full transition-transform',
                  isAnonymous ? 'translate-x-7' : 'translate-x-1'
                )} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 发布按钮 */}
      <div className="flex items-center justify-end mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium transition-all duration-200',
            content.trim() && !isSubmitting
              ? 'bg-gradient-to-r from-orange-400 to-amber-400 text-white shadow-md hover:shadow-lg hover:scale-[1.02]'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              发布中...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              发布分享
            </>
          )}
        </button>
      </div>
    </div>
  );
}
