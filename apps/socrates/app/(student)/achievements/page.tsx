// =====================================================
// Project Socrates - Achievements Page
// 成就页面 - 展示用户成就、等级、积分
// v1.6.23 - 添加已解锁成就闪光效果和悬停呼吸感
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  Trophy,
  Star,
  Flame,
  Target,
  Lock,
  CheckCircle,
  Loader2,
  Clock,
  Zap,
  Crown,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/PageHeader';
import { cn } from '@/lib/utils';
import { RARITY_CONFIG } from '@/lib/achievements/definitions';
import type { AchievementDefinition } from '@/lib/achievements/types';

interface AchievementWithStatus extends AchievementDefinition {
  unlocked: boolean;
  unlocked_at: string | null;
  progress: number;
}

interface UserLevelData {
  level: number;
  xp: number;
  total_xp: number;
  title: string;
  current: number;
  next: number;
  progress: number;
}

interface AchievementStats {
  total_achievements: number;
  unlocked_achievements: number;
  total_points: number;
  earned_points: number;
  current_streak: number;
  longest_streak: number;
}

export default function AchievementsPage() {
  const { profile } = useAuth();
  const [achievements, setAchievements] = useState<AchievementWithStatus[]>([]);
  const [level, setLevel] = useState<UserLevelData | null>(null);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    if (profile?.id) {
      fetchAchievements();
    }
  }, [profile?.id]);

  const fetchAchievements = async () => {
    if (!profile?.id) return;
    setLoading(true);

    try {
      const response = await fetch(`/api/achievements?user_id=${profile.id}`);
      if (response.ok) {
        const result = await response.json();
        setAchievements(result.data.achievements);
        setLevel(result.data.level);
        setStats(result.data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAchievements = achievements.filter(a => {
    if (filter === 'unlocked') return a.unlocked;
    if (filter === 'locked') return !a.unlocked && !a.hidden;
    return !a.hidden || a.unlocked;
  });

  const groupedAchievements = filteredAchievements.reduce((acc, a) => {
    if (!acc[a.type]) acc[a.type] = [];
    acc[a.type].push(a);
    return acc;
  }, {} as Record<string, AchievementWithStatus[]>);

  const typeLabels: Record<string, string> = {
    learning: '学习成就',
    streak: '连续学习',
    mastery: '掌握成就',
    social: '社交成就',
    special: '特殊成就',
  };

  const themeClass = profile?.theme_preference === 'junior' ? 'theme-junior' : 'theme-senior';

  if (loading) {
    return (
      <div className={cn('min-h-screen bg-background flex items-center justify-center', themeClass)}>
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">加载成就数据...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-yellow-50 via-white to-amber-50 dark:from-slate-950 dark:via-slate-900 dark:to-yellow-950/30', themeClass)}>
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 right-1/4 w-80 h-80 bg-yellow-200/40 dark:bg-yellow-900/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-amber-200/30 dark:bg-amber-900/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-1/4 w-72 h-72 bg-orange-200/20 dark:bg-orange-900/20 rounded-full blur-3xl" />
      </div>

      {/* 页面标题 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <PageHeader
          title="成就中心"
          description="查看你的学习成就和等级进度"
          icon={Trophy}
          iconColor="text-yellow-500"
        />
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 space-y-6">
        {/* 等级和统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 等级卡片 - 带环形进度 */}
          <Card className="border-border/50 md:col-span-2 bg-gradient-to-br from-yellow-50/50 via-white to-orange-50/50 dark:from-yellow-950/20 dark:via-slate-900 dark:to-orange-950/20 overflow-hidden relative">
            {/* 装饰光晕 */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-yellow-400/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-orange-400/20 rounded-full blur-3xl" />

            <CardContent className="p-6 relative">
              <div className="flex items-center gap-6">
                {/* 环形进度等级图标 */}
                <div className="relative">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    {/* 背景圆环 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-muted/20"
                    />
                    {/* 进度圆环 */}
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="url(#gradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(level?.progress || 0) * 2.64} 264`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#f97316" />
                      </linearGradient>
                    </defs>
                  </svg>
                  {/* 中心等级图标 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg shadow-yellow-500/30 animate-[pulse-glow_2s_ease-in-out_infinite]">
                      <Crown className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  {/* 等级数字 */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-card border-2 border-yellow-500 rounded-full">
                    <span className="text-sm font-bold text-yellow-500">Lv.{level?.level || 1}</span>
                  </div>
                </div>

                {/* 等级信息 */}
                <div className="flex-1">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-500 bg-clip-text text-transparent">
                    {level?.title || '初学者'}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-3">
                    经验值: <span className="text-yellow-600 font-medium">{level?.total_xp || 0}</span> XP
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">升级进度</span>
                      <span className="font-medium text-yellow-600">{Math.round(level?.progress || 0)}%</span>
                    </div>
                    <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-500 rounded-full transition-all duration-1000"
                        style={{ width: `${level?.progress || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      距离下一级还需 <span className="text-orange-500 font-medium">{((level?.next || 0) - (level?.total_xp || 0))}</span> XP
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 统计卡片 */}
          <Card className="border-border/50 bg-gradient-to-br from-purple-50/50 via-white to-pink-50/50 dark:from-purple-950/20 dark:via-slate-900 dark:to-pink-950/20">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">已解锁成就</span>
                <span className="font-bold text-purple-600">{stats?.unlocked_achievements || 0}<span className="text-muted-foreground font-normal">/{stats?.total_achievements || 0}</span></span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">获得积分</span>
                <span className="font-bold text-yellow-500">{stats?.earned_points || 0} XP</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30">
                <span className="text-sm text-muted-foreground">当前连续</span>
                <span className="font-bold flex items-center gap-1.5">
                  <span className="text-lg animate-[flame_0.5s_ease-in-out_infinite]">🔥</span>
                  <span className="text-orange-500">{stats?.current_streak || 0}</span>
                  <span className="text-muted-foreground font-normal text-xs">天</span>
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-sm text-muted-foreground">最长连续</span>
                <span className="font-bold">{stats?.longest_streak || 0} 天</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 筛选器 */}
        <div className="flex gap-2">
          {(['all', 'unlocked', 'locked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                filter === f
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 hover:bg-muted"
              )}
            >
              {f === 'all' ? '全部' : f === 'unlocked' ? '已解锁' : '未解锁'}
            </button>
          ))}
        </div>

        {/* 成就列表 */}
        {Object.entries(groupedAchievements).map(([type, achievements]) => (
          <div key={type} className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {type === 'streak' && <Flame className="w-5 h-5 text-orange-500" />}
              {type === 'learning' && <Target className="w-5 h-5 text-blue-500" />}
              {type === 'mastery' && <CheckCircle className="w-5 h-5 text-green-500" />}
              {type === 'special' && <Star className="w-5 h-5 text-purple-500" />}
              {typeLabels[type] || type}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map((achievement) => {
                const rarityConfig = RARITY_CONFIG[achievement.rarity];
                return (
                  <Card
                    key={achievement.id}
                    className={cn(
                      "border-border/50 transition-all duration-500 relative overflow-hidden",
                      achievement.unlocked
                        ? "hover:shadow-xl hover:shadow-yellow-500/20 hover:scale-[1.02] group"
                        : "opacity-60 hover:opacity-80"
                    )}
                  >
                    {/* 闪光效果 - 只在已解锁时显示 */}
                    {achievement.unlocked && (
                      <>
                        {/* 闪光扫过动画层 */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer" />
                        </div>
                        {/* 边框发光效果 */}
                        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <div className="absolute inset-[-2px] bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400 rounded-lg blur-sm animate-pulse-slow" />
                        </div>
                      </>
                    )}

                    <CardContent className="p-4 relative">
                      <div className="flex items-start gap-3">
                        {/* 图标 */}
                        <div
                          className={cn(
                            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl relative",
                            achievement.unlocked
                              ? cn(rarityConfig.bgColor, "group-hover:animate-breathe shadow-lg", rarityConfig.borderColor, "border-2")
                              : "bg-muted"
                          )}
                        >
                          {achievement.unlocked ? (
                            <>
                              <span className="relative z-10">{achievement.icon}</span>
                              {/* 图标周围闪光粒子 */}
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping" />
                                <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-amber-300 rounded-full animate-ping animation-delay-200" />
                                <div className="absolute top-1/2 -right-1.5 w-1 h-1 bg-orange-300 rounded-full animate-ping animation-delay-400" />
                              </div>
                            </>
                          ) : (
                            <Lock className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>

                        {/* 内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={cn(
                              "font-medium truncate",
                              achievement.unlocked && "group-hover:text-yellow-600 dark:group-hover:text-yellow-400 transition-colors"
                            )}>
                              {achievement.name}
                            </h4>
                            {achievement.unlocked && (
                              <Badge variant="secondary" className="text-xs bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/50 dark:to-amber-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-300/50">
                                +{achievement.points} XP
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {achievement.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs",
                                achievement.unlocked && "group-hover:border-yellow-400/50 transition-colors",
                                rarityConfig.color
                              )}
                            >
                              {rarityConfig.label}
                            </Badge>
                            {achievement.unlocked && achievement.unlocked_at && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(achievement.unlocked_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}
