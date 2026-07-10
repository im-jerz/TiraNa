import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  IconSearch,
  IconX,
  IconMapPin,
  IconCalendar,
  IconChevronDown,
  IconCheck,
  IconEdit,
  IconAlertCircle,
} from "../../components/icons";
import useReviewsData from "./useReviewsData";
import "../../styles/reviews.css";

const SORT_OPTIONS = [
  { key: "newest", label: "Newest First" },
  { key: "oldest", label: "Oldest First" },
  { key: "highest", label: "Highest Rating" },
  { key: "lowest", label: "Lowest Rating" },
];

const STATUS_FILTERS = [
  { key: "all", label: "All Reviews" },
  { key: "needs_reply", label: "Needs Reply" },
  { key: "published", label: "Replied" },
];

/* ─── Utility ─────────────────────────────────────────────────── */

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function timeAgo(str) {
  const diff = Math.floor((Date.now() - new Date(str)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  if (diff < 30) return `${diff}d ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}yr ago`;
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getAvatarHue(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++)
    h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h) % 360;
}

/* ─── Sub-components ──────────────────────────────────────────── */

function StarBar({ value, max = 5 }) {
  const pct = Math.max(0, Math.min(1, (value || 0) / max));
  return (
    <div className="rv-starbar" role="img" aria-label={`${value} out of ${max} stars`}>
      <div className="rv-starbar-track">
        <div className="rv-starbar-fill" style={{ width: `${pct * 100}%` }} />
      </div>
    </div>
  );
}

function StarRating({ value, size = 16, showValue = false }) {
  const v = value || 0;
  const full = Math.floor(v);
  const partial = v - full;
  const empty = 5 - Math.ceil(v);
  return (
    <span className="rv-stars" aria-label={`${v} stars`}>
      {Array.from({ length: full }).map((_, i) => (
        <StarIcon key={`f${i}`} fill={1} size={size} />
      ))}
      {partial > 0 && <StarIcon fill={partial} size={size} />}
      {Array.from({ length: Math.max(0, empty) }).map((_, i) => (
        <StarIcon key={`e${i}`} fill={0} size={size} />
      ))}
      {showValue && <span className="rv-stars-value">{v.toFixed(1)}</span>}
    </span>
  );
}

function StarIcon({ fill, size }) {
  const id = `sg-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {fill > 0 && fill < 1 && (
        <defs>
          <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
            <stop offset={`${fill * 100}%`} stopColor="#C9A84C" />
            <stop offset={`${fill * 100}%`} stopColor="#E5E0D8" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 3.5l2.5 5.6 6 .6-4.5 4 1.3 5.9-5.3-3.2L6.7 19.6l1.3-5.9-4.5-4 6-.6L12 3.5Z"
        fill={fill === 1 ? "#C9A84C" : fill === 0 ? "#E5E0D8" : `url(#${id})`}
        stroke="none"
      />
    </svg>
  );
}

function GuestAvatar({ name, size = "md" }) {
  return (
    <div
      className={`rv-avatar rv-avatar--${size}`}
      style={{ "--av-hue": getAvatarHue(name) }}
      aria-hidden="true"
    >
      <span>{getInitials(name)}</span>
    </div>
  );
}

function RatingBadge({ value }) {
  const cls =
    value >= 4.5
      ? "rv-badge rv-badge--great"
      : value >= 3.5
      ? "rv-badge rv-badge--good"
      : value >= 2.5
      ? "rv-badge rv-badge--fair"
      : "rv-badge rv-badge--poor";
  return <span className={cls}>{(value || 0).toFixed(1)}</span>;
}

function SubcategoryRow({ label, value }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="rv-sub-row">
      <span className="rv-sub-label">{label}</span>
      <div className="rv-sub-right">
        <StarBar value={value} />
        <span className="rv-sub-val">{value}</span>
      </div>
    </div>
  );
}

/* ─── Skeleton loader ─────────────────────────────────────────── */

function ReviewCardSkeleton() {
  return (
    <div className="rv-card rv-card--skeleton">
      <div className="rv-skel rv-skel--row">
        <div className="rv-skel rv-skel--circle" />
        <div className="rv-skel-lines">
          <div className="rv-skel rv-skel--line rv-skel--w60" />
          <div className="rv-skel rv-skel--line rv-skel--w40" />
        </div>
      </div>
      <div className="rv-skel rv-skel--line rv-skel--w100" />
      <div className="rv-skel rv-skel--line rv-skel--w80" />
      <div className="rv-skel rv-skel--line rv-skel--w90" />
    </div>
  );
}

/* ─── Review Card ─────────────────────────────────────────────── */

function ReviewCard({ review, onReply, isHighlighted }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = review.review_text.length > 200;
  const displayText =
    isLong && !expanded ? review.review_text.slice(0, 200) + "…" : review.review_text;
  const needsReply = review.status === "needs_reply";

  const subcats = review.subcategories || {};
  const hasSubcats = Object.values(subcats).some((v) => v !== null && v !== undefined);

  return (
    <article
      id={`review-${review.id}`}
      className={`rv-card${needsReply ? " rv-card--attention" : ""}${isHighlighted ? " deep-link-highlight" : ""}`}
    >
      {/* Card header */}
      <div className="rv-card-header">
        <div className="rv-card-guest">
          <GuestAvatar name={review.guest.full_name} size="md" />
          <div className="rv-card-guest-info">
            <span className="rv-card-guest-name">{review.guest.full_name}</span>
            <span className="rv-card-guest-email">{review.guest.email}</span>
          </div>
        </div>
        <div className="rv-card-meta">
          <RatingBadge value={review.rating} />
          <span className="rv-card-date">{timeAgo(review.created_at)}</span>
        </div>
      </div>

      {/* Property + dates strip */}
      <div className="rv-card-property-strip">
        <span className="rv-card-property-name">
          <IconMapPin width={13} height={13} />
          {review.property.name}
        </span>
        {(review.booking?.check_in || review.booking?.check_out) && (
          <span className="rv-card-dates">
            <IconCalendar width={13} height={13} />
            {formatDate(review.booking.check_in)} – {formatDate(review.booking.check_out)}
          </span>
        )}
      </div>

      {/* Star rating visual */}
      <div className="rv-card-stars-row">
        <StarRating value={review.rating} size={15} />
      </div>

      {/* Review text */}
      <p className="rv-card-text">
        {displayText}
        {isLong && (
          <button
            type="button"
            className="rv-expand-btn"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? " Show less" : " Show more"}
          </button>
        )}
      </p>

      {/* Subcategories */}
      {hasSubcats && (
        <div className="rv-subcats">
          <SubcategoryRow label="Accuracy" value={subcats.accuracy} />
          <SubcategoryRow label="Check-in" value={subcats.check_in} />
          <SubcategoryRow label="Cleanliness" value={subcats.cleanliness} />
          <SubcategoryRow label="Communication" value={subcats.communication} />
          <SubcategoryRow label="Location" value={subcats.location} />
          <SubcategoryRow label="Value" value={subcats.value} />
        </div>
      )}

      {/* Host reply */}
      {review.host_reply && (
        <div className="rv-reply-bubble">
          <div className="rv-reply-label">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Your response
          </div>
          <p className="rv-reply-text">{review.host_reply}</p>
        </div>
      )}

      {/* Actions */}
      <div className="rv-card-actions">
        {needsReply && (
          <div className="rv-needs-reply-pill">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            Awaiting your reply
          </div>
        )}
        <button
          type="button"
          className={`rv-action-btn${needsReply ? " rv-action-btn--primary" : ""}`}
          onClick={() => onReply(review)}
        >
          <IconEdit width={14} height={14} />
          {review.host_reply ? "Edit reply" : "Reply to guest"}
        </button>
      </div>
    </article>
  );
}

/* ─── Summary Panel ──────────────────────────────────────────── */

function OverallSummary({ reviews, loading }) {
  const avg =
    reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(2)
      : "—";

  const dist = [5, 4, 3, 2, 1].map((n) => ({
    star: n,
    count: reviews.filter((r) => Math.round(r.rating) === n).length,
  }));
  const maxCount = Math.max(...dist.map((d) => d.count), 1);

  const SUBCAT_KEYS = [
    { key: "accuracy", label: "Accuracy" },
    { key: "check_in", label: "Check-in" },
    { key: "cleanliness", label: "Cleanliness" },
    { key: "communication", label: "Communication" },
    { key: "location", label: "Location" },
    { key: "value", label: "Value" },
  ];

  const subcatAvgs = SUBCAT_KEYS.map(({ key, label }) => {
    const vals = reviews
      .map((r) => r.subcategories?.[key])
      .filter((v) => v !== null && v !== undefined);
    return {
      key,
      label,
      avg: vals.length
        ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1)
        : null,
    };
  });

  const needsReplyCount = reviews.filter((r) => r.status === "needs_reply").length;

  return (
    <aside className="rv-summary-panel">
      {/* Overall score */}
      <div className="rv-summary-score-block">
        <div className="rv-summary-score-mark">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 3.5l2.5 5.6 6 .6-4.5 4 1.3 5.9-5.3-3.2L6.7 19.6l1.3-5.9-4.5-4 6-.6L12 3.5Z"
              fill="#C9A84C"
              stroke="none"
            />
          </svg>
        </div>
        <div>
          <div className="rv-summary-avg">{loading ? "…" : avg}</div>
          <div className="rv-summary-count">
            {loading ? "Loading…" : `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`}
          </div>
        </div>
      </div>

      {/* Star distribution */}
      <div className="rv-summary-dist">
        {dist.map((d) => (
          <div key={d.star} className="rv-dist-row">
            <span className="rv-dist-label">{d.star}</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#C9A84C" aria-hidden="true">
              <path d="M12 3.5l2.5 5.6 6 .6-4.5 4 1.3 5.9-5.3-3.2L6.7 19.6l1.3-5.9-4.5-4 6-.6L12 3.5Z" />
            </svg>
            <div className="rv-dist-bar-track">
              <div
                className="rv-dist-bar-fill"
                style={{ width: maxCount > 0 ? `${(d.count / maxCount) * 100}%` : "0%" }}
              />
            </div>
            <span className="rv-dist-count">{d.count}</span>
          </div>
        ))}
      </div>

      <div className="rv-summary-divider" />

      {/* Subcategory averages */}
      <div className="rv-summary-subcats">
        <div className="rv-summary-subcats-title">Category Averages</div>
        {subcatAvgs.map((sc) => (
          <div key={sc.key} className="rv-summary-subcat-row">
            <span className="rv-summary-subcat-label">{sc.label}</span>
            <div className="rv-summary-subcat-right">
              <StarBar value={sc.avg ? parseFloat(sc.avg) : 0} />
              <span className="rv-summary-subcat-val">{sc.avg ?? "—"}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Needs reply alert */}
      {needsReplyCount > 0 && (
        <>
          <div className="rv-summary-divider" />
          <div className="rv-summary-attention">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
            <span>
              {needsReplyCount} review{needsReplyCount !== 1 ? "s" : ""} need your reply
            </span>
          </div>
        </>
      )}
    </aside>
  );
}

/* ─── Reply Modal ─────────────────────────────────────────────── */

function ReplyModal({ review, onClose, onSave }) {
  const [text, setText] = useState(review?.host_reply || "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    // Small deliberate delay so the spinner is visible
    await new Promise((r) => setTimeout(r, 400));
    onSave(review.id, text.trim());
    setSaving(false);
  }

  if (!review) return null;

  return (
    <div
      className="rv-modal-backdrop"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="rv-modal" role="dialog" aria-modal="true" aria-labelledby="rv-modal-title">
        <div className="rv-modal-header">
          <div>
            <h2 id="rv-modal-title" className="rv-modal-title">
              Reply to {review.guest.full_name}
            </h2>
            <p className="rv-modal-subtitle">
              Your response will be visible to all future guests
            </p>
          </div>
          <button
            type="button"
            className="rv-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <IconX width={18} height={18} />
          </button>
        </div>

        {/* Guest review excerpt */}
        <div className="rv-modal-quote">
          <div className="rv-modal-quote-header">
            <GuestAvatar name={review.guest.full_name} size="sm" />
            <div>
              <span className="rv-modal-quote-name">{review.guest.full_name}</span>
              <StarRating value={review.rating} size={12} showValue />
            </div>
          </div>
          <p className="rv-modal-quote-text">
            "{review.review_text.slice(0, 180)}
            {review.review_text.length > 180 ? "…" : ""}"
          </p>
        </div>

        {/* Reply textarea */}
        <div className="rv-modal-field">
          <label htmlFor="rv-reply-text" className="rv-modal-label">
            Your Response
          </label>
          <textarea
            id="rv-reply-text"
            className="rv-modal-textarea"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Thank the guest, address their concerns, and show future guests that you care…"
            rows={5}
            maxLength={1000}
          />
          <div className="rv-modal-charcount">{text.length}/1000</div>
        </div>

        <div className="rv-modal-actions">
          <button type="button" className="rv-modal-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="rv-modal-save"
            onClick={handleSave}
            disabled={saving || !text.trim()}
          >
            {saving ? (
              <span className="rv-modal-spinner" aria-hidden="true" />
            ) : (
              <IconCheck width={15} height={15} />
            )}
            {saving ? "Saving…" : "Publish Response"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */

export default function ReviewsPage() {
  const { reviews, loading, error, reload, saveReply } = useReviewsData();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [filterProp, setFilterProp] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sort, setSort] = useState("newest");
  const [replyTarget, setReplyTarget] = useState(null);

  const highlightId = searchParams.get("highlight");
  const scrolledRef = useRef(false);

  // When arriving via a notification deep-link, clear any active filters
  // so the highlighted review is guaranteed to be visible.
  useEffect(() => {
    if (highlightId) {
      setFilterProp("all");
      setFilterStatus("all");
      setSearch("");
    }
  }, [highlightId]);

  useEffect(() => {
    if (!highlightId || loading || scrolledRef.current) return;
    const el = document.getElementById(`review-${highlightId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      scrolledRef.current = true;
      const t = window.setTimeout(() => {
        searchParams.delete("highlight");
        setSearchParams(searchParams, { replace: true });
      }, 2500);
      return () => window.clearTimeout(t);
    }
  }, [highlightId, loading, reviews, searchParams, setSearchParams]);

  // Derive unique property list dynamically from real data
  const propertyOptions = useMemo(() => {
    const names = [...new Set(reviews.map((r) => r.property.name))].sort();
    return names;
  }, [reviews]);

  const filtered = useMemo(() => {
    let r = reviews;
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (rv) =>
          rv.guest.full_name.toLowerCase().includes(q) ||
          rv.review_text.toLowerCase().includes(q) ||
          rv.property.name.toLowerCase().includes(q)
      );
    }
    if (filterProp !== "all") r = r.filter((rv) => rv.property.name === filterProp);
    if (filterStatus !== "all") r = r.filter((rv) => rv.status === filterStatus);
    return r.slice().sort((a, b) => {
      if (sort === "newest") return new Date(b.created_at) - new Date(a.created_at);
      if (sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
      if (sort === "highest") return b.rating - a.rating;
      if (sort === "lowest") return a.rating - b.rating;
      return 0;
    });
  }, [reviews, search, filterProp, filterStatus, sort]);

  function handleSaveReply(id, text) {
    saveReply(id, text);
    setReplyTarget(null);
  }

  function handleReset() {
    setSearch("");
    setFilterProp("all");
    setFilterStatus("all");
  }

  return (
    <>
      <div className="rv-page">
        {/* Page header */}
        <header className="rv-page-header">
          <div>
            <h1 className="rv-page-title">Reviews & Ratings</h1>
            <p className="rv-page-subtitle">
              Manage guest feedback across all your properties
            </p>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="rv-error-banner" role="alert">
            <IconAlertCircle width={16} height={16} />
            <span>{error}</span>
            <button type="button" className="rv-error-retry" onClick={reload}>
              Retry
            </button>
          </div>
        )}

        <div className="rv-layout">
          {/* Summary sidebar */}
          <OverallSummary reviews={reviews} loading={loading} />

          {/* Main column */}
          <div className="rv-main">
            {/* Toolbar */}
            <div className="rv-toolbar">
              {/* Search */}
              <div className="rv-search-wrap">
                <IconSearch width={16} height={16} className="rv-search-icon" />
                <input
                  type="search"
                  className="rv-search"
                  placeholder="Search reviews or guests…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search reviews"
                />
                {search && (
                  <button
                    type="button"
                    className="rv-search-clear"
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <IconX width={14} height={14} />
                  </button>
                )}
              </div>

              {/* Filters row */}
              <div className="rv-filters">
                {/* Status pills */}
                <div className="rv-status-pills" role="group" aria-label="Filter by status">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      className={`rv-pill${filterStatus === f.key ? " rv-pill--active" : ""}`}
                      onClick={() => setFilterStatus(f.key)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <div className="rv-selects">
                  {/* Property filter — populated from real data */}
                  <div className="rv-select-wrap">
                    <select
                      className="rv-select"
                      value={filterProp}
                      onChange={(e) => setFilterProp(e.target.value)}
                      aria-label="Filter by property"
                    >
                      <option value="all">All Properties</option>
                      {propertyOptions.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                    <IconChevronDown width={14} height={14} className="rv-select-arrow" />
                  </div>

                  {/* Sort */}
                  <div className="rv-select-wrap">
                    <select
                      className="rv-select"
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      aria-label="Sort reviews"
                    >
                      {SORT_OPTIONS.map((o) => (
                        <option key={o.key} value={o.key}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    <IconChevronDown width={14} height={14} className="rv-select-arrow" />
                  </div>
                </div>
              </div>
            </div>

            {/* Result count */}
            {!loading && (
              <div className="rv-result-count">
                {filtered.length === 0
                  ? "No reviews found"
                  : `${filtered.length} review${filtered.length !== 1 ? "s" : ""}`}
              </div>
            )}

            {/* Loading skeletons */}
            {loading ? (
              <div className="rv-cards">
                {Array.from({ length: 3 }).map((_, i) => (
                  <ReviewCardSkeleton key={i} />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="rv-empty">
                <div className="rv-empty-icon">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M12 3.5l2.5 5.6 6 .6-4.5 4 1.3 5.9-5.3-3.2L6.7 19.6l1.3-5.9-4.5-4 6-.6L12 3.5Z" />
                  </svg>
                </div>
                <p className="rv-empty-title">
                  {reviews.length === 0
                    ? "No reviews yet"
                    : "No reviews match your filters"}
                </p>
                <p className="rv-empty-sub">
                  {reviews.length === 0
                    ? "Guest reviews will appear here once they complete their stays."
                    : "Try adjusting your search or filter criteria."}
                </p>
                {reviews.length > 0 && (
                  <button type="button" className="rv-empty-reset" onClick={handleReset}>
                    Reset filters
                  </button>
                )}
              </div>
            ) : (
              <div className="rv-cards">
                {filtered.map((r) => (
                  <ReviewCard
                    key={r.id}
                    review={r}
                    onReply={setReplyTarget}
                    isHighlighted={String(r.id) === String(highlightId)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {replyTarget && (
        <ReplyModal
          review={replyTarget}
          onClose={() => setReplyTarget(null)}
          onSave={handleSaveReply}
        />
      )}
    </>
  );
}