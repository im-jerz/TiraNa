import { useState, useEffect, useCallback } from "react";
import { getReviews, saveLocalReply } from "../../api/reviews";
import useSilentPoll from "../../utils/useSilentPoll";

const POLL_INTERVAL_MS = 20_000;

export default function useReviewsData() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReviews();
      setReviews(data);
    } catch (err) {
      setError(
        err?.response?.data?.message ?? "Couldn't load reviews. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Background refresh: a newly-submitted guest review shows up on its
  // own, without the host needing to reload the page.
  const silentRefresh = useCallback(async () => {
    const data = await getReviews();
    setReviews(data);
  }, []);

  useSilentPoll(silentRefresh, POLL_INTERVAL_MS);

  const saveReply = useCallback((reviewId, text) => {
    saveLocalReply(reviewId, text.trim());
    setReviews((prev) =>
      prev.map((r) =>
        r.id === reviewId
          ? { ...r, host_reply: text.trim() || null, status: text.trim() ? "published" : "needs_reply" }
          : r
      )
    );
  }, []);

  return { reviews, loading, error, reload: load, saveReply };
}