// =====================================================
// Project Socrates - Apple-style Animations
// 苹果风格动画效果
// =====================================================

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

// =====================================================
// 1. 滚动淡入动画 (Scroll Fade In)
// =====================================================

interface ScrollFadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
  threshold?: number;
}

export function ScrollFadeIn({
  children,
  className,
  delay = 0,
  direction = 'up',
  duration = 0.6,
  threshold = 0.1,
}: ScrollFadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  const getTransform = () => {
    if (!isVisible) {
      switch (direction) {
        case 'up': return 'translateY(40px)';
        case 'down': return 'translateY(-40px)';
        case 'left': return 'translateX(40px)';
        case 'right': return 'translateX(-40px)';
        default: return 'none';
      }
    }
    return 'none';
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}s ease-out ${delay}s, transform ${duration}s ease-out ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// =====================================================
// 2. 交错动画容器 (Stagger Container)
// =====================================================

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  direction?: 'up' | 'down' | 'left' | 'right';
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
  direction = 'up',
}: StaggerContainerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {Array.isArray(children)
        ? children.map((child, index) => (
            <div
              key={index}
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible
                  ? 'none'
                  : direction === 'up'
                  ? 'translateY(30px)'
                  : direction === 'down'
                  ? 'translateY(-30px)'
                  : direction === 'left'
                  ? 'translateX(30px)'
                  : 'translateX(-30px)',
                transition: `opacity 0.5s ease-out ${index * staggerDelay}s, transform 0.5s ease-out ${index * staggerDelay}s`,
              }}
            >
              {child}
            </div>
          ))
        : children}
    </div>
  );
}

// =====================================================
// 3. 视差滚动效果 (Parallax)
// =====================================================

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  speed?: number; // 0.1 - 0.5 recommended
}

export function Parallax({ children, className, speed = 0.3 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const scrolled = window.scrollY;
      const elementTop = rect.top + scrolled;
      const relativeScroll = scrolled - elementTop + window.innerHeight;
      setOffset(relativeScroll * speed);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translateY(${offset}px)`,
      }}
    >
      {children}
    </div>
  );
}

// =====================================================
// 4. 缩放淡入效果 (Scale Fade)
// =====================================================

interface ScaleFadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  scale?: number;
}

export function ScaleFadeIn({
  children,
  className,
  delay = 0,
  scale = 0.95,
}: ScaleFadeInProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : `scale(${scale})`,
        transition: `opacity 0.6s ease-out ${delay}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

// =====================================================
// 5. 磨砂玻璃卡片 (Glassmorphism Card)
// =====================================================

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <div
      className={cn(
        'bg-white/70 dark:bg-black/50',
        'backdrop-blur-xl backdrop-saturate-150',
        'border border-white/20 dark:border-white/10',
        'rounded-2xl shadow-lg shadow-black/5',
        hover && 'transition-all duration-300 hover:shadow-xl hover:shadow-black/10 hover:scale-[1.02]',
        className
      )}
    >
      {children}
    </div>
  );
}

// =====================================================
// 6. 悬停缩放效果 (Hover Scale)
// =====================================================

interface HoverScaleProps {
  children: React.ReactNode;
  className?: string;
  scale?: number;
}

export function HoverScale({ children, className, scale = 1.02 }: HoverScaleProps) {
  return (
    <div
      className={cn(
        'transition-transform duration-300 ease-out',
        'hover:scale-[var(--hover-scale)]',
        className
      )}
      style={{ '--hover-scale': scale } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

// =====================================================
// 7. 打字机效果 (Type Writer)
// =====================================================

interface TypeWriterProps {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
  onComplete?: () => void;
}

export function TypeWriter({
  text,
  className,
  speed = 50,
  delay = 0,
  onComplete,
}: TypeWriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, started, onComplete]);

  return (
    <span className={className}>
      {displayedText}
      {started && displayedText.length < text.length && (
        <span className="animate-pulse">|</span>
      )}
    </span>
  );
}

// =====================================================
// 8. 数字滚动效果 (Count Up)
// =====================================================

interface CountUpProps {
  end: number;
  start?: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function CountUp({
  end,
  start = 0,
  duration = 2,
  className,
  suffix = '',
  prefix = '',
}: CountUpProps) {
  const [count, setCount] = useState(start);
  const ref = useRef<HTMLSpanElement>(null);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || hasAnimated) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = Date.now();
          const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / (duration * 1000), 1);
            // Easing function (ease-out)
            const easeOut = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(start + (end - start) * easeOut));
            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [end, start, duration, hasAnimated]);

  return (
    <span ref={ref} className={className}>
      {prefix}{count}{suffix}
    </span>
  );
}

// =====================================================
// 9. 页面过渡包装器 (Page Transition)
// =====================================================

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <div
      className={cn('animate-page-in', className)}
      style={{
        animation: 'pageIn 0.5s ease-out forwards',
      }}
    >
      {children}
    </div>
  );
}

// =====================================================
// 10. 悬浮卡片效果 (Floating Card)
// =====================================================

interface FloatingCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
}

export function FloatingCard({
  children,
  className,
  intensity = 'medium',
}: FloatingCardProps) {
  const intensityMap = {
    light: { translate: 'hover:-translate-y-1', shadow: 'hover:shadow-lg' },
    medium: { translate: 'hover:-translate-y-2', shadow: 'hover:shadow-xl' },
    strong: { translate: 'hover:-translate-y-3', shadow: 'hover:shadow-2xl' },
  };

  const { translate, shadow } = intensityMap[intensity];

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        translate,
        shadow,
        'hover:shadow-black/10',
        className
      )}
    >
      {children}
    </div>
  );
}
