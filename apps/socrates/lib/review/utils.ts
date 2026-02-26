// Review stages for spaced repetition (Ebbinghaus forgetting curve)
export const REVIEW_STAGES = [
  { stage: 1, name: '初次复习', days: 1 },
  { stage: 2, name: '第二次复习', days: 3 },
  { stage: 3, name: '第三次复习', days: 7 },
  { stage: 4, name: '第四次复习', days: 15 },
  { stage: 5, name: '已掌握', days: 30 },
];

// Format review date for display
export function formatReviewDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === -1) return '昨天';
  if (diffDays < -1) return `${Math.abs(diffDays)}天前`;
  if (diffDays <= 7) return `${diffDays}天后`;

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

// Get urgency color based on days until due
export function getUrgencyColor(daysUntil: number): string {
  if (daysUntil <= 0) return 'text-red-500';
  if (daysUntil <= 2) return 'text-orange-500';
  if (daysUntil <= 5) return 'text-yellow-500';
  return 'text-green-500';
}

// Get urgency label
export function getUrgencyLabel(daysUntil: number): string {
  if (daysUntil <= 0) return '已过期';
  if (daysUntil === 1) return '明天';
  if (daysUntil <= 3) return `${daysUntil}天后`;
  if (daysUntil <= 7) return '本周内';
  return '计划中';
}
