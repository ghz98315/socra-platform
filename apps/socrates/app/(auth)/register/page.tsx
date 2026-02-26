// =====================================================
// Project Socrates - Register Page
// Apple-style Modern Design
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trophy, Sparkles, Brain, Target, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 验证手机号
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('请输入正确的手机号');
      return;
    }

    // 验证密码
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为 6 位');
      return;
    }

    setLoading(true);

    try {
      // 调用服务端注册 API
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          password,
          display_name: displayName || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '注册失败，请稍后重试');
      }

      // 注册成功后自动登录
      await signIn(phone, password);

      // 跳转到选择角色页面
      router.push('/select-profile');
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败，请稍后重试';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'AI 苏格拉底式引导学习',
    '智能错题分析与复习计划',
    '个性化学习报告',
    '家长实时掌握学习进度',
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div
            className={cn(
              "transition-all duration-700",
              mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            )}
          >
            {/* Logo */}
            <div className="flex items-center gap-4 mb-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Socrates</h1>
                <p className="text-muted-foreground">AI 学习助手</p>
              </div>
            </div>

            {/* Hero Text */}
            <h2 className="text-4xl font-bold leading-tight mb-6">
              开启你的
              <br />
              <span className="text-primary">AI学习之旅</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-12 max-w-md">
              注册即可享受全方位的智能学习体验，让每一次学习都有所收获。
            </p>

            {/* Benefits List */}
            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit}
                  className={cn(
                    "flex items-center gap-3 transition-all duration-500",
                    mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  )}
                  style={{ transitionDelay: `${200 + index * 100}ms` }}
                >
                  <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-muted-foreground">{benefit}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="mt-12 pt-8 border-t border-border/30 grid grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold text-primary">10K+</div>
                <div className="text-sm text-muted-foreground">活跃学生</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">50K+</div>
                <div className="text-sm text-muted-foreground">错题已分析</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">98%</div>
                <div className="text-sm text-muted-foreground">满意度</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-background">
        <div
          className={cn(
            "w-full max-w-md transition-all duration-700",
            mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          )}
        >
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/25">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold">Socrates</span>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">创建账户</h2>
            <p className="text-muted-foreground">开启你的 AI 学习之旅</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium">
                昵称 <span className="text-muted-foreground font-normal">(可选)</span>
              </label>
              <Input
                id="displayName"
                type="text"
                placeholder="你的昵称"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={loading}
                className="rounded-xl h-12 text-base bg-muted/50 border-border/50 focus:bg-background transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                手机号
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入11位手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                pattern="[0-9]{11}"
                maxLength={11}
                required
                disabled={loading}
                className="rounded-xl h-12 text-base bg-muted/50 border-border/50 focus:bg-background transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                密码
              </label>
              <Input
                id="password"
                type="password"
                placeholder="至少 6 位"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="rounded-xl h-12 text-base bg-muted/50 border-border/50 focus:bg-background transition-colors"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                确认密码
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                className="rounded-xl h-12 text-base bg-muted/50 border-border/50 focus:bg-background transition-colors"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-medium btn-press mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  创建中...
                </>
              ) : (
                '创建账户'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">或</span>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-muted-foreground">
              已有账户？{' '}
              <Link
                href="/login"
                className="text-primary font-medium hover:underline"
              >
                立即登录
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            注册即表示同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  );
}
