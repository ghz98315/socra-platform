'use client';

import { motion } from 'motion/react';
import { ArrowLeft, QrCode } from 'lucide-react';
import Link from 'next/link';

export default function BookPurchasePage() {
  return (
    <>
<div className="py-12 md:py-24 px-4 sm:px-6 max-w-3xl mx-auto">
      <Link href="/book" className="inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 mb-8 md:mb-12 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回书籍详情
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white border border-neutral-200 rounded-3xl p-6 sm:p-8 md:p-12 shadow-sm text-center"
      >
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-neutral-900 mb-4">
          购买《从错误开始》首发套装
        </h1>
        <p className="text-neutral-500 mb-8 text-sm sm:text-base">
          包含电子书（永久买断） + Socrates 错题系统 1 个月使用权益。
        </p>

        <div className="flex justify-center mb-8">
          {/* Placeholder for QR Code - Replace with actual image later */}
          <div className="w-48 h-48 sm:w-56 sm:h-56 bg-neutral-50 rounded-2xl border-2 border-dashed border-neutral-300 flex flex-col items-center justify-center text-neutral-400 p-4">
            <QrCode className="w-12 h-12 mb-3 text-neutral-300" />
            <span className="text-sm font-medium text-neutral-500">请在此处替换微信/支付宝收款码</span>
          </div>
        </div>

        <div className="text-3xl sm:text-4xl font-bold text-neutral-900 mb-8">
          ¥ 39.9
        </div>

        <div className="bg-neutral-50 rounded-2xl p-6 sm:p-8 text-left max-w-md mx-auto border border-neutral-100">
          <h3 className="font-bold text-neutral-900 mb-5">获取流程：</h3>
          <ul className="space-y-5">
            <li className="flex items-start gap-3 text-neutral-600 text-sm sm:text-base">
              <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0 font-mono text-xs mt-0.5">1</div>
              <span>使用微信或支付宝扫描上方二维码完成支付。</span>
            </li>
            <li className="flex items-start gap-3 text-neutral-600 text-sm sm:text-base">
              <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0 font-mono text-xs mt-0.5">2</div>
              <span>添加作者微信：<strong className="text-neutral-900 select-all">[你的微信号]</strong>，并发送支付截图。</span>
            </li>
            <li className="flex items-start gap-3 text-neutral-600 text-sm sm:text-base">
              <div className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0 font-mono text-xs mt-0.5">3</div>
              <span>核实后，我将发送电子书及配套模板，并为您开通 1 个月的 Socrates 系统使用权益。</span>
            </li>
          </ul>
        </div>

        <div className="mt-10 pt-8 border-t border-neutral-100 text-xs sm:text-sm text-neutral-500 text-left max-w-md mx-auto leading-relaxed">
          <p className="mb-2"><strong className="text-neutral-700">温馨提示：</strong></p>
          <p className="mb-2">1. <strong>首发套装包含：</strong>电子书永久阅读权 + Socrates 系统首月体验。1个月期满后，Socrates 系统可按季度续订（¥69/季度）。</p>
          <p>2. 强烈建议“心法（本书）+ 落地工具（Socrates）”搭配使用，效果最佳。当然，仅阅读本书掌握心法，配合赠送的纸质模板，依然能帮你建立完整的错题闭环。</p>
        </div>
      </motion.div>
    </div>
    </>
  );
}


