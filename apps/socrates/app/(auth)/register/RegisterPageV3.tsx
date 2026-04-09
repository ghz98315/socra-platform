'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, Loader2, ShieldCheck } from 'lucide-react';

import { AvatarPicker } from '@/components/AvatarPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { defaultAvatarByRole } from '@/lib/avatar-options';
import { useAuth } from '@/lib/contexts/AuthContext';
import { buildAuthPageHref, readEntryParams, resolveEntryDestination } from '@/lib/navigation/entry-intent';
import { cn } from '@/lib/utils';

type RegisterMode = 'code' | 'password';

const benefits = [
  'AI 引导式学习提问',
  '错题分析与复习计划',
  '作文批改与原文批注',
  '家长可随时查看学习进度',
];

function RegisterPageV3Content() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, requestPhoneCode, verifyPhoneCode } = useAuth();
  const entryParams = readEntryParams(searchParams);
  const loginHref = buildAuthPageHref('/login', entryParams);
  const successDestination = resolveEntryDestination(entryParams);

  const [mode, setMode] = useState<RegisterMode>('code');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [code, setCode] = useState('');
  const [studentAvatar, setStudentAvatar] = useState(defaultAvatarByRole.student);
  const [parentAvatar, setParentAvatar] = useState(defaultAvatarByRole.parent);
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugCode, setDebugCode] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePasswordRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('请输入正确的 11 位手机号。');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致。');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少 6 位。');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone,
          password,
          display_name: displayName || undefined,
          avatar_url: studentAvatar,
          student_avatar_url: studentAvatar,
          parent_avatar_url: parentAvatar,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '注册失败，请稍后重试。');
      }

      await signIn(phone, password);
      router.replace(successDestination);
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试。');
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
        purpose: 'register',
        displayName: displayName || undefined,
        avatarUrl: studentAvatar,
        studentAvatarUrl: studentAvatar,
        parentAvatarUrl: parentAvatar,
      });
      setSuccess('验证码已发送，验证后将直接创建账号。');
      if (result.debugCode) {
        setDebugCode(result.debugCode);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码发送失败，请稍后重试。');
    } finally {
      setSendingCode(false);
    }
  };

  const handleCodeRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await verifyPhoneCode({
        phone,
        code,
        purpose: 'register',
      });
      router.replace(successDestination);
    } catch (err) {
      setError(err instanceof Error ? err.message : '验证码注册失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50">
      <div className="flex min-h-screen">
        <div className="relative hidden overflow-hidden bg-gradient-to-br from-warm-100 via-white to-orange-50 lg:flex lg:w-[46%]">
          <div className="absolute inset-0">
            <div className="absolute left-14 top-16 h-72 w-72 rounded-full bg-warm-300/20 blur-3xl" />
            <div className="absolute bottom-8 right-8 h-80 w-80 rounded-full bg-orange-200/25 blur-3xl" />
          </div>

          <div
            className={cn(
              'relative z-10 flex max-w-xl flex-col justify-center px-16 transition-all duration-700',
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
            )}
          >
            <div className="mb-12 flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-warm-100 bg-white shadow-lg shadow-warm-500/10">
                <Image src="/logo.png" alt="Socrates Logo" width={48} height={48} />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-warm-900">Socrates</h1>
                <p className="text-warm-600">AI 学习助手</p>
              </div>
            </div>

            <h2 className="mb-5 text-4xl font-bold leading-tight text-warm-900">
              注册方式
              <br />
              <span className="text-warm-500">开始切向验证码优先</span>
            </h2>

            <p className="mb-10 max-w-md text-lg leading-8 text-warm-700">
              默认推荐手机号验证码注册，同时完整保留手机号加密码方式。头像配置继续保留，后面角色切换仍然顺手。
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit}
                  className={cn(
                    'flex items-center gap-3 transition-all duration-500',
                    mounted ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0',
                  )}
                  style={{ transitionDelay: `${150 + index * 80}ms` }}
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border border-warm-200 bg-white">
                    <Check className="h-3.5 w-3.5 text-warm-500" />
                  </div>
                  <span className="text-warm-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center bg-white px-6 py-10 sm:px-10 lg:px-14">
          <div
            className={cn(
              'w-full max-w-2xl transition-all duration-700',
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
            )}
          >
            <div className="mb-8 text-center lg:hidden">
              <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-warm-100 bg-white shadow-lg shadow-warm-500/10">
                <Image src="/logo.png" alt="Socrates Logo" width={40} height={40} />
              </div>
              <h1 className="text-2xl font-bold text-warm-900">Socrates</h1>
            </div>

            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-warm-900">创建账号</h2>
              <p className="mt-2 text-warm-600">验证码注册优先，密码注册保留，学生与家长头像配置继续一起完成。</p>
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
                验证码注册
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
                密码注册
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

            <div className="mb-6 grid gap-5 xl:grid-cols-2">
              <div className="rounded-[28px] border border-warm-100 bg-gradient-to-b from-warm-50 to-white p-5">
                <AvatarPicker
                  selectedAvatar={studentAvatar}
                  onChange={setStudentAvatar}
                  roleFilter="student"
                  title="学生头像"
                  description="用于学生端工作台、错题本、复习等页面。"
                  avatarClassName="size-24"
                />
              </div>
              <div className="rounded-[28px] border border-warm-100 bg-gradient-to-b from-orange-50 to-white p-5">
                <AvatarPicker
                  selectedAvatar={parentAvatar}
                  onChange={setParentAvatar}
                  roleFilter="parent"
                  title="家长头像"
                  description="用于家长端任务、家庭、报告等页面。"
                  avatarClassName="size-24"
                />
              </div>
            </div>

            {mode === 'code' ? (
              <form onSubmit={handleCodeRegister} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="displayName" className="text-sm font-medium text-warm-800">
                      昵称
                      <span className="ml-1 font-normal text-warm-400">可选</span>
                    </label>
                    <Input
                      id="displayName"
                      type="text"
                      placeholder="输入你的昵称"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      disabled={loading || sendingCode}
                      className="h-12 rounded-2xl border-warm-200 bg-warm-50 text-base focus:border-warm-400 focus:ring-warm-400"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="code-phone" className="text-sm font-medium text-warm-800">
                      手机号
                    </label>
                    <Input
                      id="code-phone"
                      type="tel"
                      placeholder="请输入 11 位手机号"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      pattern="[0-9]{11}"
                      maxLength={11}
                      required
                      disabled={loading || sendingCode}
                      className="h-12 rounded-2xl border-warm-200 bg-warm-50 text-base focus:border-warm-400 focus:ring-warm-400"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="code" className="text-sm font-medium text-warm-800">
                      验证码
                    </label>
                    <div className="flex gap-3">
                      <Input
                        id="code"
                        type="text"
                        placeholder="请输入 6 到 8 位验证码"
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
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-full bg-warm-500 text-base font-medium text-white shadow-lg shadow-warm-500/30 hover:scale-[1.01] hover:bg-warm-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      注册中...
                    </>
                  ) : (
                    '验证码注册'
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePasswordRegister} className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="password-displayName" className="text-sm font-medium text-warm-800">
                      昵称
                      <span className="ml-1 font-normal text-warm-400">可选</span>
                    </label>
                    <Input
                      id="password-displayName"
                      type="text"
                      placeholder="输入你的昵称"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      disabled={loading}
                      className="h-12 rounded-2xl border-warm-200 bg-warm-50 text-base focus:border-warm-400 focus:ring-warm-400"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <label htmlFor="phone" className="text-sm font-medium text-warm-800">
                      手机号
                    </label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="请输入 11 位手机号"
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
                      placeholder="至少 6 位"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      required
                      disabled={loading}
                      className="h-12 rounded-2xl border-warm-200 bg-warm-50 text-base focus:border-warm-400 focus:ring-warm-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-warm-800">
                      确认密码
                    </label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="再次输入密码"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      required
                      disabled={loading}
                      className="h-12 rounded-2xl border-warm-200 bg-warm-50 text-base focus:border-warm-400 focus:ring-warm-400"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-12 w-full rounded-full bg-warm-500 text-base font-medium text-white shadow-lg shadow-warm-500/30 hover:scale-[1.01] hover:bg-warm-600"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      注册中...
                    </>
                  ) : (
                    '密码注册'
                  )}
                </Button>
              </form>
            )}

            <div className="my-6 rounded-2xl border border-warm-100 bg-warm-50/60 p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-warm-500" />
                <div>
                  <p className="text-sm font-medium text-warm-900">微信扫码注册会在下一阶段接入</p>
                  <p className="mt-1 text-sm leading-6 text-warm-600">
                    当前先把手机号验证码主链路做好，同时继续保留密码注册，后续再接微信扫码与支付成功自动承接。
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-warm-600">
                已有账号？
                <Link
                  href={loginHref}
                  className="ml-1 font-semibold text-warm-600 underline underline-offset-4 hover:text-warm-700"
                >
                  立即登录
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-warm-400">
              注册即表示你同意平台的服务条款与隐私政策。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPageV3() {
  return (
    <Suspense fallback={null}>
      <RegisterPageV3Content />
    </Suspense>
  );
}
