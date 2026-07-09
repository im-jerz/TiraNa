import { useState, useEffect, useRef, useCallback } from "react";
import {
  IconUser,
  IconSearch,
  IconX,
  IconStar,
  IconCalendar,
  IconCheck,
  IconEdit,
  IconClock,
} from "../../components/icons";
import { useToast } from "../../components/common/Toast";
import { getGuests, setGuestNote } from "../../api/guests";
import useSilentPoll from "../../utils/useSilentPoll";
import "../../styles/guests.css";

const POLL_INTERVAL_MS = 20_000;

/* ─── Utility ───────────────────────────────────────────────── */

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(n) {
  return `₱${Number(n).toLocaleString("en-PH")}`;
}

function daysAgo(str) {
  if (!str) return null;
  const diff = Math.floor((Date.now() - new Date(str)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 30) return `${diff}d ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}yr ago`;
}

const BOOKING_STATUS_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  refund_requested: "Refund Req.",
  refund_completed: "Refunded",
};

/* ─── Star display ──────────────────────────────────────────── */

function StarDisplay({ rating }) {
  const val = parseFloat(rating);
  if (!val) return <span className="gm-no-rating">Not yet rated</span>;
  return (
    <span className="gm-star-display">
      <IconStar width={13} height={13} style={{ color: "#C9A84C", fill: "#C9A84C", stroke: "none" }} />
      <span>{val}</span>
    </span>
  );
}

/* ─── Avatar ────────────────────────────────────────────────── */

function GuestAvatar({ guest, size = "md" }) {
  const initials = getInitials(guest.full_name);
  const hue = (guest.guest_id?.charCodeAt(1) || 0) * 23 % 360;
  return (
    <div
      className={`gm-avatar gm-avatar--${size}`}
      style={{ "--avatar-hue": hue }}
      aria-hidden="true"
    >
      {guest.avatar_url ? (
        <img src={guest.avatar_url} alt="" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
}

/* ─── Guest Row ─────────────────────────────────────────────── */

function GuestRow({ guest, isSelected, onClick }) {
  return (
    <button
      type="button"
      className={`gm-row${isSelected ? " gm-row--selected" : ""}`}
      onClick={onClick}
      aria-pressed={isSelected}
    >
      <GuestAvatar guest={guest} size="md" />

      <div className="gm-row-info">
        <div className="gm-row-name-line">
          <span className="gm-row-name">{guest.full_name}</span>
        </div>
        <span className="gm-row-email">{guest.email}</span>
      </div>

      <div className="gm-row-meta">
        <span className="gm-row-stays">
          <IconCalendar width={13} height={13} />
          {guest.total_stays} stay{guest.total_stays !== 1 ? "s" : ""}
        </span>
        <StarDisplay rating={guest.host_rating} />
      </div>

      <div className="gm-row-last">
        <span className="gm-row-last-prop" title={guest.last_property}>
          {guest.last_property}
        </span>
        <span className="gm-row-last-when">{daysAgo(guest.last_booking_date)}</span>
      </div>

      <div className="gm-row-chevron" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </div>
    </button>
  );
}

/* ─── Booking History Item ──────────────────────────────────── */

function BookingHistoryItem({ booking }) {
  const nights = Math.max(1, Math.ceil(
    (new Date(booking.check_out) - new Date(booking.check_in)) / 86400000
  ));
  return (
    <div className="gm-booking-item">
      <div className="gm-booking-item-top">
        <span className="gm-booking-item-prop" title={booking.property_name}>
          {booking.property_name}
        </span>
        <span className={`gm-booking-item-status gm-status--${booking.status}`}>
          {BOOKING_STATUS_LABEL[booking.status] || booking.status}
        </span>
      </div>
      <div className="gm-booking-item-bottom">
        <span>
          <IconCalendar width={12} height={12} />
          {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
        </span>
        <span>
          <IconClock width={12} height={12} />
          {nights} night{nights !== 1 ? "s" : ""}
        </span>
        <span className="gm-booking-item-amount">{formatCurrency(booking.total_price)}</span>
      </div>
    </div>
  );
}

/* ─── Profile Drawer ────────────────────────────────────────── */

function GuestProfileDrawer({ guest, onClose, onGuestUpdate }) {
  const { showToast } = useToast();
  const [note, setNote] = useState(guest?.private_note || "");
  const [editingNote, setEditingNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const noteRef = useRef(null);
  const bookings = guest?.bookings ?? [];

  useEffect(() => {
    setNote(guest?.private_note || "");
    setEditingNote(false);
  }, [guest?.guest_id]);

  useEffect(() => {
    if (editingNote && noteRef.current) noteRef.current.focus();
  }, [editingNote]);

  if (!guest) return null;

  const totalSpent = bookings
    .filter((b) => b.status === "completed")
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  async function handleSaveNote() {
    setSavingNote(true);
    setGuestNote(guest.guest_id, note);
    await new Promise((r) => setTimeout(r, 300));
    setSavingNote(false);
    setEditingNote(false);
    onGuestUpdate(guest.guest_id, { private_note: note });
    showToast("Note saved.", "success");
  }

  return (
    <>
      <div className="gm-drawer-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="gm-drawer" role="dialog" aria-modal="true" aria-label={`${guest.full_name} profile`}>

        {/* Fixed header */}
        <div className="gm-drawer-header">
          <button className="gm-drawer-close" onClick={onClose} aria-label="Close profile">
            <IconX />
          </button>
          <span className="gm-drawer-header-label">Guest Profile</span>
        </div>

        {/* Scrollable body */}
        <div className="gm-drawer-body">

          {/* Identity */}
          <div className="gm-drawer-identity">
            <GuestAvatar guest={guest} size="lg" />
            <div className="gm-drawer-identity-info">
              <h2 className="gm-drawer-name">{guest.full_name}</h2>
              <span className="gm-drawer-email">{guest.email}</span>
              {guest.last_booking_date && (
                <span className="gm-drawer-since">
                  <IconClock width={13} height={13} />
                  Last booked {formatDate(guest.last_booking_date)}
                </span>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="gm-drawer-stats">
            <div className="gm-drawer-stat">
              <span className="gm-drawer-stat-value">{guest.total_stays}</span>
              <span className="gm-drawer-stat-label">Total Stays</span>
            </div>
            <div className="gm-drawer-stat-divider" />
            <div className="gm-drawer-stat">
              <span className="gm-drawer-stat-value">
                {guest.host_rating ? (
                  <>
                    <IconStar width={14} height={14} style={{ color: "#C9A84C", fill: "#C9A84C", stroke: "none", verticalAlign: "-2px" }} />
                    {guest.host_rating}
                  </>
                ) : "—"}
              </span>
              <span className="gm-drawer-stat-label">Avg. Rating</span>
            </div>
            <div className="gm-drawer-stat-divider" />
            <div className="gm-drawer-stat">
              <span className="gm-drawer-stat-value">{formatCurrency(totalSpent)}</span>
              <span className="gm-drawer-stat-label">Total Spent</span>
            </div>
          </div>

          {/* Private note */}
          <section className="gm-drawer-section">
            <div className="gm-drawer-section-head">
              <h3 className="gm-drawer-section-title">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L12 14l-4 1 1-4 7.5-7.5Z" />
                </svg>
                Private Note
              </h3>
              {!editingNote && (
                <button
                  type="button"
                  className="gm-note-edit-btn"
                  onClick={() => setEditingNote(true)}
                  aria-label="Edit note"
                >
                  <IconEdit width={14} height={14} />
                  {note ? "Edit" : "Add note"}
                </button>
              )}
            </div>

            {editingNote ? (
              <div className="gm-note-editor">
                <textarea
                  ref={noteRef}
                  className="gm-note-textarea"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write a private note about this guest (only visible to you)…"
                  rows={4}
                  maxLength={500}
                />
                <div className="gm-note-editor-footer">
                  <span className="gm-note-char-count">{note.length}/500</span>
                  <div className="gm-note-editor-btns">
                    <button
                      type="button"
                      className="gm-note-btn gm-note-btn--cancel"
                      onClick={() => { setNote(guest.private_note || ""); setEditingNote(false); }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="gm-note-btn gm-note-btn--save"
                      onClick={handleSaveNote}
                      disabled={savingNote}
                    >
                      {savingNote ? (
                        <span className="btn-spinner" style={{ borderTopColor: "#fff", borderColor: "rgba(255,255,255,0.3)", width: 14, height: 14 }} />
                      ) : (
                        <IconCheck width={14} height={14} />
                      )}
                      Save
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="gm-note-display">
                {note ? (
                  <p>{note}</p>
                ) : (
                  <span className="gm-note-empty">No note yet. Add a private note to remember details about this guest.</span>
                )}
              </div>
            )}
          </section>

          {/* Booking history */}
          <section className="gm-drawer-section gm-drawer-section--last">
            <div className="gm-drawer-section-head">
              <h3 className="gm-drawer-section-title">
                <IconCalendar width={14} height={14} />
                Booking History
              </h3>
              <span className="gm-drawer-section-count">{bookings.length}</span>
            </div>
            {bookings.length === 0 ? (
              <p className="gm-note-empty">No bookings with your properties yet.</p>
            ) : (
              <div className="gm-booking-list">
                {bookings.map((b) => (
                  <BookingHistoryItem key={b.id} booking={b} />
                ))}
              </div>
            )}
          </section>

        </div>
      </aside>
    </>
  );
}

/* ─── Empty State ───────────────────────────────────────────── */

function EmptyState({ query }) {
  return (
    <div className="gm-empty">
      <svg className="gm-empty-illustration" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="20" y="30" width="140" height="70" rx="10" fill="var(--color-surface-alt)" />
        <circle cx="70" cy="52" r="16" fill="var(--color-border)" />
        <path d="M44 90c0-14.4 11.7-26 26-26s26 11.6 26 26" stroke="var(--color-border)" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="118" cy="62" r="22" fill="var(--color-bg)" stroke="var(--color-border)" strokeWidth="2.5" />
        <circle cx="118" cy="62" r="13" stroke="var(--color-border)" strokeWidth="2" fill="none" />
        <path d="M127 71l7 7" stroke="var(--color-border)" strokeWidth="2.5" strokeLinecap="round" />
        <text x="114" y="67" fontFamily="sans-serif" fontSize="13" fill="var(--color-text-muted)" fontWeight="700">?</text>
      </svg>
      <p className="gm-empty-title">
        {query ? `No guests matching "${query}"` : "No guests yet"}
      </p>
      <p className="gm-empty-body">
        {query
          ? "Try a different name or email address."
          : "Guests who have booked your properties will appear here."}
      </p>
    </div>
  );
}

/* ─── Error State ───────────────────────────────────────────── */

function ErrorState({ onRetry }) {
  return (
    <div className="gm-empty">
      <svg className="gm-empty-illustration" viewBox="0 0 180 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="20" y="30" width="140" height="70" rx="10" fill="var(--color-surface-alt)" />
        <circle cx="90" cy="62" r="24" fill="var(--color-error-light)" stroke="var(--color-error)" strokeWidth="2" />
        <path d="M90 50v16" stroke="var(--color-error)" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="90" cy="72" r="2" fill="var(--color-error)" />
      </svg>
      <p className="gm-empty-title">Could not load guests</p>
      <p className="gm-empty-body">Check your connection and try again.</p>
      <button type="button" className="gm-note-btn gm-note-btn--save" style={{ marginTop: 8 }} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

/* ─── Skeleton ──────────────────────────────────────────────── */

function GuestRowSkeleton() {
  return (
    <div className="gm-row gm-row--skeleton" aria-hidden="true">
      <div className="gm-avatar gm-avatar--md skeleton-pulse" />
      <div className="gm-row-info">
        <div className="skeleton-line" style={{ width: "55%", height: 14, borderRadius: 6 }} />
        <div className="skeleton-line" style={{ width: "38%", height: 12, borderRadius: 6, marginTop: 6 }} />
      </div>
      <div className="gm-row-meta" style={{ gap: 8 }}>
        <div className="skeleton-line" style={{ width: 60, height: 12, borderRadius: 6 }} />
        <div className="skeleton-line" style={{ width: 36, height: 12, borderRadius: 6 }} />
      </div>
      <div className="gm-row-last" style={{ gap: 6 }}>
        <div className="skeleton-line" style={{ width: 90, height: 12, borderRadius: 6 }} />
        <div className="skeleton-line" style={{ width: 50, height: 11, borderRadius: 6 }} />
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────── */

export default function GuestManagement() {
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [selectedGuest, setSelectedGuest] = useState(null);
  const searchRef = useRef(null);

  const loadGuests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGuests();
      setGuests(data);
    } catch (err) {
      console.error("Guest load error:", err);
      setError(err.message || "Failed to load guests");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadGuests(); }, [loadGuests]);

  // Background refresh: a newly-booked guest (or an updated stay) shows up
  // on its own, without the host needing to reload the page.
  const silentRefresh = useCallback(async () => {
    const data = await getGuests();
    setGuests(data);
  }, []);

  useSilentPoll(silentRefresh, POLL_INTERVAL_MS);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") setSelectedGuest(null); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const filtered = guests.filter((g) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return g.full_name.toLowerCase().includes(q) || g.email.toLowerCase().includes(q);
  });

  const handleGuestUpdate = useCallback((id, patch) => {
    setGuests((prev) => prev.map((g) => g.guest_id === id ? { ...g, ...patch } : g));
    setSelectedGuest((prev) => prev?.guest_id === id ? { ...prev, ...patch } : prev);
  }, []);

  const totalGuests = guests.length;
  const repeatCount = guests.filter((g) => g.total_stays > 1).length;

  return (
    <div className="gm-page">
      <header className="gm-page-header">
        <div className="gm-page-header-left">
          <h1 className="gm-page-title">Guests</h1>
          <p className="gm-page-subtitle">Your complete guest directory — history, notes, and trust signals in one place.</p>
        </div>
      </header>

      {/* Stats strip — 2 chips only */}
      <div className="gm-stats-strip">
        <div className="gm-stat-chip">
          <span className="gm-stat-chip-icon">
            <IconUser width={18} height={18} />
          </span>
          <div>
            <span className="gm-stat-chip-value">{loading ? "—" : totalGuests}</span>
            <span className="gm-stat-chip-label">Total Guests</span>
          </div>
        </div>
        <div className="gm-stat-chip">
          <span className="gm-stat-chip-icon gm-stat-chip-icon--gold">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M17 3H7l-4 9h18L17 3Z" />
              <path d="M3 12v2a9 9 0 0 0 18 0v-2" />
            </svg>
          </span>
          <div>
            <span className="gm-stat-chip-value">{loading ? "—" : repeatCount}</span>
            <span className="gm-stat-chip-label">Repeat Guests</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="gm-search-bar">
        <label htmlFor="gm-search" className="sr-only">Search guests</label>
        <span className="gm-search-icon" aria-hidden="true">
          <IconSearch width={17} height={17} />
        </span>
        <input
          id="gm-search"
          ref={searchRef}
          type="search"
          className="gm-search-input"
          placeholder="Search by name or email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
          disabled={loading || !!error}
        />
        {query && (
          <button
            type="button"
            className="gm-search-clear"
            onClick={() => { setQuery(""); searchRef.current?.focus(); }}
            aria-label="Clear search"
          >
            <IconX width={15} height={15} />
          </button>
        )}
      </div>

      {/* Column headers */}
      <div className="gm-list-header" aria-hidden="true">
        <span>Guest</span>
        <span className="gm-col-meta">Stays / Rating</span>
        <span className="gm-col-last">Last Booking</span>
      </div>

      {/* List */}
      <div className="gm-list" role="list">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <GuestRowSkeleton key={i} />)
        ) : error ? (
          <ErrorState onRetry={loadGuests} />
        ) : filtered.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          filtered.map((guest) => (
            <GuestRow
              key={guest.guest_id}
              guest={guest}
              isSelected={selectedGuest?.guest_id === guest.guest_id}
              onClick={() => setSelectedGuest(guest)}
            />
          ))
        )}
      </div>

      {selectedGuest && (
        <GuestProfileDrawer
          guest={selectedGuest}
          onClose={() => setSelectedGuest(null)}
          onGuestUpdate={handleGuestUpdate}
        />
      )}
    </div>
  );
}