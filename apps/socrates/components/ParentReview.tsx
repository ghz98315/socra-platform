// =====================================================
// Project Socrates - Parent Review Component
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

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
      alert(result.message);
      loadSessions(); // 刷新列表
    } catch (error: any) {
      alert(error.message || '复核失败，请稍后重试');
    } finally {
      setReviewing(null);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return (
      <Card className="shadow-apple">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">加载中...</div>
        </CardContent>
      </Card>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="shadow-apple">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            暂无需要复核的错题
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{studentName} 的错题复核</h3>
      {sessions.map((session) => (
        <Card key={session.id} className="shadow-apple">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                {getSubjectName(session.subject)}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  难度: {session.difficulty_rating}/5
                </span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleExpand(session.id)}
              >
                {expandedId === session.id ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm line-clamp-2">{session.extracted_text}</p>

            {session.concept_tags && session.concept_tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {session.concept_tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {expandedId === session.id && (
              <div className="pt-2 border-t">
                <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  学习对话
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {session.chat_messages?.slice(-5).map((msg, idx) => (
                    <div
                      key={idx}
                      className={`text-sm p-2 rounded ${
                        msg.role === 'assistant'
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : 'bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <span className="font-medium">
                        {msg.role === 'assistant' ? '🤖 ' : '👤 '}
                      </span>
                      {msg.content.slice(0, 200)}
                      {msg.content.length > 200 ? '...' : ''}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => handleReview(session.id, 'confirmed')}
                disabled={reviewing === session.id}
              >
                <CheckCircle className="w-4 h-4 text-green-500" />
                确认掌握
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-1"
                onClick={() => handleReview(session.id, 'overridden')}
                disabled={reviewing === session.id}
              >
                <XCircle className="w-4 h-4 text-orange-500" />
                需重学
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getSubjectName(subject: string): string {
  const names: Record<string, string> = {
    'math': '数学',
    'physics': '物理',
    'chemistry': '化学',
  };
  return names[subject] || subject;
}
