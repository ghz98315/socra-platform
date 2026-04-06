import PrivacyPolicyPageClient from '../../components/PrivacyPolicyPageClient';
import SiteLayout from '../../components/SiteLayout';
import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: '隐私政策',
  description: 'Socrates 隐私政策说明了我们如何收集、使用、存储和保护您的个人信息。',
  canonical: '/privacy',
});

export default function PrivacyPage() {
  return (
    <SiteLayout>
      <PrivacyPolicyPageClient />
    </SiteLayout>
  );
}
