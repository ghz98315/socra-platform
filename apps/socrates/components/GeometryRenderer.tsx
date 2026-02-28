// =====================================================
// Project Socrates - Geometry Renderer Component
// 几何图形渲染组件：使用JSXGraph自动绘制几何图形
// =====================================================

'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Hexagon, RefreshCw, Maximize2, Download } from 'lucide-react';

// 几何图形数据结构
export interface GeometryData {
  type: 'triangle' | 'quadrilateral' | 'circle' | 'line' | 'angle' | 'composite' | 'unknown';
  points: PointData[];
  lines: LineData[];
  circles: CircleData[];
  angles: AngleData[];
  labels: LabelData[];
  relations: RelationData[];
  confidence: number;
}

export interface PointData {
  id: string;
  name: string;
  x: number;
  y: number;
}

export interface LineData {
  id: string;
  start: string;
  end: string;
  type: 'line' | 'segment' | 'ray';
}

export interface CircleData {
  id: string;
  center: string;
  radius?: number;
  pointOnCircle?: string;
}

export interface AngleData {
  id: string;
  vertex: string;
  point1: string;
  point2: string;
  value?: number;
  showArc: boolean;
}

export interface LabelData {
  targetId: string;
  text: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export interface RelationData {
  type: 'perpendicular' | 'parallel' | 'congruent' | 'similar' | 'tangent';
  targets: string[];
}

interface GeometryRendererProps {
  geometryData: GeometryData | null;
  rawText?: string;
  className?: string;
  height?: number;
  onRedraw?: () => void;
}

// 默认的示例三角形数据
const DEFAULT_TRIANGLE: GeometryData = {
  type: 'triangle',
  points: [
    { id: 'A', name: 'A', x: 0, y: 4 },
    { id: 'B', name: 'B', x: -3, y: -2 },
    { id: 'C', name: 'C', x: 3, y: -2 },
  ],
  lines: [
    { id: 'AB', start: 'A', end: 'B', type: 'segment' },
    { id: 'BC', start: 'B', end: 'C', type: 'segment' },
    { id: 'CA', start: 'C', end: 'A', type: 'segment' },
  ],
  circles: [],
  angles: [
    { id: 'angleA', vertex: 'A', point1: 'B', point2: 'C', showArc: true },
    { id: 'angleB', vertex: 'B', point1: 'A', point2: 'C', showArc: true },
    { id: 'angleC', vertex: 'C', point1: 'A', point2: 'B', showArc: true },
  ],
  labels: [
    { targetId: 'A', text: 'A', position: 'top' },
    { targetId: 'B', text: 'B', position: 'bottom' },
    { targetId: 'C', text: 'C', position: 'bottom' },
  ],
  relations: [],
  confidence: 0.8,
};

export function GeometryRenderer({
  geometryData,
  rawText,
  className,
  height = 300,
  onRedraw,
}: GeometryRendererProps) {
  const boardRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [JXG, setJXG] = useState<any>(null);

  // 确保只在客户端渲染并动态加载 JSXGraph
  useEffect(() => {
    setIsClient(true);
    // 动态导入 JSXGraph
    import('jsxgraph').then((module) => {
      setJXG(module.default || module);
    }).catch((err) => {
      console.error('Failed to load JSXGraph:', err);
      setError('图形库加载失败');
    });
  }, []);

  // 绘制几何图形
  useEffect(() => {
    if (!isClient || !containerRef.current || !JXG) return;

    // 清除之前的画板
    if (boardRef.current) {
      JXG.JSXGraph.freeBoard(boardRef.current);
      boardRef.current = null;
    }

    setError(null);

    try {
      const data = geometryData || DEFAULT_TRIANGLE;

      // 计算边界
      const allPoints = data.points;
      let minX = -5, maxX = 5, minY = -5, maxY = 5;

      if (allPoints.length > 0) {
        minX = Math.min(...allPoints.map(p => p.x)) - 2;
        maxX = Math.max(...allPoints.map(p => p.x)) + 2;
        minY = Math.min(...allPoints.map(p => p.y)) - 2;
        maxY = Math.max(...allPoints.map(p => p.y)) + 2;
      }

      // 创建画板
      const board = JXG.JSXGraph.initBoard(containerRef.current, {
        boundingbox: [minX, maxY, maxX, minY],
        axis: true,
        grid: true,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: true,
        pan: { enabled: true },
        zoom: { enabled: true },
      });

      boardRef.current = board;

      // 存储创建的元素
      const elements: Record<string, any> = {};

      // 绘制点
      data.points.forEach(point => {
        elements[point.id] = board.create('point', [point.x, point.y], {
          name: point.name,
          size: 4,
          color: '#3b82f6',
          fixed: false,
          withLabel: true,
        });
      });

      // 绘制线段
      data.lines.forEach(line => {
        const start = elements[line.start];
        const end = elements[line.end];
        if (start && end) {
          if (line.type === 'segment') {
            elements[line.id] = board.create('segment', [start, end], {
              strokeColor: '#1e40af',
              strokeWidth: 2,
            });
          } else if (line.type === 'line') {
            elements[line.id] = board.create('line', [start, end], {
              strokeColor: '#1e40af',
              strokeWidth: 2,
              straightFirst: true,
              straightLast: true,
            });
          } else if (line.type === 'ray') {
            elements[line.id] = board.create('ray', [start, end], {
              strokeColor: '#1e40af',
              strokeWidth: 2,
            });
          }
        }
      });

      // 绘制圆
      data.circles.forEach(circle => {
        const center = elements[circle.center];
        if (center) {
          if (circle.radius !== undefined) {
            elements[circle.id] = board.create('circle', [center, circle.radius], {
              strokeColor: '#7c3aed',
              strokeWidth: 2,
              fillColor: 'transparent',
            });
          } else if (circle.pointOnCircle && elements[circle.pointOnCircle]) {
            elements[circle.id] = board.create('circle', [center, elements[circle.pointOnCircle]], {
              strokeColor: '#7c3aed',
              strokeWidth: 2,
              fillColor: 'transparent',
            });
          }
        }
      });

      // 绘制角度弧
      data.angles.forEach(angle => {
        const vertex = elements[angle.vertex];
        const p1 = elements[angle.point1];
        const p2 = elements[angle.point2];
        if (vertex && p1 && p2 && angle.showArc) {
          board.create('angle', [p1, vertex, p2], {
            radius: 0.8,
            fillColor: '#fbbf24',
            fillOpacity: 0.3,
            strokeColor: '#f59e0b',
            strokeWidth: 1,
            name: angle.value ? `${angle.value}°` : '',
          });
        }
      });

      // 绘制关系标记
      data.relations.forEach(relation => {
        if (relation.type === 'perpendicular' && relation.targets.length >= 2) {
          const line1 = elements[relation.targets[0]];
          const line2 = elements[relation.targets[1]];
          if (line1 && line2) {
            // 添加垂直标记
            const intersection = board.create('intersection', [line1, line2], {
              visible: false,
            });
            if (intersection) {
              board.create('angle', [line1.point1, intersection, line2.point1], {
                radius: 0.4,
                fillColor: '#22c55e',
                fillOpacity: 0.5,
                strokeColor: '#16a34a',
                name: '∟',
              });
            }
          }
        }

        if (relation.type === 'parallel' && relation.targets.length >= 2) {
          // 平行标记通过线段上的箭头表示
          // JSXGraph 不直接支持，可以用文本标记
        }
      });

    } catch (err: any) {
      console.error('Geometry render error:', err);
      setError(err.message || '图形渲染失败');
    }

    return () => {
      if (boardRef.current && JXG) {
        JXG.JSXGraph.freeBoard(boardRef.current);
        boardRef.current = null;
      }
    };
  }, [geometryData, isClient]);

  // 导出为图片
  const handleExportImage = () => {
    if (!boardRef.current || !JXG || !isClient) return;

    const svg = boardRef.current.renderer.svgRoot;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'geometry.svg';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={cn("border-border/50", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Hexagon className="w-4 h-4 text-purple-500" />
            几何图形
            {geometryData && (
              <Badge variant="outline" className="text-xs">
                {geometryData.type === 'triangle' ? '三角形' :
                 geometryData.type === 'quadrilateral' ? '四边形' :
                 geometryData.type === 'circle' ? '圆' :
                 geometryData.type === 'composite' ? '组合图形' : '几何图'}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            {onRedraw && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedraw}
                className="h-7 px-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-7 px-2"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportImage}
              className="h-7 px-2"
            >
              <Download className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!isClient || !JXG ? (
          <div
            className="w-full bg-slate-50 dark:bg-slate-900 rounded-lg border border-border/30 flex items-center justify-center"
            style={{ height }}
          >
            <span className="text-sm text-muted-foreground">加载图形组件...</span>
          </div>
        ) : (
          <div
            ref={containerRef}
            className={cn(
              "w-full bg-slate-50 dark:bg-slate-900 rounded-lg border border-border/30",
              isFullscreen && "fixed inset-4 z-50"
            )}
            style={{ height: isFullscreen ? 'calc(100vh - 2rem)' : height }}
            id="jxgbox"
          />
        )}

        {error && (
          <p className="text-sm text-destructive mt-2">{error}</p>
        )}

        {!geometryData && rawText && (
          <p className="text-xs text-muted-foreground mt-2">
            正在根据题目内容自动生成图形...
          </p>
        )}

        {geometryData && geometryData.confidence < 0.7 && (
          <p className="text-xs text-amber-600 mt-2">
            图形识别置信度较低，请检查是否正确
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default GeometryRenderer;
