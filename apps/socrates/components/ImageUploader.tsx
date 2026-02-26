'use client';

import { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, AlertCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  onImageSelect: (file: File, preview: string) => void;
  onImageRemove: () => void;
  currentImage?: string | null;
  maxSize?: number; // MB
  accept?: string;
}

export function ImageUploader({
  onImageSelect,
  onImageRemove,
  currentImage,
  maxSize = 10,
  accept = 'image/jpeg,image/png,image/webp'
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');

  // 验证文件
  const validateFile = useCallback((file: File): string | null => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      return '请上传图片文件';
    }

    // 检查文件大小
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSize) {
      return `图片大小不能超过 ${maxSize}MB`;
    }

    // 检查具体格式
    const allowedTypes = accept.split(',');
    if (!allowedTypes.includes(file.type)) {
      return '只支持 JPG、PNG、WebP 格式';
    }

    return null;
  }, [maxSize, accept]);

  const handleFileSelect = useCallback((file: File) => {
    setError('');

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // 读取文件并生成预览
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setPreview(result);
      onImageSelect(file, result);
    };
    reader.onerror = () => {
      setError('图片读取失败，请重试');
    };
    reader.readAsDataURL(file);
  }, [validateFile, onImageSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError('');

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError('');
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    setError('');
    fileInputRef.current?.click();
  };

  return (
    <div className="relative">
      {preview ? (
        <div className="relative group rounded-2xl overflow-hidden shadow-lg border border-border/50 bg-muted/30">
          <img
            src={preview}
            alt="上传的题目"
            className="w-full max-h-80 object-contain"
          />
          {/* 悬停遮罩 */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-4">
            <Button
              variant="secondary"
              size="sm"
              className="gap-2 bg-white/90 hover:bg-white"
              onClick={handleRemove}
            >
              <X className="w-4 h-4" />
              重新上传
            </Button>
          </div>
          {/* 移动端始终显示删除按钮 */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-2 right-2 gap-1 bg-white/90 hover:bg-white md:hidden"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
            删除
          </Button>
          {/* 成功标识 */}
          <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 bg-green-500 text-white text-xs rounded-full">
            <Sparkles className="w-3 h-3" />
            上传成功
          </div>
        </div>
      ) : (
        <div
          className={cn(
            "relative h-56 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden",
            "bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-blue-950/30 dark:via-slate-900 dark:to-purple-950/30",
            dragActive && "scale-[1.02] ring-4 ring-primary/30",
            error && "ring-2 ring-red-400"
          )}
          onClick={handleClick}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {/* Animated border */}
          <div className={cn(
            "absolute inset-0 rounded-2xl",
            "before:absolute before:inset-0 before:rounded-2xl before:p-[2px]",
            "before:bg-gradient-to-r before:from-blue-400 before:via-purple-400 before:to-pink-400",
            "before:animate-[gradient-rotate_3s_linear_infinite]",
            "after:absolute after:inset-[2px] after:rounded-xl after:bg-gradient-to-br",
            "after:from-blue-50 after:via-white after:to-purple-50",
            "dark:after:from-blue-950/30 dark:after:via-slate-900 dark:after:to-purple-950/30"
          )} />

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="relative z-10 text-center px-4">
            {dragActive ? (
              <>
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <Upload className="w-8 h-8 text-white animate-bounce" />
                </div>
                <p className="text-base font-medium text-primary">
                  松开鼠标上传图片 📸
                </p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/50 dark:to-purple-900/50 flex items-center justify-center shadow-inner">
                  <Camera className="w-8 h-8 text-blue-500" />
                </div>
                <p className="text-base font-medium text-foreground mb-1">
                  点击拍照或上传图片 📷
                </p>
                <p className="text-sm text-muted-foreground">
                  支持 JPG、PNG、WebP，最大 {maxSize}MB
                </p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                    拍照
                  </span>
                  <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                    相册
                  </span>
                  <span className="px-2 py-0.5 bg-pink-100 dark:bg-pink-900/30 rounded-full text-pink-600 dark:text-pink-400">
                    拖拽
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 p-3 mt-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
