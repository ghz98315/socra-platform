// =====================================================
// Project Socrates - Login Page
// Apple-style Modern Design
// =====================================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Trophy, Sparkles, Brain, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(phone, password);
      router.push('/select-profile');
    } catch (err) {
      const message = err instanceof Error ? err.message : '登录失败，请检查手机号和密码';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Brain, title: 'AI苏格拉底', desc: '引导式学习，启发思考' },
    { icon: Target, title: '智能复习', desc: '艾宾浩斯曲线记忆法' },
    { icon: Sparkles, title: '个性分析', desc: '精准定位薄弱知识点' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
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
              让学习成为
              <br />
              <span className="text-primary">一场对话</span>
            </h2>

            <p className="text-lg text-muted-foreground mb-12 max-w-md">
              基于苏格拉底式提问法，引导你主动思考，真正理解每一个知识点。
            </p>

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className={cn(
                    "flex items-start gap-4 transition-all duration-500",
                    mounted ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  )}
                  style={{ transitionDelay: `${200 + index * 100}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center shadow-sm">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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
            <h2 className="text-2xl font-bold mb-2">欢迎回来</h2>
            <p className="text-muted-foreground">登录你的学习账户</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-destructive/10 text-destructive text-sm border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">
                手机号
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
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
                placeholder="•••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="rounded-xl h-12 text-base bg-muted/50 border-border/50 focus:bg-background transition-colors"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl text-base font-medium btn-press"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">或</span>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center">
            <p className="text-muted-foreground">
              还没有账户？{' '}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline"
              >
                立即注册
              </Link>
            </p>
          </div>

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center mt-8">
            登录即表示同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  );
}
