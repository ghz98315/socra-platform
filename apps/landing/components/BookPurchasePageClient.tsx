'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

export default function BookPurchasePage() {
  return (
    <>
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 md:py-24">
        <Link
          href="/book"
          className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 transition-colors hover:text-neutral-900 md:mb-12"
        >
          <ArrowLeft className="w-4 h-4" /> 返回书籍详情
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
          <p className="mb-4 text-sm text-neutral-500 sm:text-base">
            包含电子书完整版阅读权限 + Socrates 1 个月会员权益。
          </p>

          <div className="mb-8 rounded-2xl border border-[#f2dfd4] bg-[#fff8f3] px-6 py-4">
            <p className="text-sm text-neutral-600 sm:text-base">
              书籍费用：
              <strong className="ml-2 text-2xl font-bold text-neutral-900 sm:text-3xl">¥39.9</strong>
            </p>
          </div>

          <div className="mb-8 flex justify-center">
            <div className="rounded-[28px] border border-neutral-200 bg-neutral-50 p-4 shadow-sm">
              <div className="overflow-hidden rounded-2xl bg-white">
                <Image
                  src="/guan.png"
                  alt="微信付款码"
                  width={320}
                  height={320}
                  className="h-64 w-64 object-cover sm:h-72 sm:w-72"
                  priority
                />
              </div>
              <p className="mt-4 text-sm text-neutral-500">扫码付款，或添加本人微信号联系</p>
              <p className="mt-2 text-base font-semibold text-neutral-900 sm:text-lg">
                微信号：<span className="select-all">guan98315</span>
              </p>
            </div>
          </div>

          <div className="mx-auto max-w-lg rounded-2xl border border-neutral-100 bg-neutral-50 p-6 text-left sm:p-8">
            <h3 className="mb-5 font-bold text-neutral-900">付款说明</h3>
            <ul className="space-y-5">
              <li className="flex items-start gap-3 text-sm text-neutral-600 sm:text-base">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 font-mono text-xs text-neutral-700">
                  1
                </div>
                <span>
                  请使用上方二维码付款，或直接添加本人微信号：
                  <strong className="text-neutral-900 select-all">guan98315</strong>。
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-neutral-600 sm:text-base">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 font-mono text-xs text-neutral-700">
                  2
                </div>
                <span>付款后，请将付款截图和申请开通的手机号发送给本人。</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-neutral-600 sm:text-base">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-200 font-mono text-xs text-neutral-700">
                  3
                </div>
                <span>确认付款后，我会手工为你开通电子书完整版阅读权限，并同步开通 1 个月的 Socrates 会员权益。</span>
              </li>
            </ul>
          </div>

          <div className="mx-auto mt-10 max-w-lg border-t border-neutral-100 pt-8 text-left text-xs leading-relaxed text-neutral-500 sm:text-sm">
            <p className="mb-2">
              <strong className="text-neutral-700">温馨提示：</strong>
            </p>
            <p className="mb-2">1. 当前为人工确认开通，非自动到账。确认付款后会尽快处理。</p>
            <p className="mb-2">2. 首发套装包含电子书完整版阅读权限 + Socrates 1 个月会员权益。</p>
            <p>3. 1 个月体验结束后，如需继续使用 Socrates 会员功能，可再单独续费。</p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
