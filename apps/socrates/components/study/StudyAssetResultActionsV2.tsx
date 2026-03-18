'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

import { useStudyAssetReviewBridge } from '@/hooks/useStudyAssetReviewBridge';
import {
  buildStudyAssetDetailHref,
  buildStudyAssetReportHref,
} from '@/lib/study/assets-v2';

interface StudyAssetResultActionsV2Props {
  assetId?: string | null;
  studentId?: string | null;
}

export function StudyAssetResultActionsV2({
  assetId,
  studentId,
}: StudyAssetResultActionsV2Props) {
  const {
    addToReview,
    addingToReview,
    resetReviewBridge,
    reviewActionError,
    reviewActionMessage,
    reviewHref,
  } = useStudyAssetReviewBridge();

  useEffect(() => {
    resetReviewBridge();
  }, [assetId, resetReviewBridge]);

  if (!assetId) {
    return null;
  }

  return (
    <>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link
          href={buildStudyAssetDetailHref(assetId)}
          className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          查看详情
        </Link>
        <Link
          href={buildStudyAssetReportHref(assetId)}
          className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
        >
          学习报告
        </Link>
        {reviewHref ? (
          <Link
            href={reviewHref}
            className="inline-flex rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            打开复习页
          </Link>
        ) : (
          <button
            type="button"
            onClick={() =>
              void addToReview({
                assetId,
                studentId,
              })
            }
            disabled={addingToReview}
            className="inline-flex items-center rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addingToReview ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                加入复习中
              </>
            ) : (
              '加入复习'
            )}
          </button>
        )}
      </div>

      {reviewActionMessage ? (
        <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {reviewActionMessage}
        </div>
      ) : null}
      {reviewActionError ? (
        <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {reviewActionError}
        </div>
      ) : null}
    </>
  );
}
