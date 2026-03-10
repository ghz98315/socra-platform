// =====================================================
// Project Socrates - Home Page (App Entry)
// socrates.socra.cn - 应用入口，重定向到登录页
// =====================================================

import { redirect } from 'next/navigation';

export default function HomePage() {
  // 应用入口重定向到登录页
  // Landing Page 在 socra.cn 域名
  redirect('/login');
}
