import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../api/axiosInstance";
import useSilentPoll from "../../utils/useSilentPoll";

const POLL_INTERVAL_MS = 20_000;
import { resolveNotificationLink } from "../../utils/notificationLinks";
import "../../styles/notifications.css";

/* ─── SVG Icons (inline, no emoji) ────────────────────────── */
const IconBookingNew = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
    <path d="M12 14v3M10.5 15.5h3" />
  </svg>
);

const IconBookingConfirmed = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M16 3v4M8 3v4M3 10h18" />
    <path d="m9 15 2 2 4-4" />
  </svg>
);

const IconCheckIn = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <path d="m10 17 5-5-5-5" />
    <path d="M3 12h12" />
  </svg>
);

const IconCheckOut = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

const IconReview = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M12 3.5l2.5 5.6 6 .6-4.5 4 1.3 5.9-5.3-3.2L6.7 19.6l1.3-5.9-4.5-4 6-.6L12 3.5Z" />
  </svg>
);

const IconPayment = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <circle cx="16.5" cy="14" r="1.25" fill="currentColor" stroke="none" />
  </svg>
);

const IconRefund = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v5h5" />
    <path d="M12 8v4l3 2" />
  </svg>
);

const IconWithdrawal = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M12 4v12M8 12l4 4 4-4" />
    <path d="M4 18v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1" />
  </svg>
);

const IconApproval = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M12 3l8 3v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const IconRejection = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M12 3l8 3v6c0 5-3.5 7.5-8 9-4.5-1.5-8-4-8-9V6l8-3Z" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

const IconSupport = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="m5.8 5.8 3 3M18.2 5.8l-3 3M5.8 18.2l3-3M18.2 18.2l-3-3" />
  </svg>
);

const IconAnnouncement = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M3 11V13a1 1 0 0 0 1 1h1l3 4v-9L5 13H4a1 1 0 0 1-1-1v-2a1 1 0 0 1 1-1h1l3-4v9" />
    <path d="M19 8c.7 1 1 2.4 1 4s-.3 3-1 4" />
    <path d="M16 9.5c.4.6.5 1.4.5 2.5s-.1 1.9-.5 2.5" />
  </svg>
);

const IconCancelled = (p) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M4.9 4.9 19.1 19.1" />
  </svg>
);

const IconCheck = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const IconFilter = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M3 5h18M7 10h10M11 15h2" />
  </svg>
);

const IconBell = (p) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M6 8a6 6 0 1 1 12 0c0 3 1 4.5 1.5 5.5a1 1 0 0 1-.9 1.5H5.4a1 1 0 0 1-.9-1.5C5 12.5 6 11 6 8Z" />
    <path d="M10 18.5a2 2 0 0 0 4 0" />
  </svg>
);

const IconChevronRight = (p) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...p}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

/* ─── Notification type config ─────────────────────────────── */
const TYPE_CONFIG = {
  new_booking:       { icon: IconBookingNew,      label: "Booking Request",   cat: "bookings",  color: "accent"  },
  booking_confirmed: { icon: IconBookingConfirmed, label: "Booking Confirmed", cat: "bookings",  color: "success" },
  booking_cancelled: { icon: IconCancelled,        label: "Booking Cancelled", cat: "bookings",  color: "danger"  },
  refund_requested:  { icon: IconRefund,           label: "Refund Requested",  cat: "bookings",  color: "danger"  },
  refund_completed:  { icon: IconRefund,           label: "Refund Completed",  cat: "bookings",  color: "success" },
  guest_checkin:     { icon: IconCheckIn,          label: "Guest Checked In",  cat: "stays",     color: "info"    },
  guest_checkout:    { icon: IconCheckOut,         label: "Guest Checked Out", cat: "stays",     color: "muted"   },
  new_review:        { icon: IconReview,           label: "New Review",        cat: "reviews",   color: "gold"    },
  review_updated:    { icon: IconReview,           label: "Review Updated",    cat: "reviews",   color: "gold"    },
  payment_credited:  { icon: IconPayment,          label: "Payment Credited",  cat: "earnings",  color: "success" },
  withdrawal_done:   { icon: IconWithdrawal,       label: "Withdrawal Done",   cat: "earnings",  color: "success" },
  listing_approved:  { icon: IconApproval,         label: "Listing Approved",  cat: "listings",  color: "success" },
  listing_rejected:  { icon: IconRejection,        label: "Listing Rejected",  cat: "listings",  color: "danger"  },
  support_update:    { icon: IconSupport,          label: "Support Update",    cat: "support",   color: "info"    },
  announcement:      { icon: IconAnnouncement,     label: "Announcement",      cat: "system",    color: "muted"   },
};

const CATEGORIES = [
  { key: "all",      label: "All" },
  { key: "bookings", label: "Bookings" },
  { key: "stays",    label: "Stays" },
  { key: "earnings", label: "Earnings" },
  { key: "reviews",  label: "Reviews" },
  { key: "listings", label: "Listings" },
  { key: "support",  label: "Support" },
  { key: "system",   label: "System" },
];

/* ─── Helpers ───────────────────────────────────────────────── */
function timeAgo(dateStr) {
  const date = new Date(dateStr);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return "Yesterday";
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function groupByDay(notifications) {
  const groups = {};
  const now = new Date();
  notifications.forEach((n) => {
    const d = new Date(n.created_at);
    const diffDays = Math.floor((now - d) / 86400000);
    let label;
    if (diffDays === 0) label = "Today";
    else if (diffDays === 1) label = "Yesterday";
    else if (diffDays < 7) label = d.toLocaleDateString("en-PH", { weekday: "long" });
    else label = d.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" });
    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  });
  return groups;
}

/* ─── Sub-components ────────────────────────────────────────── */
function NotificationItem({ item, onRead, onNavigate }) {
  const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.announcement;
  const IconComp = config.icon;
  const link = resolveNotificationLink(item);

  function handleClick() {
    if (!item.is_read) onRead(item.id);
    onNavigate(link);
  }

  return (
    <article
      className={`ntf-item${item.is_read ? "" : " ntf-item--unread"}`}
      role="button"
      tabIndex={0}
      aria-label={item.title}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
    >
      {!item.is_read && <span className="ntf-unread-dot" aria-hidden="true" />}

      <div className={`ntf-icon-wrap ntf-icon-wrap--${config.color}`}>
        <IconComp />
      </div>

      <div className="ntf-content">
        <div className="ntf-content-top">
          <span className="ntf-type-label">{config.label}</span>
          <time className="ntf-time" dateTime={item.created_at}>
            {timeAgo(item.created_at)}
          </time>
        </div>
        <p className="ntf-title">{item.title}</p>
        <p className="ntf-body">{item.body}</p>
        {link && (
          <span className="ntf-cta">
            View details
            <IconChevronRight />
          </span>
        )}
      </div>
    </article>
  );
}

function EmptyState({ category }) {
  return (
    <div className="ntf-empty">
      <div className="ntf-empty-icon">
        <IconBell />
      </div>
      <p className="ntf-empty-title">No notifications here</p>
      <p className="ntf-empty-body">
        {category === "all"
          ? "You're all caught up. New alerts will appear here."
          : `No ${category} notifications yet.`}
      </p>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeCategory, setActiveCategory] = useState("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const fetchNotifications = useCallback(async (p = 1) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axiosInstance.get(
        `/api/notifications?page=${p}&per_page=50`
      );
      setNotifications(data.data.notifications);
      setTotalPages(data.data.pages);
      setPage(p);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/signin");
      } else {
        setError("Failed to load notifications.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  const pageRef = useRef(page);
  useEffect(() => { pageRef.current = page; }, [page]);

  // Background refresh: new notifications (e.g. a fresh booking) show up
  // on their own. Only refreshes while on page 1 so it doesn't yank the
  // host off whatever page of older notifications they're browsing.
  const silentRefresh = useCallback(async () => {
    if (pageRef.current !== 1) return;
    const { data } = await axiosInstance.get(`/api/notifications?page=1&per_page=50`);
    setNotifications(data.data.notifications);
    setTotalPages(data.data.pages);
  }, []);

  useSilentPoll(silentRefresh, POLL_INTERVAL_MS);

  async function markRead(id) {
    try {
      await axiosInstance.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch {
      // silent
    }
  }

  async function markAllRead() {
    try {
      await axiosInstance.put("/api/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // silent
    }
  }

  function handleNavigate(link) {
    if (link) navigate(link);
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      const catMatch =
        activeCategory === "all" ||
        TYPE_CONFIG[n.type]?.cat === activeCategory;
      const readMatch = showUnreadOnly ? !n.is_read : true;
      return catMatch && readMatch;
    });
  }, [notifications, activeCategory, showUnreadOnly]);

  const grouped = useMemo(() => groupByDay(filtered), [filtered]);
  const groupKeys = Object.keys(grouped);

  return (
    <div className="ntf-page">
      {/* ── Header ── */}
      <header className="ntf-header">
        <div className="ntf-header-left">
          <h1 className="ntf-header-title">Notifications</h1>
          <p className="ntf-header-sub">
            {unreadCount > 0
              ? `${unreadCount} unread update${unreadCount !== 1 ? "s" : ""} need your attention`
              : "You're fully up to date"}
          </p>
        </div>

        <div className="ntf-header-actions">
          <button
            type="button"
            className={`ntf-toggle-btn${showUnreadOnly ? " ntf-toggle-btn--active" : ""}`}
            onClick={() => setShowUnreadOnly((v) => !v)}
            aria-pressed={showUnreadOnly}
          >
            <IconFilter />
            <span>Unread only</span>
          </button>
          {unreadCount > 0 && (
            <button type="button" className="ntf-mark-all-btn" onClick={markAllRead}>
              <IconCheck />
              <span>Mark all read</span>
            </button>
          )}
        </div>
      </header>

      {/* ── Category tabs ── */}
      <div className="ntf-tabs-scroll" role="tablist" aria-label="Notification categories">
        <div className="ntf-tabs">
          {CATEGORIES.map((cat) => {
            const catCount =
              cat.key === "all"
                ? unreadCount
                : notifications.filter(
                    (n) => !n.is_read && TYPE_CONFIG[n.type]?.cat === cat.key
                  ).length;
            return (
              <button
                key={cat.key}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.key}
                className={`ntf-tab${activeCategory === cat.key ? " ntf-tab--active" : ""}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                {cat.label}
                {catCount > 0 && <span className="ntf-tab-badge">{catCount}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Notification list ── */}
      <div className="ntf-list">
        {loading ? (
          <div className="ntf-empty">
            <p className="ntf-empty-body">Loading notifications…</p>
          </div>
        ) : error ? (
          <div className="ntf-empty">
            <p className="ntf-empty-body">{error}</p>
            <button type="button" className="ntf-mark-all-btn" onClick={() => fetchNotifications(page)}>
              Retry
            </button>
          </div>
        ) : groupKeys.length === 0 ? (
          <EmptyState category={activeCategory} />
        ) : (
          groupKeys.map((groupLabel) => (
            <section key={groupLabel} className="ntf-group">
              <div className="ntf-group-label" aria-label={`Notifications from ${groupLabel}`}>
                <span>{groupLabel}</span>
              </div>
              <div className="ntf-group-items">
                {grouped[groupLabel].map((item) => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    onRead={markRead}
                    onNavigate={handleNavigate}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="ntf-pagination">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => fetchNotifications(page - 1)}
            className="ntf-page-btn"
          >
            Previous
          </button>
          <span className="ntf-page-info">Page {page} of {totalPages}</span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => fetchNotifications(page + 1)}
            className="ntf-page-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}