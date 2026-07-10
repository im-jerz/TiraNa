import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { IconMenu, IconBell } from "../icons";
import axiosInstance from "../../api/axiosInstance";
import { resolveNotificationLink } from "../../utils/notificationLinks";

/* ─── Notification type → dot color ────────────────────────── */
const TYPE_DOT = {
  new_booking:       "accent",
  booking_confirmed: "success",
  booking_cancelled: "danger",
  refund_requested:  "danger",
  refund_completed:  "success",
  guest_checkin:     "info",
  guest_checkout:    "muted",
  new_review:        "gold",
  review_updated:    "gold",
  payment_credited:  "success",
  withdrawal_done:   "success",
  listing_approved:  "success",
  listing_rejected:  "danger",
  support_update:    "info",
  announcement:      "muted",
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return "Yesterday";
}

/* ─── Dropdown panel ───────────────────────────────────────── */
function NotifDropdown({ items, unreadCount, onClose, onSeeAll, onItemClick }) {
  return (
    <div className="topbar-notif-dropdown" role="dialog" aria-label="Recent notifications">
      <div className="topbar-notif-dropdown-header">
        <span className="topbar-notif-dropdown-title">Notifications</span>
        {unreadCount > 0 && (
          <span className="topbar-notif-dropdown-badge">{unreadCount} new</span>
        )}
      </div>

      <div className="topbar-notif-dropdown-list">
        {items.length === 0 ? (
          <p style={{ padding: "1rem", fontSize: "0.8rem", color: "var(--color-muted, #888)", textAlign: "center" }}>
            No recent notifications
          </p>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`topbar-notif-item${item.is_read ? "" : " topbar-notif-item--unread"}`}
              onClick={() => onItemClick(item)}
            >
              <span
                className={`topbar-notif-item-dot topbar-notif-item-dot--${TYPE_DOT[item.type] || "muted"}`}
                aria-hidden="true"
              />
              <div className="topbar-notif-item-body">
                <p className="topbar-notif-item-title">{item.title}</p>
                <p className="topbar-notif-item-sub">{item.body}</p>
                <time className="topbar-notif-item-time">{timeAgo(item.created_at)}</time>
              </div>
            </button>
          ))
        )}
      </div>

      <button type="button" className="topbar-notif-see-all" onClick={onSeeAll}>
        See all notifications
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
    </div>
  );
}

/* ─── Topbar ────────────────────────────────────────────────── */
export default function Topbar({
  eyebrow,
  title,
  onMenuClick,
  hostInitial = "H",
  hostName = "Host",
  hostAvatarUrl = "",
}) {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [preview, setPreview] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const bellBtnRef = useRef(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/api/notifications/unread-count");
      setUnreadCount(data.data.unread_count ?? 0);
    } catch {
      // silent — don't disrupt the UI
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  async function fetchPreview() {
    try {
      const { data } = await axiosInstance.get("/api/notifications?page=1&per_page=5");
      setPreview(data.data.notifications ?? []);
    } catch {
      setPreview([]);
    }
  }

  function handleBellClick() {
    const opening = !dropdownOpen;
    setDropdownOpen(opening);
    if (opening) fetchPreview();
  }

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        bellBtnRef.current && !bellBtnRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleKey(e) {
      if (e.key === "Escape") setDropdownOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [dropdownOpen]);

  function handleSeeAll() {
    setDropdownOpen(false);
    navigate("/dashboard/notifications");
  }

  async function handleItemClick(item) {
    setDropdownOpen(false);

    // Mark as read in the background, don't block navigation on it.
    if (!item.is_read) {
      axiosInstance.put(`/api/notifications/${item.id}/read`).catch(() => {});
    }

    const link = resolveNotificationLink(item);
    navigate(link || "/dashboard/notifications");
  }

  return (
    <header className="topbar">
      <button type="button" className="topbar-menu-btn" onClick={onMenuClick} aria-label="Toggle navigation">
        <IconMenu />
      </button>

      <div className="topbar-title-group">
        {eyebrow ? <div className="topbar-eyebrow">{eyebrow}</div> : null}
        <h1 className="topbar-title">{title}</h1>
      </div>

      <div className="topbar-actions">
        <div className="topbar-notif-wrapper">
          <button
            ref={bellBtnRef}
            type="button"
            className={`topbar-icon-btn${dropdownOpen ? " topbar-icon-btn--active" : ""}`}
            aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
            aria-expanded={dropdownOpen}
            aria-haspopup="dialog"
            onClick={handleBellClick}
            style={{ position: "relative" }}
          >
            <IconBell />
            {unreadCount > 0 && <span className="topbar-icon-dot" aria-hidden="true" />}
          </button>

          {dropdownOpen && (
            <div ref={dropdownRef}>
              <NotifDropdown
                items={preview}
                unreadCount={unreadCount}
                onClose={() => setDropdownOpen(false)}
                onSeeAll={handleSeeAll}
                onItemClick={handleItemClick}
              />
            </div>
          )}
        </div>

        <button
          type="button"
          className="topbar-profile"
          onClick={() => navigate("/dashboard/settings")}
          aria-label="Go to profile settings"
        >
          <span className="topbar-avatar">
            {hostAvatarUrl ? <img src={hostAvatarUrl} alt="" /> : hostInitial}
          </span>
          <span className="topbar-profile-name">{hostName}</span>
        </button>
      </div>
    </header>
  );
}