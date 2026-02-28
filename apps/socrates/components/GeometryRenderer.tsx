// =====================================================
// Project Socrates - Geometry Renderer Component
// 几何图形渲染组件：使用JSXGraph自动绘制几何图形
// =====================================================

'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Hexagon, RefreshCw, Maximize2, Download, PenLine, X, Plus, MapPin } from 'lucide-react';

// 几何图形数据结构
export interface GeometryData {
  type: 'triangle' | 'quadrilateral' | 'circle' | 'line' | 'angle' | 'function' | 'composite' | 'unknown';
  points: PointData[];
  lines: LineData[];
  circles: CircleData[];
  curves: CurveData[];
  angles: AngleData[];
  labels: LabelData[];
  relations: RelationData[];
  conditions?: ConditionData;
  confidence: number;
}

export interface ConditionData {
  lengths?: string[];
  angles?: string[];
  ratios?: string[];
  parallels?: string[];
  perpendiculars?: string[];
  midpoints?: string[];
  tangents?: string[];
  intersections?: string[];
  functions?: string[];
  others?: string[];
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

export interface CurveData {
  id: string;
  type: 'inverse_proportional' | 'linear' | 'quadratic' | 'exponential';
  equation: string;
  parameter?: number;
  pointsOnCurve?: string[];
  xRange?: [number, number];
  color?: string;
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

// 暴露给父组件的方法
export interface GeometryRendererRef {
  getSVGContent: () => string | null;
  getGeometryData: () => GeometryData | null;
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
  curves: [],
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

export const GeometryRenderer = forwardRef<GeometryRendererRef, GeometryRendererProps>(function GeometryRenderer({
  geometryData,
  rawText,
  className,
  height = 300,
  onRedraw,
}, ref) {
  const boardRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [JXG, setJXG] = useState<any>(null);

  // 辅助线相关状态
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<string[]>([]);
  const [auxiliaryLines, setAuxiliaryLines] = useState<Array<{ start: string; end: string; element: any }>>([]);
  const elementsRef = useRef<Record<string, any>>({});

  // 自定义点相关状态
  const [isAddingPoint, setIsAddingPoint] = useState(false);
  const [customPoints, setCustomPoints] = useState<Array<{ id: string; name: string; x: number; y: number; element: any }>>([]);
  const customPointCounterRef = useRef(0);
  const isAddingPointRef = useRef(false); // 用于在useEffect中访问最新状态

  // 确保只在客户端渲染并动态加载 JSXGraph
  useEffect(() => {
    setIsClient(true);
    // 动态导入 JSXGraph
    import('jsxgraph').then((module) => {
      // JSXGraph 导出的是 CommonJS 模块
      const jsxgraph = module.default || module;
      console.log('JSXGraph loaded:', !!jsxgraph, !!jsxgraph?.JSXGraph);
      setJXG(jsxgraph);
    }).catch((err) => {
      console.error('Failed to load JSXGraph:', err);
      setError('图形库加载失败');
    });
  }, []);

  // 同步 isAddingPoint 状态到 ref
  useEffect(() => {
    isAddingPointRef.current = isAddingPoint;
  }, [isAddingPoint]);

  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    getSVGContent: () => {
      if (!boardRef.current || !JXG || !isClient) return null;
      try {
        const svg = boardRef.current.renderer.svgRoot;
        if (!svg) return null;
        const serializer = new XMLSerializer();
        return serializer.serializeToString(svg);
      } catch (e) {
        console.error('Error getting SVG content:', e);
        return null;
      }
    },
    getGeometryData: () => {
      return geometryData;
    },
  }), [JXG, isClient, geometryData]);

  // 绘制几何图形
  useEffect(() => {
    if (!isClient || !containerRef.current || !JXG) {
      console.log('Geometry render skipped:', { isClient, hasContainer: !!containerRef.current, hasJXG: !!JXG });
      return;
    }

    console.log('Rendering geometry:', geometryData);

    // 清除之前的画板
    if (boardRef.current) {
      try {
        JXG.JSXGraph.freeBoard(boardRef.current);
      } catch (e) {
        console.warn('Error freeing board:', e);
      }
      boardRef.current = null;
    }

    setError(null);

    try {
      const data = geometryData || DEFAULT_TRIANGLE;
      console.log('Using data:', data.type, data.points.length, 'points');

      // 计算边界
      const allPoints = data.points;
      let minX = -5, maxX = 5, minY = -5, maxY = 5;

      if (allPoints.length > 0) {
        minX = Math.min(...allPoints.map(p => p.x)) - 2;
        maxX = Math.max(...allPoints.map(p => p.x)) + 2;
        minY = Math.min(...allPoints.map(p => p.y)) - 2;
        maxY = Math.max(...allPoints.map(p => p.y)) + 2;
      }

      // 创建画板 - 注意 boundingbox 格式为 [x左, y上, x右, y下]
      const board = JXG.JSXGraph.initBoard(containerRef.current, {
        boundingbox: [minX, maxY, maxX, minY],  // [left, top, right, bottom]
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
      elementsRef.current = elements;

      // 收集所有线段用于点吸附
      const lineSegments: any[] = [];

      // 绘制点（启用吸附功能）
      data.points.forEach(point => {
        // 注意：JSXGraph Y轴向上，可能需要调整
        const pointElement = board.create('point', [point.x, point.y], {
          name: point.name,
          size: 4,
          color: '#3b82f6',
          fixed: false,
          withLabel: true,
          snapToGrid: true,
          snapSizeX: 0.5,
          snapSizeY: 0.5,
        });
        elements[point.id] = pointElement;
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

      // 绘制函数曲线
      if (data.curves && data.curves.length > 0) {
        data.curves.forEach(curve => {
          const curveColor = curve.color || '#22c55e'; // 默认绿色

          if (curve.type === 'inverse_proportional' && curve.parameter) {
            const k = curve.parameter;
            const xMin = curve.xRange?.[0] || 0.1;
            const xMax = curve.xRange?.[1] || 10;

            // 绘制 y = k/x 曲线（x > 0 分支）
            board.create('functiongraph', [
              function(x: number) {
                if (x > 0.05) return k / x;
                return NaN;
              }
            ], {
              strokeColor: curveColor,
              strokeWidth: 2.5,
              highlight: false,
            });

            // 绘制 y = k/x 曲线（x < 0 分支）
            board.create('functiongraph', [
              function(x: number) {
                if (x < -0.05) return k / x;
                return NaN;
              }
            ], {
              strokeColor: curveColor,
              strokeWidth: 2.5,
              highlight: false,
            });

            // 添加函数标签
            board.create('text', [xMax * 0.6, k / (xMax * 0.6) + 0.5, `y=${k}/x`], {
              fontSize: 14,
              color: curveColor,
              anchorX: 'left',
              anchorY: 'bottom',
            });
          }
        });
      }

      // 绘制角度弧 - 特殊处理直角
      data.angles.forEach(angle => {
        const vertex = elements[angle.vertex];
        const p1 = elements[angle.point1];
        const p2 = elements[angle.point2];
        if (vertex && p1 && p2 && angle.showArc) {
          const isRightAngle = angle.value === 90;

          if (isRightAngle) {
            // 直角使用特殊的正方形标记
            board.create('angle', [p1, vertex, p2], {
              radius: 0.5,
              fillColor: '#22c55e',
              fillOpacity: 0.4,
              strokeColor: '#16a34a',
              strokeWidth: 1.5,
              name: '',
              orthoSensitivity: 0,  // 精确90度
            });
          } else {
            board.create('angle', [p1, vertex, p2], {
              radius: 0.8,
              fillColor: '#fbbf24',
              fillOpacity: 0.3,
              strokeColor: '#f59e0b',
              strokeWidth: 1,
              name: angle.value ? `${angle.value}°` : '',
            });
          }
        }
      });

      // 绘制关系标记 - 垂直关系自动添加直角符号
      data.relations.forEach(relation => {
        if (relation.type === 'perpendicular' && relation.targets.length >= 2) {
          const line1 = elements[relation.targets[0]];
          const line2 = elements[relation.targets[1]];
          if (line1 && line2) {
            // 添加垂直标记（直角符号）
            const intersection = board.create('intersection', [line1, line2], {
              visible: false,
            });
            if (intersection) {
              // 直角符号 - 使用正方形标记
              board.create('angle', [line1.point1, intersection, line2.point1], {
                radius: 0.5,
                fillColor: '#22c55e',
                fillOpacity: 0.4,
                strokeColor: '#16a34a',
                strokeWidth: 1.5,
                name: '',
              });
            }
          }
        }

        if (relation.type === 'parallel' && relation.targets.length >= 2) {
          // 平行标记通过线段上的箭头表示
          // JSXGraph 不直接支持，可以用文本标记
        }
      });

      // 添加画板点击事件处理（用于添加自定义点）
      board.on('down', function(evt: any) {
        console.log('Board down event triggered, isAddingPoint:', isAddingPointRef.current);
        if (!isAddingPointRef.current) return;

        try {
          // 获取点击位置的数学坐标
          let x, y;

          // 使用 board 的内部方法获取坐标
          // JSXGraph 在 'down' 事件中会更新 board.mouse 属性
          if (board.mouse && board.mouse.usrCoords) {
            x = board.mouse.usrCoords[1];
            y = board.mouse.usrCoords[2];
            console.log('Got coords from board.mouse:', x, y);
          } else {
            // 备选方案：从事件中获取屏幕坐标并转换
            const container = document.getElementById('jxgbox');
            if (container && evt) {
              const rect = container.getBoundingClientRect();
              let clientX, clientY;

              // 尝试多种方式获取客户端坐标
              if (evt.clientX !== undefined) {
                clientX = evt.clientX;
                clientY = evt.clientY;
              } else if (evt.originalEvent && evt.originalEvent.clientX !== undefined) {
                clientX = evt.originalEvent.clientX;
                clientY = evt.originalEvent.clientY;
              } else if (window.event) {
                const winEvt = window.event as any;
                clientX = winEvt.clientX;
                clientY = winEvt.clientY;
              }

              if (clientX !== undefined && clientY !== undefined) {
                const relX = clientX - rect.left;
                const relY = clientY - rect.top;

                // 使用 JSXGraph 的坐标转换
                const [ux, uy] = board.getUsrCoords(relX, relY);
                x = ux;
                y = uy;
                console.log('Got coords from getUsrCoords:', x, y);
              }
            }
          }

          if (x !== undefined && y !== undefined && !isNaN(x) && !isNaN(y)) {
            console.log('Creating point at:', x, y);

            // 创建自定义点
            customPointCounterRef.current += 1;
            const pointId = `custom_${customPointCounterRef.current}`;
            const pointName = `P${customPointCounterRef.current}`;

            const pointElement = board.create('point', [x, y], {
              name: pointName,
              size: 4,
              color: '#f97316',
              fixed: false,
              withLabel: true,
              snapToGrid: true,
              snapSizeX: 0.5,
              snapSizeY: 0.5,
            });

            // 存储到elementsRef以便后续引用
            elements[pointId] = pointElement;
            elementsRef.current[pointId] = pointElement;

            setCustomPoints(prev => [...prev, {
              id: pointId,
              name: pointName,
              x,
              y,
              element: pointElement
            }]);

            console.log('Point created successfully:', pointName);
          } else {
            console.log('Could not get valid coordinates');
          }
        } catch (err) {
          console.error('Error creating point:', err);
        }
      });

    } catch (err: any) {
      console.error('Geometry render error:', err);
      setError(err.message || '图形渲染失败');
    }

    return () => {
      if (boardRef.current && JXG) {
        try {
          JXG.JSXGraph.freeBoard(boardRef.current);
        } catch (e) {
          console.warn('Error in cleanup:', e);
        }
        boardRef.current = null;
      }
    };
  }, [geometryData, isClient, JXG]);

  // 添加辅助线
  const handleAddAuxiliaryLine = (startId: string, endId: string) => {
    if (!boardRef.current || !elementsRef.current[startId] || !elementsRef.current[endId]) return;

    const start = elementsRef.current[startId];
    const end = elementsRef.current[endId];

    const line = boardRef.current.create('segment', [start, end], {
      strokeColor: '#f97316',
      strokeWidth: 2,
      dash: 2, // 虚线
      name: `辅助线 ${startId}-${endId}`,
    });

    setAuxiliaryLines(prev => [...prev, { start: startId, end: endId, element: line }]);
  };

  // 移除最后一条辅助线
  const handleRemoveLastAuxiliaryLine = () => {
    if (auxiliaryLines.length === 0 || !boardRef.current) return;

    const lastLine = auxiliaryLines[auxiliaryLines.length - 1];
    try {
      boardRef.current.removeObject(lastLine.element);
    } catch (e) {
      console.warn('Error removing auxiliary line:', e);
    }

    setAuxiliaryLines(prev => prev.slice(0, -1));
  };

  // 清除所有辅助线
  const handleClearAuxiliaryLines = () => {
    if (!boardRef.current) return;

    auxiliaryLines.forEach(line => {
      try {
        boardRef.current.removeObject(line.element);
      } catch (e) {
        console.warn('Error removing auxiliary line:', e);
      }
    });

    setAuxiliaryLines([]);
  };

  // 处理点选择（用于绘制辅助线）
  const handlePointSelect = (pointId: string) => {
    const newSelected = [...selectedPoints, pointId];

    if (newSelected.length === 2) {
      // 两个点都被选中，绘制辅助线
      if (newSelected[0] !== newSelected[1]) {
        handleAddAuxiliaryLine(newSelected[0], newSelected[1]);
      }
      setSelectedPoints([]);
    } else {
      setSelectedPoints(newSelected);
    }
  };

  // 添加自定义点
  const handleAddCustomPoint = (x: number, y: number) => {
    if (!boardRef.current) return;

    customPointCounterRef.current += 1;
    const pointId = `custom_${customPointCounterRef.current}`;
    const pointName = `P${customPointCounterRef.current}`;

    const pointElement = boardRef.current.create('point', [x, y], {
      name: pointName,
      size: 4,
      color: '#f97316', // 橙色，区别于蓝色原始点
      fixed: false,
      withLabel: true,
      snapToGrid: true,
      snapSizeX: 0.5,
      snapSizeY: 0.5,
    });

    // 存储到elementsRef以便后续引用
    elementsRef.current[pointId] = pointElement;

    setCustomPoints(prev => [...prev, {
      id: pointId,
      name: pointName,
      x,
      y,
      element: pointElement
    }]);
  };

  // 删除最后一个自定义点
  const handleRemoveLastCustomPoint = () => {
    if (customPoints.length === 0 || !boardRef.current) return;

    const lastPoint = customPoints[customPoints.length - 1];
    try {
      boardRef.current.removeObject(lastPoint.element);
      delete elementsRef.current[lastPoint.id];
    } catch (e) {
      console.warn('Error removing custom point:', e);
    }

    setCustomPoints(prev => prev.slice(0, -1));
  };

  // 清除所有自定义点
  const handleClearCustomPoints = () => {
    if (!boardRef.current) return;

    customPoints.forEach(point => {
      try {
        boardRef.current.removeObject(point.element);
        delete elementsRef.current[point.id];
      } catch (e) {
        console.warn('Error removing custom point:', e);
      }
    });

    setCustomPoints([]);
    customPointCounterRef.current = 0;
  };

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
                 geometryData.type === 'function' ? '函数图象' :
                 geometryData.type === 'composite' ? '组合图形' : '几何图'}
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-1">
            {/* 添加点模式按钮 */}
            <Button
              variant={isAddingPoint ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setIsAddingPoint(!isAddingPoint);
                setIsDrawingMode(false);
              }}
              className={cn("h-7 px-2", isAddingPoint && "bg-green-500 hover:bg-green-600")}
              title="添加自定义点"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            {customPoints.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLastCustomPoint}
                  className="h-7 px-2 text-xs"
                  title="删除最后一个点"
                >
                  <X className="w-3 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearCustomPoints}
                  className="h-7 px-2 text-xs"
                  title="清除所有自定义点"
                >
                  清除点
                </Button>
              </>
            )}
            {/* 辅助线模式按钮 */}
            <Button
              variant={isDrawingMode ? 'default' : 'ghost'}
              size="sm"
              onClick={() => {
                setIsDrawingMode(!isDrawingMode);
                setSelectedPoints([]);
              }}
              className={cn("h-7 px-2", isDrawingMode && "bg-orange-500 hover:bg-orange-600")}
              title="添加辅助线"
            >
              <PenLine className="w-3.5 h-3.5" />
            </Button>
            {auxiliaryLines.length > 0 && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLastAuxiliaryLine}
                  className="h-7 px-2 text-xs"
                  title="撤销最后一条辅助线"
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAuxiliaryLines}
                  className="h-7 px-2 text-xs"
                  title="清除所有辅助线"
                >
                  清除
                </Button>
              </>
            )}
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
              isFullscreen && "fixed inset-4 z-50",
              isAddingPoint && "cursor-crosshair"
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

        {/* 添加点模式提示 */}
        {isAddingPoint && (
          <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-xs text-green-700 dark:text-green-400 mb-2">
              <MapPin className="w-3 h-3 inline mr-1" />
              添加点模式：点击图板任意位置添加新点（可拖动）
            </p>
            {customPoints.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-green-600 dark:text-green-400">已添加：</span>
                {customPoints.map((point) => (
                  <Badge key={point.id} variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                    {point.name} ({point.x.toFixed(1)}, {point.y.toFixed(1)})
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 辅助线绘制模式提示 */}
        {isDrawingMode && geometryData && (
          <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <p className="text-xs text-orange-700 dark:text-orange-400 mb-2">
              辅助线模式：点击选择两个点来添加虚线辅助线
            </p>
            <div className="flex flex-wrap gap-1">
              {/* 原始点 */}
              {geometryData.points?.map((point: PointData) => (
                <Button
                  key={point.id}
                  variant={selectedPoints.includes(point.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePointSelect(point.id)}
                  className={cn(
                    "h-6 px-2 text-xs",
                    selectedPoints.includes(point.id) && "bg-orange-500 hover:bg-orange-600"
                  )}
                >
                  {point.name}
                </Button>
              ))}
              {/* 自定义点 */}
              {customPoints.map((point) => (
                <Button
                  key={point.id}
                  variant={selectedPoints.includes(point.id) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePointSelect(point.id)}
                  className={cn(
                    "h-6 px-2 text-xs border-orange-300",
                    selectedPoints.includes(point.id) && "bg-orange-500 hover:bg-orange-600"
                  )}
                >
                  <span className="text-orange-600">{point.name}</span>
                </Button>
              ))}
            </div>
            {selectedPoints.length > 0 && (
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                已选择: {selectedPoints.join(' → ')} {selectedPoints.length === 1 && '(请再选择一个点)'}
              </p>
            )}
          </div>
        )}

        {/* 自定义点统计 */}
        {customPoints.length > 0 && !isAddingPoint && (
          <p className="text-xs text-muted-foreground mt-2">
            已添加 {customPoints.length} 个自定义点 ({customPoints.map(p => p.name).join(', ')})
          </p>
        )}

        {/* 辅助线统计 */}
        {auxiliaryLines.length > 0 && !isDrawingMode && (
          <p className="text-xs text-muted-foreground mt-2">
            已添加 {auxiliaryLines.length} 条辅助线
          </p>
        )}

        {/* 函数曲线显示 */}
        {geometryData?.curves && geometryData.curves.length > 0 && (
          <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-2">
              函数曲线
            </p>
            <div className="flex flex-wrap gap-1">
              {geometryData.curves.map((curve, i) => (
                <Badge key={`curve-${i}`} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                  {curve.type === 'inverse_proportional' ? '反比例函数' :
                   curve.type === 'linear' ? '一次函数' :
                   curve.type === 'quadratic' ? '二次函数' :
                   curve.type === 'exponential' ? '指数函数' : curve.type}
                  : {curve.equation}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 已知条件展示 */}
        {geometryData?.conditions && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
              已知条件
            </p>
            <div className="flex flex-wrap gap-1">
              {geometryData.conditions.lengths?.map((c, i) => (
                <Badge key={`len-${i}`} variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400">
                  {c}
                </Badge>
              ))}
              {geometryData.conditions.angles?.map((c, i) => (
                <Badge key={`ang-${i}`} variant="secondary" className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">
                  {c}
                </Badge>
              ))}
              {geometryData.conditions.ratios?.map((c, i) => (
                <Badge key={`rat-${i}`} variant="secondary" className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400">
                  {c}
                </Badge>
              ))}
              {geometryData.conditions.parallels?.map((c, i) => (
                <Badge key={`par-${i}`} variant="secondary" className="text-xs bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-400">
                  {c}
                </Badge>
              ))}
              {geometryData.conditions.perpendiculars?.map((c, i) => (
                <Badge key={`per-${i}`} variant="secondary" className="text-xs bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">
                  {c}
                </Badge>
              ))}
              {geometryData.conditions.midpoints?.map((c, i) => (
                <Badge key={`mid-${i}`} variant="secondary" className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400">
                  {c}
                </Badge>
              ))}
              {geometryData.conditions.tangents?.map((c, i) => (
                <Badge key={`tan-${i}`} variant="secondary" className="text-xs bg-pink-100 text-pink-700 dark:bg-pink-900/50 dark:text-pink-400">
                  {c}
                </Badge>
              ))}
              {geometryData.conditions.intersections?.map((c, i) => (
                <Badge key={`int-${i}`} variant="secondary" className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-400">
                  {c}
                </Badge>
              ))}
              {geometryData.conditions.functions?.map((c, i) => (
                <Badge key={`fun-${i}`} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">
                  {c}
                </Badge>
              ))}
              {geometryData.conditions.others?.map((c, i) => (
                <Badge key={`oth-${i}`} variant="secondary" className="text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  {c}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 关系列表 */}
        {geometryData?.relations && geometryData.relations.length > 0 && (
          <div className="mt-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700">
            <p className="text-xs text-muted-foreground mb-1">图形关系：</p>
            <div className="flex flex-wrap gap-1">
              {geometryData.relations.map((rel, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {rel.type === 'perpendicular' ? '⊥' :
                   rel.type === 'parallel' ? '//' :
                   rel.type === 'congruent' ? '≌' :
                   rel.type === 'similar' ? '∽' :
                   rel.type === 'tangent' ? '切' :
                   rel.type === 'intersect' ? '∩' :
                   rel.type === 'midpoint' ? '中点' :
                   rel.type === 'bisect' ? '平分' : rel.type}
                  {' '}
                  {rel.targets.join(', ')}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
