// =====================================================
// Project Socrates - Workbench Page (Student & Parent)
// 方案二：分层卡片设计 + 苹果风格动画
// v1.6.27 - 集成难度评分弹窗
// =====================================================

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  BookOpen,
  Camera,
  Play,
  Pause,
  RefreshCw,
  Bot,
  Timer,
  Download,
  FileText,
  Users,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  PanelLeft,
  Smartphone,
  Calendar,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUploader } from '@/components/ImageUploader';
import { OCRResult, type OCRDetectionResult } from '@/components/OCRResult';
import type { SubjectType, QuestionType, DialogMode } from '@/lib/prompts/types';
import { ChatMessageList, type Message } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { PageHeader } from '@/components/PageHeader';
import { AnalysisDialog } from '@/components/AnalysisDialog';
import { DifficultyRatingModal } from '@/components/DifficultyRating';
import { cn } from '@/lib/utils';
import { downloadErrorQuestionPDF } from '@/lib/pdf/ErrorQuestionPDF';
import { createClient } from '@/lib/supabase/client';
import { formatReviewDate, getUrgencyLabel, REVIEW_STAGES } from '@/lib/review/utils';

type Step = 'upload' | 'ocr' | 'chat';

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

// 页面进入动画 Hook
function usePageAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // This is a valid pattern for triggering mount animations
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return mounted;
}

function WorkbenchPage() {
  const { profile, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageAnimation = usePageAnimation();
  const leftPanelAnimation = useScrollAnimation();
  const rightPanelAnimation = useScrollAnimation();

  // 未登录时自动重定向到登录页
  useEffect(() => {
    if (!loading && !user) {
      console.log('[Workbench] No user, redirecting to login');
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Parent student selection
  const [parentStudents, setParentStudents] = useState<Array<{ id: string; display_name: string }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  const isParent = profile?.role === 'parent';
  const effectiveStudentId = isParent ? selectedStudentId : profile?.id;

  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [geometryData, setGeometryData] = useState<any>(null);

  // 新增：OCR 识别的科目和题型信息
  const [ocrSubject, setOcrSubject] = useState<{ type: SubjectType; confidence: number } | null>(null);
  const [ocrQuestionType, setOcrQuestionType] = useState<{ type: QuestionType; confidence: number } | null>(null);

  // 新增：对话模式（Logic / Socra）
  const [dialogMode, setDialogMode] = useState<DialogMode>('Logic');

  // 新增：几何变更提示
  const [geometryChangeHint, setGeometryChangeHint] = useState<string | null>(null);
  const prevGeometryDataRef = useRef<any>(null);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatSessionRef = useRef<string>(`session_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Study session tracking
  const [isStudying, setIsStudying] = useState(false);
  const [studySessionId, setStudySessionId] = useState<string | null>(null);
  const [studyDuration, setStudyDuration] = useState(0);
  const studyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isStudyingRef = useRef(false); // 用 ref 来跟踪 isStudying 状态，解决闭包问题

  // Mastery state
  const [isMastered, setIsMastered] = useState(false);
  const [mastering, setMastering] = useState(false);
  const [masterMessage, setMasterMessage] = useState<string | null>(null);

  // Difficulty rating state - 难度评分弹窗
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [currentSessionForRating, setCurrentSessionForRating] = useState<string | null>(null);
  const [currentAiDifficulty, setCurrentAiDifficulty] = useState<number | null>(null);

  // Analysis state (for parent)
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [showAnalysisPrompt, setShowAnalysisPrompt] = useState(false);

  // Mobile panel state
  const [showMobilePanel, setShowMobilePanel] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Review state - 待复习题目
  const [pendingReviews, setPendingReviews] = useState<Array<{
    id: string;
    sessionId: string;
    subject: string;
    conceptTags: string[] | null;
    difficultyRating: number | null;
    nextReviewAt: string;
    reviewStage: number;
    daysUntilDue: number;
    isOverdue: boolean;
    extractedText?: string;
  }>>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Load parent's students and check URL params
  useEffect(() => {
    if (isParent && profile?.id) {
      loadParentStudents();
    }

    // Check for student param in URL (for parent navigation from dashboard)
    const studentParam = searchParams.get('student');
    const studentNameParam = searchParams.get('name');
    if (studentParam) {
      setSelectedStudentId(studentParam);
      setSelectedStudentName(studentNameParam || '学生');
    }
  }, [isParent, profile?.id, searchParams]);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load pending reviews - 加载待复习题目
  const loadPendingReviews = async () => {
    if (!effectiveStudentId) return;

    setLoadingReviews(true);
    const supabase = createClient();

    try {
      // 获取已到期的复习任务（next_review_at <= now）
      const { data: reviewData, error } = await supabase
        .from('review_schedule')
        .select('*')
        .eq('student_id', effectiveStudentId)
        .eq('is_completed', false)
        .lte('next_review_at', new Date().toISOString())
        .order('next_review_at', { ascending: true })
        .limit(5); // 最多显示5个

      if (error) {
        console.error('Error loading pending reviews:', error);
        return;
      }

      // 类型断言
      const reviews = (reviewData || []) as Array<{
        id: string;
        session_id: string;
        next_review_at: string;
        review_stage: number;
      }>;

      if (reviews.length === 0) {
        setPendingReviews([]);
        return;
      }

      // 获取关联的错题信息
      const sessionIds = reviews.map(r => r.session_id);
      const { data: sessionData } = await supabase
        .from('error_sessions')
        .select('id, subject, concept_tags, difficulty_rating, extracted_text')
        .in('id', sessionIds);

      const sessions = (sessionData || []) as Array<{
        id: string;
        subject?: string;
        concept_tags?: string[] | null;
        difficulty_rating?: number | null;
        extracted_text?: string;
      }>;

      const sessionMap = new Map(sessions.map(s => [s.id, s]));

      const pendingReviews = reviews.map(review => {
        const session = sessionMap.get(review.session_id);
        const now = new Date();
        const nextReviewDate = new Date(review.next_review_at);
        const daysUntil = Math.ceil((nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: review.id,
          sessionId: review.session_id,
          subject: session?.subject || 'math',
          conceptTags: session?.concept_tags ?? null,
          difficultyRating: session?.difficulty_rating ?? null,
          nextReviewAt: review.next_review_at,
          reviewStage: review.review_stage,
          daysUntilDue: daysUntil,
          isOverdue: daysUntil <= 0,
          extractedText: session?.extracted_text?.substring(0, 100) || '',
        };
      });

      setPendingReviews(pendingReviews);
    } catch (err) {
      console.error('Failed to load pending reviews:', err);
    } finally {
      setLoadingReviews(false);
    }
  };

  // Load pending reviews when effectiveStudentId changes
  useEffect(() => {
    loadPendingReviews();
  }, [effectiveStudentId]);

  const loadParentStudents = async () => {
    if (!profile?.id) return;
    setLoadingStudents(true);
    const supabase = createClient();

    // 使用 profiles 表的 parent_id 字段查询学生
    // 与家长控制台的 /api/students 保持一致
    const { data: students, error } = await supabase
      .from('profiles')
      .select('id, display_name')
      .eq('role', 'student')
      .eq('parent_id', profile.id);

    if (error) {
      console.error('Error loading students:', error);
    }

    // 类型断言解决 TypeScript 推断问题
    const typedStudents = students as { id: string; display_name: string }[] | null;

    if (typedStudents && typedStudents.length > 0) {
      const studentList = typedStudents.map((s) => ({
        id: s.id,
        display_name: s.display_name || '未命名学生',
      }));
      setParentStudents(studentList);

      // Auto-select first student if only one
      if (studentList.length === 1 && !selectedStudentId) {
        setSelectedStudentId(studentList[0].id);
        setSelectedStudentName(studentList[0].display_name);
      }
    }
    setLoadingStudents(false);
  };

  // Start study session when component mounts
  useEffect(() => {
    if (!isParent || selectedStudentId) {
      startStudySession();
    }

    // Set up duration update interval - 使用 ref 检查状态
    studyTimerRef.current = setInterval(() => {
      if (isStudyingRef.current) {
        setStudyDuration(prev => prev + 1);
      }
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (studyTimerRef.current) {
        clearInterval(studyTimerRef.current);
      }
      endStudySession();
    };
  }, []);

  // Heartbeat effect - 当 isStudying 变化时设置
  useEffect(() => {
    if (!isStudying || !studySessionId) return;

    const heartbeatInterval = setInterval(() => {
      sendHeartbeat();
    }, 30000);

    return () => clearInterval(heartbeatInterval);
  }, [isStudying, studySessionId]);

  // Start a new study session
  const startStudySession = async () => {
    if (!profile?.id) return;

    try {
      const response = await fetch('/api/study/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-action': 'start',
        },
        body: JSON.stringify({
          student_id: effectiveStudentId,
          session_type: 'error_analysis',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setStudySessionId(result.data.session_id);
        setIsStudying(true);
        isStudyingRef.current = true; // 同步更新 ref
        setStudyDuration(0);
      }
    } catch (error) {
      console.error('Failed to start study session:', error);
    }
  };

  // End the current study session
  const endStudySession = async () => {
    if (!studySessionId) return;

    try {
      const response = await fetch('/api/study/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-action': 'end',
        },
        body: JSON.stringify({
          student_id: effectiveStudentId,
          session_id: studySessionId,
        }),
      });

      if (response.ok) {
        setIsStudying(false);
        isStudyingRef.current = false; // 同步更新 ref
        setStudySessionId(null);
      }
    } catch (error) {
      console.error('Failed to end study session:', error);
    }
  };

  // Send heartbeat to keep session alive
  const sendHeartbeat = async () => {
    if (!studySessionId) return;

    try {
      await fetch('/api/study/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-action': 'heartbeat',
        },
        body: JSON.stringify({
          student_id: effectiveStudentId,
          session_id: studySessionId,
        }),
      });
    } catch (error) {
      console.error('Failed to send heartbeat:', error);
    }
  };

  // Toggle study session (pause/resume)
  const toggleStudySession = async () => {
    if (isStudying) {
      await endStudySession();
    } else {
      await startStudySession();
    }
  };

  // Format duration display
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  // Export current error question as PDF
  const [pdfExporting, setPdfExporting] = useState(false);
  const [pdfExportStatus, setPdfExportStatus] = useState<string | null>(null);

  const handleExportPDF = async () => {
    if (!ocrText && messages.length === 0) {
      setPdfExportStatus('请先上传错题并进行学习对话');
      setTimeout(() => setPdfExportStatus(null), 3000);
      return;
    }

    setPdfExporting(true);
    setPdfExportStatus('正在生成PDF...');

    try {
      await downloadErrorQuestionPDF({
        subject: 'math', // Default subject
        createdAt: new Date().toISOString(),
        studentName: profile?.display_name,
        ocrText: ocrText || undefined,
        imageUrl: imagePreview || undefined,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      });
      setPdfExportStatus('PDF下载成功！');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      setPdfExportStatus('导出失败，请重试');
    } finally {
      setPdfExporting(false);
      setTimeout(() => setPdfExportStatus(null), 3000);
    }
  };

  const handleImageSelect = (file: File, preview: string) => {
    setSelectedImage(file);
    setImagePreview(preview);
    setCurrentStep('ocr');
  };

  const handleOCRComplete = async (result: OCRDetectionResult) => {
    console.log('🔔 handleOCRComplete called, result:', result);

    setOcrText(result.text);
    setGeometryData(result.geometryData || null);

    // 保存 OCR 识别的科目和题型
    if (result.subject) {
      setOcrSubject(result.subject);
      console.log('OCR Subject:', result.subject);
    }
    if (result.questionType) {
      setOcrQuestionType(result.questionType);
      console.log('OCR Question Type:', result.questionType);
    }

    setCurrentStep('chat');

    if (!profile?.id) {
      console.error('No profile ID, cannot save error session');
      return;
    }

    // 保存 session
    await saveErrorSession(result.text, result.geometryData, result.geometrySvg, result.subject, result.questionType);
    console.log('🔔 saveErrorSession completed, triggering AI welcome...');

    // 🔔 直接触发 AI 暖场对话（不需要学生发消息）
    triggerAIWelcome(result.text, result.subject, result.questionType, result.geometryData);
  };

  // 触发 AI 暖场对话
  const triggerAIWelcome = async (
    questionText: string,
    subjectInfo?: { type: SubjectType; confidence: number } | null,
    questionTypeInfo?: { type: QuestionType; confidence: number } | null,
    geomData?: any
  ) => {
    console.log('🔔 triggerAIWelcome called with:', { questionText: questionText?.substring(0, 50), subjectInfo, questionTypeInfo, geomData });
    setIsChatLoading(true);

    // 不需要添加用户消息，直接让 AI 主动发起暖场
    // 用户已经通过上传题目表示了学习意愿

    try {
      const userLevel = (profile as any)?.subscription_tier || 'free';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: '[系统触发：学生已上传题目，请按照Phase 1暖场共情流程主动发起对话]',
          session_id: chatSessionRef.current,
          theme: profile?.theme_preference || 'junior',
          subject: subjectInfo?.type || 'math',
          userLevel: userLevel,
          subjectConfidence: subjectInfo?.confidence || 1,
          questionType: questionTypeInfo?.type || 'unknown',
          questionContent: questionText,
          geometryData: geomData,
          isWelcomeTrigger: true, // 标记这是暖场触发
        }),
      });

      const data = await response.json();

      if (data.dialogMode) {
        setDialogMode(data.dialogMode);
      }

      if (data.content) {
        const assistantMessage: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
        };
        setMessages([assistantMessage]); // 只显示 AI 的消息
      }
    } catch (error) {
      console.error('Failed to trigger AI welcome:', error);
      // 即使失败也显示一条提示
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: '老师收到你的题目了！这是一道很有意思的题目，能告诉我你在哪里卡住了吗？',
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const saveErrorSession = async (
    text: string,
    geomData?: any,
    geomSvg?: string | null,
    subjectInfo?: { type: SubjectType; confidence: number } | null,
    questionTypeInfo?: { type: QuestionType; confidence: number } | null
  ) => {
    if (!profile?.id) return;
    try {
      console.log('Creating error session with profile ID:', profile.id);

      // 确定科目（优先使用 OCR 识别结果）
      const sessionSubject = subjectInfo?.type || 'math';

      const response = await fetch('/api/error-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: effectiveStudentId,
          subject: sessionSubject,
          original_image_url: imagePreview || null,
          extracted_text: text,
          theme_used: profile?.theme_preference || 'junior',
          geometry_data: geomData || null, // 几何图形JSON数据（可编辑）
          geometry_svg: geomSvg || null, // 几何图形SVG图片（视觉一致）
          // 新增：OCR 识别信息
          ocr_subject: subjectInfo?.type || null,
          ocr_subject_confidence: subjectInfo?.confidence || null,
          ocr_question_type: questionTypeInfo?.type || null,
          ocr_question_type_confidence: questionTypeInfo?.confidence || null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        chatSessionRef.current = result.data.session_id;
        console.log('Error session created successfully:', result.data.session_id, 'theme:', result.data.theme_used);
      } else {
        const errorText = await response.text();
        console.error('Failed to create error session. Response:', errorText);
      }
    } catch (error) {
      console.error('Exception creating error session:', error);
    }
  };

  const handleImageRemove = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setOcrText('');
    setCurrentStep('upload');
    setMessages([]);
    chatSessionRef.current = `session_${Date.now()}`;
    // 重置 OCR 识别状态
    setOcrSubject(null);
    setOcrQuestionType(null);
    setDialogMode('Logic');
  };

  // Chat functions
  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      // 获取用户等级（从 profile 获取，默认为 free）
      const userLevel = (profile as any)?.subscription_tier || 'free';

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          session_id: chatSessionRef.current,
          theme: profile?.theme_preference || 'junior',
          // 新增参数
          subject: ocrSubject?.type || 'math',
          userLevel: userLevel,
          subjectConfidence: ocrSubject?.confidence || 1,
          questionType: ocrQuestionType?.type || 'unknown',
          // 原有参数
          questionContent: ocrText,
          geometryData: geometryData,
        }),
      });

      const data = await response.json();

      // 保存对话模式（Logic / Socra）
      if (data.dialogMode) {
        setDialogMode(data.dialogMode);
      }

      if (data.content) {
        const assistantMessage: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: 'assistant',
          content: data.content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else if (data.error) {
        const errorMessage: Message = {
          id: `msg_${Date.now()}_error`,
          role: 'assistant',
          content: '抱歉，我遇到了一些问题。请稍后再试。',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: '网络连接失败，请检查你的网络设置。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    // 获取用户等级
    const userLevel = (profile as any)?.subscription_tier || 'free';

    // 清除服务端的对话历史缓存
    fetch('/api/chat/clear-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: chatSessionRef.current,
        newSessionId: `session_${Date.now()}`,
        theme: profile?.theme_preference || 'junior',
        subject: ocrSubject?.type || 'math',
        userLevel: userLevel,
        subjectConfidence: ocrSubject?.confidence || 1,
        questionType: ocrQuestionType?.type || 'unknown',
        questionContent: ocrText,
        geometryData: geometryData,
      }),
    }).catch(console.error);
    chatSessionRef.current = `session_${Date.now()}`;
    setIsMastered(false);
    setMasterMessage(null);
  };

  // 标记为已掌握
  const handleMarkMastered = async () => {
    if (!chatSessionRef.current || !effectiveStudentId) {
      setMasterMessage('请先上传错题并开始学习');
      return;
    }

    setMastering(true);
    setMasterMessage(null);

    try {
      const response = await fetch('/api/error-session/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: chatSessionRef.current,
          student_id: effectiveStudentId,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsMastered(true);
        setMasterMessage(data.message || '恭喜！已标记为掌握');

        // 显示难度评分弹窗
        setCurrentSessionForRating(chatSessionRef.current);
        setCurrentAiDifficulty(data.difficulty_rating || null);
        setShowDifficultyModal(true);

        // 如果是家长，显示分析提示
        if (isParent && data.can_analyze) {
          setShowAnalysisPrompt(true);
        }
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

  // 提交学生难度评分
  const handleDifficultySubmit = async (rating: number) => {
    if (!currentSessionForRating || !effectiveStudentId) return;

    try {
      const response = await fetch('/api/error-session/difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: currentSessionForRating,
          student_id: effectiveStudentId,
          difficulty_rating: rating,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('[Workbench] Difficulty rating saved:', data.data);
      } else {
        console.error('[Workbench] Failed to save difficulty rating:', data.error);
      }
    } catch (error) {
      console.error('[Workbench] Error submitting difficulty rating:', error);
    }
  };

  // 关闭难度评分弹窗
  const handleCloseDifficultyModal = () => {
    setShowDifficultyModal(false);
    setCurrentSessionForRating(null);
    setCurrentAiDifficulty(null);
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const themeClass = profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior';

  // 根据对话模式确定 AI 名称（Logic = 通用模式，Socra = 专科模式）
  const aiName = dialogMode;

  // 正在检查登录状态时显示加载
  if (loading) {
    return (
      <div className={cn("min-h-screen bg-background flex items-center justify-center", themeClass)}>
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录时显示重定向提示（useEffect 会处理跳转）
  if (!user) {
    return (
      <div className={cn("min-h-screen bg-background flex items-center justify-center", themeClass)}>
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">正在跳转到登录页...</p>
        </div>
      </div>
    );
  }

  // Show student selector for parents without selected student
  if (isParent && !effectiveStudentId) {
    return (
      <div className={cn("min-h-screen bg-background flex items-center justify-center p-6", themeClass)}>
        <Card className="w-full max-w-md shadow-apple">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-xl">选择学习对象</CardTitle>
            <CardDescription>请选择要辅导的学生</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingStudents ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : parentStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">还没有关联的学生</p>
                <Button onClick={() => router.push('/dashboard')}>
                  去添加学生
                </Button>
              </div>
            ) : (
              parentStudents.map((student) => (
                <Button
                  key={student.id}
                  variant="outline"
                  className="w-full justify-start gap-3 h-14"
                  onClick={() => {
                    setSelectedStudentId(student.id);
                    setSelectedStudentName(student.display_name);
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold">{student.display_name.charAt(0)}</span>
                  </div>
                  <span className="font-medium">{student.display_name}</span>
                </Button>
              ))
            )}
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full gap-2"
                onClick={() => router.push('/dashboard')}
              >
                <ArrowLeft className="w-4 h-4" />
                返回仪表板
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950", themeClass)}>
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/30 dark:bg-purple-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-blue-200/30 dark:bg-blue-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-green-200/20 dark:bg-green-900/20 rounded-full blur-3xl" />
      </div>

      {/* Parent indicator */}
      {isParent && selectedStudentName && (
        <div className="bg-primary/5 border-b border-primary/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">正在辅导：</span>
              <span className="font-medium">{selectedStudentName}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedStudentId(null);
                setSelectedStudentName('');
              }}
              className="text-xs"
            >
              切换学生
            </Button>
          </div>
        </div>
      )}
      {/* 页面标题卡片 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div
          style={{
            opacity: pageAnimation ? 1 : 0,
            transform: pageAnimation ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
          }}
        >
          <PageHeader
            title="学习工作台"
            description={profile?.theme_preference === 'junior' ? '小学版 · AI引导学习' : '中学版 · AI推理分析'}
            icon={BookOpen}
            iconColor="text-green-500"
            actions={
              <div className="flex items-center gap-3">
                {/* Study Session Timer */}
                {isStudying ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-2 px-3 py-1">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <Timer className="w-3.5 h-3.5" />
                    <span>{formatDuration(studyDuration)}</span>
                  </Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground px-3 py-1">
                    未开始
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleStudySession}
                  className="gap-2 transition-all duration-200"
                >
                  {isStudying ? (
                    <>
                      <Pause className="w-4 h-4" />
                      暂停
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      开始学习
                    </>
                  )}
                </Button>
              </div>
            }
          />
        </div>
      </div>

      {/* Main Content - 双栏布局 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {/* 移动端横屏提示 */}
        {isMobile && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-3">
            <Smartphone className="w-5 h-5 text-blue-500" />
            <div className="flex-1">
              <p className="text-sm text-blue-700 dark:text-blue-400">
                横屏使用体验更佳，题目和对话可同时显示
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - 题目区域 - PC端固定，移动端可折叠 */}
          <div
            ref={leftPanelAnimation.ref}
            className={cn(
              "w-full lg:w-[40%] lg:flex-shrink-0 transition-all duration-300",
              isMobile && !showMobilePanel && "hidden"
            )}
            style={{
              opacity: leftPanelAnimation.isVisible ? 1 : 0,
              transform: leftPanelAnimation.isVisible ? 'translateX(0)' : 'translateX(-30px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            }}
          >
            {/* PC端：sticky固定 */}
            <div className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto space-y-6">
              {/* Image Upload Card */}
              <Card className="border-border/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Camera className="w-5 h-5 text-primary" />
                    上传错题
                  </CardTitle>
                  <CardDescription>
                    拍摄或上传你的错题图片
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUploader
                    onImageSelect={handleImageSelect}
                    onImageRemove={handleImageRemove}
                    currentImage={imagePreview}
                    maxSize={10}
                  />
                </CardContent>
              </Card>

              {/* OCR Result Card */}
              {selectedImage && (
                <div
                  className="animate-slide-up"
                  style={{
                    animation: 'slideUp 0.4s ease-out forwards',
                  }}
                >
                  <OCRResult
                    initialText={ocrText}
                    onTextChange={setOcrText}
                    onConfirm={handleOCRComplete}
                    imageData={imagePreview}
                    onGeometryChange={(data) => {
                      console.log('Geometry changed:', data);

                      // 生成变更提示
                      const hints: string[] = [];
                      const prevData = prevGeometryDataRef.current;

                      if (prevData) {
                        // 检测新增的自定义点
                        const prevCustomPoints = prevData.points?.filter((p: any) => p.id.startsWith('custom_')) || [];
                        const newCustomPoints = data.points?.filter((p: any) => p.id.startsWith('custom_')) || [];
                        if (newCustomPoints.length > prevCustomPoints.length) {
                          const addedPoint = newCustomPoints[newCustomPoints.length - 1];
                          hints.push(`添加了点 ${addedPoint.name}(${addedPoint.x.toFixed(1)}, ${addedPoint.y.toFixed(1)})`);
                        }

                        // 检测新增的辅助线
                        const prevAuxLines = prevData.lines?.filter((l: any) => l.id.startsWith('aux_')) || [];
                        const newAuxLines = data.lines?.filter((l: any) => l.id.startsWith('aux_')) || [];
                        if (newAuxLines.length > prevAuxLines.length) {
                          const addedLine = newAuxLines[newAuxLines.length - 1];
                          hints.push(`添加了辅助线 ${addedLine.start}-${addedLine.end}`);
                        }

                        // 检测点坐标变化（拖动）
                        if (data.points && prevData.points) {
                          data.points.forEach((newPoint: any) => {
                            const prevPoint = prevData.points?.find((p: any) => p.id === newPoint.id);
                            if (prevPoint && !newPoint.id.startsWith('custom_')) {
                              const dx = Math.abs(newPoint.x - prevPoint.x);
                              const dy = Math.abs(newPoint.y - prevPoint.y);
                              if (dx > 0.1 || dy > 0.1) {
                                hints.push(`点 ${newPoint.name} 移动到 (${newPoint.x.toFixed(1)}, ${newPoint.y.toFixed(1)})`);
                              }
                            }
                          });
                        }
                      }

                      // 更新状态
                      setGeometryData(data);
                      prevGeometryDataRef.current = data;

                      // 显示变更提示（3秒后自动消失）
                      if (hints.length > 0) {
                        setGeometryChangeHint(hints.join('；'));
                        setTimeout(() => setGeometryChangeHint(null), 5000);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - 对话区域 - 可独立滚动 */}
          <div
            ref={rightPanelAnimation.ref}
            className="flex-1 min-w-0"
            style={{
              opacity: rightPanelAnimation.isVisible ? 1 : 0,
              transform: rightPanelAnimation.isVisible ? 'translateX(0)' : 'translateX(30px)',
              transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s',
            }}
          >
            {/* 移动端切换按钮 */}
            {isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMobilePanel(!showMobilePanel)}
                className="mb-4 gap-2"
              >
                <PanelLeft className="w-4 h-4" />
                {showMobilePanel ? '隐藏题目区' : '显示题目区'}
              </Button>
            )}
            <Card className="border-border/50 h-full flex flex-col min-h-[600px] transition-all duration-300 hover:shadow-lg">
              {currentStep === 'upload' && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center space-y-6">
                    <div
                      className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center"
                      style={{
                        animation: 'float 6s ease-in-out infinite',
                      }}
                    >
                      <Bot className="w-12 h-12 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-2">
                        {profile?.theme_preference === 'junior' ? '准备好学习了吗?' : '开始你的学习之旅'}
                      </h3>
                      <p className="text-muted-foreground max-w-sm mx-auto">
                        {profile?.theme_preference === 'junior'
                          ? `${aiName} 会引导你理解问题，一步步找到答案`
                          : `${aiName} 将通过苏格拉底式提问帮助你深入思考`}
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      {aiName} 已就绪
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'ocr' && (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                    <h3 className="text-lg font-semibold">
                      正在分析你的错题...
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      AI 正在识别题目内容
                    </p>
                  </div>
                </div>
              )}

              {currentStep === 'chat' && (
                <div className="flex-1 flex flex-col">
                  {/* Chat Header */}
                  <CardHeader className="border-b border-border/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white font-bold">
                          {aiName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium">{aiName}</p>
                          <p className="text-xs text-muted-foreground">AI 学习导师</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pdfExportStatus && (
                          <span className={cn(
                            "text-xs px-2 py-1 rounded",
                            pdfExportStatus.includes('成功') ? "text-green-600 bg-green-50" :
                            pdfExportStatus.includes('失败') || pdfExportStatus.includes('请先') ? "text-red-600 bg-red-50" :
                            "text-muted-foreground"
                          )}>
                            {pdfExportStatus}
                          </span>
                        )}
                        {masterMessage && (
                          <span className={cn(
                            "text-xs px-2 py-1 rounded",
                            masterMessage.includes('恭喜') ? "text-green-600 bg-green-50" :
                            masterMessage.includes('失败') || masterMessage.includes('错误') ? "text-red-600 bg-red-50" :
                            "text-muted-foreground"
                          )}>
                            {masterMessage}
                          </span>
                        )}
                        {currentStep === 'chat' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleExportPDF}
                              disabled={pdfExporting}
                              className="gap-2"
                            >
                              {pdfExporting ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  导出中...
                                </>
                              ) : (
                                <>
                                  <Download className="w-4 h-4" />
                                  导出PDF
                                </>
                              )}
                            </Button>
                            {!isMastered ? (
                              <Button
                                size="sm"
                                onClick={handleMarkMastered}
                                disabled={mastering || messages.length === 0}
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
                            ) : (
                              <Badge className="bg-green-100 text-green-700 gap-1">
                                <CheckCircle className="w-3 h-3" />
                                已掌握
                              </Badge>
                            )}
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleResetChat}
                          className="gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          重新开始
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {/* OCR Context */}
                  {ocrText && (
                    <div className="px-6 pt-4">
                      <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">当前题目：</p>
                        <p className="text-sm line-clamp-2">{ocrText}</p>
                      </div>
                    </div>
                  )}

                  {/* 几何变更提示 */}
                  {geometryChangeHint && (
                    <div className="px-6 pt-2">
                      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
                        <Sparkles className="w-4 h-4 text-slate-500" />
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          图形已更新：{geometryChangeHint}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-auto px-6">
                    <ChatMessageList
                      messages={messages}
                      theme={profile?.theme_preference || 'junior'}
                      isLoading={isChatLoading}
                    />
                    <div ref={messagesEndRef} />
                  </CardContent>

                  {/* Input */}
                  <div className="p-4 border-t border-border/50">
                    <ChatInput
                      onSend={handleSendMessage}
                      isLoading={isChatLoading}
                      placeholder={
                        profile?.theme_preference === 'junior'
                          ? '告诉我你的想法...'
                          : '描述你的问题或思路...'
                      }
                    />
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* 待复习题目区域 */}
        {!isParent && (pendingReviews.length > 0 || loadingReviews) && (
          <div className="mt-8 pt-8 border-t border-border/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                待复习题目
                {pendingReviews.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {pendingReviews.length} 道已到期
                  </Badge>
                )}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/review')}
                className="text-muted-foreground"
              >
                查看全部
              </Button>
            </div>

            {loadingReviews ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingReviews.map((review) => (
                  <Card
                    key={review.id}
                    className={cn(
                      "border-border/50 transition-all duration-300 hover:shadow-lg cursor-pointer",
                      review.isOverdue && "border-l-4 border-l-red-500"
                    )}
                    onClick={() => router.push(`/review/session/${review.id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {review.subject === 'math' ? '📐' : review.subject === 'physics' ? '🔬' : '📚'}
                          </span>
                          <Badge
                            variant={review.isOverdue ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {getUrgencyLabel(review.daysUntilDue)}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatReviewDate(review.nextReviewAt)}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {review.extractedText || '点击查看题目详情'}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {REVIEW_STAGES.find(s => s.stage === review.reviewStage)?.name || '复习中'}
                          </span>
                        </div>
                        <div className="flex-1 h-1 bg-muted rounded-full mx-2 overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full"
                            style={{ width: `${(review.reviewStage / 5) * 100}%` }}
                          />
                        </div>
                      </div>

                      {review.conceptTags && review.conceptTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {review.conceptTags.slice(0, 2).map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs font-normal">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {pendingReviews.length === 0 && !loadingReviews && (
              <Card className="border-border/50">
                <CardContent className="py-8 text-center">
                  <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="text-muted-foreground">太棒了！没有待复习的题目</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </main>

      {/* AI Analysis Prompt for Parent (after mastery) */}
      {showAnalysisPrompt && isParent && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom duration-300">
          <Card className="shadow-xl border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 max-w-md">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-purple-900 dark:text-purple-100">
                    孩子完成学习了！
                  </p>
                  <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                    点击查看AI分析报告，了解孩子的学习状态和沟通建议
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAnalysisPrompt(false)}
                  className="text-purple-600 dark:text-purple-300"
                >
                  稍后再说
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowAnalysisPrompt(false);
                    setShowAnalysisDialog(true);
                  }}
                  className="bg-purple-500 hover:bg-purple-600 text-white"
                >
                  查看分析
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Analysis Dialog */}
      <AnalysisDialog
        open={showAnalysisDialog}
        onOpenChange={setShowAnalysisDialog}
        sessionId={chatSessionRef.current}
      />

      {/* Difficulty Rating Modal - 难度评分弹窗 */}
      <DifficultyRatingModal
        isOpen={showDifficultyModal}
        onClose={handleCloseDifficultyModal}
        onSubmit={handleDifficultySubmit}
        onSkip={handleCloseDifficultyModal}
        aiRating={currentAiDifficulty}
        questionText={ocrText.substring(0, 100)}
      />

      {/* Development Notice */}
      <div className="fixed bottom-4 left-0 right-0 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto">
          <div className="mx-auto bg-card/80 backdrop-blur-xl rounded-full px-4 py-2 text-sm text-muted-foreground shadow-sm border border-border/50 w-fit">
            工作台开发中...更多功能即将上线
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading fallback component
function WorkbenchLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-primary/30"></div>
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        </div>
        <p className="text-muted-foreground">加载中...</p>
      </div>
    </div>
  );
}

// Export with Suspense wrapper for useSearchParams
export default function WorkbenchPageWrapper() {
  return (
    <Suspense fallback={<WorkbenchLoading />}>
      <WorkbenchPage />
    </Suspense>
  );
}
