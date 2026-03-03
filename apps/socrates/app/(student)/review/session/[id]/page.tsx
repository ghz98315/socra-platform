// =====================================================
// Project Socrates - Review Session Page
// 复习模式：显示原题，进行复习测试
// v1.6.28 - 支持难度重评功能
// =====================================================

'use client';

import { useState, useEffect, use } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Tag,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  Bot,
  ChevronRight,
  FileText,
  MessageSquare,
  Target,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { REVIEW_STAGES } from '@/lib/review/utils';
import { StarRating, InteractiveStarRating, calculateFinalDifficulty } from '@/components/DifficultyRating';

interface ReviewSession {
  id: string;
  sessionId: string;
  review_stage: number;
  next_review_at: string;
  is_completed: boolean;
  error_session: {
    id: string;
    subject: 'math' | 'physics' | 'chemistry';
    extracted_text: string | null;
    original_image_url: string | null;
    status: string;
    difficulty_rating: number | null; // AI 评估
    student_difficulty_rating: number | null; // 学生自评
    final_difficulty_rating: number | null; // 最终综合
    concept_tags: string[] | null;
    created_at: string;
  };
}

const subjectLabels: Record<string, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
};

const subjectColors: Record<string, string> = {
  math: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
  physics: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
  chemistry: 'text-green-500 bg-green-50 dark:bg-green-900/30',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

export default function ReviewSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { profile } = useAuth();
  const router = useRouter();
  const supabase = createClient() as SupabaseClient;
  const [reviewSession, setReviewSession] = useState<ReviewSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewStep, setReviewStep] = useState<'intro' | 'recall' | 'check' | 'complete'>('intro');
  const [userRecall, setUserRecall] = useState('');

  // 难度重评状态
  const [studentDifficulty, setStudentDifficulty] = useState<number>(0);
  const [isRatingDifficulty, setIsRatingDifficulty] = useState(false);
  const [showDifficultySection, setShowDifficultySection] = useState(true);

  useEffect(() => {
    loadReviewSession();
  }, [resolvedParams.id]);

  const loadReviewSession = async () => {
    setLoading(true);

    // 加载复习计划
    const { data: reviewData, error: reviewError } = await supabase
      .from('review_schedule')
      .select(`
        id,
        session_id,
        review_stage,
        next_review_at,
        is_completed
      `)
      .eq('id', resolvedParams.id)
      .single();

    if (reviewError || !reviewData) {
      console.error('Failed to load review session:', reviewError);
      setLoading(false);
      return;
    }

    // 加载错题信息
    const { data: errorData } = await supabase
      .from('error_sessions')
      .select('*')
      .eq('id', (reviewData as { session_id: string }).session_id)
      .single();

    if (!errorData) {
      setLoading(false);
      return;
    }

    setReviewSession({
      id: (reviewData as { id: string }).id,
      sessionId: (reviewData as { session_id: string }).session_id,
      review_stage: (reviewData as { review_stage: number }).review_stage,
      next_review_at: (reviewData as { next_review_at: string }).next_review_at,
      is_completed: (reviewData as { is_completed: boolean }).is_completed,
      error_session: errorData as ReviewSession['error_session'],
    });

    // 初始化学生难度评分
    setStudentDifficulty((errorData as { student_difficulty_rating?: number }).student_difficulty_rating || 0);

    setLoading(false);
  };

  // 提交难度重评
  const handleDifficultyRating = async () => {
    if (!reviewSession || studentDifficulty === 0) return;

    setIsRatingDifficulty(true);
    try {
      const response = await fetch('/api/error-session/difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: reviewSession.sessionId,
          student_id: profile?.id,
          difficulty_rating: studentDifficulty,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 更新本地状态
        setReviewSession(prev => prev ? {
          ...prev,
          error_session: {
            ...prev.error_session,
            student_difficulty_rating: studentDifficulty,
            final_difficulty_rating: data.data.final_difficulty_rating,
          }
        } : null);
        setShowDifficultySection(false);
      }
    } catch (error) {
      console.error('Failed to submit difficulty rating:', error);
    } finally {
      setIsRatingDifficulty(false);
    }
  };

  const handleCompleteReview = async () => {
    if (!reviewSession) return;

    // 计算下一阶段
    const nextStage = Math.min(reviewSession.review_stage + 1, 4);
    const nextDays = REVIEW_STAGES.find(s => s.stage === nextStage)?.days || 30;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + nextDays);

    // 更新复习计划
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {
      review_stage: nextStage,
      next_review_at: nextDate.toISOString(),
    };

    await supabase
      .from('review_schedule')
      .update(updateData)
      .eq('id', reviewSession.id);

    setReviewStep('complete');
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <p className="text-muted-foreground">加载复习内容...</p>
        </div>
      </div>
    );
  }

  if (!reviewSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">复习任务不存在</p>
            <Button onClick={() => router.push('/review')}>
              返回复习列表
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStage = REVIEW_STAGES.find(s => s.stage === reviewSession.review_stage);
  const progress = (reviewSession.review_stage / 4) * 100;

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-orange-950/30",
      profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior'
    )}>
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-border/50 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/review')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
              <div>
                <h1 className="text-lg font-semibold">复习模式</h1>
                <p className="text-sm text-muted-foreground">
                  {currentStage?.name} - 第 {reviewSession.review_stage + 1} 次复习
                </p>
              </div>
            </div>
            <Badge className={cn('gap-1', subjectColors[reviewSession.error_session.subject])}>
              {subjectLabels[reviewSession.error_session.subject]}
            </Badge>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 复习进度 */}
        <Card className="border-border/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">复习进度</span>
              <span className="text-sm font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2">
              {REVIEW_STAGES.map((stage, index) => (
                <div
                  key={stage.stage}
                  className={cn(
                    "text-xs",
                    index < reviewSession.review_stage
                      ? "text-green-600"
                      : index === reviewSession.review_stage
                      ? "text-primary font-medium"
                      : "text-muted-foreground"
                  )}
                >
                  {stage.name}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 复习步骤 */}
        {reviewStep === 'intro' && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                复习准备
              </CardTitle>
              <CardDescription>
                准备好复习这道错题了吗？
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 标签 */}
              {reviewSession.error_session.concept_tags && reviewSession.error_session.concept_tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  {reviewSession.error_session.concept_tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 难度 */}
              {reviewSession.error_session.difficulty_rating && (
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">难度：</span>
                  <div className="flex">
                    {'★'.repeat(reviewSession.error_session.difficulty_rating)}
                    {'☆'.repeat(5 - reviewSession.error_session.difficulty_rating)}
                  </div>
                </div>
              )}

              {/* 创建时间 */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                首次学习：{formatDate(reviewSession.error_session.created_at)}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/error-book/${reviewSession.sessionId}`)}
                  className="flex-1 gap-2"
                >
                  <FileText className="w-4 h-4" />
                  查看学习记录
                </Button>
                <Button
                  onClick={() => setReviewStep('recall')}
                  className="flex-1 gap-2"
                >
                  开始复习
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {reviewStep === 'recall' && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                回忆练习
              </CardTitle>
              <CardDescription>
                先尝试回忆这道题的解法，不要看答案
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 题目内容 */}
              {reviewSession.error_session.original_image_url && (
                <div className="rounded-xl overflow-hidden bg-muted">
                  <img
                    src={reviewSession.error_session.original_image_url}
                    alt="错题图片"
                    className="w-full max-h-80 object-contain"
                  />
                </div>
              )}

              {reviewSession.error_session.extracted_text && (
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <p className="text-sm whitespace-pre-wrap">{reviewSession.error_session.extracted_text}</p>
                </div>
              )}

              {/* 用户回忆输入 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  回忆一下这道题的解题思路（可选）
                </label>
                <textarea
                  value={userRecall}
                  onChange={(e) => setUserRecall(e.target.value)}
                  placeholder="写下你记得的解题步骤..."
                  className="w-full h-32 p-3 rounded-xl border border-border/50 bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setReviewStep('intro')}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  返回
                </Button>
                <Button
                  onClick={() => setReviewStep('check')}
                  className="flex-1 gap-2"
                >
                  查看答案
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {reviewStep === 'check' && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                检查结果
              </CardTitle>
              <CardDescription>
                你答对了吗？选择你的掌握程度
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 题目内容 */}
              {reviewSession.error_session.extracted_text && (
                <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-2">原题：</p>
                  <p className="text-sm whitespace-pre-wrap">{reviewSession.error_session.extracted_text}</p>
                </div>
              )}

              {/* 用户的回忆 */}
              {userRecall && (
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-blue-600 dark:text-blue-400 mb-2">你的回忆：</p>
                  <p className="text-sm whitespace-pre-wrap">{userRecall}</p>
                </div>
              )}

              {/* 难度重评区域 */}
              {showDifficultySection && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        难度评价
                      </span>
                    </div>
                    {reviewSession.error_session.final_difficulty_rating && (
                      <Badge variant="outline" className="text-xs border-amber-300 text-amber-600">
                        当前：{reviewSession.error_session.final_difficulty_rating}星
                      </Badge>
                    )}
                  </div>

                  {/* 显示当前难度 */}
                  <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
                    {reviewSession.error_session.difficulty_rating && (
                      <span>AI评估：{reviewSession.error_session.difficulty_rating}星</span>
                    )}
                    {reviewSession.error_session.student_difficulty_rating && (
                      <span>你的评价：{reviewSession.error_session.student_difficulty_rating}星</span>
                    )}
                  </div>

                  {/* 重新评价 */}
                  <div className="space-y-3">
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      这道题对你来说现在感觉如何？重新评价一下吧！
                    </p>
                    <InteractiveStarRating
                      value={studentDifficulty}
                      onChange={setStudentDifficulty}
                      size="md"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowDifficultySection(false)}
                        disabled={isRatingDifficulty}
                      >
                        跳过
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDifficultyRating}
                        disabled={studentDifficulty === 0 || isRatingDifficulty}
                        className="bg-amber-500 hover:bg-amber-600 text-white"
                      >
                        {isRatingDifficulty ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            提交中...
                          </>
                        ) : (
                          '提交评价'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/workbench?session=${reviewSession.sessionId}`)}
                  className="h-20 flex-col gap-2"
                >
                  <MessageSquare className="w-6 h-6" />
                  <span>需要复习</span>
                  <span className="text-xs text-muted-foreground">继续AI对话学习</span>
                </Button>
                <Button
                  onClick={handleCompleteReview}
                  className="h-20 flex-col gap-2 bg-green-500 hover:bg-green-600"
                >
                  <CheckCircle className="w-6 h-6" />
                  <span>已掌握</span>
                  <span className="text-xs opacity-80">进入下一复习阶段</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {reviewStep === 'complete' && (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">复习完成！</h2>
              <p className="text-muted-foreground mb-6">
                下次复习时间：{formatDate(
                  new Date(Date.now() + (REVIEW_STAGES.find(s => s.stage === reviewSession.review_stage + 1)?.days || 30) * 24 * 60 * 60 * 1000).toISOString()
                )}
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push('/review')}
                >
                  返回复习列表
                </Button>
                <Button
                  onClick={() => router.push('/workbench')}
                >
                  继续学习
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
