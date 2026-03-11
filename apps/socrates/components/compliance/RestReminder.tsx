// =====================================================
// Project Socrates - Rest Reminder Component
// 休息提醒弹窗组件
// =====================================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Coffee, Moon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface RestReminderProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionMinutes: number;
  restReminderInterval: number;
  forceRestDuration: number;
  onRestStart: () => void;
  onRestEnd: () => void;
}

export function RestReminder({
  isOpen,
  onClose,
  currentSessionMinutes,
  restReminderInterval = 45,
  forceRestDuration = 15,
  onRestStart,
  onRestEnd,
}: RestReminderProps) {
  const [countdown, setCountdown] = useState(forceRestDuration * 60);
  const [isResting, setIsResting] = useState(false);

  // 声音倒计时
  useEffect(() => {
    if (isOpen && isResting) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onRestEnd();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isOpen, isResting, onRestEnd]);

  // 格式化时间显示
  const formatCountdown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRest = () => {
    setIsResting(true);
    setCountdown(forceRestDuration * 60);
    onRestStart();
  };

  const handleClose = () => {
    setIsResting(false);
    setCountdown(forceRestDuration * 60);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Coffee className="w-6 h-6 text-amber-600" />
            </div>
            <DialogTitle className="text-xl">休息时间到了</DialogTitle>
          </div>
          <p className="text-gray-600 mb-4">
            你已连续学习 <span className="text-amber-600 font-semibold">{currentSessionMinutes}</span> 分钟
          </p>
          <p className="text-gray-500 mb-6">
            寏隔 {restReminderInterval} 分钟需要休息一下，保护眼睛健康
          </p>

          {!isResting ? (
            <div className="space-y-4">
              <p className="text-gray-600">建议休息 <span className="font-semibold">{forceRestDuration}</span> 分钟后再继续学习</p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose}>
                  稍后提醒
                </Button>
                <Button onClick={handleStartRest} className="bg-amber-500 hover:bg-amber-600">
                  开始休息
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <Moon className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-2">休息中...</p>
              <p className="text-4xl font-bold text-amber-600 mb-4">
                {formatCountdown(countdown)}
              </p>
              <p className="text-gray-500">休息结束后可以继续学习</p>
              <Button onClick={handleClose} className="w-full bg-amber-500 hover:bg-amber-600">
                结束休息
              </Button>
            </div>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
