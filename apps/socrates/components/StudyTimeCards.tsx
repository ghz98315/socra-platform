'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Clock, Calendar, TrendingUp, Flame } from 'lucide-react';

interface TodayStatsProps {
  todayDuration: string;
  todaySessions: number;
  todayStreak: number;
}

export function TodayStats({ todayDuration, todaySessions, todayStreak }: TodayStatsProps) {
  return (
    <Card className="shadow-apple">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-medium">今日学习</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-card-foreground">
              {todayDuration}
            </div>
            <div className="text-xs text-muted-foreground mt-1">分钟</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-card-foreground">
              {todaySessions}
            </div>
            <div className="text-xs text-muted-foreground mt-1">次学习</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">
              {todayStreak}
            </div>
            <div className="text-xs text-muted-foreground mt-1">连续天数</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface WeeklyStatsProps {
  totalDuration: string;
  totalSessions: number;
  avgDaily: string;
  weeklyTrend?: 'up' | 'down' | 'stable';
}

export function WeeklyStats({ totalDuration, totalSessions, avgDaily, weeklyTrend }: WeeklyStatsProps) {
  return (
    <Card className="shadow-apple">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-medium">本周统计</h3>
          </div>
          {weeklyTrend === 'up' && (
            <div className="flex items-center gap-1 text-green-500">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">上升</span>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-card-foreground">
              {totalDuration}
            </div>
            <div className="text-xs text-muted-foreground mt-1">小时</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-card-foreground">
              {totalSessions}
            </div>
            <div className="text-xs text-muted-foreground mt-1">总学习次数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-card-foreground">
              {avgDaily}
            </div>
            <div className="text-xs text-muted-foreground mt-1">日均小时</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
