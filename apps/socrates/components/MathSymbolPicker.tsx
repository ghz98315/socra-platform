// =====================================================
// Project Socrates - Math Symbol Picker Component
// 数学符号快捷输入面板
// =====================================================

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Sigma, ChevronDown } from 'lucide-react';

// 数学符号分类
const MATH_SYMBOLS = {
  basic: {
    name: '基础运算',
    symbols: ['+', '-', '×', '÷', '=', '≠', '≈', '±', '∓'],
  },
  comparison: {
    name: '比较符号',
    symbols: ['<', '>', '≤', '≥', '≡', '≢'],
  },
  root: {
    name: '根号',
    symbols: ['√', '∛', '∜'],
  },
  power: {
    name: '幂次',
    symbols: ['x²', 'x³', 'xⁿ', '²', '³', '⁰', '¹', '⁴', '⁵', '⁶', '⁷', '⁸', '⁹'],
  },
  subscript: {
    name: '下标',
    symbols: ['x₁', 'x₂', 'x₃', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉', '₀'],
  },
  fraction: {
    name: '分数',
    symbols: ['½', '⅓', '⅔', '¼', '¾', '⅕', '⅖', '⅗', '⅘', '⅙', '⅚', '⅛', '⅜', '⅝', '⅞'],
  },
  greek: {
    name: '希腊字母',
    symbols: ['α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'π', 'σ', 'φ', 'ω', 'Δ', 'Σ', 'Π', 'Ω'],
  },
  geometry: {
    name: '几何符号',
    symbols: ['∠', '∟', '⊥', '∥', '∦', '△', '□', '○', '◇', '∴', '∵'],
  },
  set: {
    name: '集合符号',
    symbols: ['∈', '∉', '⊂', '⊃', '⊆', '⊇', '∪', '∩', '∅', '∀', '∃'],
  },
  arrows: {
    name: '箭头',
    symbols: ['→', '←', '↑', '↓', '↔', '⇒', '⇐', '⇔'],
  },
};

// 常用符号（显示在快捷栏）
const QUICK_SYMBOLS = ['√', 'x²', '½', '±', '≠', '≤', '≥', 'π', 'θ', '∠', '△', '→'];

interface MathSymbolPickerProps {
  onSymbolSelect: (symbol: string) => void;
  className?: string;
  variant?: 'full' | 'compact';
}

export function MathSymbolPicker({
  onSymbolSelect,
  className,
  variant = 'compact',
}: MathSymbolPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof MATH_SYMBOLS>('basic');
  const [isOpen, setIsOpen] = useState(false);

  const handleSymbolClick = (symbol: string) => {
    onSymbolSelect(symbol);
    // 在移动端，选择后自动关闭
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  // 紧凑模式：只显示快捷符号栏
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1 flex-wrap', className)}>
        {QUICK_SYMBOLS.map((symbol) => (
          <button
            key={symbol}
            onClick={() => onSymbolSelect(symbol)}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-md',
              'text-base font-medium text-foreground',
              'bg-muted/50 hover:bg-muted transition-colors',
              'active:scale-95'
            )}
            title={`插入 ${symbol}`}
          >
            {symbol}
          </button>
        ))}

        {/* 更多符号按钮 */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded-md',
                'text-muted-foreground hover:text-foreground',
                'bg-muted/50 hover:bg-muted transition-colors',
                'active:scale-95'
              )}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-80 p-3"
            align="start"
          >
            <MathSymbolPanel
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              onSymbolClick={handleSymbolClick}
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // 完整模式：显示完整面板
  return (
    <div className={cn('bg-card rounded-lg border', className)}>
      <MathSymbolPanel
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
        onSymbolClick={handleSymbolClick}
      />
    </div>
  );
}

// 内部面板组件
interface MathSymbolPanelProps {
  activeCategory: keyof typeof MATH_SYMBOLS;
  setActiveCategory: (category: keyof typeof MATH_SYMBOLS) => void;
  onSymbolClick: (symbol: string) => void;
}

function MathSymbolPanel({
  activeCategory,
  setActiveCategory,
  onSymbolClick,
}: MathSymbolPanelProps) {
  return (
    <div className="space-y-3">
      {/* 分类标签 */}
      <div className="flex flex-wrap gap-1">
        {Object.entries(MATH_SYMBOLS).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key as keyof typeof MATH_SYMBOLS)}
            className={cn(
              'px-2 py-1 text-xs rounded-md transition-colors',
              activeCategory === key
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* 符号网格 */}
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
        {MATH_SYMBOLS[activeCategory].symbols.map((symbol, index) => (
          <button
            key={`${symbol}-${index}`}
            onClick={() => onSymbolClick(symbol)}
            className={cn(
              'h-9 flex items-center justify-center rounded-md',
              'text-base font-medium',
              'bg-muted/30 hover:bg-muted transition-all',
              'active:scale-95 active:bg-primary/20'
            )}
            title={`插入 ${symbol}`}
          >
            {symbol}
          </button>
        ))}
      </div>

      {/* 提示 */}
      <p className="text-xs text-muted-foreground text-center">
        点击符号插入到输入框
      </p>
    </div>
  );
}

// 导出一个简单的快捷符号栏组件
interface QuickSymbolBarProps {
  onSymbolSelect: (symbol: string) => void;
  className?: string;
}

export function QuickSymbolBar({ onSymbolSelect, className }: QuickSymbolBarProps) {
  return (
    <div className={cn('flex items-center gap-1 overflow-x-auto py-1', className)}>
      {QUICK_SYMBOLS.map((symbol) => (
        <button
          key={symbol}
          onClick={() => onSymbolSelect(symbol)}
          className={cn(
            'flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md',
            'text-base font-medium text-foreground',
            'bg-muted/50 hover:bg-muted transition-colors',
            'active:scale-95'
          )}
          title={`插入 ${symbol}`}
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}

export default MathSymbolPicker;
