// =====================================================
// Socra Platform - Privacy Policy Page
// 隐私政策页面
// =====================================================

import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, Eye, Database, Bell, UserCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: '隐私政策 - Socrates',
  description: 'Socrates 隐私政策，了解我们如何收集、使用和保护您的个人信息',
};

export default function PrivacyPage() {
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
            <Shield className="w-8 h-8 text-warm-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">隐私政策</h1>
          <p className="text-gray-500">最后更新：2026年3月9日</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl p-8 shadow-sm space-y-8">
          {/* Introduction */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">引言</h2>
            <p className="text-gray-600 leading-relaxed">
              欢迎使用 Socrates（以下简称"我们"或"本服务"）。我们非常重视您的隐私保护。
              本隐私政策说明了我们如何收集、使用、存储和保护您的个人信息。
            </p>
          </section>

          {/* Data Collection */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">信息收集</h2>
            <p className="text-gray-600 leading-relaxed mb-4">我们收集以下类型的信息：</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>账户信息：</strong>手机号、密码（加密存储）、昵称、头像</li>
              <li><strong>学习数据：</strong>错题记录、学习进度、复习记录、AI对话历史</li>
              <li><strong>使用数据：</strong>访问日志、设备信息、IP地址</li>
              <li><strong>支付信息：</strong>订单记录（不存储完整支付凭证）</li>
            </ul>
          </section>

          {/* Data Usage */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">信息使用</h2>
            <p className="text-gray-600 leading-relaxed mb-4">我们使用收集的信息用于：</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>提供、维护和改进我们的服务</li>
              <li>个性化学习体验和AI对话</li>
              <li>生成学习报告和数据分析</li>
              <li>发送服务相关通知（如复习提醒）</li>
              <li>保障账户安全，防止欺诈行为</li>
            </ul>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">安全措施</h2>
            <p className="text-gray-600 leading-relaxed mb-4">我们采取以下措施保护您的数据：</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li>数据传输使用 SSL/TLS 加密</li>
              <li>密码使用单向哈希存储</li>
              <li>定期进行安全审计和漏洞测试</li>
              <li>严格的员工数据访问控制</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">数据共享</h2>
            <p className="text-gray-600 leading-relaxed">
              我们不会出售您的个人信息。我们仅在以下情况下共享数据：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
              <li><strong>服务提供商：</strong>帮助我们运营服务的第三方（如云服务、支付处理）</li>
              <li><strong>法律要求：</strong>法律法规要求或法律程序需要时</li>
              <li><strong>业务转让：</strong>合并、收购或资产出售时（会通知您）</li>
            </ul>
          </section>

          {/* Children Privacy */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">儿童隐私保护</h2>
            <p className="text-gray-600 leading-relaxed">
              我们的服务面向学生用户。对于18岁以下用户，我们要求家长或监护人：
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4 mt-2">
              <li>审核并同意本隐私政策</li>
              <li>监督子女的使用行为</li>
              <li>定期检查子女的学习数据</li>
            </ul>
            <p className="text-gray-600 mt-4">
              我们提供<strong>青少年模式</strong>，家长可以设置使用时长限制、内容过滤等级等。
            </p>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">您的权利</h2>
            <p className="text-gray-600 leading-relaxed mb-4">您对您的个人信息享有以下权利：</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
              <li><strong>访问权：</strong>您可以查看我们持有的您的个人信息</li>
              <li><strong>更正权：</strong>您可以更新或更正不准确的信息</li>
              <li><strong>删除权：</strong>您可以请求删除您的账户和相关数据</li>
              <li><strong>导出权：</strong>您可以导出您的学习数据</li>
              <li><strong>撤回同意权：</strong>您可以随时撤回之前给予的同意</li>
            </ul>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">联系我们</h2>
            <p className="text-gray-600 leading-relaxed">
              如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：
            </p>
            <p className="text-gray-600 mt-2">
              电子邮箱：<a href="mailto:privacy@socra.cn" className="text-warm-600 hover:underline">privacy@socra.cn</a>
            </p>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">政策更新</h2>
            <p className="text-gray-600 leading-relaxed">
              我们可能不时更新本隐私政策。重大变更时，我们会通过应用内通知或邮件告知您。
              继续使用本服务即表示您接受更新后的政策。
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
