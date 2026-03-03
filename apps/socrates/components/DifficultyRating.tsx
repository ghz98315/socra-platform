// =====================================================
// Project Socrates - Difficulty Rating Components
// 难度评估组件：星级显示 + 评分弹窗
// =====================================================

'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// =====================================================
// 半星显示组件
// =====================================================

interface StarRatingProps {
  rating: number; // 1-5, 支持 0.5 步进（如 3.5）
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function StarRating({ rating, size = 'md', showValue = false, className }: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const starSize = sizeClasses[size];

  // 渲染单个星星（支持半星）
  const renderStar = (index: number) => {
    const filled = rating - index;

    if (filled >= 1) {
      // 完全填充
      return (
        <div key={index} className="relative">
          <Star className={cn(starSize, "fill-yellow-400 text-yellow-400")} />
        </div>
      );
    } else if (filled > 0) {
      // 半星填充
      return (
        <div key={index} className="relative">
          {/* 底层灰色星星 */}
          <Star className={cn(starSize, "text-gray-300 dark:text-gray-600")} />
          {/* 上层填充星星（裁剪一半） */}
          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
            <Star className={cn(starSize, "fill-yellow-400 text-yellow-400")} />
          </div>
        </div>
      );
    } else {
      // 空星
      return (
        <Star key={index} className={cn(starSize, "text-gray-300 dark:text-gray-600")} />
      );
    }
  };

  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[0, 1, 2, 3, 4].map(renderStar)}
      {showValue && (
        <span className="ml-1.5 text-xs text-muted-foreground">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

// =====================================================
// 交互式星级评分组件
// =====================================================

interface InteractiveStarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: 'md' | 'lg';
  disabled?: boolean;
}

export function InteractiveStarRating({
  value,
  onChange,
  size = 'lg',
  disabled = false
}: InteractiveStarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeClasses = {
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const starSize = sizeClasses[size];

  const labels = ['简单', '一般', '有点难', '比较难', '很难'];
  const emojis = ['😊', '🙂', '🤔', '😓', '😫'];

  const displayValue = hoverValue ?? value;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            className={cn(
              "transition-transform duration-150",
              !disabled && "hover:scale-110",
              disabled && "cursor-not-allowed opacity-50"
            )}
            onMouseEnter={() => !disabled && setHoverValue(star)}
            onMouseLeave={() => !disabled && setHoverValue(null)}
            onClick={() => !disabled && onChange(star)}
          >
            <Star
              className={cn(
                starSize,
                "transition-colors duration-150",
                star <= displayValue
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              )}
            />
          </button>
        ))}
      </div>

      {/* 显示当前选中的标签和表情 */}
      {displayValue > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="text-lg">{emojis[displayValue - 1]}</span>
          <span>{labels[displayValue - 1]}</span>
        </div>
      )}
    </div>
  );
}

// =====================================================
// 难度评分弹窗组件
// =====================================================

interface DifficultyRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
  onSkip: () => void;
  aiRating?: number | null;
  questionText?: string;
}

export function DifficultyRatingModal({
  isOpen,
  onClose,
  onSubmit,
  onSkip,
  aiRating,
  questionText,
}: DifficultyRatingModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await onSubmit(rating);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    setRating(0);
    onSkip();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* 弹窗内容 */}
      <div className="relative bg-card rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
        {/* 关闭按钮 */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 标题 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">🎉</div>
          <h3 className="text-xl font-semibold mb-2">太棒了！你完成了这道题的学习</h3>
          <p className="text-sm text-muted-foreground">
            这道题对你来说难度如何？（你的评价会帮助我们更好地推荐练习）
          </p>
        </div>

        {/* 题目预览 */}
        {questionText && (
          <div className="bg-muted/50 rounded-lg p-3 mb-4 text-sm text-muted-foreground line-clamp-2">
            {questionText}
          </div>
        )}

        {/* AI 评估参考 */}
        {aiRating && (
          <div className="flex items-center justify-center gap-2 mb-4 text-sm text-muted-foreground">
            <span>AI 评估：</span>
            <StarRating rating={aiRating} size="sm" />
          </div>
        )}

        {/* 交互式评分 */}
        <div className="py-6">
          <InteractiveStarRating
            value={rating}
            onChange={setRating}
            size="lg"
          />
        </div>

        {/* 按钮组 */}
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={handleSkip}
            disabled={submitting}
          >
            跳过
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
          >
            {submitting ? '提交中...' : '确认'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// 计算最终难度的工具函数
// =====================================================

/**
 * 计算最终难度
 * @param aiRating AI 评估 (1-5)
 * @param studentRating 学生自评 (1-5) 或 null
 * @returns 最终难度 (0.5 步进，如 3.5)
 */
export function calculateFinalDifficulty(
  aiRating: number,
  studentRating: number | null
): number {
  if (!studentRating) {
    return aiRating;
  }

  const aiWeight = 0.6;
  const studentWeight = 0.4;

  const final = aiRating * aiWeight + studentRating * studentWeight;

  // 四舍五入到 0.5
  return Math.round(final * 2) / 2;
}
