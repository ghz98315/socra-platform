// =====================================================
// Project Socrates - Study Sessions & Duration Tracking
// =====================================================

export interface StudySession {
  id: string;
  student_id: string;
  session_type: 'error_analysis' | 'review';
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
}

export interface StudySessionWithStats extends StudySession {
  subject?: 'math' | 'physics' | 'chemistry';
  subject_icon?: string;
}

export interface StudyStats {
  total_sessions: number;
  total_duration_minutes: number;
  today_duration_minutes: number;
  streak_days: number;
  mastery_rate: number;
}

export const SESSION_TYPE_ICONS = {
  error_analysis: '📊',
  review: '📅',
};

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// 计算连续学习天数
export function calculateStreak(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0;

  // 获取有结束时间的会话并按日期分组
  const completedSessions = sessions.filter(s => s.end_time);

  if (completedSessions.length === 0) return 0;

  // 获取唯一的学习日期
  const studyDates = new Set(
    completedSessions.map(s => {
      const date = new Date(s.start_time);
      return date.toDateString();
    })
  );

  // 将日期转换为数组并排序
  const sortedDates = Array.from(studyDates)
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime()); // 降序排列

  // 检查今天是否有学习记录
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const latestDate = new Date(sortedDates[0]);
  latestDate.setHours(0, 0, 0, 0);

  // 如果最新记录不是今天或昨天，streak为0
  const daysDiff = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > 1) return 0;

  let streak = 1;
  let currentDate = daysDiff === 0 ? today : latestDate;

  // 向前遍历，检查连续天数
  for (let i = 1; i < sortedDates.length; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() - 1); // 减一天

    const prevDateStr = checkDate.toDateString();
    const hasStudyOnPrevDate = sortedDates.some(d => d.toDateString() === prevDateStr);

    if (hasStudyOnPrevDate) {
      streak++;
      currentDate = checkDate;
    } else {
      break;
    }
  }

  return streak;
}

export function calculateStats(sessions: StudySession[]): StudyStats {
  const totalSessions = sessions.length;

  // 计算总时长（秒）
  const totalSeconds = sessions.reduce((sum, session) => {
    if (session.end_time && session.start_time) {
      const start = new Date(session.start_time);
      const end = new Date(session.end_time);
      return sum + (end.getTime() - start.getTime()) / 1000;
    }
    return sum;
  }, 0);

  // 计算今天的学习时长
  const todaySeconds = sessions
    .filter(s => {
      const sessionDate = new Date(s.start_time);
      return sessionDate.toDateString() === new Date().toDateString() && s.end_time;
    })
    .reduce((sum, session) => {
      if (session.end_time) {
        const duration = new Date(session.end_time).getTime() - new Date(session.start_time).getTime();
        return sum + duration;
      }
      return sum;
    }, 0);

  // 计算连续天数
  const streak = calculateStreak(sessions);

  // 计算掌握率（暂时返回固定值，需要结合review表数据）
  const masteryRate = 0; // TODO: 实现基于review表的掌握率计算

  return {
    total_sessions: totalSessions,
    total_duration_minutes: Math.round(totalSeconds / 60),
    today_duration_minutes: Math.round(todaySeconds / 60),
    streak_days: streak,
    mastery_rate: masteryRate,
  };
}

// 获取本周学习统计
export function getWeeklyStats(sessions: StudySession[]): {
  totalDuration: string;
  totalSessions: number;
  avgDaily: string;
  weeklyTrend?: 'up' | 'down' | 'stable';
} {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 本周的学习会话
  const thisWeekSessions = sessions.filter(s => {
    const sessionDate = new Date(s.start_time);
    return sessionDate >= weekAgo && sessionDate <= now && s.end_time;
  });

  // 计算总时长（秒）
  const totalSeconds = thisWeekSessions.reduce((sum, session) => {
    const duration = new Date(session.end_time!).getTime() - new Date(session.start_time).getTime();
    return sum + duration;
  }, 0);

  const totalHours = (totalSeconds / 3600).toFixed(1);
  const avgDailyHours = (totalSeconds / 3600 / 7).toFixed(1);

  // 计算上周数据进行对比
  const twoWeeksAgo = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
  const lastWeekSessions = sessions.filter(s => {
    const sessionDate = new Date(s.start_time);
    return sessionDate >= twoWeeksAgo && sessionDate < weekAgo && s.end_time;
  });

  const lastWeekSeconds = lastWeekSessions.reduce((sum, session) => {
    const duration = new Date(session.end_time!).getTime() - new Date(session.start_time).getTime();
    return sum + duration;
  }, 0);

  let weeklyTrend: 'up' | 'down' | 'stable' | undefined;
  if (lastWeekSeconds > 0) {
    const diffPercent = ((totalSeconds - lastWeekSeconds) / lastWeekSeconds) * 100;
    if (diffPercent > 5) {
      weeklyTrend = 'up';
    } else if (diffPercent < -5) {
      weeklyTrend = 'down';
    } else {
      weeklyTrend = 'stable';
    }
  }

  return {
    totalDuration: totalHours,
    totalSessions: thisWeekSessions.length,
    avgDaily: avgDailyHours,
    weeklyTrend,
  };
}

// 获取今日学习统计
export function getTodayStats(sessions: StudySession[]): {
  todayDuration: string;
  todaySessions: number;
  todayStreak: number;
} {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todaySessions = sessions.filter(s => {
    const sessionDate = new Date(s.start_time);
    return sessionDate.toDateString() === today.toDateString() && s.end_time;
  });

  const totalSeconds = todaySessions.reduce((sum, session) => {
    const duration = new Date(session.end_time!).getTime() - new Date(session.start_time).getTime();
    return sum + duration;
  }, 0);

  return {
    todayDuration: Math.round(totalSeconds / 60).toString(),
    todaySessions: todaySessions.length,
    todayStreak: calculateStreak(sessions),
  };
}
