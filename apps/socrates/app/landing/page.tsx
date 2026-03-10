// =====================================================
// Project Socrates - Landing Page Route
// 访问路径: /landing
// =====================================================

import LandingPage from '@/components/landing/LandingPage';

export default function LandingPageRoute() {
  // 默认使用 Style A (科技简约风)
  return <LandingPage initialStyle="A" />;
}
