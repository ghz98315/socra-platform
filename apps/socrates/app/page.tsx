// =====================================================
// Project Socrates - Home Page (Server Redirect)
// =====================================================

import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to login page for now
  // In production, this would check session cookies
  redirect('/login');
}
