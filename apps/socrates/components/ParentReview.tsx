// =====================================================
// Project Socrates - Parent Review Component
// 家长复核组件 - 查看学生学习情况并确认
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Clock,
  Tag,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: string;
  content: string;
  created_at: string;
}

interface ErrorSession {
  id: string;
  subject: string;
  extracted_text: string;
  difficulty_rating: number;
  concept_tags: string[];
  status: string;
  created_at: string;
  chat_messages: ChatMessage[];
}

interface ParentReviewProps {
  studentId: string;
  studentName: string;
}

export function ParentReview({ studentId, studentName }: ParentReviewProps) {
  const [sessions, setSessions] = useState<ErrorSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null);

  useEffect(() => {
    loadSessions();
  }, [studentId]);

  const loadSessions = async () => {
    try {
      const response = await fetch(`/api/parent/review?student_id=${studentId}&limit=10`);
      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }
      const result = await response.json();
      setSessions(result.data || []);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (sessionId: string, action: 'confirmed' | 'overridden', notes?: string) => {
    setReviewing(sessionId);
    try {
      const response = await fetch('/api/parent/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, action, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit review');
      }

      const result = await response.json();
      // 从列表中移除已复核的项目
      setSessions(sessions.filter(s => s.id !== sessionId));
      setExpandedId(null);
    } catch (error: any) {
      alert(error.message || '复核失败，请稍后重试');
    } finally {
      setReviewing(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (hours < 48) return '昨天';
    return `${Math.floor(hours / 24)}天前`;
  };

  const getDifficultyLabel = (rating: number) => {
    if (rating <= 2) return { label: '简单', color: 'text-green-600 bg-green-100' };
    if (rating <= 3) return { label: '中等', color: 'text-yellow-600 bg-yellow-100' };
    return { label: '困难', color: 'text-red-600 bg-red-100' };
  };

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      guided_learning: { label: '学习中', color: 'text-blue-600 bg-blue-100' },
      mastered: { label: '已掌握', color: 'text-green-600 bg-green-100' },
    };
    return statusMap[status] || { label: status, color: 'text-gray-600 bg-gray-100' };
  };

  if (loading) {
    return (
      <Card className="border-warm-100">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-warm-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-warm-100 transition-all duration-300 hover:shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warm-900">
          <CheckCircle className="w-5 h-5 text-warm-500" />
          家长复核
        </CardTitle>
        <CardDescription>
          查看 {studentName} 的学习进度，确认掌握情况
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warm-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-warm-500" />
            </div>
            <p className="text-warm-600">暂无待复核的学习记录</p>
            <p className="text-sm text-warm-400 mt-1">学生完成学习后，记录会出现在这里</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const difficulty = getDifficultyLabel(session.difficulty_rating || 2);
              const status = getStatusLabel(session.status);
              const isExpanded = expandedId === session.id;

              return (
                <div
                  key={session.id}
                  className="bg-warm-50 rounded-xl border border-warm-100 overflow-hidden transition-all duration-300"
                >
                  {/* Session Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-warm-100/50 transition-colors"
                    onClick={() => toggleExpand(session.id)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', status.color)}>
                            {status.label}
                          </span>
                          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', difficulty.color)}>
                            {difficulty.label}
                          </span>
                          <span className="text-xs text-warm-500">
                            {getSubjectName(session.subject)}
                          </span>
                        </div>
                        <p className="text-warm-800 text-sm line-clamp-2">
                          {session.extracted_text?.substring(0, 100) || '无题目内容'}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-warm-400">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(session.created_at)}
                          </span>
                          {session.concept_tags && session.concept_tags.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Tag className="w-3 h-3" />
                              {session.concept_tags.length} 个知识点
                            </span>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-warm-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-warm-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-warm-100 p-4 bg-white">
                      {/* Knowledge Tags */}
                      {session.concept_tags && session.concept_tags.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-warm-600 mb-2">涉及知识点</p>
                          <div className="flex flex-wrap gap-2">
                            {session.concept_tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-warm-100 text-warm-700 px-2 py-1 rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Chat Messages */}
                      {session.chat_messages && session.chat_messages.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-warm-600 mb-2 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            学习对话记录
                          </p>
                          <div className="max-h-40 overflow-y-auto space-y-2 bg-warm-50 rounded-lg p-3">
                            {session.chat_messages.slice(-4).map((msg, idx) => (
                              <div
                                key={idx}
                                className={cn(
                                  'text-xs p-2 rounded-lg',
                                  msg.role === 'user'
                                    ? 'bg-warm-100 text-warm-800 ml-4'
                                    : 'bg-white text-warm-600 mr-4 border border-warm-100'
                                )}
                              >
                                <span className="font-medium">
                                  {msg.role === 'user' ? '学生：' : 'AI：'}
                                </span>
                                {msg.content.substring(0, 100)}
                                {msg.content.length > 100 && '...'}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Review Actions */}
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                          onClick={() => handleReview(session.id, 'confirmed')}
                          disabled={reviewing === session.id}
                        >
                          {reviewing === session.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          确认掌握
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
                          onClick={() => handleReview(session.id, 'overridden')}
                          disabled={reviewing === session.id}
                        >
                          {reviewing === session.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <RefreshCw className="w-4 h-4" />
                          )}
                          需要重学
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function getSubjectName(subject: string): string {
  const names: Record<string, string> = {
    'math': '数学',
    'physics': '物理',
    'chemistry': '化学',
    'chinese': '语文',
    'english': '英语',
  };
  return names[subject] || subject || '未分类';
}
