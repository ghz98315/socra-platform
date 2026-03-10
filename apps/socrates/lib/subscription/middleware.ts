// =====================================================
// Project Socrates - Pro Feature Check Middleware
// Pro 权限检查中间件
// =====================================================

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Pro 功能配置
const PRO_FEATURES = {
  error_review: { limit: 'error_review_daily', label: '错题学习' },
  essay: { limit: 'essay_weekly', label: '作文批改' },
  ai_chat: { limit: 'ai_chat_rounds', label: 'AI对话' },
  pdf_export: { limit: 'pdf_export_monthly', label: 'PDF导出' },
  geometry_board: { limit: 'geometry_board', label: '几何画板' },
  review_plan: { limit: 'review_plan', label: '复习计划' },
  time_planner: { limit: 'time_planner', label: '时间规划' },
  learning_report: { limit: 'learning_report', label: '学习报告' },
};

export type ProFeature = keyof typeof PRO_FEATURES;

// 检查用户是否为 Pro
export async function checkProStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_pro_user', { p_user_id: userId });
  return !error && data === true;
}

// 检查功能限制
export async function checkFeatureLimit(
  userId: string,
  feature: ProFeature,
  currentUsage: number
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  isPro: boolean;
}> {
  const { data, error } = await supabase.rpc('check_feature_limit', {
    p_user_id: userId,
    p_feature: feature,
    p_current_usage: currentUsage
  });

  if (error || !data) {
    return { allowed: false, limit: 0, remaining: 0, isPro: false };
  }

  return {
    allowed: data.allowed,
    limit: data.limit,
    remaining: data.remaining,
    isPro: data.is_pro
  };
}

// API 路由中间件 - 检查 Pro 权限
export async function withProCheck(
  req: NextRequest,
  feature: ProFeature,
  handler: (userId: string, isPro: boolean) => Promise<NextResponse>
): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id');

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isPro = await checkProStatus(userId);

  // Pro 用户直接放行
  if (isPro) {
    return handler(userId, true);
  }

  // 非Pro用户需要检查限制
  // 这里需要根据具体功能获取当前使用量
  // 简化处理，直接返回需要升级的提示
  return NextResponse.json({
    error: 'Feature limit exceeded',
    message: '此功能需要升级到 Pro 版本',
    feature: PRO_FEATURES[feature]?.label || feature,
    isPro: false
  }, { status: 403 });
}
