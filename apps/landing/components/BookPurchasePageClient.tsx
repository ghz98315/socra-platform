'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

export default function BookPurchasePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-24">
      <Link
        href="/book"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 md:mb-12"
      >
        <ArrowLeft className="h-4 w-4" />
        返回书籍详情
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl border border-neutral-200 bg-white p-6 text-center shadow-sm sm:p-8 md:p-12"
      >
        <h1 className="mb-4 font-serif text-2xl font-bold text-neutral-900 md:text-3xl">
          购买《从错误开始》
        </h1>
        <p className="mb-8 text-sm text-neutral-500 sm:text-base">
          包含电子书永久阅读权限 + Socrates 1 个月会员权益。
        </p>

        <div className="mb-8 flex justify-center">
          <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-4 shadow-sm">
            <div className="overflow-hidden rounded-2xl bg-white">
              <Image
                src="/guan.png"
                alt="微信收款二维码"
                width={320}
                height={320}
                className="h-64 w-64 object-cover sm:h-72 sm:w-72"
                priority
              />
            </div>
            <p className="mt-4 text-sm text-neutral-500">
              请添加上方二维码微信号，或直接添加本人微信号
            </p>
            <p className="mt-2 text-base font-semibold text-neutral-900 sm:text-lg">
              微信号：<span className="select-all">guan98315</span>
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-xl rounded-2xl border border-neutral-100 bg-neutral-50 p-6 text-left sm:p-8">
          <h3 className="mb-5 font-bold text-neutral-900">付款说明</h3>
          <ul className="space-y-5">
            <li className="flex items-start gap-3 text-sm text-neutral-600 sm:text-base">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 font-mono text-xs text-neutral-700">
                1
              </div>
              <span>
                首次开通权限费用：<strong className="text-neutral-900">39.9元</strong>。
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm text-neutral-600 sm:text-base">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 font-mono text-xs text-neutral-700">
                2
              </div>
              <span>
                请添加上方二维码微信号，或直接添加本人微信号：
                <strong className="select-all text-neutral-900">guan98315</strong>。
              </span>
            </li>
            <li className="flex items-start gap-3 text-sm text-neutral-600 sm:text-base">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 font-mono text-xs text-neutral-700">
                3
              </div>
              <span>付款后，请将付款截图和申请开通的手机号发送给本人。</span>
            </li>
            <li className="flex items-start gap-3 text-sm text-neutral-600 sm:text-base">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 font-mono text-xs text-neutral-700">
                4
              </div>
              <span>
                确认付款后，会在2小时内开通电子版书籍永久阅读权限，并同步开通1个月的
                socrates系统和会员权限。
              </span>
            </li>
          </ul>
        </div>

        <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-amber-100 bg-amber-50 p-6 text-left sm:p-8">
          <h3 className="mb-5 font-bold text-amber-900">温馨提示</h3>
          <ul className="space-y-4 text-sm text-amber-900/80 sm:text-base">
            <li>1. 当前为人工确认开通，非自动到账，请在付款后耐心等待处理。</li>
            <li>2. 本次开通包含电子版书籍永久阅读权限，以及 1 个月的 Socrates 系统会员权益。</li>
            <li>3. 会员体验期结束后，如需继续使用 Socrates 系统会员功能，可再单独续费。</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
