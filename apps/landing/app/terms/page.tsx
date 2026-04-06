import TermsOfServicePageClient from '../../components/TermsOfServicePageClient';
import SiteLayout from '../../components/SiteLayout';
import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: '服务条款',
  description: 'Socrates 学习平台用户协议和服务条款。',
  canonical: '/terms',
});

export default function TermsPage() {
  return (
    <SiteLayout>
      <TermsOfServicePageClient />
    </SiteLayout>
  );
}
