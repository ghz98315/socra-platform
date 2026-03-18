'use client';

import { useCallback, useState } from 'react';

import { bridgeStudyAssetToReview } from '@/lib/study/assets-v2';

interface AddStudyAssetToReviewInput {
  assetId?: string | null;
  studentId?: string | null;
}

export function useStudyAssetReviewBridge() {
  const [addingToReview, setAddingToReview] = useState(false);
  const [reviewHref, setReviewHref] = useState('');
  const [reviewActionError, setReviewActionError] = useState('');
  const [reviewActionMessage, setReviewActionMessage] = useState('');

  const addToReview = useCallback(async (input: AddStudyAssetToReviewInput) => {
    if (!input.studentId || !input.assetId || addingToReview) {
      return null;
    }

    setAddingToReview(true);
    setReviewActionError('');
    setReviewActionMessage('');

    try {
      const result = await bridgeStudyAssetToReview({
        assetId: input.assetId,
        studentId: input.studentId,
      });

      if (result.reviewHref.trim()) {
        setReviewHref(result.reviewHref);
      }

      setReviewActionMessage(
        result.existed ? '这条结果已在复习清单中。' : '已把本轮结果加入复习清单。',
      );

      return result;
    } catch (error: any) {
      console.error('[useStudyAssetReviewBridge] Failed to bridge study asset to review:', error);
      setReviewActionError(error?.message || '加入复习失败，请稍后重试。');
      return null;
    } finally {
      setAddingToReview(false);
    }
  }, [addingToReview]);

  const resetReviewBridge = useCallback(() => {
    setAddingToReview(false);
    setReviewHref('');
    setReviewActionError('');
    setReviewActionMessage('');
  }, []);

  return {
    addToReview,
    addingToReview,
    resetReviewBridge,
    reviewActionError,
    reviewActionMessage,
    reviewHref,
  };
}
