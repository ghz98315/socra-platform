'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Check, RefreshCw, AlertCircle, Sparkles, Zap, Cloud, Pencil } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ImageAnnotator } from '@/components/ImageAnnotator';

// Base64 conversion utility function
function getBase64FromDataURL(dataUrl: string): string {
  if (dataUrl.startsWith('data:')) {
    return dataUrl.split(',')[1];
  }
  return dataUrl;
}

interface OCRResultProps {
  initialText: string;
  onTextChange: (text: string) => void;
  onConfirm: (text: string) => void;
  imageData?: string | null;
}

// 云端 OCR API
const CLOUD_OCR_URL = '/api/ocr';
const OCR_TIMEOUT = 60000; // 60秒超时（云端可能较慢）

export function OCRResult({ initialText, onTextChange, onConfirm, imageData }: OCRResultProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [text, setText] = useState(initialText);
  const [error, setError] = useState<string>('');
  const [cloudOCRAvailable, setCloudOCRAvailable] = useState<boolean | null>(null);
  const [showAnnotator, setShowAnnotator] = useState(false);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const cancelRef = useRef<boolean>(false);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  // 检查云端 OCR 服务是否可用
  useEffect(() => {
    const checkCloudOCR = async () => {
      try {
        const response = await fetch(CLOUD_OCR_URL, { method: 'GET' });
        const data = await response.json();
        setCloudOCRAvailable(data.config?.available ?? false);
      } catch {
        setCloudOCRAvailable(false);
      }
    };
    checkCloudOCR();
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    onTextChange(e.target.value);
    setError('');
  };

  const updateProgress = (value: number, statusText?: string) => {
    if (cancelRef.current) return;
    setProgress(value);
    if (statusText) setStatus(statusText);
  };

  const handleReOCR = async () => {
    if (!imageData) {
      setError('没有可用的图片数据');
      return;
    }

    cancelRef.current = false;
    setIsProcessing(true);
    setProgress(0);
    setStatus('准备识别...');
    setError('');

    try {
      // 使用云端 OCR
      updateProgress(10, '连接云端 OCR 服务...');

      const base64Image = getBase64FromDataURL(imageData);

      // 使用 AbortController 实现超时
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OCR_TIMEOUT);

      try {
        updateProgress(20, '上传图片中...');

        const response = await fetch(CLOUD_OCR_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (cancelRef.current) return;

        updateProgress(60, 'AI 识别中...');

        if (!response.ok) {
          throw new Error(`OCR服务错误: ${response.status}`);
        }

        const result = await response.json();
        updateProgress(90, '处理结果...');

        if (result.success && result.text) {
          setText(result.text);
          onTextChange(result.text);
          updateProgress(100, '识别完成!');
          setCloudOCRAvailable(true);
        } else {
          throw new Error(result.error || '未识别到文字');
        }

      } catch (err: any) {
        clearTimeout(timeoutId);
        if (cancelRef.current) return;

        // 云端 OCR 失败
        if (err.name === 'AbortError') {
          throw new Error('识别超时，请重试');
        }
        throw err;
      }

    } catch (err: any) {
      if (cancelRef.current) return;
      setError(err.message || 'OCR识别失败，请重试');
      console.error('OCR Error:', err);
    } finally {
      if (!cancelRef.current) {
        setIsProcessing(false);
        setTimeout(() => {
          setProgress(0);
          setStatus('');
        }, 2000);
      }
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setIsProcessing(false);
    setProgress(0);
    setStatus('');
  };

  // 处理标注保存
  const handleAnnotatorSave = (annotatedImageUrl: string) => {
    setAnnotatedImage(annotatedImageUrl);
    setShowAnnotator(false);
  };

  // 获取当前显示的图片（优先显示标注后的图片）
  const displayImage = annotatedImage || imageData;

  // Auto-execute OCR when image is uploaded
  useEffect(() => {
    if (imageData && !initialText && !isProcessing) {
      handleReOCR();
    }
  }, [imageData]);

  return (
    <>
    <Card className={cn(
      "border-border/50 transition-all duration-300",
      isProcessing && "border-primary/30 shadow-lg shadow-primary/5"
    )}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            题目识别
          </h3>
          <div className="flex items-center gap-2">
            {cloudOCRAvailable === true && (
              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
                <Cloud className="w-3 h-3" />
                AI识别
              </span>
            )}
            {cloudOCRAvailable === false && (
              <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-medium">
                服务不可用
              </span>
            )}
            {cloudOCRAvailable === null && (
              <span className="text-xs text-muted-foreground">检测服务中...</span>
            )}
          </div>
        </div>

        {isProcessing ? (
          <div className="space-y-3">
            <div className="relative">
              <Progress value={progress} className="h-2.5" />
              {progress > 0 && (
                <span className="absolute right-0 top-4 text-xs text-muted-foreground">
                  {progress}%
                </span>
              )}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {status}
              </p>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                className="text-muted-foreground hover:text-foreground"
              >
                取消
              </Button>
            </div>

            <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
              AI 正在识别图片中的文字，请稍候...
              <br />
              <span className="text-primary">支持数学公式、图表等复杂内容识别</span>
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <textarea
                value={text}
                onChange={handleTextChange}
                placeholder="上传图片后，AI将自动识别题目内容..."
                className={cn(
                  "w-full h-32 rounded-xl border bg-transparent px-4 py-3 text-sm resize-none",
                  "transition-all duration-200",
                  "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50",
                  "placeholder:text-muted-foreground/60"
                )}
              />
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                className="gap-2"
                onClick={() => setShowAnnotator(true)}
                disabled={!imageData}
                title="在图片上画线、标注"
              >
                <Pencil className="w-4 h-4" />
                标注
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleReOCR}
                disabled={isProcessing || !imageData}
              >
                <RefreshCw className="w-4 h-4" />
                重新识别
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-2"
                onClick={() => onConfirm(text)}
                disabled={!text || isProcessing}
              >
                <Check className="w-4 h-4" />
                确认并开始学习
              </Button>
            </div>

            {/* 标注后的图片预览 */}
            {annotatedImage && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">已标注图片：</p>
                <img
                  src={annotatedImage}
                  alt="已标注"
                  className="max-w-full h-auto rounded-lg border"
                />
              </div>
            )}
          </>
        )}

        {error && (
          <div className="mt-3 text-sm text-destructive flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>

      {/* 图片标注模态框 */}
      {showAnnotator && imageData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-background rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold">图片标注工具</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAnnotator(false)}
              >
                ✕
              </Button>
            </div>
            <div className="p-4">
              <ImageAnnotator
                imageUrl={displayImage || ''}
                onSave={handleAnnotatorSave}
                onCancel={() => setShowAnnotator(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
