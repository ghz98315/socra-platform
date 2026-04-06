import LandingPageClient from '../components/LandingPageClient';
import SiteLayout from '../components/SiteLayout';
import { buildMetadata } from '../lib/metadata';

export const metadata = buildMetadata({
  canonical: '/',
});

export default function HomePage() {
  return (
    <SiteLayout>
      <LandingPageClient />
    </SiteLayout>
  );
}
