// =====================================================
// Project Socrates - Learning Report Generator
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// POST - 生成学习报告
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_id, report_type = 'weekly', days = 7 } = body;

    if (!student_id) {
      return NextResponse.json({ error: 'Missing student_id parameter' }, { status: 400 });
    }

    // 获取学生基本信息
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('id, display_name, grade_level')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // 计算时间范围
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 获取错题统计数据
    const { data: errorStats, error: statsError } = await supabase
      .from('error_sessions')
      .select('id, subject, difficulty_rating, concept_tags, created_at, status')
      .eq('student_id', student_id)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (statsError) {
      console.error('Error fetching stats:', statsError);
    }

    // 获取学习时长统计
    const { data: studySessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('start_time, end_time, duration_seconds, session_type')
      .eq('student_id', student_id)
      .gte('start_time', startDate.toISOString())
      .lte('start_time', endDate.toISOString());

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError);
    }

    // 汇总统计数据
    const stats = calculateStats(errorStats || [], studySessions || [], days);

    // 获取薄弱知识点
    const weakPoints = analyzeWeakPoints(errorStats || []);

    // 生成 AI 分析和建议
    const aiAnalysis = await generateAIAnalysis(student, stats, weakPoints, report_type);

    // 保存报告到数据库
    const { data: report, error: insertError } = await supabase
      .from('learning_reports')
      .insert({
        student_id,
        report_type,
        period_start: startDate.toISOString().split('T')[0],
        period_end: endDate.toISOString().split('T')[0],
        total_errors_analyzed: stats.totalErrors,
        total_reviews_completed: stats.totalReviews,
        mastery_rate: stats.masteryRate,
        weak_points: weakPoints,
        total_study_minutes: stats.totalStudyMinutes,
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error saving report:', insertError);
    }

    return NextResponse.json({
      success: true,
      data: {
        report,
        stats,
        weakPoints,
        aiAnalysis,
      },
    });
  } catch (error: any) {
    console.error('Learning report API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - 获取历史报告
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get('student_id');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!student_id) {
      return NextResponse.json({ error: 'Missing student_id parameter' }, { status: 400 });
    }

    const { data: reports, error } = await supabase
      .from('learning_reports')
      .select('*')
      .eq('student_id', student_id)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({
      data: reports || [],
    });
  } catch (error: any) {
    console.error('Learning report fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// 计算统计数据
function calculateStats(errors: any[], sessions: any[], days: number) {
  const totalErrors = errors.length;
  const mastered = errors.filter(e => e.status === 'mastered').length;
  const masteryRate = totalErrors > 0 ? Math.round((mastered / totalErrors) * 100) : 0;

  // 计算学习时长（分钟）
  let totalStudyMinutes = 0;
  sessions.forEach(session => {
    if (session.duration_seconds) {
      totalStudyMinutes += Math.round(session.duration_seconds / 60);
    } else if (session.start_time && session.end_time) {
      const duration = (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000;
      totalStudyMinutes += Math.round(duration / 60);
    }
  });

  // 计算复习完成次数
  const totalReviews = sessions.filter(s => s.session_type === 'review').length;

  // 计算平均每天学习时间
  const avgDailyMinutes = days > 0 ? Math.round(totalStudyMinutes / days) : 0;

  return {
    totalErrors,
    mastered,
    masteryRate,
    totalStudyMinutes,
    totalReviews,
    avgDailyMinutes,
  };
}

// 分析薄弱知识点
function analyzeWeakPoints(errors: any[]): Array<{ tag: string; count: number; trend?: 'up' | 'down' | 'stable' }> {
  const tagMap = new Map<string, number>();

  errors.forEach(error => {
    if (error.concept_tags) {
      error.concept_tags.forEach((tag: string) => {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
    }
  });

  // 转换为数组并排序
  const weakPoints = Array.from(tagMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10); // 取前10个

  return weakPoints;
}

// 生成 AI 分析和建议
async function generateAIAnalysis(student: any, stats: any, weakPoints: any[], reportType: string): Promise<string> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return getDefaultAnalysis(stats, weakPoints);
  }

  try {
    const periodName = reportType === 'weekly' ? '本周' : '本月';
    const subject = getSubjectName(stats);
    const weakPointsText = weakPoints
      .slice(0, 5)
      .map((p, i) => `${i + 1}. ${p.tag}（${p.count}次）`)
      .join('\n');

    const prompt = `你是苏格拉底AI学习助手，为${student.display_name}生成${periodName}学习报告。

【学习数据】
- 分析错题数：${stats.totalErrors} 题
- 已掌握：${stats.mastered} 题
- 掌握率：${stats.masteryRate}%
- 总学习时长：${stats.totalStudyMinutes} 分钟
- 平均每日：${stats.avgDailyMinutes} 分钟
- 完成复习：${stats.totalReviews} 次

【薄弱知识点】
${weakPointsText || '暂无明显薄弱点'}

【任务】
生成一段温馨、鼓励性的学习总结（150-200字），要求：
1. 肯定学生的努力和进步
2. 指出需要加强的知识点
3. 给出具体可行的学习建议
4. 用苏格拉底式的引导思考
5. 语气亲切自然，适合中小学生

请直接输出报告内容，不要有其他说明。`;

    const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        messages: [
          {
            role: 'system',
            content: '你是苏格拉底AI学习助手，擅长鼓励学生并给出学习建议。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || getDefaultAnalysis(stats, weakPoints);
  } catch (error) {
    console.error('Tongyi API Error:', error);
    return getDefaultAnalysis(stats, weakPoints);
  }
}

// 默认分析（当 API 不可用时）
function getDefaultAnalysis(stats: any, weakPoints: any[]): string {
  const points = weakPoints.slice(0, 3).map(p => p.tag).join('、');
  const hasWeakPoints = points.length > 0;

  let text = `📊 ${stats.masteryRate >= 70 ? '太棒了！' : '继续加油！'}\n\n`;
  text += `在这段时间里，你一共分析了 ${stats.totalErrors} 道题目，`;
  text += `其中 ${stats.mastered} 道已经完全掌握了，掌握率达到了 ${stats.masteryRate}%！\n\n`;
  text += `你累计学习了 ${stats.totalStudyMinutes} 分钟，平均每天 ${stats.avgDailyMinutes} 分钟。`;

  if (hasWeakPoints) {
    text += `\n\n建议重点关注：${points} 这些知识点。`;
    text += ` 可以通过多做类似题目来巩固。`;
  }

  text += `\n\n记住，每一个错误都是进步的机会！💪`;

  return text;
}

function getSubjectName(stats: any): string {
  // 这里可以根据实际需求扩展
  return '';
}
