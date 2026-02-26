'use client';

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface WeakKnowledgePointsProps {
  data: { tag: string; count: number; trend?: 'up' | 'down' | 'stable' }[];
}

export function WeakKnowledgePoints({ data }: WeakKnowledgePointsProps) {
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />;
      case 'stable':
        return <Minus className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  return (
    <Card className="shadow-apple">
      <CardContent className="p-6">
        <h3 className="text-sm font-medium mb-4">薄弱知识点</h3>
        <div className="space-y-3">
          {data.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground w-6">
                  {index + 1}
                </span>
                <span className="text-sm font-medium">{item.tag}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {item.count} 题
                </span>
                {getTrendIcon(item.trend)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
