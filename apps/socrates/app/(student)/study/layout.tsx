import { StudyDomainNav } from '@/components/study/StudyDomainNav';

export default function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.12),_transparent_28%),linear-gradient(180deg,#fffdf8_0%,#ffffff_48%,#fff7ed_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
        <StudyDomainNav />
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
