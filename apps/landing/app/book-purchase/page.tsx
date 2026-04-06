import BookPurchasePageClient from '../../components/BookPurchasePageClient';
import SiteLayout from '../../components/SiteLayout';
import { buildMetadata } from '../../lib/metadata';

export const metadata = buildMetadata({
  title: '购买《从错误开始》首发套装',
  description: '购买《从错误开始》电子书首发套装，包含电子书和 Socrates 错题系统 1 个月使用权益。',
  canonical: '/book-purchase',
});

export default function BookPurchasePage() {
  return (
    <SiteLayout>
      <BookPurchasePageClient />
    </SiteLayout>
  );
}
