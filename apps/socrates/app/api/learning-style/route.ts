// =====================================================
// Project Socrates - Learning Style Test API
// 学习风格测试 API (VARK 模型)
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 学习风格配置
const STYLE_CONFIG: Record<string, {
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  tips: string[];
}> = {
  visual: {
    name: '视觉型',
    nameEn: 'Visual',
    description: '你通过看图表、图像、视频来学习效果最好',
    icon: 'Eye',
    color: 'blue',
    tips: [
      '使用思维导图整理知识点',
      '观看教学视频和动画演示',
      '用不同颜色标记重点',
      '将文字转化为图表或图像',
      '利用图片和颜色做笔记'
    ]
  },
  auditory: {
    name: '听觉型',
    nameEn: 'Auditory',
    description: '你通过听讲解、讨论、朗读来学习效果最好',
    icon: 'Headphones',
    color: 'green',
    tips: [
      '参加小组讨论和课堂互动',
      '大声朗读课文和笔记',
      '录制讲解音频反复收听',
      '用语音备忘录记录想法',
      '向他人讲解来巩固知识'
    ]
  },
  kinesthetic: {
    name: '动觉型',
    nameEn: 'Kinesthetic',
    description: '你通过动手实践、体验来学习效果最好',
    icon: 'Hand',
    color: 'orange',
    tips: [
      '动手做实验和练习',
      '边走边背诵知识点',
      '使用模型和实物辅助学习',
      '做笔记时多画图和涂鸦',
      '定期休息活动身体'
    ]
  },
  reading: {
    name: '读写型',
    nameEn: 'Reading/Writing',
    description: '你通过阅读文字、书写笔记来学习效果最好',
    icon: 'BookOpen',
    color: 'purple',
    tips: [
      '认真阅读课本和参考资料',
      '整理详细的笔记',
      '将知识写成总结和列表',
      '多做题和书面练习',
      '重写和整理课堂笔记'
    ]
  }
};

// GET - 获取测试题目或用户测评结果
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type') || 'questions';

    // 获取用户测评结果
    if (type === 'result' && userId) {
      const { data: assessment, error: assessmentError } = await supabase
        .from('learning_style_assessments')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (assessmentError && assessmentError.code !== 'PGRST116') {
        console.error('[Learning Style API] Error fetching assessment:', assessmentError);
        throw assessmentError;
      }

      if (!assessment) {
        return NextResponse.json({
          completed: false,
          message: '尚未完成学习风格测试'
        });
      }

      // 添加风格配置信息
      const primaryConfig = STYLE_CONFIG[assessment.primary_style] || null;
      const secondaryConfig = STYLE_CONFIG[assessment.secondary_style] || null;

      return NextResponse.json({
        completed: true,
        assessment: {
          ...assessment,
          primaryStyleConfig: primaryConfig,
          secondaryStyleConfig: secondaryConfig
        }
      });
    }

    // 获取测试题目
    const { data: questions, error: questionsError } = await supabase
      .from('learning_style_questions')
      .select('id, question_number, category, question_text, option_a, option_b, option_c, option_d')
      .eq('is_active', true)
      .order('question_number');

    if (questionsError) {
      console.error('[Learning Style API] Error fetching questions:', questionsError);
      throw questionsError;
    }

    // 获取用户已有答案（如果有）
    let existingAnswers = null;
    if (userId) {
      const { data: assessment } = await supabase
        .from('learning_style_assessments')
        .select('answers')
        .eq('user_id', userId)
        .single();

      existingAnswers = assessment?.answers || null;
    }

    return NextResponse.json({
      questions: questions || [],
      totalQuestions: questions?.length || 0,
      existingAnswers,
      styleConfig: STYLE_CONFIG
    });
  } catch (error: any) {
    console.error('[Learning Style API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST - 提交测试答案
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, answers } = body;

    if (!userId || !answers) {
      return NextResponse.json(
        { error: 'userId and answers are required' },
        { status: 400 }
      );
    }

    // 验证答案格式
    if (typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'Invalid answers format' },
        { status: 400 }
      );
    }

    // 计算得分
    const { data: questions } = await supabase
      .from('learning_style_questions')
      .select('question_number, scores')
      .eq('is_active', true);

    let visualScore = 0;
    let auditoryScore = 0;
    let kinestheticScore = 0;
    let readingScore = 0;

    for (const question of questions || []) {
      const answer = answers[question.question_number];
      if (!answer) continue;

      const scores = question.scores as Record<string, Record<string, number>>;
      const optionScores = scores[answer];

      if (optionScores) {
        visualScore += optionScores.visual || 0;
        auditoryScore += optionScores.auditory || 0;
        kinestheticScore += optionScores.kinesthetic || 0;
        readingScore += optionScores.reading || 0;
      }
    }

    // 确定主要和次要学习风格
    const scores = [
      { style: 'visual', score: visualScore },
      { style: 'auditory', score: auditoryScore },
      { style: 'kinesthetic', score: kinestheticScore },
      { style: 'reading', score: readingScore }
    ].sort((a, b) => b.score - a.score);

    const primaryStyle = scores[0].style;
    const secondaryStyle = scores[1].style;

    // 生成个性化建议
    const recommendations = generateRecommendations(primaryStyle, secondaryStyle, scores);

    // 保存或更新测评结果
    const { data: existing } = await supabase
      .from('learning_style_assessments')
      .select('id')
      .eq('user_id', userId)
      .single();

    let result;
    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('learning_style_assessments')
        .update({
          answers,
          visual_score: visualScore,
          auditory_score: auditoryScore,
          kinesthetic_score: kinestheticScore,
          reading_score: readingScore,
          primary_style: primaryStyle,
          secondary_style: secondaryStyle,
          recommendations,
          completed_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (updateError) throw updateError;
      result = updated;
    } else {
      const { data: created, error: createError } = await supabase
        .from('learning_style_assessments')
        .insert({
          user_id: userId,
          answers,
          visual_score: visualScore,
          auditory_score: auditoryScore,
          kinesthetic_score: kinestheticScore,
          reading_score: readingScore,
          primary_style: primaryStyle,
          secondary_style: secondaryStyle,
          recommendations
        })
        .select()
        .single();

      if (createError) throw createError;
      result = created;
    }

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        primaryStyleConfig: STYLE_CONFIG[primaryStyle],
        secondaryStyleConfig: STYLE_CONFIG[secondaryStyle],
        scores: {
          visual: visualScore,
          auditory: auditoryScore,
          kinesthetic: kinestheticScore,
          reading: readingScore
        }
      }
    });
  } catch (error: any) {
    console.error('[Learning Style API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// 生成个性化建议
function generateRecommendations(
  primary: string,
  secondary: string,
  scores: Array<{ style: string; score: number }>
): string[] {
  const recommendations: string[] = [];
  const primaryConfig = STYLE_CONFIG[primary];
  const secondaryConfig = STYLE_CONFIG[secondary];

  // 主要风格建议
  recommendations.push(`你的主要学习风格是${primaryConfig.name}，${primaryConfig.description}`);
  recommendations.push(`建议：${primaryConfig.tips[0]}`);

  // 次要风格建议
  recommendations.push(`你的次要学习风格是${secondaryConfig.name}，可以结合使用`);

  // 平衡建议
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
  const maxDiff = scores[0].score - scores[3].score;
  const balanceRatio = maxDiff / (totalScore || 1);

  if (balanceRatio < 0.3) {
    recommendations.push('你的学习风格比较均衡，可以尝试多种学习方式');
  } else if (balanceRatio > 0.6) {
    recommendations.push(`你的学习风格偏向明显，建议多尝试其他学习方式来提升综合能力`);
  }

  // 针对性建议
  if (primary === 'visual' && secondary === 'reading') {
    recommendations.push('结合图像和文字，制作图文并茂的学习笔记效果会很好');
  } else if (primary === 'auditory' && secondary === 'kinesthetic') {
    recommendations.push('可以尝试边走边听讲解，或者在讨论中动手实践');
  }

  return recommendations;
}
