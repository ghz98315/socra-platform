import { StudyAssetDetail } from '@/components/study/StudyAssetDetail';

export default function StudyAssetDetailPage({
  params,
}: {
  params: { assetId: string };
}) {
  return <StudyAssetDetail assetId={params.assetId} />;
}
