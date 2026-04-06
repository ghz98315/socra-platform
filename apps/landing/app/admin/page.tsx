import AdminPageClient from '../../components/AdminPageClient';
import SiteLayout from '../../components/SiteLayout';
import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: '管理后台',
  description: 'Socrates 内容管理后台。',
  canonical: '/admin',
});

export default function AdminPage() {
  return (
    <SiteLayout>
      <AdminPageClient />
    </SiteLayout>
  );
}
