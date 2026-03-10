// =====================================================
// Project Socrates - Subscription Features Comparison
// 订阅权益对比组件 (优化版)
// =====================================================

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Check,
  X,
  Star,
  Sparkles,
  Zap,
  Crown,
  Target,
  Brain,
  FileText,
  Calendar,
  Clock,
  BarChart3,
  Download,
  HeadphonesIcon,
  History,
  Palette,
  TrendingUp,
  Gift,
  ChevronDown,
  ChevronUp,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface SubscriptionFeaturesProps {
  currentPlan: string;
  onUpgrade?: () => void;
}

// 图标映射
const iconMap: Record<string, any> = {
  '错题学习': Target,
  'AI对话': Brain,
  '作文批改': FileText,
  '几何画板': Palette,
  '复习计划': Calendar,
  '时间规划': Clock,
  '学习报告': BarChart3,
  '历史记录': History,
  'PDF导出': Download,
  '优先客服': HeadphonesIcon,
  '知识图谱': TrendingUp,
  '成就系统': Gift,
};

// 权益配置 - 扩展版
const FEATURES: Array<{
  category: string;
  icon: any;
  items: Array<{
    name: string;
    icon?: any;
    free: string | boolean;
    pro: string | boolean;
    highlight?: boolean;
    description?: string;
  }>;
}> = [
  {
    category: '核心学习功能',
    icon: Brain,
    items: [
      {
        name: '错题学习',
        icon: Target,
        free: '5次/天',
        pro: '无限次',
        highlight: true,
        description: '拍照上传错题，AI智能分析'
      },
      {
        name: 'AI对话轮数',
        icon: Brain,
        free: '20轮/题',
        pro: '无限轮',
        description: '与AI深度探讨每道错题'
      },
      {
        name: '作文批改',
        icon: FileText,
        free: '3次/周',
        pro: '无限次',
        highlight: true,
        description: 'AI批改作文，提供详细建议'
      },
      {
        name: '知识图谱',
        icon: TrendingUp,
        free: '基础',
        pro: '完整',
        description: '可视化知识点掌握情况'
      },
    ]
  },
  {
    category: '学习工具',
    icon: Calendar,
    items: [
      {
        name: '复习计划',
        icon: Calendar,
        free: '基础',
        pro: 'AI智能优化',
        description: '基于遗忘曲线的复习安排'
      },
      {
        name: '时间规划',
        icon: Clock,
        free: '基础',
        pro: 'AI智能排期',
        highlight: true,
        description: '智能分配学习时间'
      },
      {
        name: '学习报告',
        icon: BarChart3,
        free: '基础',
        pro: '深度分析',
        description: '周报/月报详细数据'
      },
      {
        name: '几何画板',
        icon: Palette,
        free: '基础版',
        pro: '高级版',
        description: '几何图形绘制工具'
      },
    ]
  },
  {
    category: '数据与特权',
    icon: Gift,
    items: [
      {
        name: '历史记录',
        icon: History,
        free: '7天',
        pro: '永久保存',
        highlight: true,
        description: '错题和学习记录保存'
      },
      {
        name: 'PDF导出',
        icon: Download,
        free: '3次/月',
        pro: '无限次',
        description: '导出错题本和报告'
      },
      {
        name: '成就系统',
        icon: Gift,
        free: '基础',
        pro: '完整徽章',
        description: '解锁全部成就徽章'
      },
      {
        name: '优先客服',
        icon: HeadphonesIcon,
        free: false,
        pro: true,
        description: '专属客服快速响应'
      },
    ]
  },
];

// 常见问题
const FAQS = [
  {
    q: '如何取消订阅？',
    a: '您可以随时在个人中心取消订阅，取消后当前周期仍然有效。'
  },
  {
    q: '支持哪些支付方式？',
    a: '支持微信支付、支付宝等多种支付方式。'
  },
  {
    q: '购买后可以退款吗？',
    a: '首次购买7天内不满意可申请全额退款。'
  },
];

export function SubscriptionFeatures({ currentPlan, onUpgrade }: SubscriptionFeaturesProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const isPro = currentPlan !== 'free';

  return (
    <div className="space-y-6">
      {/* 功能对比表格 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {/* 表头 */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-4 border-b border-gray-200">
          <div className="grid grid-cols-3 gap-4 items-center">
            <div className="col-span-1">
              <span className="text-sm font-medium text-gray-500">功能对比</span>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-gray-200 rounded-full">
                <span className="text-sm font-medium text-gray-600">免费版</span>
              </div>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-warm-500 to-orange-500 rounded-full">
                <Crown className="w-4 h-4 text-yellow-200" />
                <span className="text-sm font-bold text-white">Pro</span>
              </div>
            </div>
          </div>
        </div>

        {/* 功能列表 */}
        <div className="divide-y divide-gray-100">
          {FEATURES.map((category) => {
            const CategoryIcon = category.icon;
            return (
              <div key={category.category}>
                {/* 分类标题 */}
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-transparent flex items-center gap-2">
                  <CategoryIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-700">
                    {category.category}
                  </span>
                </div>

                {/* 功能项 */}
                {category.items.map((item) => {
                  const ItemIcon = item.icon || iconMap[item.name] || Sparkles;
                  return (
                    <div
                      key={item.name}
                      className={cn(
                        "grid grid-cols-3 gap-4 px-4 py-3 transition-colors",
                        item.highlight && "bg-warm-50/50"
                      )}
                    >
                      {/* 功能名称 */}
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          item.highlight ? "bg-warm-100" : "bg-gray-100"
                        )}>
                          <ItemIcon className={cn(
                            "w-4 h-4",
                            item.highlight ? "text-warm-600" : "text-gray-500"
                          )} />
                        </div>
                        <div>
                          <span className={cn(
                            "text-sm block",
                            item.highlight ? "font-semibold text-gray-900" : "text-gray-700"
                          )}>
                            {item.name}
                          </span>
                          {item.description && (
                            <span className="text-xs text-gray-400 hidden md:block">
                              {item.description}
                            </span>
                          )}
                        </div>
                        {item.highlight && (
                          <Sparkles className="w-3 h-3 text-warm-500 flex-shrink-0" />
                        )}
                      </div>

                      {/* 免费版 */}
                      <div className="flex items-center justify-center">
                        {typeof item.free === 'boolean' ? (
                          item.free ? (
                            <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                              <Check className="w-4 h-4 text-green-600" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                              <X className="w-4 h-4 text-gray-400" />
                            </div>
                          )
                        ) : (
                          <span className="text-sm text-gray-500 px-2 py-1 bg-gray-100 rounded-md">
                            {item.free}
                          </span>
                        )}
                      </div>

                      {/* Pro版 */}
                      <div className="flex items-center justify-center">
                        {typeof item.pro === 'boolean' ? (
                          item.pro ? (
                            <div className="w-6 h-6 rounded-full bg-warm-100 flex items-center justify-center">
                              <Check className="w-4 h-4 text-warm-600" />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                              <X className="w-4 h-4 text-gray-400" />
                            </div>
                          )
                        ) : (
                          <span className="text-sm font-semibold text-warm-600 px-2 py-1 bg-warm-100 rounded-md">
                            {item.pro}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* 升级提示 */}
        {!isPro && (
          <div className="px-4 py-5 bg-gradient-to-r from-warm-50 via-orange-50 to-yellow-50 border-t border-warm-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-warm-500 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    解锁全部 Pro 功能
                  </p>
                  <p className="text-sm text-gray-500">
                    首月仅需 ¥14.5，随时可取消
                  </p>
                </div>
              </div>
              <button
                onClick={onUpgrade}
                className="px-6 py-2.5 bg-gradient-to-r from-warm-500 to-orange-500 text-white font-semibold rounded-full hover:from-warm-600 hover:to-orange-600 transition-all shadow-md hover:shadow-lg"
              >
                立即升级
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 信任标识 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-gray-100">
          <Shield className="w-6 h-6 text-green-500 mb-1" />
          <span className="text-xs font-medium text-gray-700">安全支付</span>
          <span className="text-xs text-gray-400">多重加密保护</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-gray-100">
          <RefreshCw className="w-6 h-6 text-blue-500 mb-1" />
          <span className="text-xs font-medium text-gray-700">随时取消</span>
          <span className="text-xs text-gray-400">无捆绑消费</span>
        </div>
        <div className="flex flex-col items-center p-3 bg-white rounded-xl border border-gray-100">
          <Gift className="w-6 h-6 text-purple-500 mb-1" />
          <span className="text-xs font-medium text-gray-700">7天退款</span>
          <span className="text-xs text-gray-400">不满意全额退</span>
        </div>
      </div>

      {/* 常见问题 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">常见问题</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {FAQS.map((faq, index) => (
            <div key={index}>
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-800">{faq.q}</span>
                {expandedFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {expandedFaq === index && (
                <div className="px-4 pb-3">
                  <p className="text-sm text-gray-600">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
