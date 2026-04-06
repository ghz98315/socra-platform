/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import ArticlePage from './pages/ArticlePage';
import BookPage from './pages/BookPage';
import BookPurchasePage from './pages/BookPurchasePage';
import BookReader from './pages/BookReader';
import EssaysPage from './pages/EssaysPage';
import AdminPage from './pages/AdminPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';

export default function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="essays" element={<EssaysPage />} />
            <Route path="essays/:slug" element={<ArticlePage />} />
            <Route path="book" element={<BookPage />} />
            <Route path="book-purchase" element={<BookPurchasePage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="privacy" element={<PrivacyPolicyPage />} />
            <Route path="terms" element={<TermsOfServicePage />} />
          </Route>
          {/* Reader route outside Layout to hide standard navbar/footer */}
          <Route path="/read/:chapterId" element={<BookReader />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  );
}
