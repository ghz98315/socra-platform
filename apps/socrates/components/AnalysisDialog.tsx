// =====================================================
// Project Socrates - Conversation Analysis Dialog
// AI对话分析报告弹窗
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  X,
  Loader2,
  Star,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  MessageCircle,
  Lightbulb,
  BookOpen,
  Heart,
  ArrowLeft,
  ArrowRight,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: string;
  studentId?: string;
  dateRange?: '7d' | '30d' | 'all';
  subjects?: string | string[];
}

interface AnalysisResult {
  overallAssessment: {
    learningScore: number;
    engagement: string;
    status: string;
    totalProblems?: number;
    avgScore?: number;
    masteryRate?: number;
    trend?: string;
  };
  knowledgeAnalysis?: {
    mastered: string[];
    understanding: string[];
    needsWork: string[];
  };
  thinkingStyle?: {
    activeThinking: { score: number; comment: string };
    logicalReasoning: { score: number; comment: string };
    answerDependence: { score: number; comment: string };
    errorCorrection: { score: number; comment: string };
  };
  highlights?: Array<{ text: string; meaning: string }>;
  concerns?: Array<{ text: string; meaning: string }>;
  communicationAdvice: {
    approach: string;
    keyPoints?: string[];
    scripts: {
      opening: { scene: string; script: string };
      guiding: { scene: string; script: string };
      encouraging: { scene: string; script: string };
      casual: { scene: string; script: string };
    };
    doList: string[];
    dontList: string[];
  };
  practiceSuggestions?: string[];
  // 综合分析特有字段
  subjectPerformance?: Array<{
    subject: string;
    mastery: number;
    status: string;
    comment: string;
  }>;
  thinkingPatterns?: {
    strengths: string[];
    patterns: string[];
    challenges: string[];
  };
  nextWeekPlan?: {
    suggestions: string[];
    recommendedOrder: string;
    focusAreas: string[];
  };
}

export function AnalysisDialog({
  open,
  onOpenChange,
  sessionId,
  studentId,
  dateRange = '7d',
  subjects = 'all'
}: AnalysisDialogProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'communication' | 'practice'>('overview');

  useEffect(() => {
    if (open) {
      loadAnalysis();
    }
  }, [open, sessionId, studentId]);

  const loadAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const body = sessionId
        ? { session_id: sessionId }
        : { student_id: studentId, date_range: dateRange, subjects };

      const response = await fetch('/api/analyze-conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || data.error || '分析失败');
      } else {
        setAnalysis(data.analysis);
      }
    } catch (err) {
      setError('网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (score: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={cn(
              "w-4 h-4",
              i <= score ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        ))}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    if (status === '有效' || status === '良好') return 'bg-green-100 text-green-700';
    if (status === '需关注') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const getSubjectName = (subject: string) => {
    const names: Record<string, string> = {
      math: '数学',
      physics: '物理',
      chemistry: '化学',
    };
    return names[subject] || subject;
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">AI正在分析对话内容...</p>
            <p className="text-sm text-muted-foreground mt-2">这可能需要几秒钟</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center py-10">
            <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
            <p className="text-center text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                关闭
              </Button>
              <Button onClick={loadAnalysis}>
                重试
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!analysis) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            AI对话分析报告
          </DialogTitle>
        </DialogHeader>

        {/* Tab导航 */}
        <div className="flex border-b border-border/50">
          {[
            { key: 'overview', label: '学习分析', icon: TrendingUp },
            { key: 'communication', label: '沟通建议', icon: Heart },
            { key: 'practice', label: '练习建议', icon: BookOpen },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto py-4 space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* 总体评估 */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">📊 总体评估</h3>
                    <Badge className={getStatusColor(analysis.overallAssessment.status)}>
                      {analysis.overallAssessment.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">学习效果</div>
                      {renderStars(analysis.overallAssessment.learningScore || analysis.overallAssessment.avgScore || 3)}
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">参与度</div>
                      <div className="font-medium">{analysis.overallAssessment.engagement}</div>
                    </div>
                    {analysis.overallAssessment.masteryRate && (
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">掌握率</div>
                        <div className="font-medium">{analysis.overallAssessment.masteryRate}%</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* 知识点分析 */}
              {analysis.knowledgeAnalysis && (
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">🧠 知识点分析</h3>
                    <div className="space-y-3">
                      {analysis.knowledgeAnalysis.mastered.length > 0 && (
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-sm text-muted-foreground">已掌握：</span>
                            <span className="text-sm">{analysis.knowledgeAnalysis.mastered.join('、')}</span>
                          </div>
                        </div>
                      )}
                      {analysis.knowledgeAnalysis.understanding.length > 0 && (
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 rounded-full bg-yellow-100 flex items-center justify-center mt-0.5 shrink-0">
                            <span className="text-xs text-yellow-600">→</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">理解中：</span>
                            <span className="text-sm">{analysis.knowledgeAnalysis.understanding.join('、')}</span>
                          </div>
                        </div>
                      )}
                      {analysis.knowledgeAnalysis.needsWork.length > 0 && (
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-sm text-muted-foreground">待加强：</span>
                            <span className="text-sm">{analysis.knowledgeAnalysis.needsWork.join('、')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 思维方式分析 */}
              {analysis.thinkingStyle && (
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">💭 思维方式分析</h3>
                    <div className="space-y-3">
                      {[
                        { label: '主动思考', data: analysis.thinkingStyle.activeThinking },
                        { label: '逻辑推理', data: analysis.thinkingStyle.logicalReasoning },
                        { label: '独立程度', data: { ...analysis.thinkingStyle.answerDependence, score: 6 - analysis.thinkingStyle.answerDependence.score } },
                        { label: '错误修正', data: analysis.thinkingStyle.errorCorrection },
                      ].map(item => (
                        <div key={item.label} className="flex items-center justify-between">
                          <span className="text-sm">{item.label}</span>
                          <div className="flex items-center gap-2">
                            {renderStars(item.data.score)}
                            <span className="text-xs text-muted-foreground w-32 text-right">
                              {item.data.comment}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 亮点和关注点 */}
              <div className="grid grid-cols-2 gap-4">
                {analysis.highlights && analysis.highlights.length > 0 && (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3 text-green-600">✨ 对话亮点</h3>
                      <div className="space-y-2">
                        {analysis.highlights.map((h, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium">"{h.text}"</span>
                            <span className="text-muted-foreground"> - {h.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                {analysis.concerns && analysis.concerns.length > 0 && (
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-3 text-orange-600">⚠️ 需要关注</h3>
                      <div className="space-y-2">
                        {analysis.concerns.map((c, i) => (
                          <div key={i} className="text-sm">
                            <span className="font-medium">"{c.text}"</span>
                            <span className="text-muted-foreground"> - {c.meaning}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {activeTab === 'communication' && (
            <>
              {/* 沟通角度 */}
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-primary" />
                    🎯 沟通角度
                  </h3>
                  <p className="text-sm leading-relaxed">{analysis.communicationAdvice.approach}</p>
                  {analysis.communicationAdvice.keyPoints && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {analysis.communicationAdvice.keyPoints.map((point, i) => (
                        <Badge key={i} variant="secondary">{point}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 推荐话术 */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">🗣️ 推荐话术</h3>
                  <div className="space-y-4">
                    {Object.entries(analysis.communicationAdvice.scripts).map(([key, value]) => (
                      <div key={key} className="p-3 rounded-xl bg-muted/50">
                        <div className="text-sm font-medium text-primary mb-2">
                          【{value.scene}】
                        </div>
                        <p className="text-sm leading-relaxed">"{value.script}"</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 注意事项 */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 text-green-600">✅ 建议</h3>
                    <ul className="space-y-2">
                      {analysis.communicationAdvice.doList.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 text-red-600">❌ 避免</h3>
                    <ul className="space-y-2">
                      {analysis.communicationAdvice.dontList.map((item, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <X className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {activeTab === 'practice' && (
            <>
              {/* 练习建议 */}
              {analysis.practiceSuggestions && (
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">📚 练习建议</h3>
                    <ul className="space-y-3">
                      {analysis.practiceSuggestions.map((suggestion, i) => (
                        <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-medium text-primary">{i + 1}</span>
                          </div>
                          <span className="text-sm">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* 下周计划（综合分析） */}
              {analysis.nextWeekPlan && (
                <Card className="border-border/50">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">📅 下周学习建议</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">推荐顺序：</div>
                        <div className="p-3 rounded-xl bg-primary/5 text-sm">
                          {analysis.nextWeekPlan.recommendedOrder}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">重点关注：</div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.nextWeekPlan.focusAreas.map((area, i) => (
                            <Badge key={i} variant="outline">{area}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-2">具体建议：</div>
                        <ul className="space-y-2">
                          {analysis.nextWeekPlan.suggestions.map((s, i) => (
                            <li key={i} className="text-sm flex items-start gap-2">
                              <ArrowRight className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="border-t border-border/50 pt-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={loadAnalysis}>
              重新分析
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
