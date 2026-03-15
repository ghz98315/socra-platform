'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';

import { AvatarPicker } from '@/components/AvatarPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { defaultAvatarByRole } from '@/lib/avatar-options';
import { useAuth } from '@/lib/contexts/AuthContext';
import { cn } from '@/lib/utils';

const benefits = [
  'AI 引导式学习提问',
  '错题分析与复习计划',
  '作文批改与原文批注',
  '家长可随时查看学习进度',
];

export default function RegisterPageV3() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [studentAvatar, setStudentAvatar] = useState(defaultAvatarByRole.student);
  const [parentAvatar, setParentAvatar] = useState(defaultAvatarByRole.parent);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

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
      router.push('/select-profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试。');
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
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
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
              先选好两套头像
              <br />
              <span className="text-warm-500">后续切换角色更顺手</span>
            </h2>

            <p className="mb-10 max-w-md text-lg leading-8 text-warm-700">
              注册时一次选好学生头像和家长头像。后面切换角色时系统会自动带出对应头像，角色页不再重复选择。
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit}
                  className={cn(
                    'flex items-center gap-3 transition-all duration-500',
                    mounted ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
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
              mounted ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
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
              <p className="mt-2 text-warm-600">注册时一次选好学生头像和家长头像，后面角色页保持简洁。</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              ) : null}

              <div className="grid gap-5 xl:grid-cols-2">
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
                    onChange={(e) => setDisplayName(e.target.value)}
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
                    onChange={(e) => setPhone(e.target.value)}
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
                    onChange={(e) => setPassword(e.target.value)}
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
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 rounded-2xl border-warm-200 bg-warm-50 text-base focus:border-warm-400 focus:ring-warm-400"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="h-12 w-full rounded-full bg-warm-500 text-base font-medium text-white shadow-lg shadow-warm-500/30 transition-all hover:scale-[1.01] hover:bg-warm-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    注册中...
                  </>
                ) : (
                  '创建账号'
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-warm-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs uppercase tracking-[0.2em] text-warm-400">
                  或
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-warm-600">
                已有账号？
                <Link
                  href="/login"
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
