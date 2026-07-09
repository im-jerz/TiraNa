import { useEffect, useRef } from "react";

/**
 * Runs `callback` on an interval to keep data fresh in the background,
 * without touching page-level loading/error state (that's what makes it
 * "silent" — the UI shouldn't flash a spinner just because we're
 * re-checking for new bookings/reviews/etc. behind the scenes).
 *
 * - Skips a tick if the previous call hasn't resolved yet.
 * - Pauses while the tab is hidden, and refreshes immediately when the
 *   tab becomes visible again, so data isn't stale when the host comes back.
 * - Always calls the latest `callback` passed in, without needing it in
 *   a dependency array (avoids re-creating the interval on every render).
 */
export default function useSilentPoll(callback, intervalMs = 2_000) {
  const callbackRef = useRef(callback);
  const inFlightRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!intervalMs) return;

    async function tick() {
      if (inFlightRef.current) return;
      if (document.hidden) return;
      inFlightRef.current = true;
      try {
        await callbackRef.current();
      } catch {
        // silent — a failed background refresh shouldn't disrupt the page
      } finally {
        inFlightRef.current = false;
      }
    }

    const interval = window.setInterval(tick, intervalMs);

    function onVisibility() {
      if (!document.hidden) tick();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs]);
}