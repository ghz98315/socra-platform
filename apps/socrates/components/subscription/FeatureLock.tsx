// =====================================================
// Project Socrates - Feature Lock Component
// 功能锁定提示组件
// =====================================================

'use client';

import { Lock, Crown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface FeatureLockProps {
  featureName: string;
  description?: string;
  onUnlock?: () => void;
  showOverlay?: boolean;
  children?: React.ReactNode;
  className?: string;
}

// 功能锁定遮罩
export function FeatureLock({
  featureName,
  description,
  onUnlock,
  showOverlay = true,
  children,
  className
}: FeatureLockProps) {
  const handleUnlock = () => {
    if (onUnlock) {
      onUnlock();
    } else {
      window.location.href = '/subscription';
    }
  };

  return (
    <div className={cn("relative", className)}>
      {children}

      {showOverlay && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
          <div className="text-center p-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 flex items-center justify-center">
              <Lock className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {featureName}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {description || '升级 Pro 会员解锁此功能'}
            </p>
            <Button
              onClick={handleUnlock}
              className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              解锁功能
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// 功能锁定弹窗
interface FeatureLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  benefits?: string[];
}

export function FeatureLockModal({
  isOpen,
  onClose,
  featureName,
  benefits = []
}: FeatureLockModalProps) {
  if (!isOpen) return null;

  const defaultBenefits = [
    '无限 AI 对话学习',
    '高级复习计划',
    '详细学习报告',
    '优先客服支持'
  ];

  const displayBenefits = benefits.length > 0 ? benefits : defaultBenefits;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-500" />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-2">
            解锁 {featureName}
          </h3>
          <p className="text-gray-500 mb-6">
            升级 Pro 会员，享受更多高级功能
          </p>

          <div className="space-y-3 mb-6 text-left">
            {displayBenefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 rounded-lg p-4 mb-4">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-bold text-gray-900">¥29</span>
              <span className="text-gray-500">/月</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">年付仅需 ¥199，省 35%</p>
          </div>

          <div className="space-y-3">
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              onClick={() => {
                window.location.href = '/subscription';
              }}
            >
              <Crown className="w-4 h-4 mr-2" />
              立即升级 Pro
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              稍后再说
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 功能锁定标签
interface FeatureLockTagProps {
  className?: string;
}

export function FeatureLockTag({ className }: FeatureLockTagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium",
        "text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full",
        className
      )}
    >
      <Lock className="w-3 h-3" />
      PRO
    </span>
  );
}

// 检查功能权限的 Hook
export function useFeatureAccess(featureKey: string) {
  // 这里可以从订阅状态检查功能权限
  const hasAccess = false;
  const isPro = false;

  return { hasAccess, isPro };
}
