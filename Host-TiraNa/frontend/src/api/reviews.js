/**
 * reviews.js
 *
 * Reviews & Ratings API — Host-TiraNa
 *
 * Uses axiosInstance (JWT-authenticated, goes through Vite proxy → Flask
 * backend → client server). The Flask backend resolves property ownership
 * from the JWT so we don't need to pass property_ids manually.
 *
 * Host replies are stored in localStorage until a backend reply endpoint exists.
 */

import axiosInstance from "./axiosInstance";

/* ─── Local reply storage ──────────────────────────────────────── */

const REPLY_PREFIX = "tirana_review_reply_";

export function getLocalReply(reviewId) {
  return localStorage.getItem(`${REPLY_PREFIX}${reviewId}`) ?? null;
}

export function saveLocalReply(reviewId, text) {
  if (text) {
    localStorage.setItem(`${REPLY_PREFIX}${reviewId}`, text);
  } else {
    localStorage.removeItem(`${REPLY_PREFIX}${reviewId}`);
  }
}

/* ─── Fetch reviews ─────────────────────────────────────────────── */

export async function getReviews(params = {}) {
  const { data } = await axiosInstance.get("/api/host/property-reviews", { params });

  // Response shape: { success: true, data: { reviews: [...], total, page, per_page } }
  const rawReviews = data?.data?.reviews ?? data?.data ?? data?.reviews ?? [];

  return rawReviews.map((r) => {
    // subcategories come nested from hostReviews.js
    const sc = r.subcategories ?? {};

    return {
      id: r.id,
      booking_id: r.booking_id,
      user_id: r.user_id,
      property_id: String(r.property_id),
      rating: parseFloat(r.rating) || 0,
      review_text: r.review_text ?? "",
      created_at: r.created_at,
      subcategories: {
        accuracy:      _clamp(sc.accuracy      ?? r.accuracy),
        check_in:      _clamp(sc.check_in      ?? r.check_in_score),
        cleanliness:   _clamp(sc.cleanliness   ?? r.cleanliness),
        communication: _clamp(sc.communication ?? r.communication),
        location:      _clamp(sc.location      ?? r.location_score),
        value:         _clamp(sc.value         ?? r.value),
      },
      guest: {
        id:         r.guest?.id ?? r.user_id,
        full_name:  r.guest?.full_name ?? r.guest?.username ?? "Guest",
        email:      r.guest?.email ?? "",
        avatar_url: r.guest?.avatar_url ?? "",
      },
      property: {
        id:       String(r.property?.id ?? r.property_id),
        name:     r.property?.name ?? `Property ${r.property_id}`,
        location: r.property?.location ?? "",
      },
      booking: {
        check_in:  r.booking?.check_in  ?? null,
        check_out: r.booking?.check_out ?? null,
      },
      host_reply: getLocalReply(r.id),
      status:     getLocalReply(r.id) ? "published" : "needs_reply",
    };
  });
}

/**
 * Clamp a subcategory value to 1–5 or return null.
 * Guards against timestamps, IDs, or other garbage values leaking in.
 */
function _clamp(v) {
  if (v === null || v === undefined) return null;
  const n = parseFloat(v);
  if (isNaN(n) || n < 1 || n > 5) return null;
  return n;
}

/* ─── Stats ─────────────────────────────────────────────────────── */

export async function getReviewStats() {
  try {
    const { data } = await axiosInstance.get("/api/host/property-reviews/stats");
    return data?.data ?? null;
  } catch {
    return null;
  }
}