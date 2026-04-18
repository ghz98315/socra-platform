import BookPageClient from '../../components/BookPageClient';
import SiteLayout from '../../components/SiteLayout';
import { buildMetadata } from '../../lib/metadata';
import { resolveLandingBookAccess } from '../../lib/bookAccess.server';

export const metadata = buildMetadata({
  title: '《从错误开始》',
  description: '一位工程师爸爸用工厂管理逻辑重建的学习方法。首发套装包含电子书和 Socrates 使用权益。',
  canonical: '/book',
  type: 'book',
});

export default async function BookPage() {
  const access = await resolveLandingBookAccess();

  return (
    <SiteLayout>
      <BookPageClient hasFullAccess={access.hasFullAccess} />
    </SiteLayout>
  );
}
