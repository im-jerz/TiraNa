import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import { resolveNotificationLink } from "../../utils/notificationLinks";

const IconBell = (p) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 3 1 4.5 1.5 5.5a1 1 0 0 1-.9 1.5H5.4a1 1 0 0 1-.9-1.5C5 12.5 6 11 6 8Z" />
    <path d="M10 18.5a2 2 0 0 0 4 0" />
  </svg>
);

const POLL_INTERVAL_MS = 20_000;

/**
 * Mounted once at the dashboard shell level. Polls /api/notifications for
 * the newest item; when a notification id we haven't seen before shows up,
 * slides a toast in from the right, holds briefly, then slides back out to
 * the right. Clicking the toast navigates to the relevant page.
 */
export default function NotificationToast() {
  const navigate = useNavigate();
  const [active, setActive] = useState(null); // { notification, phase: 'in' | 'out' }
  const lastSeenIdRef = useRef(null);
  const initializedRef = useRef(false);
  const timersRef = useRef([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  };

  const showToast = useCallback((notification) => {
    clearTimers();
    setActive({ notification, phase: "in" });

    // Hold, then slide back out to the right.
    const holdTimer = window.setTimeout(() => {
      setActive((curr) => (curr ? { ...curr, phase: "out" } : curr));
      const removeTimer = window.setTimeout(() => setActive(null), 420);
      timersRef.current.push(removeTimer);
    }, 4200);
    timersRef.current.push(holdTimer);
  }, []);

  const poll = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/api/notifications?page=1&per_page=1");
      const latest = data?.data?.notifications?.[0];
      if (!latest) return;

      if (!initializedRef.current) {
        // First check on mount: just record where we are, don't toast
        // for notifications that already existed before this session.
        lastSeenIdRef.current = latest.id;
        initializedRef.current = true;
        return;
      }

      if (latest.id !== lastSeenIdRef.current) {
        lastSeenIdRef.current = latest.id;
        showToast(latest);
      }
    } catch {
      // silent — don't disrupt the dashboard over a failed poll
    }
  }, [showToast]);

  useEffect(() => {
    poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(interval);
      clearTimers();
    };
  }, [poll]);

  if (!active) return null;

  const { notification, phase } = active;

  function handleClick() {
    const link = resolveNotificationLink(notification);
    clearTimers();
    setActive(null);
    if (link) navigate(link);
    else navigate("/dashboard/notifications");
  }

  return (
    <button
      type="button"
      className={`notif-toast notif-toast--${phase}`}
      onClick={handleClick}
      aria-live="polite"
    >
      <span className="notif-toast-icon">
        <IconBell />
      </span>
      <span className="notif-toast-body">
        <span className="notif-toast-title">New Notification</span>
        <span className="notif-toast-sub">{notification.title}</span>
      </span>
    </button>
  );
}