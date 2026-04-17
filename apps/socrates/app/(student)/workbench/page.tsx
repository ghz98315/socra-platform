// =====================================================
// Project Socrates - Workbench Page (Student & Parent)
// 左右分栏布局 + 左侧面板可滚动
// =====================================================

'use client';

import { useState, useEffect, useRef, Suspense, useCallback } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
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
  Hexagon,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUploader } from '@/components/ImageUploader';
import { OCRResult } from '@/components/OCRResult';
import { ChatMessageList, type Message } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { ChatWrapUpCard, type WrapUpPreviewData } from '@/components/chat/ChatWrapUpCard';
import { PageHeader } from '@/components/PageHeader';
import { GeometryRenderer, type GeometryData, type GeometryRendererRef } from '@/components/GeometryRenderer';
import { SubjectTabs, type SubjectType, getSubjectConfig } from '@/components/SubjectTabs';
import {
  getRootCauseSubtypeOptions,
  isValidRootCauseSubtype,
  type RootCauseCategory,
  type RootCauseSubtype,
} from '@/lib/error-loop/taxonomy';
import { hasAssistantWrapUpCue, isLikelyWrapUpSignal } from '@/lib/chat/wrap-up-signal';
import { cn } from '@/lib/utils';
import { downloadErrorQuestionPDF } from '@/lib/pdf/ErrorQuestionPDF';
import { createClient } from '@/lib/supabase/client';

type Step = 'upload' | 'ocr' | 'chat';
type GeometryUiState =
  | 'idle'
  | 'ready'
  | 'low-confidence'
  | 'unknown'
  | 'error'
  | 'preserved-unknown'
  | 'preserved-error';

const EMPTY_GEOMETRY: GeometryData = {
  type: 'unknown',
  points: [],
  lines: [],
  circles: [],
  curves: [],
  angles: [],
  labels: [],
  relations: [],
  confidence: 0,
};

const getGeometryUiStateFromData = (data: GeometryData | null): GeometryUiState => {
  if (!data || data.type === 'unknown') {
    return 'idle';
  }

  return data.confidence < 0.7 ? 'low-confidence' : 'ready';
};

const GEOMETRY_HINT_PATTERN =
  /[△▵▲三角形四边形平行四边形梯形菱形矩形正方形圆扇形弧切线直线射线线段中点垂线高线角平分线周长面积相似全等坐标函数抛物线点[ABCDEFGHOPQMNXYZ]边[ABCDEF]{1,2}|∠|⊥|∥|圆心|半径|直径|弦]/;

const hasLikelyGeometryContent = (text: string) => {
  const normalized = text.replace(/\s+/g, '');
  return GEOMETRY_HINT_PATTERN.test(normalized);
};

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
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageAnimation = usePageAnimation();
  const leftPanelAnimation = useScrollAnimation();
  const rightPanelAnimation = useScrollAnimation();

  // Parent student selection
  const [parentStudents, setParentStudents] = useState<Array<{ id: string; display_name: string }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [selectedStudentName, setSelectedStudentName] = useState<string>('');
  const [loadingStudents, setLoadingStudents] = useState(false);

  const isParent = profile?.role === 'parent';
  const effectiveStudentId = isParent ? selectedStudentId : profile?.id;

  // Subject from URL params
  const [activeSubject, setActiveSubject] = useState<SubjectType>('math');

  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [isRestoringSession, setIsRestoringSession] = useState(false);

  // Geometry state
  const [geometryData, setGeometryData] = useState<GeometryData | null>(null);
  const [geometryUiState, setGeometryUiState] = useState<GeometryUiState>('idle');
  const [isGeometryLoading, setIsGeometryLoading] = useState(false);
  const geometryAbortRef = useRef<boolean>(false);
  const geometryDataRef = useRef<GeometryData | null>(null);
  const lastParsedTextRef = useRef<string>(''); // 跟踪已解析的文本，避免重复解析
  const isGeometryLoadingRef = useRef(false); // 用ref跟踪加载状态
  const shouldAutoParseRef = useRef(false); // 控制是否应该自动解析（仅在OCR完成时为true）

  // Left panel scroll container ref
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const geometryRendererRef = useRef<GeometryRendererRef | null>(null);
  const [errorSessionId, setErrorSessionId] = useState<string | null>(null);
  const lastSyncedGeometrySignatureRef = useRef('');
  const geometrySyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geometryEnabled = activeSubject === 'math';

  // 同步加载状态到ref
  useEffect(() => {
    isGeometryLoadingRef.current = isGeometryLoading;
  }, [isGeometryLoading]);

  useEffect(() => {
    geometryDataRef.current = geometryData;
  }, [geometryData]);

  // Debug: Log geometry state changes
  useEffect(() => {
    console.log('[Workbench] Geometry state changed:', {
      isLoading: isGeometryLoading,
      hasData: !!geometryData,
      dataType: geometryData?.type,
      dataPoints: geometryData?.points?.length
    });
  }, [isGeometryLoading, geometryData]);

  // 自动触发几何识别：仅在 shouldAutoParseRef 为 true 时触发
  // 这避免了用户编辑文本时重复解析
  useEffect(() => {
    // 只有当标记为应该解析、文本不为空、不是正在加载、且与上次解析的文本不同时才触发
    const shouldParse = geometryEnabled &&
        shouldAutoParseRef.current &&
        ocrText &&
        ocrText.trim().length > 0 &&
        ocrText !== lastParsedTextRef.current &&
        !isGeometryLoadingRef.current;

    console.log('[Workbench] Auto-parse check:', {
      geometryEnabled,
      shouldAutoParse: shouldAutoParseRef.current,
      hasText: !!ocrText,
      textLength: ocrText?.length,
      lastParsed: lastParsedTextRef.current?.substring(0, 50),
      isLoading: isGeometryLoadingRef.current,
      shouldParse
    });

    if (shouldParse) {
      console.log('[Workbench] Auto-starting geometry parsing');
      lastParsedTextRef.current = ocrText;
      shouldAutoParseRef.current = false; // 解析后重置标志
      parseGeometry(ocrText);
    }
  }, [geometryEnabled, ocrText]);

  useEffect(() => {
    if (geometryEnabled) {
      return;
    }

    geometryAbortRef.current = true;
    shouldAutoParseRef.current = false;
    setGeometryData(null);
    setGeometryUiState('idle');
    setIsGeometryLoading(false);

    if (geometrySyncTimeoutRef.current) {
      clearTimeout(geometrySyncTimeoutRef.current);
      geometrySyncTimeoutRef.current = null;
    }
  }, [geometryEnabled]);

  const getGeometrySvg = useCallback(() => {
    return geometryRendererRef.current?.getSVGContent() || null;
  }, []);

  const syncGeometryToSession = useCallback(async (
    sessionId: string,
    nextGeometryData: GeometryData,
    geometrySvg?: string | null,
  ) => {
    try {
      const payload: Record<string, unknown> = {
        session_id: sessionId,
        geometry_data: nextGeometryData,
      };

      if (geometrySvg !== undefined) {
        payload.geometry_svg = geometrySvg;
      }

      const response = await fetch('/api/error-session', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Workbench] Failed to sync geometry data. Response:', errorText);
        return;
      }

      console.log('[Workbench] Geometry data synced to error session:', sessionId);
    } catch (error) {
      console.error('[Workbench] Exception syncing geometry data:', error);
    }
  }, []);

  useEffect(() => {
    if (!geometryEnabled || !errorSessionId || !geometryData || geometryData.type === 'unknown') {
      return;
    }

    const nextSignature = JSON.stringify(geometryData);
    if (nextSignature === lastSyncedGeometrySignatureRef.current) {
      return;
    }

    lastSyncedGeometrySignatureRef.current = nextSignature;
    if (geometrySyncTimeoutRef.current) {
      clearTimeout(geometrySyncTimeoutRef.current);
    }

    geometrySyncTimeoutRef.current = setTimeout(() => {
      geometrySyncTimeoutRef.current = null;
      const geometrySvg = getGeometrySvg();
      void syncGeometryToSession(errorSessionId, geometryData, geometrySvg ?? undefined);
    }, 400);

    return () => {
      if (geometrySyncTimeoutRef.current) {
        clearTimeout(geometrySyncTimeoutRef.current);
        geometrySyncTimeoutRef.current = null;
      }
    };
  }, [errorSessionId, geometryData, geometryEnabled, getGeometrySvg, syncGeometryToSession]);

  useEffect(() => {
    return () => {
      if (geometrySyncTimeoutRef.current) {
        clearTimeout(geometrySyncTimeoutRef.current);
      }
    };
  }, []);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatSessionRef = useRef<string>(`session_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [wrapUpPreview, setWrapUpPreview] = useState<WrapUpPreviewData | null>(null);
  const [isWrapUpLoading, setIsWrapUpLoading] = useState(false);
  const [isWrapUpSubmitting, setIsWrapUpSubmitting] = useState(false);
  const [wrapUpSubmitError, setWrapUpSubmitError] = useState<string | null>(null);
  const [wrapUpCategory, setWrapUpCategory] = useState<RootCauseCategory>('strategy_gap');
  const [wrapUpSubtype, setWrapUpSubtype] = useState<RootCauseSubtype>('no_entry_strategy');
  const [wrapUpDifficulty, setWrapUpDifficulty] = useState(3);
  const [wrapUpDismissedCount, setWrapUpDismissedCount] = useState(0);
  const [wrapUpSubmitted, setWrapUpSubmitted] = useState(false);
  const [isSessionPreparing, setIsSessionPreparing] = useState(false);

  // Study session tracking
  const [isStudying, setIsStudying] = useState(false);
  const [studySessionId, setStudySessionId] = useState<string | null>(null);
  const [studyDuration, setStudyDuration] = useState(0);
  const studyTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      const currentQuery = searchParams.toString();
      const redirectTarget = currentQuery ? `/workbench?${currentQuery}` : '/workbench';
      router.replace(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
    }
  }, [authLoading, router, searchParams, user]);

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

    // Check for subject param in URL
    const subjectParam = searchParams.get('subject');
    if (subjectParam && ['math', 'chinese', 'english', 'physics', 'chemistry'].includes(subjectParam)) {
      setActiveSubject(subjectParam as SubjectType);
    }

    const sessionParam = searchParams.get('session');
    if (sessionParam) {
      void loadExistingSession(sessionParam);
    }
  }, [isParent, profile?.id, searchParams]);

  const loadExistingSession = async (sessionId: string) => {
    setIsRestoringSession(true);

    try {
      // Database typings here do not cover the restored session join shape used by this page.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = createClient() as any;
      let restoredStudentName = isParent ? selectedStudentName : profile?.display_name;

      const { data: sessionData, error: sessionError } = await supabase
        .from('error_sessions')
        .select('id, student_id, subject, original_image_url, extracted_text, geometry_data, created_at')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData) {
        console.error('[Workbench] Failed to load existing session:', sessionError);
        return;
      }

      const restoredSubject = sessionData.subject;
      if (restoredSubject && ['math', 'chinese', 'english', 'physics', 'chemistry'].includes(restoredSubject)) {
        setActiveSubject(restoredSubject as SubjectType);
      }

      if (isParent && sessionData.student_id) {
        setSelectedStudentId(sessionData.student_id);

        const matchedStudent = parentStudents.find((student) => student.id === sessionData.student_id);
        if (matchedStudent) {
          restoredStudentName = matchedStudent.display_name;
          setSelectedStudentName(matchedStudent.display_name);
        } else {
          const { data: studentProfile } = await supabase
            .from('profiles')
            .select('display_name')
            .eq('id', sessionData.student_id)
            .maybeSingle();

          if (studentProfile?.display_name) {
            restoredStudentName = studentProfile.display_name;
            setSelectedStudentName(studentProfile.display_name);
          }
        }
      }

      setSelectedImage(null);
      setImagePreview(sessionData.original_image_url || null);
      setOcrText(sessionData.extracted_text || '');
      resetWrapUpState();
      setGeometryData(restoredSubject === 'math' ? sessionData.geometry_data || null : null);
      setGeometryUiState(
        restoredSubject === 'math'
          ? getGeometryUiStateFromData(sessionData.geometry_data || null)
          : 'idle',
      );
      setCurrentStep(sessionData.extracted_text ? 'chat' : sessionData.original_image_url ? 'ocr' : 'upload');
      setErrorSessionId(sessionData.id);
      chatSessionRef.current = sessionData.id;
      lastParsedTextRef.current = sessionData.extracted_text || '';
      lastSyncedGeometrySignatureRef.current =
        restoredSubject === 'math' && sessionData.geometry_data
          ? JSON.stringify(sessionData.geometry_data)
          : '';
      shouldAutoParseRef.current = false;

      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('[Workbench] Failed to load session messages:', messagesError);
        setMessages(
          sessionData.extracted_text
            ? [buildOpeningAssistantMessage(restoredStudentName)]
            : [],
        );
      } else {
        const restoredMessages: Message[] = (messagesData || []).map((message: { id: string; role: 'user' | 'assistant' | 'system'; content: string; created_at: string }) => ({
          id: message.id,
          role: message.role,
          content: message.content,
          timestamp: new Date(message.created_at),
        }));
        setMessages(
          restoredMessages.length > 0
            ? restoredMessages
            : sessionData.extracted_text
              ? [buildOpeningAssistantMessage(restoredStudentName)]
              : [],
        );
      }
    } catch (error) {
      console.error('[Workbench] Exception while restoring session:', error);
    } finally {
      setIsRestoringSession(false);
    }
  };

  const loadParentStudents = async () => {
    if (!profile?.id) return;
    setLoadingStudents(true);
    const supabase = createClient();

    const { data: relations } = await supabase
      .from('parent_students')
      .select('student_id, profiles!parent_students_student_id_fkey(display_name)')
      .eq('parent_id', profile.id);

    if (relations) {
      const students = relations.map((r: { student_id: string; profiles: { display_name: string } }) => ({
        id: r.student_id,
        display_name: r.profiles?.display_name || '未命名学生',
      }));
      setParentStudents(students);

      // Auto-select first student if only one
      if (students.length === 1 && !selectedStudentId) {
        setSelectedStudentId(students[0].id);
        setSelectedStudentName(students[0].display_name);
      }
    }
    setLoadingStudents(false);
  };

  const resetWrapUpState = useCallback(() => {
    setWrapUpPreview(null);
    setIsWrapUpLoading(false);
    setIsWrapUpSubmitting(false);
    setWrapUpSubmitError(null);
    setWrapUpCategory('strategy_gap');
    setWrapUpSubtype('no_entry_strategy');
    setWrapUpDifficulty(3);
    setWrapUpDismissedCount(0);
    setWrapUpSubmitted(false);
  }, []);

  const syncWrapUpDefaults = useCallback((preview: WrapUpPreviewData) => {
    setWrapUpPreview(preview);
    setWrapUpSubmitError(null);
    setWrapUpCategory(preview.suggested_root_cause_category);
    setWrapUpSubtype(preview.suggested_root_cause_subtype);
    setWrapUpDifficulty(preview.suggested_difficulty_rating);
  }, []);

  const readWrapUpPayload = useCallback(async (response: Response) => {
    const raw = await response.text();

    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      const contentType = response.headers.get('content-type') || '';
      const looksLikeHtml = raw.trimStart().startsWith('<') || contentType.includes('text/html');
      throw new Error(
        looksLikeHtml
          ? '收口接口返回了非 JSON 响应，通常表示线上服务报错或当前部署还没有更新完成。请稍后重试。'
          : '收口接口返回的数据格式不正确，请稍后重试。',
      );
    }
  }, []);

  const fetchWrapUpPreview = useCallback(async () => {
    if (!errorSessionId || !effectiveStudentId || isWrapUpLoading || isWrapUpSubmitting || wrapUpSubmitted) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    setIsWrapUpLoading(true);
    setWrapUpSubmitError(null);

    try {
      const response = await fetch('/api/error-session/wrap-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          mode: 'preview',
          session_id: errorSessionId,
          student_id: effectiveStudentId,
        }),
      });

      const result = await readWrapUpPayload(response);
      if (!response.ok || !result?.data) {
        throw new Error(result?.error || 'Failed to load wrap-up preview');
      }

      syncWrapUpDefaults(result.data as WrapUpPreviewData);
    } catch (error) {
      console.error('[Workbench] Failed to fetch wrap-up preview:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        setWrapUpSubmitError('加载收口卡片超时，请稍后重试。');
        return;
      }
      if (error instanceof Error) {
        setWrapUpSubmitError(error.message);
        return;
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsWrapUpLoading(false);
    }
  }, [
    effectiveStudentId,
    errorSessionId,
    isWrapUpLoading,
    isWrapUpSubmitting,
    readWrapUpPayload,
    syncWrapUpDefaults,
    wrapUpSubmitted,
  ]);

  const handleContinueWrapUp = useCallback(() => {
    const currentUserMessageCount = messages.filter((message) => message.role === 'user').length;
    setWrapUpDismissedCount(currentUserMessageCount);
    setWrapUpPreview(null);
    setWrapUpSubmitError(null);
  }, [messages]);

  const handleSubmitWrapUp = useCallback(async () => {
    if (!errorSessionId || !effectiveStudentId || isWrapUpSubmitting) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10000);

    setIsWrapUpSubmitting(true);
    setWrapUpSubmitError(null);

    try {
      const response = await fetch('/api/error-session/wrap-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          mode: 'submit',
          session_id: errorSessionId,
          student_id: effectiveStudentId,
          root_cause_category: wrapUpCategory,
          root_cause_subtype: wrapUpSubtype,
          difficulty_rating: wrapUpDifficulty,
        }),
      });

      const result = await readWrapUpPayload(response);
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to submit wrap-up result');
      }

      setWrapUpSubmitted(true);
      router.push(`/error-book/${errorSessionId}?from=wrap-up`);
    } catch (error) {
      console.error('[Workbench] Failed to submit wrap-up result:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        setWrapUpSubmitError('提交收口结果超时，请稍后重试。');
        return;
      }
      if (error instanceof Error) {
        setWrapUpSubmitError(error.message);
        return;
      }
      setWrapUpSubmitError('提交收口结果失败，请稍后重试。');
    } finally {
      window.clearTimeout(timeoutId);
      setIsWrapUpSubmitting(false);
    }
  }, [
    effectiveStudentId,
    errorSessionId,
    readWrapUpPayload,
    router,
    isWrapUpSubmitting,
    wrapUpCategory,
    wrapUpDifficulty,
    wrapUpSubtype,
  ]);

  // Start study session when component mounts
  useEffect(() => {
    if (!isParent || selectedStudentId) {
      startStudySession();
    }

    // Set up heartbeat interval
    const heartbeatInterval = setInterval(() => {
      if (isStudying && studySessionId) {
        sendHeartbeat();
      }
    }, 30000);

    // Set up duration update interval
    studyTimerRef.current = setInterval(() => {
      if (isStudying) {
        setStudyDuration(prev => prev + 1);
      }
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(heartbeatInterval);
      if (studyTimerRef.current) {
        clearInterval(studyTimerRef.current);
      }
      endStudySession();
    };
  }, []);

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
  const handleExportPDF = async () => {
    if (!ocrText && messages.length === 0) {
      return;
    }

    try {
      await downloadErrorQuestionPDF({
        subject: activeSubject,
        createdAt: new Date().toISOString(),
        studentName: profile?.display_name,
        ocrText: ocrText || undefined,
        imageUrl: imagePreview || undefined,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const buildOpeningAssistantMessage = useCallback((studentName?: string | null): Message => {
    const normalizedName = studentName?.trim();

    return {
      id: `msg_${Date.now()}_opening`,
      role: 'assistant',
      content: normalizedName
        ? `你好，${normalizedName}，这道题我看到了。你现在最卡哪一步？`
        : '你好，这道题我看到了。你现在最卡哪一步？',
      timestamp: new Date(),
    };
  }, []);

  const handleImageSelect = (file: File, preview: string) => {
    setSelectedImage(file);
    setImagePreview(preview);
    setCurrentStep('ocr');
  };

  // 解析几何图形
  const parseGeometry = async (text: string) => {
    if (!geometryEnabled || !text?.trim()) {
      setGeometryData(null);
      setGeometryUiState('idle');
      setIsGeometryLoading(false);
      return;
    }

    if (!hasLikelyGeometryContent(text)) {
      setGeometryData(null);
      setGeometryUiState('idle');
      setIsGeometryLoading(false);
      return;
    }

    console.log('[Workbench] parseGeometry called with text:', text?.substring(0, 100));
    const previousGeometry = geometryDataRef.current;
    const hasPreviousGeometry = !!previousGeometry && previousGeometry.type !== 'unknown';

    // 重置 abort 标志
    geometryAbortRef.current = false;
    console.log('[Workbench] Setting isGeometryLoading to true');
    setIsGeometryLoading(true);

    try {
      // 使用 AbortController 实现超时 (30秒)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('[Workbench] Geometry API request timed out after 30s');
      }, 30000);

      console.log('[Workbench] Calling /api/geometry...');
      const response = await fetch('/api/geometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, subject: activeSubject }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // 检查是否已取消
      if (geometryAbortRef.current) {
        console.log('[Workbench] Geometry parsing was aborted');
        return;
      }

      console.log('[Workbench] Geometry API response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('[Workbench] Geometry API result:', JSON.stringify(result).substring(0, 500));

        if (!geometryAbortRef.current) {
          if (result.success && result.geometry) {
            // 无论是否为 unknown 都设置数据，以便 UI 显示相应状态
            console.log('[Workbench] Setting geometryData:', result.geometry.type, 'with', result.geometry.points?.length, 'points');
            if (result.geometry.type !== 'unknown') {
              setGeometryData(result.geometry);
              setGeometryUiState(getGeometryUiStateFromData(result.geometry));
              console.log('[Workbench] Geometry parsed successfully, confidence:', result.geometry.confidence);
            } else if (hasPreviousGeometry) {
              setGeometryUiState('preserved-unknown');
              console.log('[Workbench] Geometry became unknown, preserving previous usable geometry');
            } else {
              setGeometryData(result.geometry);
              setGeometryUiState('unknown');
              console.log('[Workbench] No geometry content detected (type: unknown)');
            }
          } else {
            console.log('[Workbench] Geometry parsing failed');
            if (hasPreviousGeometry) {
              setGeometryUiState('preserved-error');
            } else {
              setGeometryData(EMPTY_GEOMETRY);
              setGeometryUiState('error');
            }
          }
        }
      } else {
        if (!geometryAbortRef.current) {
          console.log('[Workbench] Geometry API response not OK:', response.status);
          if (hasPreviousGeometry) {
            setGeometryUiState('preserved-error');
          } else {
            setGeometryData(EMPTY_GEOMETRY);
            setGeometryUiState('error');
          }
        }
      }
    } catch (error: unknown) {
      if (!geometryAbortRef.current) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('[Workbench] Geometry API request was aborted (timeout)');
        } else {
          console.error('[Workbench] Failed to parse geometry:', error);
        }
        if (hasPreviousGeometry) {
          setGeometryUiState('preserved-error');
        } else {
          setGeometryData(null);
          setGeometryUiState('error');
        }
      }
    } finally {
      if (!geometryAbortRef.current) {
        console.log('[Workbench] Setting isGeometryLoading to false');
        setIsGeometryLoading(false);
      }
    }
  };

  // 处理 OCR 成功完成（仅在此触发几何分析，不在用户编辑时触发）
  const handleOCRSuccess = (text: string) => {
    console.log('[Workbench] OCR success, triggering geometry analysis');
    shouldAutoParseRef.current = geometryEnabled;
    // 重置上次解析的文本，以便新的解析可以触发
    lastParsedTextRef.current = '';
    if (!geometryEnabled) {
      geometryAbortRef.current = true;
      setGeometryData(null);
      setGeometryUiState('idle');
      setIsGeometryLoading(false);
    }
    if (geometrySyncTimeoutRef.current) {
      clearTimeout(geometrySyncTimeoutRef.current);
      geometrySyncTimeoutRef.current = null;
    }
    // 此时 ocrText 已经通过 onTextChange 更新了
  };

  const handleOCRComplete = async (text: string) => {
    console.log('[Workbench] handleOCRComplete called with text:', text?.substring(0, 100));
    // 更新 ocrText（用户可能在确认前编辑了文本）
    // 注意：不要在这里调用 parseGeometry，因为：
    // 1. 几何分析已经在 OCR 完成时通过 useEffect 自动触发了
    // 2. 用户可能已经在画板上添加了辅助线或点，重新解析会丢失这些修改
    setOcrText(text);
    const openingAssistantMessage = buildOpeningAssistantMessage(
      isParent ? selectedStudentName : profile?.display_name,
    );
    resetWrapUpState();
    setMessages([openingAssistantMessage]);
    setCurrentStep('chat');
    setIsSessionPreparing(true);

    if (!profile?.id || !effectiveStudentId) {
      console.error('[Workbench] Missing profile or student context, cannot save error session');
      setIsSessionPreparing(false);
      return;
    }

    await saveErrorSession(text, openingAssistantMessage);
    setIsSessionPreparing(false);
  };

  const saveErrorSession = async (text: string, openingAssistantMessage?: Message) => {
    if (!profile?.id || !effectiveStudentId) return null;
    try {
      console.log('Creating error session with profile ID:', profile.id);
      const initialGeometryData = geometryEnabled && geometryData && geometryData.type !== 'unknown' ? geometryData : null;
      const initialGeometrySvg = initialGeometryData ? getGeometrySvg() : null;
      const response = await fetch('/api/error-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: effectiveStudentId,
          subject: activeSubject,
          original_image_url: imagePreview || null,
          extracted_text: text,
          geometry_data: initialGeometryData,
          geometry_svg: initialGeometrySvg,
          initial_messages: openingAssistantMessage
            ? [
                {
                  role: openingAssistantMessage.role,
                  content: openingAssistantMessage.content,
                },
              ]
            : [],
          theme_used: profile?.theme_preference || 'junior', // 记录对话时使用的主题模式
        }),
      });

      if (response.ok) {
        const result = await response.json();
        chatSessionRef.current = result.data.session_id;
        setErrorSessionId(result.data.session_id);
        resetWrapUpState();
        lastSyncedGeometrySignatureRef.current = initialGeometryData ? JSON.stringify(initialGeometryData) : '';
        console.log('Error session created successfully:', result.data.session_id, 'theme:', result.data.theme_used);
        return result.data.session_id as string;
      } else {
        const errorText = await response.text();
        console.error('Failed to create error session. Response:', errorText);
      }
    } catch (error) {
      console.error('Exception creating error session:', error);
    }
    return null;
  };

  const handleImageRemove = () => {
    // 取消正在进行的几何解析
    geometryAbortRef.current = true;
    lastParsedTextRef.current = ''; // 重置已解析文本跟踪

    setSelectedImage(null);
    setImagePreview(null);
    setOcrText('');
    setGeometryData(null);
    setGeometryUiState('idle');
    setIsGeometryLoading(false);
    setCurrentStep('upload');
    setMessages([]);
    chatSessionRef.current = `session_${Date.now()}`;
    setErrorSessionId(null);
    setIsSessionPreparing(false);
    resetWrapUpState();
    lastSyncedGeometrySignatureRef.current = '';
  };

  // Chat functions
  const handleSendMessage = async (content: string) => {
    if (wrapUpSubmitted || isWrapUpSubmitting || isSessionPreparing) {
      return;
    }

    if (!errorSessionId || !chatSessionRef.current || chatSessionRef.current !== errorSessionId) {
      const pendingMessage: Message = {
        id: `msg_${Date.now()}_pending_session`,
        role: 'assistant',
        content: '题目会话还在初始化，请稍等 1 秒后再发送。',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, pendingMessage]);
      return;
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setWrapUpSubmitError(null);
    setMessages((prev) => [...prev, userMessage]);
    setIsChatLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          session_id: chatSessionRef.current,
          theme: profile?.theme_preference || 'junior',
          subject: activeSubject,
          questionContent: ocrText,
          geometryData: geometryEnabled ? geometryData : null,
        }),
      });

      const data = await response.json();

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
    chatSessionRef.current = `session_${Date.now()}`;
    setIsSessionPreparing(false);
    resetWrapUpState();
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isValidRootCauseSubtype(wrapUpCategory, wrapUpSubtype)) {
      return;
    }

    const fallbackSubtype = getRootCauseSubtypeOptions(wrapUpCategory)[0]?.value;
    if (fallbackSubtype) {
      setWrapUpSubtype(fallbackSubtype);
    }
  }, [wrapUpCategory, wrapUpSubtype]);

  const userMessages = messages.filter((message) => message.role === 'user');
  const assistantMessages = messages.filter((message) => message.role === 'assistant');
  const userMessageCount = userMessages.length;
  const lastUserMessage = userMessages[userMessages.length - 1]?.content || '';
  const lastAssistantMessage = assistantMessages[assistantMessages.length - 1]?.content || '';
  const hasWrapUpSignal =
    isLikelyWrapUpSignal(lastUserMessage) || hasAssistantWrapUpCue(lastAssistantMessage);

  useEffect(() => {
    if (currentStep !== 'chat' || !errorSessionId || !effectiveStudentId) {
      return;
    }

    if (isRestoringSession || isChatLoading || isWrapUpSubmitting || wrapUpSubmitted) {
      return;
    }

    if (!hasWrapUpSignal || userMessageCount <= wrapUpDismissedCount) {
      return;
    }

    if (wrapUpSubmitError && !wrapUpPreview) {
      return;
    }

    if (wrapUpPreview && wrapUpPreview.user_message_count === userMessageCount) {
      return;
    }

    void fetchWrapUpPreview();
  }, [
    currentStep,
    effectiveStudentId,
    errorSessionId,
    fetchWrapUpPreview,
    isChatLoading,
    hasWrapUpSignal,
    isRestoringSession,
    isWrapUpSubmitting,
    userMessageCount,
    wrapUpDismissedCount,
    wrapUpPreview,
    wrapUpSubmitError,
    wrapUpSubmitted,
  ]);

  const themeClass = profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior';
  const aiName = profile?.theme_preference === 'junior' ? 'Jasper' : 'Logic';
  const currentSubjectConfig = getSubjectConfig(activeSubject);
  const showWrapUpCard =
    currentStep === 'chat' &&
    !!errorSessionId &&
    !wrapUpSubmitted &&
    (isWrapUpLoading || !!wrapUpPreview || !!wrapUpSubmitError);
  const hasGeometryText = geometryEnabled && ocrText.trim().length > 0;
  const hasLikelyGeometryText = hasGeometryText && hasLikelyGeometryContent(ocrText);
  const hasRenderableGeometry = !!geometryData && geometryData.type !== 'unknown';
  const showGeometryEmptyState =
    hasLikelyGeometryText &&
    !isGeometryLoading &&
    !hasRenderableGeometry &&
    (geometryUiState === 'unknown' || geometryUiState === 'error');

  const geometryNotice = (() => {
    if (!geometryEnabled || isGeometryLoading) {
      return null;
    }

    if (geometryUiState === 'low-confidence') {
      return {
        tone: 'amber' as const,
        title: '图形已识别，建议先核对关键条件',
        description: '当前结果可继续辅助解题，但更适合当作草图。若点位、边或已知条件不完整，请先修正 OCR 文本后重新识别。',
      };
    }

    if (geometryUiState === 'preserved-unknown') {
      return {
        tone: 'amber' as const,
        title: '本次未稳定识别出新图形，已保留上一版图形',
        description: '你可以继续答题，也可以补充题干中的点名、线段关系或角度条件后再次识别，避免当前进度被覆盖。',
      };
    }

    if (geometryUiState === 'preserved-error') {
      return {
        tone: 'amber' as const,
        title: '本次几何识别异常，已保留当前图形',
        description: '当前图形和你添加的辅助信息仍可继续使用。若要重试，建议先检查 OCR 文本是否缺行、漏符号或顺序错乱。',
      };
    }

    return null;
  })();

  if (authLoading || (!user && !profile)) {
    return (
      <div className={cn("min-h-screen bg-warm-50 flex items-center justify-center", themeClass)}>
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-warm-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-warm-500 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-warm-600">正在检查登录状态...</p>
        </div>
      </div>
    );
  }

  if (isRestoringSession) {
    return (
      <div className={cn("min-h-screen bg-warm-50 flex items-center justify-center p-6", themeClass)}>
        <Card className="w-full max-w-md shadow-lg border-warm-200/50">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-warm-200 border-t-warm-500" />
            <div>
              <p className="text-base font-medium text-warm-900">正在恢复学习会话</p>
              <p className="mt-1 text-sm text-warm-600">会保留原题内容、对话记录和当前学科。</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show student selector for parents without selected student
  if (isParent && !effectiveStudentId) {
    return (
      <div className={cn("min-h-screen bg-warm-50 flex items-center justify-center p-6", themeClass)}>
        <Card className="w-full max-w-md shadow-lg border-warm-200/50">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-warm-100 flex items-center justify-center mb-4 shadow-lg shadow-warm-500/30">
              <Users className="w-8 h-8 text-warm-500" />
            </div>
            <CardTitle className="text-xl text-warm-900">选择学习对象</CardTitle>
            <CardDescription className="text-warm-600">请选择要辅导的学生</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingStudents ? (
              <div className="text-center py-8 text-warm-600">加载中...</div>
            ) : parentStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-warm-600 mb-4">还没有关联的学生</p>
                <Button onClick={() => router.push('/dashboard')} className="bg-warm-500 hover:bg-warm-600 text-white rounded-full shadow-lg shadow-warm-500/30 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  去添加学生
                </Button>
              </div>
            ) : (
              parentStudents.map((student) => (
                <Button
                  key={student.id}
                  variant="outline"
                  className="w-full justify-start gap-3 h-14 border-warm-200 hover:bg-warm-100 hover:border-warm-300 rounded-full transition-all"
                  onClick={() => {
                    setSelectedStudentId(student.id);
                    setSelectedStudentName(student.display_name);
                  }}
                >
                  <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center">
                    <span className="text-warm-600 font-bold">{student.display_name.charAt(0)}</span>
                  </div>
                  <span className="font-medium text-warm-900">{student.display_name}</span>
                </Button>
              ))
            )}
            <div className="pt-4 border-t border-warm-200">
              <Button
                variant="ghost"
                className="w-full gap-2 text-warm-600 hover:text-warm-900 hover:bg-warm-100 rounded-full"
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
    <div className={cn("min-h-screen bg-gradient-to-br from-warm-50 via-white to-warm-100", themeClass)}>
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-warm-200/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-warm-300/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/3 w-72 h-72 bg-warm-100/30 rounded-full blur-3xl" />
      </div>

      {/* Parent indicator */}
      {isParent && selectedStudentName && (
        <div className="bg-warm-100 border-b border-warm-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-warm-500" />
              <span className="text-warm-600">正在辅导：</span>
              <span className="font-medium text-warm-900">{selectedStudentName}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedStudentId(null);
                setSelectedStudentName('');
              }}
              className="text-xs text-warm-600 hover:text-warm-900 hover:bg-warm-200 rounded-full"
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
            description={`${currentSubjectConfig?.name || '学科'} · ${profile?.theme_preference === 'junior' ? '小学版 · AI引导学习' : '中学版 · AI推理分析'}`}
            icon={currentSubjectConfig?.icon || BookOpen}
            iconColor={currentSubjectConfig?.color || 'text-warm-500'}
            actions={
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {/* Study Session Timer */}
                {isStudying ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 text-xs sm:text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <Timer className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>{formatDuration(studyDuration)}</span>
                  </Badge>
                ) : (
                  <Badge className="bg-muted text-muted-foreground px-2 sm:px-3 py-1 text-xs sm:text-sm">
                    未开始
                  </Badge>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleStudySession}
                  className="gap-1.5 sm:gap-2 transition-all duration-200 border-warm-200 hover:bg-warm-100 hover:border-warm-300 rounded-full text-xs sm:text-sm"
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

          {/* Subject Tabs */}
          <div className="mt-4">
            <SubjectTabs
              activeSubject={activeSubject}
              onSubjectChange={(subject) => {
                setActiveSubject(subject);
                // Update URL without reload
                const url = new URL(window.location.href);
                url.searchParams.set('subject', subject);
                window.history.replaceState({}, '', url.toString());
              }}
              showPro={false}
            />
          </div>
        </div>
      </div>

      {/* Main Content - 左右分栏布局 (桌面) / 上下堆叠 (移动端) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - 题目识别面板 */}
          <div
            ref={leftPanelRef}
            className="w-full lg:w-[420px] flex-shrink-0 lg:sticky lg:top-[140px] lg:self-start lg:max-h-[calc(100vh-180px)] overflow-y-auto lg:pr-2"
          >
            <div className="space-y-4">
              {/* Image Upload Card */}
              <Card className="border-warm-200/50 transition-all duration-300 hover:shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg text-warm-900">
                    <Camera className="w-5 h-5 text-warm-500" />
                    上传错题
                  </CardTitle>
                  <CardDescription className="text-warm-600">
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
                    onOCRSuccess={handleOCRSuccess}
                    imageData={imagePreview}
                  />
                </div>
              )}

              {/* Geometry Status Indicator */}
              {showGeometryEmptyState && (
                <Card className="border-amber-200/60 bg-gradient-to-br from-amber-50 via-white to-orange-50 transition-all duration-300">
                  <CardContent className="py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-amber-900">
                          {geometryUiState === 'error' ? '几何识别暂时失败' : '未稳定识别出几何图形'}
                        </p>
                        <p className="mt-1 text-sm text-amber-700">
                          {geometryUiState === 'error'
                            ? '这次识别没有拿到稳定结果。若题目确实有图形，请先检查 OCR 文本是否缺行、漏符号，再重新识别。'
                            : '如果这道题本身没有图形，可以直接继续对话；如果题干里有点、线、角或圆的条件，建议先补全 OCR 文本后再重试。'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          lastParsedTextRef.current = '';
                          parseGeometry(ocrText);
                        }}
                        className="border-amber-200 text-amber-700 hover:bg-amber-50"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        重试
                      </Button>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-amber-700">
                      <span>无图题可直接继续答题；有图题建议先补全 OCR 文本中的点、线、角条件。</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentStep('chat')}
                        className="h-8 px-2 text-amber-700 hover:bg-amber-100/70"
                      >
                        继续答题
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Geometry Renderer Card */}
              {geometryEnabled && (isGeometryLoading || hasRenderableGeometry) && (
                <Card className="border-purple-200/50 bg-gradient-to-br from-purple-50 to-white transition-all duration-300 hover:shadow-lg animate-slide-up">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg text-purple-900">
                      <Hexagon className="w-5 h-5 text-purple-500" />
                      几何图形画板
                      {isGeometryLoading && (
                        <Badge variant="outline" className="ml-2 bg-purple-100 text-purple-700 border-purple-300">
                          <span className="animate-pulse mr-1">●</span> 分析中...
                        </Badge>
                      )}
                      {hasRenderableGeometry && !isGeometryLoading && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "ml-2",
                            geometryUiState === 'ready'
                              ? "bg-green-100 text-green-700 border-green-300"
                              : "bg-amber-100 text-amber-700 border-amber-300",
                          )}
                        >
                          {geometryUiState === 'ready' ? '已识别' : '待确认'}
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-purple-600">
                      AI 自动识别题目中的几何图形并绘制
                    </p>
                  </CardHeader>
                  <CardContent>
                    {isGeometryLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 space-y-4">
                        <div className="relative w-16 h-16">
                          <div className="absolute inset-0 rounded-full border-4 border-purple-200"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
                        </div>
                        <div className="text-center">
                          <p className="text-purple-700 font-medium">正在分析几何图形...</p>
                          <p className="text-sm text-purple-500 mt-1">AI 正在识别图形类型和坐标</p>
                        </div>
                      </div>
                    ) : geometryData ? (
                      <div className="space-y-3">
                        {geometryNotice && (
                          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-amber-900">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                              <div>
                                <p className="text-sm font-medium">{geometryNotice.title}</p>
                                <p className="mt-1 text-xs leading-5 text-amber-700">{geometryNotice.description}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-100/50 px-3 py-2 rounded-lg">
                          <span className="font-medium">
                            {geometryData.type === 'triangle' ? '三角形' :
                             geometryData.type === 'quadrilateral' ? '四边形' :
                             geometryData.type === 'circle' ? '圆' :
                             geometryData.type === 'function' ? '函数图像' :
                             geometryData.type === 'composite' ? '组合图形' : geometryData.type}
                          </span>
                          <span className="text-purple-400">|</span>
                          <span>置信度: {Math.round((geometryData.confidence || 0) * 100)}%</span>
                          <span className="text-purple-400">|</span>
                          <span>{geometryData.points?.length || 0} 个点</span>
                        </div>
                        <div className="border border-purple-200 rounded-xl overflow-hidden bg-white">
                          <GeometryRenderer
                            ref={geometryRendererRef}
                            geometryData={geometryData}
                            rawText={ocrText}
                            size={400}
                            onRedraw={() => parseGeometry(ocrText)}
                            onGeometryChange={setGeometryData}
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => parseGeometry(ocrText)}
                          className="w-full border-purple-200 text-purple-700 hover:bg-purple-50"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          重新识别图形
                        </Button>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Right Panel - 聊天区域 (自适应宽度) */}
          <div className="flex-1 min-w-0">
            <Card className="border-warm-200/50 h-full flex flex-col min-h-[600px] transition-all duration-300 hover:shadow-lg">
              {/* Chat Header */}
              <CardHeader className="border-b border-warm-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-warm-500 to-warm-600 flex items-center justify-center text-white font-bold shadow-lg shadow-warm-500/30">
                      {aiName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-warm-900">{aiName}</p>
                      <p className="text-xs text-warm-600">AI 学习导师</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {currentStep === 'chat' && messages.length > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleExportPDF}
                        className="gap-2 border-warm-200 hover:bg-warm-100 hover:border-warm-300 rounded-full"
                      >
                        <Download className="w-4 h-4" />
                        导出PDF
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleResetChat}
                      className="gap-2 transition-all duration-200 hover:rotate-180 text-warm-600 hover:text-warm-900 hover:bg-warm-100 rounded-full"
                    >
                      <RefreshCw className="w-4 h-4" />
                      重新开始
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* OCR Context in Chat */}
              {ocrText && (
                <div className="px-6 pt-4">
                  <div className="p-4 rounded-xl bg-warm-100 border border-warm-200">
                    <p className="text-xs text-warm-600 mb-1 font-medium">当前题目：</p>
                    <div className="max-h-48 overflow-y-auto pr-1">
                      <p className="text-sm whitespace-pre-wrap break-words text-warm-900">{ocrText}</p>
                    </div>
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
              <div className="relative z-[60] border-t border-warm-200/50 p-4 pb-24 sm:z-auto sm:pb-4">
                {showWrapUpCard ? (
                  <div className="mb-4 pointer-events-auto">
                    <ChatWrapUpCard
                      preview={wrapUpPreview}
                      loading={isWrapUpLoading && !wrapUpPreview}
                      submitting={isWrapUpSubmitting}
                      submitError={wrapUpSubmitError}
                      selectedCategory={wrapUpCategory}
                      selectedSubtype={wrapUpSubtype}
                      selectedDifficulty={wrapUpDifficulty}
                      onCategoryChange={setWrapUpCategory}
                      onSubtypeChange={setWrapUpSubtype}
                      onDifficultyChange={setWrapUpDifficulty}
                      onContinue={handleContinueWrapUp}
                      onSubmit={handleSubmitWrapUp}
                    />
                  </div>
                ) : null}
                <ChatInput
                  onSend={handleSendMessage}
                  disabled={wrapUpSubmitted || isWrapUpSubmitting || isSessionPreparing}
                  isLoading={isChatLoading || isSessionPreparing}
                  autoFocusKey={messages.length}
                  placeholder={
                    profile?.theme_preference === 'junior'
                      ? '告诉我你的想法...'
                      : '描述你的问题或思路...'
                  }
                />
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Development Notice */}
      <div className="fixed bottom-4 left-0 right-0 p-4 pointer-events-none">
        <div className="max-w-7xl mx-auto">
          <div className="mx-auto bg-white/80 backdrop-blur-xl rounded-full px-4 py-2 text-sm text-warm-600 shadow-sm border border-warm-200/50 w-fit">
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
    <div className="min-h-screen bg-warm-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-warm-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-warm-500 border-t-transparent animate-spin"></div>
        </div>
        <p className="text-warm-600">加载中...</p>
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
