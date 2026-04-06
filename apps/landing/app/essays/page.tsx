import EssaysPageClient from '../../components/EssaysPageClient';
import SiteLayout from '../../components/SiteLayout';
import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: '错题管理心法系列文章',
  description: '从错误开始，闭环学习。这里是 Socrates 的方法论沉淀，涵盖 8D、5 Why、PDCA 等闭环学习方法。',
  canonical: '/essays',
});

export default function EssaysPage() {
  return (
    <SiteLayout>
      <EssaysPageClient />
    </SiteLayout>
  );
}
