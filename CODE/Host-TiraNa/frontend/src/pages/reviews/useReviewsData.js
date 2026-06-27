/**
 * useReviewsData.js
 *
 * Data hook for Reviews & Ratings Management.
 * Fetches reviews from the client API via reviews.js, handles loading/error
 * states, and exposes a saveReply action that persists locally.
 */

import { useState, useEffect, useCallback } from "react";
import { getReviews, saveLocalReply } from "../../api/reviews";
import { getHostPropertyIds } from "../../api/bookings";

export default function useReviewsData() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [propertyIds, setPropertyIds] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const ids = await getHostPropertyIds();
      setPropertyIds(ids);

      if (!ids.length) {
        setReviews([]);
        return;
      }

      const data = await getReviews();
      setReviews(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Couldn't load reviews. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /**
   * Save a host reply for a review.
   * Persists to localStorage immediately, updates local state so the UI
   * reflects the change without a full reload.
   */
  const saveReply = useCallback((reviewId, text) => {
    saveLocalReply(reviewId, text.trim());
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? {
              ...r,
              host_reply: text.trim() || null,
              status: text.trim() ? "published" : "needs_reply",
            }
          : r
      )
    );
  }, []);

  return {
    reviews,
    loading,
    error,
    propertyIds,
    reload: load,
    saveReply,
  };
}