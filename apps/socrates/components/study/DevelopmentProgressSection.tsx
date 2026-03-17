import { CheckCircle2, CircleDashed, Clock3, Flag, Wrench } from 'lucide-react';

import { Progress } from '@/components/ui/progress';
import {
  developmentProgressGroups,
  developmentProgressUpdatedAt,
  getDevelopmentProgressStats,
  type DevelopmentProgressStatus,
} from '@/lib/study/development-progress';
import { cn } from '@/lib/utils';

function getStatusMeta(status: DevelopmentProgressStatus) {
  switch (status) {
    case 'completed':
      return {
        label: '已完成',
        icon: CheckCircle2,
        badgeClass: 'bg-emerald-100 text-emerald-700',
        dotClass: 'bg-emerald-500',
      };
    case 'in_progress':
      return {
        label: '进行中',
        icon: Clock3,
        badgeClass: 'bg-amber-100 text-amber-700',
        dotClass: 'bg-amber-500',
      };
    case 'pending':
      return {
        label: '未开始',
        icon: CircleDashed,
        badgeClass: 'bg-slate-100 text-slate-600',
        dotClass: 'bg-slate-400',
      };
    default:
      return {
        label: '未开始',
        icon: CircleDashed,
        badgeClass: 'bg-slate-100 text-slate-600',
        dotClass: 'bg-slate-400',
      };
  }
}

export function DevelopmentProgressSection() {
  const stats = getDevelopmentProgressStats();

  return (
    <section className="mt-10 rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-sm shadow-slate-100/70 lg:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">Development Progress</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">当前多学科开发进程</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            先把统一学习入口、数学稳定性和语文作文桥接做稳，再继续把语文做深、把英语做成第一条专属主链。
            下方展示的是这个阶段的真实推进状态，不是长期规划的理想终态。
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-slate-50/80 px-5 py-4 text-sm text-slate-600">
          <div className="flex items-center gap-2 text-slate-900">
            <Flag className="h-4 w-4 text-warm-500" />
            <span className="font-medium">最近更新</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{developmentProgressUpdatedAt}</p>
          <p className="mt-1 text-sm">当前阶段以“稳住数学几何链路”和“搭起多学科骨架”为主。</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <article className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4">
          <div className="text-3xl font-semibold text-slate-900">{stats.progress}%</div>
          <div className="mt-1 text-sm text-slate-600">整体完成度</div>
          <Progress value={stats.progress} className="mt-3 h-2.5" />
        </article>
        <article className="rounded-3xl border border-emerald-200 bg-emerald-50/80 p-4">
          <div className="text-3xl font-semibold text-emerald-700">{stats.completed}</div>
          <div className="mt-1 text-sm text-emerald-700">已完成模块</div>
        </article>
        <article className="rounded-3xl border border-amber-200 bg-amber-50/80 p-4">
          <div className="text-3xl font-semibold text-amber-700">{stats.inProgress}</div>
          <div className="mt-1 text-sm text-amber-700">进行中模块</div>
        </article>
        <article className="rounded-3xl border border-slate-200 bg-slate-50/80 p-4">
          <div className="text-3xl font-semibold text-slate-700">{stats.pending}</div>
          <div className="mt-1 text-sm text-slate-600">未开始模块</div>
        </article>
      </div>

      <div className="mt-8 grid gap-4 xl:grid-cols-3">
        {developmentProgressGroups.map((group) => (
          <article
            key={group.id}
            className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-white to-slate-50/60 p-5"
          >
            <h3 className="text-lg font-semibold text-slate-900">{group.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{group.description}</p>

            <div className="mt-5 space-y-3">
              {group.items.map((item) => {
                const meta = getStatusMeta(item.status);
                const Icon = meta.icon;

                return (
                  <div
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-100/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={cn('mt-1 h-2.5 w-2.5 rounded-full', meta.dotClass)} />
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{item.summary}</p>
                        </div>
                      </div>
                      <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium', meta.badgeClass)}>
                        <Icon className="h-3.5 w-3.5" />
                        {meta.label}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2">
                      {item.tasks.map((task) => (
                        <div key={task} className="flex items-start gap-2 text-sm text-slate-600">
                          <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warm-500" />
                          <span>{task}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 rounded-[28px] border border-blue-200 bg-blue-50/80 p-5">
        <h3 className="text-base font-semibold text-slate-900">几何专项说明</h3>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          当前数学几何链路的优先级高于激进重构。图形识别核心没有被重写，只补了学科级保护，并确认几何画板已有手工加点、
          拖拽点位和辅助线能力。后续会继续按“先回归验证，再继续扩功能”的顺序推进。
        </p>
      </div>
    </section>
  );
}
