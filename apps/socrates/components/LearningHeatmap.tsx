'use client';

import { Card, CardContent } from '@/components/ui/card';

interface LearningHeatmapProps {
  data: { date: string; count: number }[];
}

export function LearningHeatmap({ data }: LearningHeatmapProps) {
  const getMaxCount = () => Math.max(...data.map(d => d.count), 1);

  const getColorClass = (count: number) => {
    const max = getMaxCount();
    const ratio = count / max;
    if (count === 0) return 'bg-gray-100';
    if (ratio < 0.25) return 'bg-green-200';
    if (ratio < 0.5) return 'bg-green-300';
    if (ratio < 0.75) return 'bg-green-400';
    return 'bg-green-500';
  };

  return (
    <Card className="shadow-apple">
      <CardContent className="p-6">
        <h3 className="text-sm font-medium mb-4">学习热力图</h3>
        <div className="flex gap-1 flex-wrap">
          {data.map((day, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-sm ${getColorClass(day.count)}`}
              title={`${day.date}: ${day.count} 题`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
          <span>少</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 rounded-sm bg-gray-100" />
            <div className="w-3 h-3 rounded-sm bg-green-200" />
            <div className="w-3 h-3 rounded-sm bg-green-300" />
            <div className="w-3 h-3 rounded-sm bg-green-400" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
          </div>
          <span>多</span>
        </div>
      </CardContent>
    </Card>
  );
}
