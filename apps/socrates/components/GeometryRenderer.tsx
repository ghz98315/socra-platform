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
  size?: number; // 正方形边长（默认扩大到500）
  onRedraw?: () => void;
  onGeometryChange?: (data: GeometryData) => void; // 几何数据变化回调
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
  size = 500, // 扩大画板尺寸
  onRedraw,
  onGeometryChange,
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
  const onGeometryChangeRef = useRef(onGeometryChange); // 用于在useEffect中访问最新回调

  // 同步 onGeometryChange 到 ref
  useEffect(() => {
    onGeometryChangeRef.current = onGeometryChange;
  }, [onGeometryChange]);

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

  // 获取当前完整的几何数据（包含用户修改）
  const getCurrentGeometryData = (): GeometryData | null => {
    if (!geometryData) return null;

    // 构建包含用户修改的完整数据
    const updatedData: GeometryData = {
      ...geometryData,
      // 添加自定义点到顶点列表
      points: [
        ...geometryData.points,
        ...customPoints.map(p => ({
          id: p.id,
          name: p.name,
          x: p.x,
          y: p.y,
        })),
      ],
      // 添加辅助线到线段列表
      lines: [
        ...geometryData.lines,
        ...auxiliaryLines.map(line => ({
          id: `aux_${line.start}_${line.end}`,
          start: line.start,
          end: line.end,
          type: 'segment' as const,
        })),
      ],
    };

    // 更新原始点的坐标（如果用户拖动了）
    if (boardRef.current && elementsRef.current) {
      updatedData.points = updatedData.points.map(point => {
        const element = elementsRef.current[point.id];
        if (element && typeof element.X === 'function' && typeof element.Y === 'function') {
          try {
            const newX = element.X();
            const newY = element.Y();
            if (isFinite(newX) && isFinite(newY)) {
              return { ...point, x: newX, y: newY };
            }
          } catch (e) {
            // 保持原坐标
          }
        }
        return point;
      });
    }

    return updatedData;
  };

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
      return getCurrentGeometryData();
    },
  }), [JXG, isClient, geometryData, customPoints, auxiliaryLines]);

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

      // 计算边界 - 扩大默认范围以适应更多图形
      const allPoints = data.points;
      let minX = -6, maxX = 6, minY = -6, maxY = 6; // 扩大默认边界

      if (allPoints.length > 0) {
        const pointMinX = Math.min(...allPoints.map(p => p.x));
        const pointMaxX = Math.max(...allPoints.map(p => p.x));
        const pointMinY = Math.min(...allPoints.map(p => p.y));
        const pointMaxY = Math.max(...allPoints.map(p => p.y));

        // 计算需要的范围，并添加边距
        const rangeX = pointMaxX - pointMinX;
        const rangeY = pointMaxY - pointMinY;
        const maxRange = Math.max(rangeX, rangeY, 10); // 至少10个单位的范围
        const padding = maxRange * 0.3; // 30% 的边距

        // 计算中心点
        const centerX = (pointMinX + pointMaxX) / 2;
        const centerY = (pointMinY + pointMaxY) / 2;

        // 确保是正方形区域（保持纵横比）
        const halfRange = maxRange / 2 + padding;
        minX = centerX - halfRange;
        maxX = centerX + halfRange;
        minY = centerY - halfRange;
        maxY = centerY + halfRange;
      }

      // 创建画板 - 注意 boundingbox 格式为 [x左, y上, x右, y下]
      const board = JXG.JSXGraph.initBoard(containerRef.current, {
        boundingbox: [minX, maxY, maxX, minY],  // [left, top, right, bottom]
        axis: true,
        grid: true,
        showNavigation: false,
        showCopyright: false,
        keepAspectRatio: true, // 保持纵横比为1（正方形）
        pan: { enabled: true, needShift: false },
        zoom: { enabled: true, pinchHorizontal: false, pinchVertical: false },
      });

      boardRef.current = board;

      // 存储创建的元素
      const elements: Record<string, any> = {};
      elementsRef.current = elements;

      // 收集所有线段用于点吸附
      const lineSegments: any[] = [];

      // 绘制线段（先绘制线段，以便点可以吸附）
      data.lines.forEach(line => {
        const start = elements[line.start];
        const end = elements[line.end];
        if (start && end) {
          if (line.type === 'segment') {
            const lineElement = board.create('segment', [start, end], {
              strokeColor: '#1e40af',
              strokeWidth: 2,
            });
            elements[line.id] = lineElement;
            lineSegments.push({ element: lineElement, id: line.id, start: line.start, end: line.end });
          } else if (line.type === 'line') {
            const lineElement = board.create('line', [start, end], {
              strokeColor: '#1e40af',
              strokeWidth: 2,
              straightFirst: true,
              straightLast: true,
            });
            elements[line.id] = lineElement;
            lineSegments.push({ element: lineElement, id: line.id, start: line.start, end: line.end });
          } else if (line.type === 'ray') {
            const lineElement = board.create('ray', [start, end], {
              strokeColor: '#1e40af',
              strokeWidth: 2,
            });
            elements[line.id] = lineElement;
            lineSegments.push({ element: lineElement, id: line.id, start: line.start, end: line.end });
          }
        }
      });

      // 吸附阈值配置
      const SNAP_THRESHOLD = 0.3; // 吸附距离阈值
      const SNAP_GRID_SIZE = 0.05; // 网格吸附精度（更小的值更丝滑）

      // 计算点到线段的最短距离和最近点
      const getPointToLineInfo = (px: number, py: number, lineElement: any): { distance: number; closestX: number; closestY: number } => {
        try {
          const p1 = lineElement.point1 ? [lineElement.point1.X(), lineElement.point1.Y()] : null;
          const p2 = lineElement.point2 ? [lineElement.point2.X(), lineElement.point2.Y()] : null;

          if (!p1 || !p2) return { distance: Infinity, closestX: px, closestY: py };

          const [x1, y1] = p1;
          const [x2, y2] = p2;

          const dx = x2 - x1;
          const dy = y2 - y1;
          const lengthSquared = dx * dx + dy * dy;

          if (lengthSquared === 0) return { distance: Math.sqrt((px - x1) ** 2 + (py - y1) ** 2), closestX: x1, closestY: y1 };

          // 计算投影参数 t
          let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
          t = Math.max(0, Math.min(1, t)); // 限制在线段范围内

          const closestX = x1 + t * dx;
          const closestY = y1 + t * dy;
          const distance = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);

          return { distance, closestX, closestY };
        } catch {
          return { distance: Infinity, closestX: px, closestY: py };
        }
      };

      // 计算两点连线的斜率（用于平行/垂直检测）
      const getSlope = (x1: number, y1: number, x2: number, y2: number): number | null => {
        if (Math.abs(x2 - x1) < 0.001) return null; // 垂直线
        return (y2 - y1) / (x2 - x1);
      };

      // 检查是否接近垂直或水平（用于自动吸附）
      const checkAxisAlignment = (x1: number, y1: number, x2: number, y2: number): { isVertical: boolean; isHorizontal: boolean; snapX?: number; snapY?: number } => {
        const dx = Math.abs(x2 - x1);
        const dy = Math.abs(y2 - y1);

        // 如果接近垂直（dx很小），建议吸附到垂直
        if (dx < SNAP_THRESHOLD && dx < dy) {
          return { isVertical: true, isHorizontal: false, snapX: x1 };
        }
        // 如果接近水平（dy很小），建议吸附到水平
        if (dy < SNAP_THRESHOLD && dy < dx) {
          return { isHorizontal: true, isVertical: false, snapY: y1 };
        }
        return { isVertical: false, isHorizontal: false };
      };

      // 绘制点（启用吸附功能 + 高级吸附逻辑）
      data.points.forEach(point => {
        // 注意：JSXGraph Y轴向上，可能需要调整
        const pointElement = board.create('point', [point.x, point.y], {
          name: point.name,
          size: 4,
          color: '#3b82f6',
          fixed: false,
          withLabel: true,
          snapToGrid: true,
          snapSizeX: SNAP_GRID_SIZE,
          snapSizeY: SNAP_GRID_SIZE,
          // 吸附到点
          attractors: data.points
            .filter(p => p.id !== point.id)
            .map(p => elements[p.id])
            .filter(el => el),
          attractorDistance: 0.3,
          snatchDistance: 0.4,
        });
        elements[point.id] = pointElement;

        // 监听点拖动事件 - 实现线段吸附和特殊关系吸附
        pointElement.on('drag', function() {
          const currentX = pointElement.X();
          const currentY = pointElement.Y();
          let snapX = currentX;
          let snapY = currentY;
          let shouldSnap = false;

          // 1. 检查线段吸附
          for (const lineInfo of lineSegments) {
            // 跳过以当前点为端点的线段
            if (lineInfo.start === point.id || lineInfo.end === point.id) continue;

            const info = getPointToLineInfo(currentX, currentY, lineInfo.element);
            if (info.distance < SNAP_THRESHOLD && info.distance < 0.3) {
              snapX = info.closestX;
              snapY = info.closestY;
              shouldSnap = true;
              console.log(`Point ${point.name} snapping to line ${lineInfo.id}`);
              break;
            }
          }

          // 2. 检查与其他点的垂直/水平关系吸附
          if (!shouldSnap) {
            for (const otherPoint of data.points) {
              if (otherPoint.id === point.id) continue;
              const otherElement = elements[otherPoint.id];
              if (!otherElement) continue;

              const otherX = otherElement.X();
              const otherY = otherElement.Y();
              const axisAlign = checkAxisAlignment(currentX, currentY, otherX, otherY);

              if (axisAlign.isVertical && axisAlign.snapX !== undefined) {
                // 吸附到垂直线
                snapX = axisAlign.snapX;
                shouldSnap = true;
                console.log(`Point ${point.name} snapping to vertical with ${otherPoint.name}`);
                break;
              } else if (axisAlign.isHorizontal && axisAlign.snapY !== undefined) {
                // 吸附到水平线
                snapY = axisAlign.snapY;
                shouldSnap = true;
                console.log(`Point ${point.name} snapping to horizontal with ${otherPoint.name}`);
                break;
              }
            }
          }

          // 应用吸附
          if (shouldSnap) {
            pointElement.setPosition(JXG.COORDS_BY_USER, [snapX, snapY]);
            board.update();
          }
        });

        // 监听点拖动结束事件
        pointElement.on('up', function() {
          console.log(`Point ${point.name} dragged to:`, pointElement.X(), pointElement.Y());
          // 延迟通知以确保坐标更新完成
          setTimeout(() => {
            if (onGeometryChangeRef.current) {
              const currentData = getCurrentGeometryData();
              if (currentData) {
                onGeometryChangeRef.current(currentData);
              }
            }
          }, 50);
        });
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

      // 绘制函数曲线 - 支持拖动移动
      if (data.curves && data.curves.length > 0) {
        data.curves.forEach(curve => {
          const curveColor = curve.color || '#22c55e'; // 默认绿色

          if (curve.type === 'inverse_proportional') {
            // 反比例函数 y = k/(x-x0) + y0
            // x0, y0 是曲线的中心位置（渐近线交点）
            let initialK = curve.parameter || 1;

            // 如果曲线经过某个点，计算 k 值
            if (curve.pointsOnCurve && curve.pointsOnCurve.length > 0) {
              const pointOnCurve = data.points.find(p => p.name === curve.pointsOnCurve![0]);
              if (pointOnCurve && pointOnCurve.x !== 0) {
                initialK = pointOnCurve.x * pointOnCurve.y;
              }
            }

            // 创建曲线中心控制点（可拖动移动整个曲线）
            const centerPoint = board.create('point', [0, 0], {
              name: 'O\'',
              size: 5,
              color: '#ef4444',
              fixed: false,
              withLabel: true,
              snapToGrid: true,
              snapSizeX: 0.1,
              snapSizeY: 0.1,
            });

            // 创建 k 参数控制点
            const kSlider = board.create('point', [1, initialK], {
              name: 'k',
              size: 6,
              color: '#f97316',
              fixed: false,
              withLabel: true,
              snapToGrid: false,
              visible: true,
            });

            // 动态获取参数
            const getK = () => kSlider.Y();
            const getX0 = () => centerPoint.X();
            const getY0 = () => centerPoint.Y();

            // 绘制 y = k/(x-x0) + y0 曲线（x > x0 分支）
            board.create('functiongraph', [
              function(x: number) {
                const k = getK();
                const x0 = getX0();
                const y0 = getY0();
                const dx = x - x0;
                if (dx > 0.05 && Math.abs(k) > 0.01) return y0 + k / dx;
                return NaN;
              }
            ], {
              strokeColor: curveColor,
              strokeWidth: 2.5,
              highlight: false,
            });

            // 绘制 y = k/(x-x0) + y0 曲线（x < x0 分支）
            board.create('functiongraph', [
              function(x: number) {
                const k = getK();
                const x0 = getX0();
                const y0 = getY0();
                const dx = x - x0;
                if (dx < -0.05 && Math.abs(k) > 0.01) return y0 + k / dx;
                return NaN;
              }
            ], {
              strokeColor: curveColor,
              strokeWidth: 2.5,
              highlight: false,
            });

            // 绘制渐近线（虚线）
            board.create('line', [
              [() => getX0(), () => getY0() - 10],
              [() => getX0(), () => getY0() + 10]
            ], {
              strokeColor: '#94a3b8',
              strokeWidth: 1,
              dash: 2,
              straightFirst: true,
              straightLast: true,
            });

            board.create('line', [
              [() => getX0() - 10, () => getY0()],
              [() => getX0() + 10, () => getY0()]
            ], {
              strokeColor: '#94a3b8',
              strokeWidth: 1,
              dash: 2,
              straightFirst: true,
              straightLast: true,
            });

            // 添加动态函数标签
            board.create('text', [() => getX0() + 4, () => getY0() + 3, function() {
              const k = getK();
              const x0 = getX0();
              const y0 = getY0();
              let equation = 'y=';
              if (y0 !== 0) {
                equation += `${y0.toFixed(1)}+`;
              }
              equation += `${k.toFixed(1)}`;
              if (x0 === 0) {
                equation += '/x';
              } else {
                equation += `/(x${x0 > 0 ? '-' : '+'}${Math.abs(x0).toFixed(1)})`;
              }
              return equation;
            }], {
              fontSize: 14,
              color: curveColor,
              anchorX: 'left',
              anchorY: 'bottom',
            });

            // 存储控制点引用
            elements[`center_${curve.id}`] = centerPoint;
            elements[`kSlider_${curve.id}`] = kSlider;
          }

          // 一次函数 y = ax + b
          if (curve.type === 'linear') {
            // 解析方程 y = ax + b
            let a = 1, b = 0;
            const eqMatch = curve.equation?.match(/y\s*=\s*(-?[\d.]*?)x\s*([+-]\s*[\d.]+)?/);
            if (eqMatch) {
              a = parseFloat(eqMatch[1]) || 1;
              if (eqMatch[2]) {
                b = parseFloat(eqMatch[2].replace(/\s/g, '')) || 0;
              }
            }

            // 创建直线上的一个可拖动点
            const linePoint1 = board.create('point', [-4, a * -4 + b], {
              name: 'P1',
              size: 4,
              color: '#3b82f6',
              fixed: false,
              withLabel: true,
              snapToGrid: true,
              snapSizeX: 0.1,
              snapSizeY: 0.1,
            });

            const linePoint2 = board.create('point', [4, a * 4 + b], {
              name: 'P2',
              size: 4,
              color: '#3b82f6',
              fixed: false,
              withLabel: true,
              snapToGrid: true,
              snapSizeX: 0.1,
              snapSizeY: 0.1,
            });

            // 绘制直线
            board.create('line', [linePoint1, linePoint2], {
              strokeColor: curveColor,
              strokeWidth: 2.5,
              straightFirst: true,
              straightLast: true,
            });

            // 添加动态函数标签
            board.create('text', [3, () => linePoint2.Y() + 0.5, function() {
              const x1 = linePoint1.X(), y1 = linePoint1.Y();
              const x2 = linePoint2.X(), y2 = linePoint2.Y();
              if (Math.abs(x2 - x1) < 0.001) return 'x = c'; // 垂直线
              const slope = (y2 - y1) / (x2 - x1);
              const intercept = y1 - slope * x1;
              return `y = ${slope.toFixed(2)}x ${intercept >= 0 ? '+' : ''} ${intercept.toFixed(2)}`;
            }], {
              fontSize: 14,
              color: curveColor,
              anchorX: 'left',
              anchorY: 'bottom',
            });

            elements[`lineP1_${curve.id}`] = linePoint1;
            elements[`lineP2_${curve.id}`] = linePoint2;
          }

          // 二次函数 y = ax² + bx + c
          if (curve.type === 'quadratic') {
            // 默认参数
            let a = 1, b = 0, c = 0;
            const eqMatch = curve.equation?.match(/y\s*=\s*(-?[\d.]*?)x²\s*([+-]\s*[\d.]*?)?x?\s*([+-]\s*[\d.]+)?/);
            if (eqMatch) {
              a = parseFloat(eqMatch[1]) || 1;
              if (eqMatch[2]) {
                b = parseFloat(eqMatch[2].replace(/\s/g, '')) || 0;
              }
              if (eqMatch[3]) {
                c = parseFloat(eqMatch[3].replace(/\s/g, '')) || 0;
              }
            }

            // 创建顶点控制点
            const vertex = board.create('point', [-b/(2*a), c - b*b/(4*a)], {
              name: 'V',
              size: 5,
              color: '#ef4444',
              fixed: false,
              withLabel: true,
              snapToGrid: true,
              snapSizeX: 0.1,
              snapSizeY: 0.1,
            });

            // 创建 a 参数控制点（控制开口方向和大小）
            const aSlider = board.create('point', [0, a], {
              name: 'a',
              size: 6,
              color: '#f97316',
              fixed: false,
              withLabel: true,
              snapToGrid: false,
            });

            // 绘制抛物线
            board.create('functiongraph', [
              function(x: number) {
                const h = vertex.X();
                const k = vertex.Y();
                const aVal = aSlider.Y();
                if (Math.abs(aVal) < 0.01) return NaN;
                return aVal * (x - h) * (x - h) + k;
              }
            ], {
              strokeColor: curveColor,
              strokeWidth: 2.5,
              highlight: false,
            });

            // 添加动态函数标签
            board.create('text', [() => vertex.X() + 2, () => vertex.Y() + 2, function() {
              const h = vertex.X();
              const k = vertex.Y();
              const aVal = aSlider.Y();
              return `y = ${aVal.toFixed(2)}(x${h >= 0 ? '-' : '+'}${Math.abs(h).toFixed(1)})² ${k >= 0 ? '+' : ''} ${k.toFixed(1)}`;
            }], {
              fontSize: 14,
              color: curveColor,
              anchorX: 'left',
              anchorY: 'bottom',
            });

            elements[`vertex_${curve.id}`] = vertex;
            elements[`aSlider_${curve.id}`] = aSlider;
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
          let x: number | undefined, y: number | undefined;

          // 方法1：使用 board.mouse.usrCoords（齐次坐标 [1, x, y]）
          if (board.mouse && board.mouse.usrCoords && board.mouse.usrCoords.length >= 3) {
            x = board.mouse.usrCoords[1];
            y = board.mouse.usrCoords[2];
            console.log('Got coords from board.mouse.usrCoords:', x, y);
          }
          // 方法2：使用事件中的坐标直接获取
          else if (evt && evt.target && typeof board.getCoords === 'function') {
            const coords = board.getCoords(evt);
            if (coords && coords.usrCoords && coords.usrCoords.length >= 3) {
              x = coords.usrCoords[1];
              y = coords.usrCoords[2];
              console.log('Got coords from board.getCoords:', x, y);
            }
          }

          // 方法3：手动计算坐标转换
          if (x === undefined || y === undefined) {
            const container = document.getElementById('jxgbox');
            if (container && evt) {
              const rect = container.getBoundingClientRect();
              let clientX: number | undefined, clientY: number | undefined;

              // 尝试多种方式获取客户端坐标
              if (evt.clientX !== undefined) {
                clientX = evt.clientX;
                clientY = evt.clientY;
              } else if (evt.originalEvent && evt.originalEvent.clientX !== undefined) {
                clientX = evt.originalEvent.clientX;
                clientY = evt.originalEvent.clientY;
              }

              if (clientX !== undefined && clientY !== undefined) {
                const relX = clientX - rect.left;
                const relY = clientY - rect.top;

                // 手动计算坐标转换
                // JSXGraph 的 boundingbox 格式为 [left, top, right, bottom]
                const bbox = board.getBoundingBox();
                const width = container.clientWidth;
                const height = container.clientHeight;

                // 将像素坐标转换为用户坐标
                x = bbox[0] + (relX / width) * (bbox[2] - bbox[0]);
                y = bbox[3] + (relY / height) * (bbox[1] - bbox[3]);

                console.log('Got coords from manual calculation:', x, y, 'bbox:', bbox);
              }
            }
          }

          if (x !== undefined && y !== undefined && !isNaN(x) && !isNaN(y) && isFinite(x) && isFinite(y)) {
            console.log('Creating point at:', x, y);

            // 创建自定义点 - 使用相同的吸附设置
            customPointCounterRef.current += 1;
            const pointId = `custom_${customPointCounterRef.current}`;
            const pointName = `P${customPointCounterRef.current}`;

            // 收集所有点用于吸附
            const allPoints = [...Object.values(elementsRef.current).filter((el: any) => el && el.elementClass === JXG.OBJECT_CLASS_POINT)];

            const pointElement = board.create('point', [x, y], {
              name: pointName,
              size: 4,
              color: '#f97316',
              fixed: false,
              withLabel: true,
              snapToGrid: true,
              snapSizeX: 0.05,
              snapSizeY: 0.05,
              // 吸附到其他点
              attractors: allPoints,
              attractorDistance: 0.3,
              snatchDistance: 0.4,
            });

            // 为自定义点添加拖动吸附逻辑
            pointElement.on('drag', function() {
              const currentX = pointElement.X();
              const currentY = pointElement.Y();
              let snapX = currentX;
              let snapY = currentY;
              let shouldSnap = false;

              // 检查线段吸附
              for (const lineInfo of lineSegments) {
                const info = getPointToLineInfo(currentX, currentY, lineInfo.element);
                if (info.distance < SNAP_THRESHOLD) {
                  snapX = info.closestX;
                  snapY = info.closestY;
                  shouldSnap = true;
                  break;
                }
              }

              // 检查与点的垂直/水平吸附
              if (!shouldSnap) {
                for (const otherPoint of data.points) {
                  const otherElement = elements[otherPoint.id];
                  if (!otherElement) continue;

                  const otherX = otherElement.X();
                  const otherY = otherElement.Y();
                  const axisAlign = checkAxisAlignment(currentX, currentY, otherX, otherY);

                  if (axisAlign.isVertical && axisAlign.snapX !== undefined) {
                    snapX = axisAlign.snapX;
                    shouldSnap = true;
                    break;
                  } else if (axisAlign.isHorizontal && axisAlign.snapY !== undefined) {
                    snapY = axisAlign.snapY;
                    shouldSnap = true;
                    break;
                  }
                }
              }

              if (shouldSnap) {
                pointElement.setPosition(JXG.COORDS_BY_USER, [snapX, snapY]);
                board.update();
              }
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

            // 通知几何变化（延迟执行以确保状态已更新）
            setTimeout(() => notifyGeometryChange(), 0);
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

  // 通知父组件几何数据变化
  const notifyGeometryChange = () => {
    if (onGeometryChange) {
      const currentData = getCurrentGeometryData();
      if (currentData) {
        onGeometryChange(currentData);
      }
    }
  };

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

    // 通知几何变化
    setTimeout(() => notifyGeometryChange(), 0);
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

    // 通知几何变化
    setTimeout(() => notifyGeometryChange(), 0);
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

    // 通知几何变化
    setTimeout(() => notifyGeometryChange(), 0);
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
      snapSizeX: 0.05, // 更精细的吸附
      snapSizeY: 0.05,
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

    // 通知几何变化
    setTimeout(() => notifyGeometryChange(), 0);
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

    // 通知几何变化
    setTimeout(() => notifyGeometryChange(), 0);
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
            style={{ height: size, minHeight: size }}
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
            style={{
              height: isFullscreen ? 'calc(100vh - 2rem)' : size,
              minHeight: size,
              aspectRatio: isFullscreen ? 'auto' : '1'
            }}
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
