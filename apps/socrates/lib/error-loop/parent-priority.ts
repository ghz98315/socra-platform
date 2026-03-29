import type { ReviewInterventionEffect } from '@/lib/error-loop/review';

type ParentInterventionTaskType = 'review_intervention' | 'conversation_intervention' | 'other';

export function getParentInterventionTaskPriorityWeight(input: {
  taskType: ParentInterventionTaskType;
  status?: string | null;
  effect?: ReviewInterventionEffect | null;
  hasFeedbackNote?: boolean;
}) {
  if (input.taskType === 'review_intervention') {
    if (input.effect === 'risk_persisting') {
      return 0;
    }
    if (input.status !== 'completed' && !input.hasFeedbackNote) {
      return 1;
    }
    if (input.status !== 'completed') {
      return 2;
    }
    if (input.effect === 'pending') {
      return 3;
    }
    if (input.effect === 'risk_lowered') {
      return 5;
    }
    return 4;
  }

  if (input.taskType === 'conversation_intervention') {
    if (input.status !== 'completed' && !input.hasFeedbackNote) {
      return 4;
    }
    if (input.status !== 'completed') {
      return 5;
    }
    return 6;
  }

  return 7;
}

export function getParentRecentRiskPriorityWeight(input: {
  interventionEffect?: ReviewInterventionEffect | null;
  hasInterventionTask: boolean;
  interventionStatus?: string | null;
  closurePendingCount: number;
}) {
  if (input.interventionEffect === 'risk_persisting') {
    return 0;
  }
  if (input.hasInterventionTask && input.interventionStatus !== 'completed') {
    return 1;
  }
  if (!input.hasInterventionTask && input.closurePendingCount > 0) {
    return 2;
  }
  return 3;
}
