import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import {
  buildStudyAssetFocusSummary,
  buildStudyAssetWeakPointTags,
  getStudyAssetModuleDisplayLabel,
  hasStudyAssetStructuredResult,
} from '@/lib/study/bridges-v2';
import { buildStructuredOutcomeRollup } from '@/lib/error-loop/structured-rollup';
import { GUARDIAN_ERROR_TYPE_LABELS } from '@/lib/error-loop/structured-outcome';
import { getAuthenticatedProfile } from '@/lib/server/route-auth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

interface ErrorSessionRow {
  id: string;
  subject: string;
  difficulty_rating: number | null;
  concept_tags: string[] | null;
  guardian_error_type: string | null;
  guardian_root_cause_summary: string | null;
  child_poka_yoke_action: string | null;
  suggested_guardian_action: string | null;
  false_error_gate: boolean | null;
  analysis_mode: string | null;
  stuck_stage: string | null;
  created_at: string;
  status: string | null;
}

interface StudySessionRow {
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  session_type: string | null;
}

interface StudyAssetRow {
  id: string;
  subject: string;
  module: string;
  title: string | null;
  summary: string | null;
  status: string;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface BreakdownItem {
  key: string;
  label: string;
  count: number;
}

async function resolveAuthorizedStudent(requestedStudentId?: string) {
  const profile = await getAuthenticatedProfile();
  if (!profile) {
    return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) };
  }

  if (profile.role === 'student') {
    const { data: student, error } = await (supabase as any)
      .from('profiles')
      .select('id, display_name, grade_level')
      .eq('id', profile.id)
      .single();

    if (error || !student) {
      return { error: NextResponse.json({ error: 'Student not found' }, { status: 404 }) };
    }

    return { student };
  }

  if (profile.role !== 'parent') {
    return { error: NextResponse.json({ error: 'Unsupported role' }, { status: 403 }) };
  }

  const studentId = requestedStudentId?.trim() || '';
  if (!studentId) {
    return { error: NextResponse.json({ error: 'Missing student_id parameter' }, { status: 400 }) };
  }

  const { data: student, error } = await (supabase as any)
    .from('profiles')
    .select('id, display_name, grade_level')
    .eq('id', studentId)
    .eq('role', 'student')
    .eq('parent_id', profile.id)
    .maybeSingle();

  if (error || !student) {
    return { error: NextResponse.json({ error: 'Student not found' }, { status: 404 }) };
  }

  return { student };
}

const subjectLabels: Record<string, string> = {
  chinese: '语文',
  english: '英语',
  math: '数学',
  physics: '物理',
  chemistry: '化学',
  generic: '综合',
};

function dedupeStudyAssets(studyAssets: StudyAssetRow[], focusAsset: StudyAssetRow | null) {
  if (!focusAsset) {
    return studyAssets;
  }

  const assetMap = new Map(studyAssets.map((asset) => [asset.id, asset]));
  assetMap.set(focusAsset.id, focusAsset);
  return [...assetMap.values()];
}

function calculateStudyMinutes(sessions: StudySessionRow[]) {
  return sessions.reduce((total, session) => {
    if (session.duration_seconds) {
      return total + Math.round(session.duration_seconds / 60);
    }

    if (session.start_time && session.end_time) {
      const duration =
        (new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / 1000;
      return total + Math.max(0, Math.round(duration / 60));
    }

    return total;
  }, 0);
}

function calculateStats(errors: ErrorSessionRow[], sessions: StudySessionRow[], studyAssets: StudyAssetRow[], days: number) {
  const processedAssets = studyAssets.filter((asset) => hasStudyAssetStructuredResult(asset)).length;
  const masteredErrors = errors.filter((error) => error.status === 'mastered').length;
  const totalRecords = errors.length + studyAssets.length;
  const completedRecords = masteredErrors + processedAssets;
  const masteryRate = totalRecords > 0 ? Math.round((completedRecords / totalRecords) * 100) : 0;
  const totalStudyMinutes = calculateStudyMinutes(sessions);
  const totalReviews = sessions.filter((session) => session.session_type === 'review').length;
  const avgDailyMinutes = days > 0 ? Math.round(totalStudyMinutes / days) : 0;

  return {
    totalErrors: totalRecords,
    mastered: completedRecords,
    masteryRate,
    totalStudyMinutes,
    totalReviews,
    avgDailyMinutes,
    legacyErrorCount: errors.length,
    studyAssetCount: studyAssets.length,
    processedAssetCount: processedAssets,
  };
}

function analyzeWeakPoints(errors: ErrorSessionRow[], studyAssets: StudyAssetRow[]) {
  const tagMap = new Map<string, number>();

  errors.forEach((error) => {
    (error.concept_tags || []).forEach((tag) => {
      if (!tag?.trim()) {
        return;
      }

      tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
    });
  });

  studyAssets.forEach((asset) => {
    buildStudyAssetWeakPointTags(asset)
      .slice(0, 4)
      .forEach((tag) => {
        if (!tag?.trim()) {
          return;
        }

        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      });
  });

  return [...tagMap.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((left, right) => right.count - left.count)
    .slice(0, 10);
}

function buildGuardianErrorBreakdown(errors: ErrorSessionRow[]) {
  const counts = new Map<string, number>();

  errors.forEach((error) => {
    if (!error.guardian_error_type?.trim()) {
      return;
    }

    counts.set(error.guardian_error_type, (counts.get(error.guardian_error_type) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: GUARDIAN_ERROR_TYPE_LABELS[key as keyof typeof GUARDIAN_ERROR_TYPE_LABELS] || key,
      count,
    }))
    .sort((left, right) => right.count - left.count);
}

function buildAnalysisModeBreakdown(errors: ErrorSessionRow[]) {
  const counts = new Map<string, number>();

  errors.forEach((error) => {
    if (!error.analysis_mode?.trim()) {
      return;
    }

    counts.set(error.analysis_mode, (counts.get(error.analysis_mode) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((left, right) => right.count - left.count);
}

function buildSubjectBreakdown(errors: ErrorSessionRow[], studyAssets: StudyAssetRow[]) {
  const counts = new Map<string, number>();

  errors.forEach((error) => {
    counts.set(error.subject, (counts.get(error.subject) || 0) + 1);
  });

  studyAssets.forEach((asset) => {
    counts.set(asset.subject, (counts.get(asset.subject) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: subjectLabels[key] || key,
      count,
    }))
    .sort((left, right) => right.count - left.count);
}

function buildModuleBreakdown(studyAssets: StudyAssetRow[]) {
  const counts = new Map<string, number>();

  studyAssets.forEach((asset) => {
    counts.set(asset.module, (counts.get(asset.module) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([key, count]) => ({
      key,
      label: getStudyAssetModuleDisplayLabel(key),
      count,
    }))
    .sort((left, right) => right.count - left.count);
}

function getDefaultAnalysis(
  student: { display_name: string | null },
  stats: ReturnType<typeof calculateStats>,
  weakPoints: Array<{ tag: string; count: number }>,
  guardianErrorBreakdown: BreakdownItem[],
  subjectBreakdown: BreakdownItem[],
  focusAssetSummary: ReturnType<typeof buildStudyAssetFocusSummary> | null,
) {
  const focusLine = focusAssetSummary
    ? `这次报告重点跟踪的是「${focusAssetSummary.title}」这条学习记录。`
    : '';
  const weakPointLine =
    weakPoints.length > 0
      ? `建议优先回看 ${weakPoints
          .slice(0, 3)
          .map((item) => item.tag)
          .join('、')}。`
      : '当前没有明显重复出现的薄弱点，可以继续保持。';
  const subjectLine =
    subjectBreakdown.length > 0
      ? `最近学习主要集中在${subjectBreakdown
          .slice(0, 3)
          .map((item) => `${item.label}${item.count}次`)
          .join('、')}。`
      : '';
  const guardianErrorLine =
    guardianErrorBreakdown.length > 0
      ? `最近更常见的卡点类型是${guardianErrorBreakdown
          .slice(0, 3)
          .map((item) => `${item.label}${item.count}次`)
          .join('、')}。`
      : '';

  return [
    `${student.display_name || '这位同学'}最近共沉淀了 ${stats.totalErrors} 条学习记录，完成分析 ${stats.mastered} 条，整体完成率 ${stats.masteryRate}%。`,
    `累计学习时长 ${stats.totalStudyMinutes} 分钟，日均 ${stats.avgDailyMinutes} 分钟。`,
    guardianErrorLine,
    subjectLine,
    weakPointLine,
    focusLine,
    '下一步建议把最新一条学习记录尽快加入复习清单，再结合学习报告持续跟踪。',
  ]
    .filter(Boolean)
    .join('\n\n');
}

async function generateAIAnalysis(
  student: { display_name: string | null; grade_level: number | null },
  stats: ReturnType<typeof calculateStats>,
  weakPoints: Array<{ tag: string; count: number }>,
  guardianErrorBreakdown: BreakdownItem[],
  subjectBreakdown: BreakdownItem[],
  moduleBreakdown: BreakdownItem[],
  focusAssetSummary: ReturnType<typeof buildStudyAssetFocusSummary> | null,
  reportType: string,
) {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) {
    return getDefaultAnalysis(student, stats, weakPoints, guardianErrorBreakdown, subjectBreakdown, focusAssetSummary);
  }

  try {
    const periodName = reportType === 'weekly' ? '本周' : '本阶段';
    const weakPointsText =
      weakPoints.length > 0
        ? weakPoints
            .slice(0, 5)
            .map((item, index) => `${index + 1}. ${item.tag}（${item.count}次）`)
            .join('\n')
        : '暂无明显重复薄弱点';
    const subjectText =
      subjectBreakdown.length > 0
        ? subjectBreakdown.map((item) => `${item.label}${item.count}次`).join('、')
        : '暂无科目分布数据';
    const guardianErrorText =
      guardianErrorBreakdown.length > 0
        ? guardianErrorBreakdown.map((item) => `${item.label}${item.count}次`).join('、')
        : '暂无统一错因分类数据';
    const moduleText =
      moduleBreakdown.length > 0
        ? moduleBreakdown.slice(0, 5).map((item) => `${item.label}${item.count}次`).join('、')
        : '暂无模块分布数据';
    const focusText = focusAssetSummary
      ? `本次重点学习记录：${focusAssetSummary.title}\n模块：${focusAssetSummary.moduleLabel}\n摘要：${focusAssetSummary.summary}`
      : '本次没有指定单条重点学习记录';

    const prompt = `你是苏格拉底AI学习助手，请为${student.display_name || '学生'}生成一段${periodName}学习报告。

【学习概况】
- 学习记录：${stats.totalErrors}
- 已完成分析：${stats.mastered}
- 完成率：${stats.masteryRate}%
- 学习时长：${stats.totalStudyMinutes}分钟
- 日均学习：${stats.avgDailyMinutes}分钟
- 已完成复习：${stats.totalReviews}次

【科目分布】
${subjectText}

【模块分布】
${moduleText}

【重点关注】
${weakPointsText}

【统一错因标签】
${guardianErrorText}

【单条记录聚焦】
${focusText}

请输出一段 120-220 字的中文学习总结，要求：
1. 肯定进展，但不要空泛夸奖；
2. 点出最值得继续巩固的能力点；
3. 给出一条很具体的下一步行动建议；
4. 如果有重点学习记录，请在建议里顺带提到它。`;

    const response = await fetch(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'qwen-turbo',
          messages: [
            {
              role: 'system',
              content: '你是苏格拉底AI学习助手，擅长根据学习记录生成简洁、具体、鼓励式的学习总结。',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.6,
          max_tokens: 500,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`dashscope-${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === 'string' && content.trim()
      ? content
      : getDefaultAnalysis(student, stats, weakPoints, guardianErrorBreakdown, subjectBreakdown, focusAssetSummary);
  } catch (error) {
    console.error('[reports/study] AI analysis fallback:', error);
    return getDefaultAnalysis(student, stats, weakPoints, guardianErrorBreakdown, subjectBreakdown, focusAssetSummary);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const requestedStudentId = typeof body?.student_id === 'string' ? body.student_id.trim() : '';
    const reportType = typeof body?.report_type === 'string' ? body.report_type : 'weekly';
    const days = Number.isFinite(body?.days) ? Number(body.days) : 7;
    const focusAssetId = typeof body?.focus_asset_id === 'string' ? body.focus_asset_id.trim() : '';

    const resolvedStudent = await resolveAuthorizedStudent(requestedStudentId);
    if (resolvedStudent.error) {
      return resolvedStudent.error;
    }
    const student = resolvedStudent.student;
    const studentId = student.id;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [errorStatsResult, sessionsResult, studyAssetsResult, focusAssetResult] = await Promise.all([
      (supabase as any)
        .from('error_sessions')
        .select(
          'id, subject, difficulty_rating, concept_tags, guardian_error_type, guardian_root_cause_summary, child_poka_yoke_action, suggested_guardian_action, false_error_gate, analysis_mode, stuck_stage, created_at, status',
        )
        .eq('student_id', studentId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString()),
      (supabase as any)
        .from('study_sessions')
        .select('start_time, end_time, duration_seconds, session_type')
        .eq('student_id', studentId)
        .gte('start_time', startDate.toISOString())
        .lte('start_time', endDate.toISOString()),
      (supabase as any)
        .from('study_assets')
        .select('id, subject, module, title, summary, status, payload, created_at, updated_at')
        .eq('student_id', studentId)
        .gte('updated_at', startDate.toISOString())
        .lte('updated_at', endDate.toISOString()),
      focusAssetId
        ? (supabase as any)
            .from('study_assets')
            .select('id, subject, module, title, summary, status, payload, created_at, updated_at')
            .eq('id', focusAssetId)
            .eq('student_id', studentId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (errorStatsResult.error) {
      console.error('[reports/study] Error stats query failed:', errorStatsResult.error);
    }

    if (sessionsResult.error) {
      console.error('[reports/study] Study sessions query failed:', sessionsResult.error);
    }

    if (studyAssetsResult.error) {
      console.error('[reports/study] Study assets query failed:', studyAssetsResult.error);
    }

    if (focusAssetResult.error) {
      console.error('[reports/study] Focus asset query failed:', focusAssetResult.error);
    }

    const errors = (errorStatsResult.data || []) as ErrorSessionRow[];
    const studySessions = (sessionsResult.data || []) as StudySessionRow[];
    const studyAssets = dedupeStudyAssets(
      (studyAssetsResult.data || []) as StudyAssetRow[],
      (focusAssetResult.data as StudyAssetRow | null) || null,
    );
    const focusAssetSummary = focusAssetResult.data
      ? buildStudyAssetFocusSummary(focusAssetResult.data as StudyAssetRow)
      : null;
    const stats = calculateStats(errors, studySessions, studyAssets, days);
    const weakPoints = analyzeWeakPoints(errors, studyAssets);
    const guardianErrorBreakdown = buildGuardianErrorBreakdown(errors);
    const analysisModeBreakdown = buildAnalysisModeBreakdown(errors);
    const structuredRollup = buildStructuredOutcomeRollup(errors, {
      openErrorCount: stats.totalErrors - stats.mastered,
    });
    const subjectBreakdown = buildSubjectBreakdown(errors, studyAssets);
    const moduleBreakdown = buildModuleBreakdown(studyAssets);
    const aiAnalysis = await generateAIAnalysis(
      student,
      stats,
      weakPoints,
      guardianErrorBreakdown,
      subjectBreakdown,
      moduleBreakdown,
      focusAssetSummary,
      reportType,
    );

    const { data: report, error: insertError } = await (supabase as any)
      .from('learning_reports')
      .insert({
        student_id: studentId,
        report_type: reportType,
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
      console.error('[reports/study] Failed to save report:', insertError);
    }

    return NextResponse.json({
      success: true,
      data: {
        report,
        stats,
        weakPoints,
        guardianSignal: structuredRollup.guardian_signal,
        topBlocker: structuredRollup.top_blocker,
        focusSummary: structuredRollup.focus_summary,
        stuckStageSummary: structuredRollup.stuck_stage_summary,
        structuredDiagnosisCount: structuredRollup.structured_diagnosis_count,
        falseErrorGateCount: structuredRollup.false_error_gate_count,
        grade9ExamCount: structuredRollup.grade9_exam_count,
        guardianErrorBreakdown,
        analysisModeBreakdown,
        aiAnalysis,
        subjectBreakdown,
        moduleBreakdown,
        focusAsset: focusAssetSummary,
      },
    });
  } catch (error: any) {
    console.error('[reports/study] API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedStudentId = searchParams.get('student_id') || undefined;
    const limit = Number.parseInt(searchParams.get('limit') || '10', 10);

    const resolvedStudent = await resolveAuthorizedStudent(requestedStudentId);
    if (resolvedStudent.error) {
      return resolvedStudent.error;
    }
    const studentId = resolvedStudent.student.id;

    const { data: reports, error } = await (supabase as any)
      .from('learning_reports')
      .select('*')
      .eq('student_id', studentId)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[reports/study] Failed to fetch reports:', error);
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
    }

    return NextResponse.json({ data: reports || [] });
  } catch (error: any) {
    console.error('[reports/study] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
