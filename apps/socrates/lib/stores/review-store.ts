// =====================================================
// Project Socrates - Review Store
// 复习数据缓存 store
// =====================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ReviewItem {
  id: string;
  sessionId: string;
  subject: 'math' | 'physics' | 'chemistry';
  conceptTags: string[] | null;
  difficultyRating: number | null;
  nextReviewAt: string;
  reviewStage: number;
  daysUntilDue: number;
  isOverdue: boolean;
  extractedText?: string;
}

interface ReviewStore {
  // State
  reviews: ReviewItem[];
  loading: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  setReviews: (reviews: ReviewItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Cache management
  shouldRefetch: () => boolean;
  invalidateCache: () => void;

  // Optimistic updates
  updateReviewStage: (reviewId: string, newStage: number) => void;
  removeReview: (reviewId: string) => void;
}

// 缓存有效期：5分钟
const CACHE_DURATION = 5 * 60 * 1000;

export const useReviewStore = create<ReviewStore>()(
  persist(
    (set, get) => ({
      reviews: [],
      loading: false,
      error: null,
      lastFetched: null,

      setReviews: (reviews) => set({
        reviews,
        lastFetched: Date.now(),
        error: null
      }),

      setLoading: (loading) => set({ loading }),

      setError: (error) => set({ error }),

      shouldRefetch: () => {
        const { lastFetched, loading } = get();
        if (loading) return false;
        if (!lastFetched) return true;
        return Date.now() - lastFetched > CACHE_DURATION;
      },

      invalidateCache: () => set({
        reviews: [],
        lastFetched: null
      }),

      updateReviewStage: (reviewId, newStage) => set((state) => ({
        reviews: state.reviews.map(r =>
          r.id === reviewId
            ? { ...r, reviewStage: newStage }
            : r
        )
      })),

      removeReview: (reviewId) => set((state) => ({
        reviews: state.reviews.filter(r => r.id !== reviewId)
      })),
    }),
    {
      name: 'socrates-review-cache',
      storage: createJSONStorage(() => sessionStorage), // 使用 sessionStorage，关闭标签页就清除
      partialize: (state) => ({
        reviews: state.reviews,
        lastFetched: state.lastFetched
      }),
    }
  )
);
