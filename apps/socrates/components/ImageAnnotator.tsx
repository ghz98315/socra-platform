// =====================================================
// Project Socrates - Image Annotator Component
// 图片标注工具 - 用于在题目图片上画线、标注
// =====================================================

'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Pencil,
  Eraser,
  Type,
  ArrowRight,
  Undo2,
  Trash2,
  Download,
  X,
  Check,
  Minus,
  Square,
} from 'lucide-react';

// 工具类型
type Tool = 'pencil' | 'line' | 'arrow' | 'text' | 'eraser';

// 颜色选项
const COLORS = [
  { name: '红色', value: '#ef4444' },
  { name: '蓝色', value: '#3b82f6' },
  { name: '绿色', value: '#22c55e' },
  { name: '橙色', value: '#f97316' },
  { name: '紫色', value: '#a855f7' },
  { name: '黑色', value: '#1f2937' },
];

// 线宽选项
const LINE_WIDTHS = [
  { name: '细', value: 2 },
  { name: '中', value: 4 },
  { name: '粗', value: 6 },
];

// 绘图动作接口
interface DrawAction {
  type: 'pencil' | 'line' | 'arrow' | 'text' | 'eraser';
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  text?: string;
  textPosition?: { x: number; y: number };
  color: string;
  lineWidth: number;
}

interface ImageAnnotatorProps {
  imageUrl: string;
  onSave?: (annotatedImageUrl: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function ImageAnnotator({
  imageUrl,
  onSave,
  onCancel,
  className,
}: ImageAnnotatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<Tool>('pencil');
  const [color, setColor] = useState(COLORS[0].value);
  const [lineWidth, setLineWidth] = useState(LINE_WIDTHS[1].value);
  const [isDashed, setIsDashed] = useState(false);
  const [actions, setActions] = useState<DrawAction[]>([]);
  const [currentAction, setCurrentAction] = useState<DrawAction | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number; y: number } | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // 加载图片并初始化画布
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      // 计算适合容器的尺寸
      const container = containerRef.current;
      if (container) {
        const maxWidth = container.clientWidth - 20;
        const maxHeight = 500;

        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = (maxHeight / height) * width;
          height = maxHeight;
        }

        setCanvasSize({ width, height });
      }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // 重绘所有动作
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const img = imageRef.current;

    if (!canvas || !ctx || !img) return;

    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制原图
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // 绘制所有已保存的动作
    actions.forEach((action) => {
      drawAction(ctx, action);
    });

    // 绘制当前动作
    if (currentAction) {
      drawAction(ctx, currentAction);
    }
  }, [actions, currentAction]);

  // 绘制单个动作
  const drawAction = (ctx: CanvasRenderingContext2D, action: DrawAction) => {
    ctx.save();
    ctx.strokeStyle = action.color;
    ctx.fillStyle = action.color;
    ctx.lineWidth = action.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (action.type === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
    }

    switch (action.type) {
      case 'pencil':
      case 'eraser':
        if (action.points && action.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(action.points[0].x, action.points[0].y);
          for (let i = 1; i < action.points.length; i++) {
            ctx.lineTo(action.points[i].x, action.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case 'line':
        if (action.start && action.end) {
          ctx.beginPath();
          ctx.setLineDash(isDashed ? [5, 5] : []);
          ctx.moveTo(action.start.x, action.start.y);
          ctx.lineTo(action.end.x, action.end.y);
          ctx.stroke();
        }
        break;

      case 'arrow':
        if (action.start && action.end) {
          const headLength = 15;
          const angle = Math.atan2(
            action.end.y - action.start.y,
            action.end.x - action.start.x
          );

          ctx.beginPath();
          ctx.setLineDash(isDashed ? [5, 5] : []);
          ctx.moveTo(action.start.x, action.start.y);
          ctx.lineTo(action.end.x, action.end.y);
          ctx.stroke();

          // 绘制箭头头部
          ctx.beginPath();
          ctx.setLineDash([]);
          ctx.moveTo(action.end.x, action.end.y);
          ctx.lineTo(
            action.end.x - headLength * Math.cos(angle - Math.PI / 6),
            action.end.y - headLength * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(action.end.x, action.end.y);
          ctx.lineTo(
            action.end.x - headLength * Math.cos(angle + Math.PI / 6),
            action.end.y - headLength * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
        break;

      case 'text':
        if (action.text && action.textPosition) {
          ctx.font = `${action.lineWidth * 4}px sans-serif`;
          ctx.fillText(action.text, action.textPosition.x, action.textPosition.y);
        }
        break;
    }

    ctx.restore();
  };

  // 画布重绘
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // 获取鼠标/触摸位置
  const getPosition = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // 开始绘制
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const pos = getPosition(e);

    if (tool === 'text') {
      setTextPosition(pos);
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);

    const newAction: DrawAction = {
      type: tool,
      color: tool === 'eraser' ? '#ffffff' : color,
      lineWidth: tool === 'eraser' ? 20 : lineWidth,
      points: [pos],
      start: pos,
      end: pos,
    };

    setCurrentAction(newAction);
  };

  // 绘制中
  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !currentAction) return;
    e.preventDefault();

    const pos = getPosition(e);

    if (tool === 'pencil' || tool === 'eraser') {
      setCurrentAction({
        ...currentAction,
        points: [...(currentAction.points || []), pos],
      });
    } else if (tool === 'line' || tool === 'arrow') {
      setCurrentAction({
        ...currentAction,
        end: pos,
      });
    }
  };

  // 结束绘制
  const handleEnd = () => {
    if (isDrawing && currentAction) {
      setActions([...actions, currentAction]);
      setCurrentAction(null);
    }
    setIsDrawing(false);
  };

  // 添加文字
  const handleAddText = () => {
    if (textInput.trim() && textPosition) {
      const newAction: DrawAction = {
        type: 'text',
        text: textInput,
        textPosition,
        color,
        lineWidth,
      };
      setActions([...actions, newAction]);
    }
    setShowTextInput(false);
    setTextInput('');
    setTextPosition(null);
  };

  // 撤销
  const handleUndo = () => {
    setActions(actions.slice(0, -1));
  };

  // 清除
  const handleClear = () => {
    setActions([]);
  };

  // 保存
  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 创建临时画布保存完整图像
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0);
      const dataUrl = tempCanvas.toDataURL('image/png');
      onSave?.(dataUrl);
    }
  };

  // 下载
  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `annotated_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!imageLoaded) {
    return (
      <div className={cn('flex items-center justify-center p-8', className)}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载图片中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg">
        {/* 工具选择 */}
        <div className="flex gap-1 border-r border-border pr-2">
          <Button
            size="sm"
            variant={tool === 'pencil' ? 'default' : 'ghost'}
            onClick={() => setTool('pencil')}
            title="画笔"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'line' ? 'default' : 'ghost'}
            onClick={() => setTool('line')}
            title="直线"
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'arrow' ? 'default' : 'ghost'}
            onClick={() => setTool('arrow')}
            title="箭头"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'text' ? 'default' : 'ghost'}
            onClick={() => setTool('text')}
            title="文字"
          >
            <Type className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={tool === 'eraser' ? 'default' : 'ghost'}
            onClick={() => setTool('eraser')}
            title="橡皮擦"
          >
            <Eraser className="w-4 h-4" />
          </Button>
        </div>

        {/* 颜色选择 */}
        <div className="flex gap-1">
          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => setColor(c.value)}
              className={cn(
                'w-6 h-6 rounded-full border-2 transition-transform',
                color === c.value ? 'scale-125 border-foreground' : 'border-transparent'
              )}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}
        </div>

        {/* 线宽选择 */}
        <div className="flex gap-1 border-l border-border pl-2">
          {LINE_WIDTHS.map((lw) => (
            <Button
              key={lw.value}
              size="sm"
              variant={lineWidth === lw.value ? 'default' : 'ghost'}
              onClick={() => setLineWidth(lw.value)}
              className="px-2"
            >
              <Square
                className="w-3 h-3"
                style={{ transform: `scale(${lw.value / 4})` }}
              />
            </Button>
          ))}
        </div>

        {/* 虚线开关 */}
        <Button
          size="sm"
          variant={isDashed ? 'default' : 'ghost'}
          onClick={() => setIsDashed(!isDashed)}
          title="虚线"
        >
          虚线
        </Button>

        {/* 操作按钮 */}
        <div className="flex gap-1 border-l border-border pl-2 ml-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleUndo}
            disabled={actions.length === 0}
            title="撤销"
          >
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleClear}
            disabled={actions.length === 0}
            title="清除"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 画布容器 */}
      <div
        ref={containerRef}
        className="relative bg-white rounded-lg overflow-hidden border border-border"
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          className="touch-none cursor-crosshair mx-auto block"
        />

        {/* 文字输入框 */}
        {showTextInput && textPosition && (
          <div
            className="absolute"
            style={{
              left: textPosition.x,
              top: textPosition.y - 20,
            }}
          >
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddText();
                if (e.key === 'Escape') {
                  setShowTextInput(false);
                  setTextInput('');
                }
              }}
              placeholder="输入文字..."
              className="px-2 py-1 border rounded text-sm"
              autoFocus
            />
            <Button size="sm" onClick={handleAddText} className="ml-1">
              <Check className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* 底部按钮 */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          下载
        </Button>
        <Button onClick={handleSave}>
          <Check className="w-4 h-4 mr-2" />
          保存标注
        </Button>
      </div>
    </div>
  );
}

export default ImageAnnotator;
