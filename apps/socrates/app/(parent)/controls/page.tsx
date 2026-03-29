import { Suspense } from 'react';
import ParentInsightControlPage from '@/components/error-loop/ParentInsightControlPage';

function ParentControlsLoading() {
  return <div className="min-h-screen bg-slate-50" />;
}

export default function ParentalControlsPage() {
  return (
    <Suspense fallback={<ParentControlsLoading />}>
      <ParentInsightControlPage />
    </Suspense>
  );
}
