// =====================================================
// Project Socrates - Workbench Page (Student & Parent)
// 方案二：分层卡片设计 + 苹果风格动画
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
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUploader } from '@/components/ImageUploader';
import { OCRResult } from '@/components/OCRResult';
import { ChatMessageList, type Message } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { downloadErrorQuestionPDF } from '@/lib/pdf/ErrorQuestionPDF';
import { createClient } from '@/lib/supabase/client';

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
  const { profile } = useAuth();
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

  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrText, setOcrText] = useState('');

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
    } catch (error) {
      console.error('Failed to export PDF:', error);
    }
  };

  const handleImageSelect = (file: File, preview: string) => {
    setSelectedImage(file);
    setImagePreview(preview);
    setCurrentStep('ocr');
  };

  const handleOCRComplete = async (text: string) => {
    setOcrText(text);
    setCurrentStep('chat');

    if (!profile?.id) {
      console.error('No profile ID, cannot save error session');
      return;
    }

    saveErrorSession(text);
  };

  const saveErrorSession = async (text: string) => {
    if (!profile?.id) return;
    try {
      console.log('Creating error session with profile ID:', profile.id);
      const response = await fetch('/api/error-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: effectiveStudentId,
          subject: 'math',
          original_image_url: imagePreview || null,
          extracted_text: text,
          theme_used: profile?.theme_preference || 'junior', // 记录对话时使用的主题模式
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          session_id: chatSessionRef.current,
          theme: profile?.theme_preference || 'junior',
          subject: 'math',
          questionContent: ocrText,
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
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const themeClass = profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior';
  const aiName = profile?.theme_preference === 'junior' ? 'Jasper' : 'Logic';

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel - 40% */}
          <div
            ref={leftPanelAnimation.ref}
            className="lg:col-span-2 space-y-6"
            style={{
              opacity: leftPanelAnimation.isVisible ? 1 : 0,
              transform: leftPanelAnimation.isVisible ? 'translateX(0)' : 'translateX(-30px)',
              transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
            }}
          >
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
                />
              </div>
            )}
          </div>

          {/* Right Panel - 60% - Chat Area */}
          <div
            ref={rightPanelAnimation.ref}
            className="lg:col-span-3"
            style={{
              opacity: rightPanelAnimation.isVisible ? 1 : 0,
              transform: rightPanelAnimation.isVisible ? 'translateX(0)' : 'translateX(30px)',
              transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s ease-out 0.2s',
            }}
          >
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
                        {currentStep === 'chat' && messages.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleExportPDF}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            导出PDF
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleResetChat}
                          className="gap-2 transition-all duration-200 hover:rotate-180"
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
      </main>

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
