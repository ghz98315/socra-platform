// =====================================================
// Socra Platform - Terms of Service Page
// 用户协议页面
// =====================================================

import { Metadata } from 'next';
import Link from 'next/link';
import { FileText, Scale, AlertTriangle, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: '用户协议 - Socrates',
  description: 'Socrates 用户协议，了解使用我们服务的条款和条件',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-warm-600 hover:text-warm-700 font-medium">
            ← 返回首页
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-warm-100 flex items-center justify-center">
            <FileText className="w-8 h-8 text-warm-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">用户协议</h1>
          <p className="text-gray-500">最后更新：2026年3月9日</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">协议说明</h2>
            <p className="text-gray-600 leading-relaxed">
              欢迎使用 Socrates 学习平台（以下简称"本服务"）。在使用本服务前，请仔细阅读以下条款。
              使用本服务即表示您同意遵守本协议的所有条款。如果您不同意这些条款，请勿使用本服务。
            </p>
          </section>

          {/* Service Description */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">服务内容</h2>
            <p className="text-gray-600 leading-relaxed mb-4">Socrates 是一款 AI 驱动的学习辅助工具，提供以下功能：</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>错题拍照识别与管理</li>
              <li>AI 苏格拉底式对话学习</li>
              <li>智能复习计划（艾宾浩斯遗忘曲线）</li>
              <li>学习报告与数据分析</li>
              <li>作文批改与点评</li>
              <li>时间规划与专注模式</li>
            </ul>
          </section>

          {/* Account */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">账户注册与使用</h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                <strong>注册要求：</strong>您需要提供有效的手机号码进行注册。
                对于18岁以下用户，需要家长或监护人的同意。
              </p>
              <p className="leading-relaxed">
                <strong>账户安全：</strong>您有责任保护账户密码的安全。
                对于账户下的所有活动，您需承担全部责任。
              </p>
              <p className="leading-relaxed">
                <strong>真实信息：</strong>您同意提供真实、准确的信息，并及时更新。
              </p>
            </div>
          </section>

          {/* User Conduct */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">用户行为规范</h2>
            <p className="text-gray-600 leading-relaxed mb-4">使用本服务时，您同意不会：</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>违反任何适用的法律法规</li>
              <li>侵犯他人的知识产权或其他权利</li>
              <li>上传、传播有害、违法或不当内容</li>
              <li>尝试破坏或干扰服务的正常运行</li>
              <li>使用自动化工具（如爬虫、机器人）访问服务</li>
              <li>将账户转让、出借给他人使用</li>
              <li>利用服务进行商业欺诈或其他违法活动</li>
            </ul>
          </section>

          {/* AI Content */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">AI 生成内容声明</h2>
            <div className="bg-amber-50 rounded-lg p-4 mb-4">
              <p className="text-amber-800 text-sm">
                <strong>重要提示：</strong>AI 生成的内容仅供参考，不构成专业教育建议。
                学习者应结合学校教学内容和教师指导进行学习。
              </p>
            </div>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>AI 回答可能存在不准确或不完整的情况</li>
              <li>对于重要知识点，建议向教师或专业人士确认</li>
              <li>我们持续优化 AI 模型，但不保证所有回答的正确性</li>
            </ul>
          </section>

          {/* Subscription */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">订阅与付费</h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                <strong>免费服务：</strong>基础功能免费使用，每日有 AI 对话次数限制。
              </p>
              <p className="leading-relaxed">
                <strong>Pro 会员：</strong>订阅后可解锁无限 AI 对话、高级复习计划等功能。
              </p>
              <p className="leading-relaxed">
                <strong>退款政策：</strong>订阅后7天内且未大量使用 Pro 功能，可申请全额退款。
              </p>
              <p className="leading-relaxed">
                <strong>自动续费：</strong>月付/年付会员到期后将自动续费，您可随时取消。
              </p>
            </div>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">知识产权</h2>
            <div className="space-y-4 text-gray-600">
              <p className="leading-relaxed">
                <strong>服务内容：</strong>本服务中的软件、设计、文本、图片等内容归我们所有或经授权使用。
              </p>
              <p className="leading-relaxed">
                <strong>用户内容：</strong>您上传的错题、笔记等内容，您保留所有权。
                您授权我们使用这些内容来提供和改进服务。
              </p>
            </div>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">隐私保护</h2>
            <p className="text-gray-600 leading-relaxed">
              我们重视您的隐私。关于我们如何收集、使用和保护您的个人信息，
              请参阅我们的{' '}
              <Link href="/privacy" className="text-warm-600 hover:underline">
                隐私政策
              </Link>
              。
            </p>
          </section>

          {/* Disclaimer */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">免责声明</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>我们不保证服务将不间断、无错误或安全</li>
              <li>对于因使用或无法使用服务导致的任何损失，我们不承担责任</li>
              <li>对于第三方链接或服务，我们不承担任何责任</li>
              <li>我们保留随时修改或终止服务的权利</li>
            </ul>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">协议终止</h2>
            <p className="text-gray-600 leading-relaxed">
              您可以随时删除账户来终止本协议。如果您违反本协议，
              我们有权暂停或终止您的账户访问权限，且无需事先通知。
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">协议修改</h2>
            <p className="text-gray-600 leading-relaxed">
              我们可能不时修改本协议。修改后的协议将在本页面公布。
              重大变更时，我们会通过应用内通知或邮件告知您。
              继续使用服务即表示您接受修改后的协议。
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">联系我们</h2>
            <p className="text-gray-600 leading-relaxed">
              如果您对本协议有任何疑问，请通过以下方式联系我们：
            </p>
            <p className="text-gray-600 mt-2">
              电子邮箱：<a href="mailto:support@socra.cn" className="text-warm-600 hover:underline">support@socra.cn</a>
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2026 Socrates。保留所有权利。</p>
        </div>
      </footer>
    </div>
  );
}
