import { StudyAssetDetail } from '@/components/study/StudyAssetDetail';

export default async function StudyAssetDetailPage({
  params,
}: {
  params: Promise<{ assetId: string }>;
}) {
  const { assetId } = await params;

  return <StudyAssetDetail assetId={assetId} />;
}
