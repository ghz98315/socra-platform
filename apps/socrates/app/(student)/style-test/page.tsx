// =====================================================
// Project Socrates - Learning Style Test Page
// 学习风格测试页面 (VARK 模型)
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Brain,
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Eye,
  Headphones,
  Hand,
  BookOpen,
  Loader2,
  Sparkles,
  Target,
  Lightbulb
} from 'lucide-react';

interface Question {
  id: string;
  question_number: number;
  category: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

interface StyleConfig {
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  tips: string[];
}

interface TestResult {
  id: string;
  visual_score: number;
  auditory_score: number;
  kinesthetic_score: number;
  reading_score: number;
  primary_style: string;
  secondary_style: string;
  recommendations: string[];
  primaryStyleConfig: StyleConfig;
  secondaryStyleConfig: StyleConfig;
  scores: {
    visual: number;
    auditory: number;
    kinesthetic: number;
    reading: number;
  };
}

const STYLE_ICONS: Record<string, React.ElementType> = {
  Eye,
  Headphones,
  Hand,
  BookOpen
};

const STYLE_COLORS: Record<string, { bg: string; text: string; border: string; progress: string }> = {
  blue: { bg: 'bg-blue-100', text: 'text-blue-600', border: 'border-blue-300', progress: 'bg-blue-500' },
  green: { bg: 'bg-green-100', text: 'text-green-600', border: 'border-green-300', progress: 'bg-green-500' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-300', progress: 'bg-orange-500' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-600', border: 'border-purple-300', progress: 'bg-purple-500' }
};

export default function StyleTestPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    if (profile?.id) {
      loadQuestions();
    }
  }, [profile?.id]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/learning-style?user_id=${profile?.id}`);
      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
        if (data.existingAnswers) {
          setAnswers(data.existingAnswers);
        }
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (option: string) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].question_number]: option
    }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!profile?.id || Object.keys(answers).length < questions.length) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/learning-style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          answers
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.result);
        setShowResult(true);
      }
    } catch (error) {
      console.error('Failed to submit answers:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentQuestion(0);
    setShowResult(false);
    setResult(null);
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const currentQ = questions[currentQuestion];
  const currentAnswer = currentQ ? answers[currentQ.question_number] : null;
  const answeredCount = Object.keys(answers).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600" />
          <p className="text-gray-600">加载测试题目...</p>
        </div>
      </div>
    );
  }

  // 结果展示
  if (showResult && result) {
    const PrimaryIcon = STYLE_ICONS[result.primaryStyleConfig.icon] || Brain;
    const SecondaryIcon = STYLE_ICONS[result.secondaryStyleConfig.icon] || Brain;
    const primaryColors = STYLE_COLORS[result.primaryStyleConfig.color] || STYLE_COLORS.blue;
    const secondaryColors = STYLE_COLORS[result.secondaryStyleConfig.color] || STYLE_COLORS.green;
    const maxScore = Math.max(result.scores.visual, result.scores.auditory, result.scores.kinesthetic, result.scores.reading);

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <PageHeader
            title="学习风格测试结果"
            description="了解你的学习偏好，找到最适合的学习方法"
            icon={Brain}
            iconColor="text-indigo-500"
            actions={
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => router.back()}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回
                </Button>
                <Button variant="outline" onClick={handleRetake}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  重新测试
                </Button>
              </div>
            }
          />
        </div>

        <main className="max-w-4xl mx-auto px-4 pb-12 space-y-6">
          {/* 主要风格卡片 */}
          <Card className={cn("border-2", primaryColors.border, primaryColors.bg)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center", primaryColors.bg)}>
                  <PrimaryIcon className={cn("w-8 h-8", primaryColors.text)} />
                </div>
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {result.primaryStyleConfig.name}
                    <Badge className={cn(primaryColors.bg, primaryColors.text)}>
                      主要风格
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    {result.primaryStyleConfig.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  学习建议
                </h4>
                <ul className="space-y-2">
                  {result.primaryStyleConfig.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* 次要风格卡片 */}
          <Card className={cn("border-2", secondaryColors.border)}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", secondaryColors.bg)}>
                  <SecondaryIcon className={cn("w-6 h-6", secondaryColors.text)} />
                </div>
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {result.secondaryStyleConfig.name}
                    <Badge variant="outline" className={secondaryColors.text}>
                      次要风格
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {result.secondaryStyleConfig.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 得分统计 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                各维度得分
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'visual', label: '视觉型', score: result.scores.visual, color: 'blue' },
                { key: 'auditory', label: '听觉型', score: result.scores.auditory, color: 'green' },
                { key: 'kinesthetic', label: '动觉型', score: result.scores.kinesthetic, color: 'orange' },
                { key: 'reading', label: '读写型', score: result.scores.reading, color: 'purple' }
              ].map(item => {
                const colors = STYLE_COLORS[item.color];
                const percentage = maxScore > 0 ? (item.score / maxScore) * 100 : 0;
                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.label}</span>
                      <span className={cn("font-bold", colors.text)}>{item.score} 分</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* 个性化建议 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                个性化建议
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {result.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-600">{index + 1}</span>
                    </div>
                    <span className="text-sm text-gray-700">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  // 测试界面
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <PageHeader
          title="学习风格测试"
          description="通过 16 道题目，发现最适合你的学习方式"
          icon={Brain}
          iconColor="text-indigo-500"
          actions={
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回
            </Button>
          }
        />
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-12">
        {/* 进度条 */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>第 {currentQuestion + 1} 题 / 共 {questions.length} 题</span>
            <span>已答 {answeredCount} 题</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* 题目卡片 */}
        {currentQ && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-xl">
                {currentQ.question_text}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['a', 'b', 'c', 'd'].map(option => {
                  const optionKey = `option_${option}` as keyof Question;
                  const optionText = currentQ[optionKey] as string;
                  const isSelected = currentAnswer === option;
                  const optionLabel = option.toUpperCase();

                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className={cn(
                        "w-full p-4 rounded-xl border-2 text-left transition-all",
                        "hover:border-indigo-300 hover:bg-indigo-50",
                        isSelected
                          ? "border-indigo-500 bg-indigo-50"
                          : "border-gray-200"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-medium",
                          isSelected
                            ? "bg-indigo-500 text-white"
                            : "bg-gray-100 text-gray-600"
                        )}>
                          {isSelected ? <Check className="w-4 h-4" /> : optionLabel}
                        </div>
                        <span className={cn(
                          "text-sm",
                          isSelected ? "text-indigo-700 font-medium" : "text-gray-700"
                        )}>
                          {optionText}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 导航按钮 */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            上一题
          </Button>

          {currentQuestion === questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={answeredCount < questions.length || submitting}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  提交测试
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={!currentAnswer}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              下一题
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>

        {/* 题目导航 */}
        <div className="mt-8">
          <p className="text-sm text-gray-500 mb-3">题目导航</p>
          <div className="flex flex-wrap gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(index)}
                className={cn(
                  "w-8 h-8 rounded-lg text-sm font-medium transition-all",
                  index === currentQuestion
                    ? "bg-indigo-500 text-white"
                    : answers[q.question_number]
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
