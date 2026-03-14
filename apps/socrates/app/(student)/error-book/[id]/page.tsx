// =====================================================
// Project Socrates - Error Detail Page
// 错题详情页：查看错题的完整对话历史
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
  Download,
  Play,
  CheckCircle,
  Clock,
  AlertCircle,
  Bot,
  User,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { downloadErrorQuestionPDF } from '@/lib/pdf/ErrorQuestionPDF';
import { AnalysisDialog } from '@/components/AnalysisDialog';
import { VariantPractice } from '@/components/VariantPractice';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

interface ErrorSession {
  id: string;
  subject: 'math' | 'physics' | 'chemistry';
  extracted_text: string | null;
  original_image_url: string | null;
  status: 'analyzing' | 'guided_learning' | 'mastered';
  difficulty_rating: number | null;
  concept_tags: string[] | null;
  created_at: string;
}

const subjectLabels: Record<string, string> = {
  math: '数学',
  physics: '物理',
  chemistry: '化学',
};

const statusLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  analyzing: { label: '分析中', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Clock },
  guided_learning: { label: '学习中', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: AlertCircle },
  mastered: { label: '已掌握', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
};

export default function ErrorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { profile } = useAuth();
  const router = useRouter();
  const [errorSession, setErrorSession] = useState<ErrorSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [mastering, setMastering] = useState(false);
  const [masterMessage, setMasterMessage] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showVariants, setShowVariants] = useState(false);

  useEffect(() => {
    loadErrorDetail();
  }, [resolvedParams.id]);

  const loadErrorDetail = async () => {
    setLoading(true);
    const supabase = createClient();

    // 加载错题信息
    const { data: sessionData, error: sessionError } = await supabase
      .from('error_sessions')
      .select('*')
      .eq('id', resolvedParams.id)
      .single();

    if (sessionError || !sessionData) {
      console.error('Failed to load error session:', sessionError);
      setLoading(false);
      return;
    }

    setErrorSession(sessionData as ErrorSession);

    const { data: reviewData } = await supabase
      .from('review_schedule')
      .select('id')
      .eq('session_id', resolvedParams.id)
      .maybeSingle();

    setReviewId((reviewData as { id?: string } | null)?.id || null);

    // 加载对话历史
    const { data: messagesData } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', resolvedParams.id)
      .order('created_at', { ascending: true });

    setMessages((messagesData || []) as Message[]);
    setLoading(false);
  };

  const handleExportPDF = async () => {
    if (!errorSession) return;
    setExporting(true);

    try {
      await downloadErrorQuestionPDF({
        subject: errorSession.subject,
        createdAt: errorSession.created_at,
        studentName: profile?.display_name,
        ocrText: errorSession.extracted_text || undefined,
        imageUrl: errorSession.original_image_url || undefined,
        conceptTags: errorSession.concept_tags || undefined,
        difficultyRating: errorSession.difficulty_rating || undefined,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleContinueLearning = () => {
    router.push(`/workbench?session=${resolvedParams.id}`);
  };

  const handleOpenReview = () => {
    if (!reviewId) return;
    router.push(`/review/session/${reviewId}`);
  };

  // 标记为已掌握
  const handleMarkMastered = async () => {
    if (!errorSession || !profile?.id) return;

    setMastering(true);
    setMasterMessage(null);

    try {
      const response = await fetch('/api/error-session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: errorSession.id,
          student_id: profile.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // 更新本地状态
        setErrorSession({
          ...errorSession,
          status: 'mastered',
        });
        if (data.review_id) {
          setReviewId(data.review_id);
        }
        setMasterMessage('已标记为掌握，可进入复习');
      } else {
        setMasterMessage(data.error || '操作失败，请重试');
      }
    } catch (error) {
      console.error('Failed to mark as mastered:', error);
      setMasterMessage('网络错误，请重试');
    } finally {
      setMastering(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!errorSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">错题不存在或已被删除</p>
            <Button onClick={() => router.push('/error-book')}>
              返回错题本
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusLabels[errorSession.status]?.icon || Clock;

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-slate-950 dark:via-slate-900 dark:to-orange-950/30",
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
                onClick={() => router.push('/error-book')}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回
              </Button>
              <div>
                <h1 className="text-lg font-semibold">错题详情</h1>
                <p className="text-sm text-muted-foreground">
                  {formatDate(errorSession.created_at)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {masterMessage && (
                <span className={cn(
                  "text-xs px-2 py-1 rounded",
                  (masterMessage.includes('恭喜') || masterMessage.includes('已标记')) ? "text-green-600 bg-green-50" :
                  masterMessage.includes('失败') || masterMessage.includes('错误') ? "text-red-600 bg-red-50" :
                  "text-muted-foreground"
                )}>
                  {masterMessage}
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled
                className="gap-2 opacity-50 cursor-not-allowed"
                title="功能调试中"
              >
                <Download className="w-4 h-4" />
                导出PDF
              </Button>
              {messages.length >= 3 && profile?.role === 'parent' && (
                <Button
                  size="sm"
                  onClick={() => setShowAnalysis(true)}
                  className="gap-2 bg-purple-500 hover:bg-purple-600 text-white"
                >
                  <MessageCircle className="w-4 h-4" />
                  AI分析对话
                </Button>
              )}
              {errorSession.status === 'guided_learning' && (
                <Button
                  size="sm"
                  onClick={handleMarkMastered}
                  disabled={mastering}
                  className="gap-2 bg-green-500 hover:bg-green-600 text-white"
                >
                  {mastering ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      已掌握
                    </>
                  )}
                </Button>
              )}
              {reviewId && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleOpenReview}
                  className="gap-2"
                >
                  <BookOpen className="w-4 h-4" />
                  进入复习
                </Button>
              )}
              {errorSession.status !== 'mastered' && (
                <Button
                  size="sm"
                  onClick={handleContinueLearning}
                  variant="default"
                  className="gap-2"
                >
                  <Play className="w-4 h-4" />
                  继续学习
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 错题信息卡片 */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {subjectLabels[errorSession.subject] || errorSession.subject}
                  </CardTitle>
                  <CardDescription>错题内容</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn('gap-1', statusLabels[errorSession.status]?.color)}>
                  <StatusIcon className="w-3 h-3" />
                  {statusLabels[errorSession.status]?.label}
                </Badge>
                {errorSession.difficulty_rating && (
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    {errorSession.difficulty_rating}
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 标签 */}
            {errorSession.concept_tags && errorSession.concept_tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-4 h-4 text-muted-foreground" />
                {errorSession.concept_tags.map((tag, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* 图片 */}
            {errorSession.original_image_url && (
              <div className="rounded-xl overflow-hidden bg-muted">
                <img
                  src={errorSession.original_image_url}
                  alt="错题图片"
                  className="w-full max-h-80 object-contain"
                />
              </div>
            )}

            {/* 识别文本 */}
            {errorSession.extracted_text && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border/50">
                <p className="text-xs text-muted-foreground mb-2">题目内容：</p>
                <p className="text-sm whitespace-pre-wrap">{errorSession.extracted_text}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 对话历史 */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              学习对话记录
              <Badge variant="outline" className="ml-2">
                {messages.length} 条
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">暂无对话记录</p>
                <p className="text-sm text-muted-foreground mt-1">点击"继续学习"开始AI对话</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                      message.role === 'user'
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : "bg-primary/10"
                    )}>
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Bot className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3",
                      message.role === 'user'
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100"
                        : "bg-muted"
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(message.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 变式练习入口 */}
        {profile?.role === 'student' && errorSession.extracted_text && (
          <Card className="border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">变式练习</CardTitle>
                    <CardDescription>AI 根据这道题生成相似练习题，举一反三</CardDescription>
                  </div>
                </div>
                <Button
                  variant={showVariants ? 'default' : 'outline'}
                  onClick={() => setShowVariants(!showVariants)}
                  className="gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {showVariants ? '收起' : '开始练习'}
                </Button>
              </div>
            </CardHeader>
            {showVariants && (
              <CardContent>
                <VariantPractice
                  sessionId={errorSession.id}
                  studentId={profile.id}
                  subject={errorSession.subject}
                  originalText={errorSession.extracted_text}
                  conceptTags={errorSession.concept_tags || undefined}
                />
              </CardContent>
            )}
          </Card>
        )}

        {/* 底部操作栏 */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-border/50 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              创建于 {formatDate(errorSession.created_at)}
            </div>
            <div className="flex items-center gap-2">
              {messages.length >= 3 && profile?.role === 'parent' && (
                <Button
                  variant="outline"
                  onClick={() => setShowAnalysis(true)}
                  className="gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  AI分析
                </Button>
              )}
              {reviewId && (
                <Button variant="outline" onClick={handleOpenReview} className="gap-2">
                  <BookOpen className="w-4 h-4" />
                  进入复习
                </Button>
              )}
              <Button onClick={handleContinueLearning} className="gap-2">
                <Play className="w-4 h-4" />
                继续学习
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* AI分析弹窗 */}
      <AnalysisDialog
        open={showAnalysis}
        onOpenChange={setShowAnalysis}
        sessionId={resolvedParams.id}
      />
    </div>
  );
}
