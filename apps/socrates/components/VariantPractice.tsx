// =====================================================
// Project Socrates - Variant Practice Component
// 变式练习组件
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Lightbulb,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { VariantQuestion, VariantDifficulty } from '@/lib/variant-questions/types';

interface VariantPracticeProps {
  sessionId: string;
  studentId: string;
  subject: 'math' | 'physics' | 'chemistry';
  originalText: string;
  conceptTags?: string[];
}

const difficultyConfig: Record<VariantDifficulty, { label: string; color: string }> = {
  easy: { label: '简单', color: 'text-green-500' },
  medium: { label: '中等', color: 'text-yellow-500' },
  hard: { label: '困难', color: 'text-red-500' },
};

const subjectLabels: Record<string, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
};

export function VariantPractice({
  sessionId,
  studentId,
  subject,
  originalText,
  conceptTags = [],
}: VariantPracticeProps) {
  const [variants, setVariants] = useState<VariantQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<VariantDifficulty>('medium');
  const [activeVariant, setActiveVariant] = useState<VariantQuestion | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHints, setShowHints] = useState<number>(0);
  const [showSolution, setShowSolution] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // 加载现有变式题目
  useEffect(() => {
    loadVariants();
  }, [sessionId, studentId]);

  const loadVariants = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/variants?student_id=${studentId}&session_id=${sessionId}`
      );
      if (response.ok) {
        const result = await response.json();
        setVariants(result.data || []);
      }
    } catch (error) {
      console.error('Failed to load variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateVariants = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          student_id: studentId,
          subject,
          original_text: originalText,
          concept_tags: conceptTags,
          difficulty: selectedDifficulty,
          count: 2,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setVariants(prev => [...result.data, ...prev]);
        }
      }
    } catch (error) {
      console.error('Failed to generate variants:', error);
    } finally {
      setGenerating(false);
    }
  };

  const submitAnswer = async (variant: VariantQuestion) => {
    if (!userAnswer.trim()) return;

    // 简单的答案匹配（实际可以做更复杂的校验）
    const isCorrect = userAnswer.trim().toLowerCase() === variant.answer.trim().toLowerCase();

    try {
      await fetch('/api/variants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: variant.id,
          student_id: studentId,
          is_correct: isCorrect,
          student_answer: userAnswer,
          time_spent: 60,
          hints_used: showHints,
        }),
      });

      setSubmitted(true);
      // 更新本地状态
      setVariants(prev =>
        prev.map(v =>
          v.id === variant.id
            ? {
                ...v,
                status: isCorrect ? 'completed' : 'practicing',
                attempts: v.attempts + 1,
                correct_attempts: v.correct_attempts + (isCorrect ? 1 : 0),
              }
            : v
        )
      );
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const resetPractice = () => {
    setActiveVariant(null);
    setUserAnswer('');
    setShowHints(0);
    setShowSolution(false);
    setSubmitted(false);
  };

  const getVariantStatusBadge = (variant: VariantQuestion) => {
    switch (variant.status) {
      case 'mastered':
        return <Badge className="bg-green-500">已掌握</Badge>;
      case 'completed':
        return <Badge className="bg-blue-500">已完成</Badge>;
      case 'practicing':
        return <Badge className="bg-yellow-500">练习中</Badge>;
      default:
        return <Badge variant="outline">待练习</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 生成新变式 */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="w-5 h-5 text-purple-500" />
            变式练习
          </CardTitle>
          <CardDescription>
            AI 根据原题生成相似练习题，帮助你巩固知识点
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            {/* 难度选择 */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">难度：</span>
              {(['easy', 'medium', 'hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                    selectedDifficulty === d
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted"
                  )}
                >
                  {difficultyConfig[d].label}
                </button>
              ))}
            </div>

            {/* 生成按钮 */}
            <Button
              onClick={generateVariants}
              disabled={generating}
              className="gap-2"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              生成变式题
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 变式题目列表 */}
      {variants.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            变式题目 ({variants.length})
          </h3>

          {variants.map((variant, index) => (
            <Card
              key={variant.id}
              className={cn(
                "border-border/50 cursor-pointer transition-all",
                activeVariant?.id === variant.id && "ring-2 ring-primary"
              )}
            >
              {activeVariant?.id === variant.id ? (
                // 练习模式
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        变式 {index + 1}
                      </Badge>
                      <Badge className={cn("text-xs", difficultyConfig[variant.difficulty].color)}>
                        {difficultyConfig[variant.difficulty].label}
                      </Badge>
                      {getVariantStatusBadge(variant)}
                    </div>
                    <button
                      onClick={resetPractice}
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      关闭
                    </button>
                  </div>

                  {/* 题目内容 */}
                  <div className="p-4 bg-muted/30 rounded-xl">
                    <p className="whitespace-pre-wrap">{variant.question_text}</p>
                  </div>

                  {/* 知识点标签 */}
                  {variant.concept_tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {variant.concept_tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* 提示区域 */}
                  {!submitted && (
                    <div className="space-y-2">
                      <button
                        onClick={() => setShowHints(Math.min(showHints + 1, variant.hints.length))}
                        className="flex items-center gap-2 text-sm text-yellow-600 hover:text-yellow-700"
                        disabled={showHints >= variant.hints.length}
                      >
                        <Lightbulb className="w-4 h-4" />
                        {showHints >= variant.hints.length ? '已显示全部提示' : '显示提示'}
                      </button>

                      {showHints > 0 && (
                        <div className="space-y-2 pl-6">
                          {variant.hints.slice(0, showHints).map((hint, i) => (
                            <p key={i} className="text-sm text-muted-foreground">
                              💡 提示{i + 1}: {hint}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 答案输入 */}
                  {!submitted ? (
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入你的答案..."
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={() => submitAnswer(variant)}>
                        提交
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* 结果显示 */}
                      <div className={cn(
                        "p-4 rounded-xl flex items-center gap-3",
                        userAnswer.trim().toLowerCase() === variant.answer.trim().toLowerCase()
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      )}>
                        {userAnswer.trim().toLowerCase() === variant.answer.trim().toLowerCase() ? (
                          <>
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            <div>
                              <p className="font-medium text-green-700 dark:text-green-400">回答正确！</p>
                              <p className="text-sm text-green-600 dark:text-green-500">
                                答案: {variant.answer}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-6 h-6 text-red-500" />
                            <div>
                              <p className="font-medium text-red-700 dark:text-red-400">回答错误</p>
                              <p className="text-sm text-red-600 dark:text-red-500">
                                你的答案: {userAnswer} | 正确答案: {variant.answer}
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      {/* 解析 */}
                      <div>
                        <button
                          onClick={() => setShowSolution(!showSolution)}
                          className="flex items-center gap-2 text-sm font-medium"
                        >
                          {showSolution ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          查看解析
                        </button>

                        {showSolution && (
                          <div className="mt-2 p-4 bg-muted/30 rounded-xl">
                            <p className="whitespace-pre-wrap text-sm">{variant.solution}</p>
                          </div>
                        )}
                      </div>

                      {/* 继续按钮 */}
                      <Button variant="outline" onClick={resetPractice}>
                        继续练习
                      </Button>
                    </div>
                  )}
                </CardContent>
              ) : (
                // 列表模式
                <CardContent
                  className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setActiveVariant(variant)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">变式 {index + 1}</Badge>
                      <span className={cn("text-xs", difficultyConfig[variant.difficulty].color)}>
                        {difficultyConfig[variant.difficulty].label}
                      </span>
                      {getVariantStatusBadge(variant)}
                    </div>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {variant.question_text}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {variants.length === 0 && !generating && (
        <div className="text-center py-8 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>还没有变式题目</p>
          <p className="text-sm">点击上方按钮生成变式练习题</p>
        </div>
      )}
    </div>
  );
}
