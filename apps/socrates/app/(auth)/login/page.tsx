'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Brain, Home, Loader2, ShieldCheck, Sparkles, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';

type LoginMode = 'code' | 'password';

const features = [
  { icon: Brain, title: 'AI 苏格拉底', desc: '引导式学习，启发思考' },
  { icon: Target, title: '智能复习', desc: '艾宾浩斯曲线记忆法' },
  { icon: Sparkles, title: '个性分析', desc: '精准定位薄弱知识点' },
];

export default function LoginPage() {
  const router = useRouter();
  const { signIn, requestPhoneCode, verifyPhoneCode } = useAuth();

  const [mode, setMode] = useState<LoginMode>('code');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugCode, setDebugCode] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await signIn(phone, password);
      router.push('/select-profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请检查手机号和密码。');
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    setError('');
    setSuccess('');
    setDebugCode('');
    setSendingCode(true);

    try {
      const result = await requestPhoneCode({
        phone,
        purpose: 'login',
      });
      setSuccess('验证码已发送，请留意短信。');
      if (result.debugCode) {
        setDebugCode(result.debugCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码发送失败，请稍后重试。');
    } finally {
      setSendingCode(false);
    }
  };

  const handleCodeLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await verifyPhoneCode({
        phone,
        code,
        purpose: 'login',
      });
      router.push('/select-profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码登录失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-warm-50">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-warm-100 via-warm-50 to-warm-100 lg:flex lg:w-1/2">
        <div className="absolute inset-0">
          <div className="absolute left-20 top-20 h-72 w-72 rounded-full bg-warm-300/30 blur-3xl" />
          <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-warm-200/40 blur-3xl" />
        </div>

        <div
          className={cn(
            'relative z-10 flex flex-col justify-center px-16 transition-all duration-700',
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
          )}
        >
          <div className="mb-12 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-warm-100 bg-white shadow-lg shadow-warm-500/20">
              <Image src="/logo.png" alt="Socrates Logo" width={48} height={48} />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-warm-900">Socrates</h1>
              <p className="text-warm-600">AI 学习助手</p>
            </div>
          </div>

          <h2 className="mb-6 text-4xl font-bold leading-tight text-warm-900">
            登录方式
            <br />
            <span className="text-warm-500">更适合国内用户了</span>
          </h2>

          <p className="mb-12 max-w-md text-lg text-warm-700">
            现在默认支持手机号验证码快速登录，同时继续保留手机号加密码，兼容老用户使用习惯。
          </p>

          <div className="space-y-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className={cn(
                  'flex items-start gap-4 transition-all duration-500',
                  mounted ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0',
                )}
                style={{ transitionDelay: `${180 + index * 100}ms` }}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-warm-100 bg-white shadow-sm">
                  <feature.icon className="h-6 w-6 text-warm-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-warm-900">{feature.title}</h3>
                  <p className="text-sm text-warm-600">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center bg-white p-6 sm:p-12">
        <div
          className={cn(
            'w-full max-w-md transition-all duration-700',
            mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
          )}
        >
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-warm-100 bg-white shadow-lg shadow-warm-500/20">
              <Image src="/logo.png" alt="Socrates Logo" width={36} height={36} />
            </div>
            <span className="text-2xl font-bold text-warm-900">Socrates</span>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-warm-900">欢迎回来</h2>
            <p className="mt-2 text-warm-600">默认推荐手机号验证码登录，密码登录仍然可用。</p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-2 rounded-2xl bg-warm-100/70 p-1">
            <button
              type="button"
              onClick={() => setMode('code')}
              className={cn(
                'rounded-2xl px-4 py-3 text-sm font-medium transition',
                mode === 'code'
                  ? 'bg-white text-warm-900 shadow-sm'
                  : 'text-warm-600 hover:text-warm-900',
              )}
            >
              验证码登录
            </button>
            <button
              type="button"
              onClick={() => setMode('password')}
              className={cn(
                'rounded-2xl px-4 py-3 text-sm font-medium transition',
                mode === 'password'
                  ? 'bg-white text-warm-900 shadow-sm'
                  : 'text-warm-600 hover:text-warm-900',
              )}
            >
              密码登录
            </button>
          </div>

          {error ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          {debugCode ? (
            <div className="mb-4 rounded-2xl border border-dashed border-warm-300 bg-warm-50 p-4 text-sm text-warm-700">
              开发环境验证码：<span className="font-semibold">{debugCode}</span>
            </div>
          ) : null}

          {mode === 'code' ? (
            <form onSubmit={handleCodeLogin} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-warm-800">
                  手机号
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  pattern="[0-9]{11}"
                  maxLength={11}
                  required
                  disabled={loading || sendingCode}
                  className="h-12 rounded-2xl border-warm-200 bg-warm-50 text-base focus:border-warm-400 focus:ring-warm-400"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium text-warm-800">
                  验证码
                </label>
                <div className="flex gap-3">
                  <Input
                    id="code"
                    type="text"
                    placeholder="请输入 6 位验证码"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    inputMode="numeric"
                    maxLength={8}
                    required
                    disabled={loading}
                    className="h-12 rounded-2xl border-warm-200 bg-warm-50 text-base focus:border-warm-400 focus:ring-warm-400"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendCode}
                    disabled={loading || sendingCode || phone.length !== 11}
                    className="h-12 min-w-[110px] rounded-2xl border-warm-200 bg-white text-warm-700 hover:bg-warm-50"
                  >
                    {sendingCode ? <Loader2 className="h-4 w-4 animate-spin" /> : '获取验证码'}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-full bg-warm-500 text-base font-medium text-white shadow-lg shadow-warm-500/30 hover:bg-warm-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '验证码登录'
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handlePasswordLogin} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="password-phone" className="text-sm font-medium text-warm-800">
                  手机号
                </label>
                <Input
                  id="password-phone"
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  pattern="[0-9]{11}"
                  maxLength={11}
                  required
                  disabled={loading}
                  className="h-12 rounded-2xl border-warm-200 bg-warm-50 text-base focus:border-warm-400 focus:ring-warm-400"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-warm-800">
                  密码
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="•••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={loading}
                  className="h-12 rounded-2xl border-warm-200 bg-warm-50 text-base focus:border-warm-400 focus:ring-warm-400"
                />
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-full bg-warm-500 text-base font-medium text-white shadow-lg shadow-warm-500/30 hover:bg-warm-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '密码登录'
                )}
              </Button>
            </form>
          )}

          <div className="my-8 rounded-2xl border border-warm-100 bg-warm-50/60 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 text-warm-500" />
              <div>
                <p className="text-sm font-medium text-warm-900">微信扫码登录会作为下一阶段加入</p>
                <p className="mt-1 text-sm leading-6 text-warm-600">
                  当前先完成手机号验证码主链路，微信登录和支付后自动承接会在后续阶段接入。
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-warm-600">
              还没有账户？
              <Link
                href="/register"
                className="ml-1 font-semibold text-warm-600 underline underline-offset-4 hover:text-warm-700"
              >
                立即注册
              </Link>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-warm-400">
            登录即表示同意平台的服务条款与隐私政策。
          </p>

          <div className="mt-6 text-center">
            <a
              href="https://socra.cn"
              className="inline-flex items-center gap-2 text-sm text-warm-500 transition-colors hover:text-warm-700"
            >
              <Home className="h-4 w-4" />
              返回首页
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
