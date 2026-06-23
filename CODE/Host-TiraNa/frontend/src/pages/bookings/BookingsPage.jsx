import { useMemo, useState } from "react";
import { IconCalendar, IconCheck, IconX, IconUser, IconMapPin, IconClock, IconMoney } from "../../components/icons";
import SkeletonGrid from "../../components/property/SkeletonGrid";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../components/common/Toast";
import useBookingsData from "./useBookingsData";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Completed" },
  { key: "cancelled", label: "Cancelled" },
  { key: "refund_requested", label: "Refund Requested" },
  { key: "refund_completed", label: "Refund Completed" },
];

const STATUS_LABEL = {
  pending: "Pending",
  confirmed: "Confirmed",
  completed: "Completed",
  cancelled: "Cancelled",
  refund_requested: "Refund Requested",
  refund_completed: "Refund Completed",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

function formatCurrency(n) {
  return `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 0 })}`;
}

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const diff = new Date(checkOut) - new Date(checkIn);
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getDisplayStatus(booking) {
  if (booking.status === "pending") {
    const now = new Date();
    const checkOut = new Date(booking.check_out);
    if (checkOut < now) return "cancelled";
  }
  return booking.status;
}

function BookingCard({ booking, onConfirm, onCancel, onCompleteRefund }) {
  const b = booking;
  const guest = b.guest || {};
  const nights = nightsBetween(b.check_in, b.check_out);
  const status = getDisplayStatus(booking);
  const isPending = status === "pending";
  const isRefundRequested = status === "refund_requested";

  return (
    <article className="booking-card">
      <div className="booking-card-header">
        <div className="booking-card-guest">
          <div className="booking-card-avatar">
            {guest.avatar_url ? (
              <img src={guest.avatar_url} alt={guest.full_name} />
            ) : (
              <IconUser />
            )}
          </div>
          <div className="booking-card-guest-info">
            <span className="booking-card-guest-name">{guest.full_name || guest.username || "Guest"}</span>
            <span className="booking-card-guest-email">{guest.email}</span>
          </div>
        </div>
        <span className={`status-pill ${status}`}>{STATUS_LABEL[status]}</span>
      </div>

      <div className="booking-card-body">
        <div className="booking-card-dates">
          <div className="booking-card-date-block">
            <span className="booking-card-date-label">Check-in</span>
            <span className="booking-card-date-value">{formatDate(b.check_in)}</span>
          </div>
          <div className="booking-card-date-arrow">→</div>
          <div className="booking-card-date-block">
            <span className="booking-card-date-label">Check-out</span>
            <span className="booking-card-date-value">{formatDate(b.check_out)}</span>
          </div>
        </div>

        <div className="booking-card-meta">
          <div className="booking-card-meta-item">
            <IconClock />
            <span>{nights} night{nights !== 1 ? "s" : ""}</span>
          </div>
          <div className="booking-card-meta-item">
            <IconUser />
            <span>{b.adults} adult{b.adults !== 1 ? "s" : ""}{b.children > 0 ? `, ${b.children} child${b.children !== 1 ? "ren" : ""}` : ""}</span>
          </div>
          <div className="booking-card-meta-item">
            <IconMoney />
            <span>{formatCurrency(b.total_price)}</span>
          </div>
        </div>

        <div className="booking-card-payment">
          <span className="booking-card-payment-label">Payment:</span>
          <span className="booking-card-payment-method">{b.payment_method === "online" ? "Online" : "Cash"}</span>
        </div>
      </div>

      {isPending && (
        <div className="booking-card-actions">
          <button
            type="button"
            className="btn-inline btn-primary btn-inline-sm"
            onClick={() => onConfirm(booking)}
          >
            <IconCheck /> Confirm
          </button>
          <button
            type="button"
            className="btn-inline btn-danger btn-inline-sm"
            onClick={() => onCancel(booking)}
          >
            <IconX /> Decline
          </button>
        </div>
      )}
      {isRefundRequested && (
        <div className="booking-card-actions">
          <button
            type="button"
            className="btn-inline btn-primary btn-inline-sm"
            onClick={() => onCompleteRefund(booking)}
          >
            <IconCheck /> Refund Completed
          </button>
        </div>
      )}
    </article>
  );
}

export default function BookingsPage() {
  const { bookings, stats, loading, error, confirm, cancel, completeRefund } = useBookingsData();
  const { push } = useToast();

  const [activeFilter, setActiveFilter] = useState("all");
  const [pendingAction, setPendingAction] = useState(null);
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const c = { all: bookings.length };
    for (const b of bookings) {
      const s = getDisplayStatus(b);
      c[s] = (c[s] || 0) + 1;
    }
    return c;
  }, [bookings]);

  const visible = useMemo(() => {
    if (activeFilter === "all") return bookings;
    return bookings.filter((b) => getDisplayStatus(b) === activeFilter);
  }, [bookings, activeFilter]);

  function handleConfirmRequest(booking) {
    setPendingAction({ type: "confirm", booking });
  }

  function handleCancelRequest(booking) {
    setPendingAction({ type: "cancel", booking });
  }

  function handleCompleteRefundRequest(booking) {
    setPendingAction({ type: "refund", booking });
  }

  async function handleConfirm() {
    if (!pendingAction) return;
    setBusy(true);
    try {
      if (pendingAction.type === "confirm") {
        await confirm(pendingAction.booking.id);
        push("Booking confirmed successfully.", "success");
      } else if (pendingAction.type === "cancel") {
        await cancel(pendingAction.booking.id);
        push("Booking declined.", "success");
      } else if (pendingAction.type === "refund") {
        await completeRefund(pendingAction.booking.id);
        push("Refund marked as completed.", "success");
      }
      setPendingAction(null);
    } catch (err) {
      push(err.response?.data?.message || "Something went wrong. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div className="page-head-text">
          <h1>Bookings</h1>
          <p>View and manage all guest bookings across your properties.</p>
        </div>
      </div>

      {stats && (
        <div className="builder-field-grid cols-3" style={{ marginBottom: "var(--space-6)" }}>
          <div className="property-card" style={{ padding: "var(--space-5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
              <span className="option-card-icon" style={{ background: "var(--color-surface-alt)" }}>
                <IconCalendar />
              </span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)" }}>Total Bookings</span>
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {stats.total}
            </div>
          </div>
          <div className="property-card" style={{ padding: "var(--space-5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
              <span className="option-card-icon" style={{ background: "var(--color-surface-alt)" }}>
                <IconClock />
              </span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)" }}>Pending</span>
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {stats.pending}
            </div>
          </div>
          <div className="property-card" style={{ padding: "var(--space-5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
              <span className="option-card-icon" style={{ background: "var(--color-surface-alt)" }}>
                <IconMoney />
              </span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)" }}>Revenue</span>
            </div>
            <div style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text-primary)" }}>
              {formatCurrency(stats.total_revenue)}
            </div>
          </div>
        </div>
      )}

      <div className="toolbar-row">
        <div className="filter-tabs" role="tablist" aria-label="Filter bookings by status">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={activeFilter === f.key}
              className={`filter-tab ${activeFilter === f.key ? "active" : ""}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
              {counts[f.key] ? <span className="filter-tab-count">{counts[f.key]}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonGrid count={4} />
      ) : error ? (
        <div className="empty-state">
          <h3>Couldn't load bookings</h3>
          <p>{error}</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <EmptyBookingIllustration />
          <h3>No bookings yet</h3>
          <p>When guests book your properties, their reservations will appear here.</p>
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <h3>No bookings match this filter</h3>
          <p>Try a different status tab to see other bookings.</p>
        </div>
      ) : (
        <div className="bookings-grid">
          {visible.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onConfirm={handleConfirmRequest}
              onCancel={handleCancelRequest}
              onCompleteRefund={handleCompleteRefundRequest}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!pendingAction}
        tone={pendingAction?.type === "cancel" ? "danger" : pendingAction?.type === "refund" ? "success" : "warn"}
        title={
          pendingAction?.type === "confirm"
            ? `Confirm this booking?`
            : pendingAction?.type === "refund"
            ? `Mark refund as completed?`
            : `Decline this booking?`
        }
        description={
          pendingAction?.type === "confirm"
            ? "This will confirm the guest's reservation. They will be notified of the confirmation."
            : pendingAction?.type === "refund"
            ? "This will mark the refund as completed. The guest's refund request will be resolved."
            : "This will decline the guest's reservation. They will be notified of the cancellation."
        }
        confirmLabel={
          pendingAction?.type === "confirm"
            ? "Yes, confirm"
            : pendingAction?.type === "refund"
            ? "Yes, refund completed"
            : "Yes, decline"
        }
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}

function EmptyBookingIllustration() {
  return (
    <svg className="empty-state-illo" viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="80" cy="80" r="78" fill="#F4F1E8" />
      <rect x="35" y="45" width="90" height="75" rx="6" fill="#FBF9F4" stroke="#1B2A4A" strokeWidth="1.5" />
      <rect x="35" y="45" width="90" height="20" rx="6" fill="#1B2A4A" />
      <rect x="45" y="51" width="20" height="8" rx="2" fill="#C9A84C" opacity="0.85" />
      <line x1="45" y1="80" x2="115" y2="80" stroke="#E5E0D8" strokeWidth="1" />
      <line x1="45" y1="95" x2="115" y2="95" stroke="#E5E0D8" strokeWidth="1" />
      <line x1="45" y1="110" x2="90" y2="110" stroke="#E5E0D8" strokeWidth="1" />
      <rect x="100" y="100" width="12" height="12" rx="2" fill="#16A34A" opacity="0.2" />
      <path d="M103 106 L106 109 L111 103" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="120" cy="40" r="3" fill="#C9A84C" opacity="0.7" />
      <circle cx="40" cy="38" r="2" fill="#C9A84C" opacity="0.5" />
    </svg>
  );
}
