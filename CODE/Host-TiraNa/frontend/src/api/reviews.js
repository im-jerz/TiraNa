/**
 * reviews.js
 *
 * Reviews & Ratings API — Host-TiraNa
 *
 * Review data lives on the client server (port 5000 / VITE_CLIENT_API_URL).
 * The host identifies their properties through the host API first, then
 * fetches all reviews for those property IDs from the client API.
 *
 * Shape of each review object returned by getReviews():
 * {
 *   id            : string (UUID)
 *   booking_id    : string
 *   user_id       : string
 *   property_id   : string
 *   rating        : number  (1.0 – 5.0)
 *   review_text   : string
 *   created_at    : string (ISO)
 *   accuracy      : number | null
 *   check_in      : number | null
 *   cleanliness   : number | null
 *   communication : number | null
 *   location      : number | null
 *   value         : number | null
 *   guest         : { id, full_name, email, avatar_url }
 *   property      : { id, name, location }
 *   booking       : { check_in, check_out }
 *   host_reply    : string | null   (local state — not persisted to DB yet)
 * }
 */

import clientApi from "./clientApi";
import { getHostPropertyIds } from "./bookings";
import { getProperties } from "./properties";

/* ─── Local reply storage (host replies) ────────────────────────
   Until the backend exposes a reply endpoint, replies are stored in
   localStorage keyed by review id so they survive page reloads.
   ────────────────────────────────────────────────────────────── */

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

/* ─── Fetch reviews for all host properties ──────────────────── */

/**
 * GET /api/host/property-reviews?property_ids=id1,id2,...
 *
 * Falls back to fetching per property if a bulk endpoint isn't available.
 */
export async function getReviews() {
  // 1. Get the host's property IDs (via host API with auth)
  const propertyIds = await getHostPropertyIds();
  if (!propertyIds.length) return [];

  // 2. Resolve property names in parallel
  let propertyMap = new Map();
  try {
    const propertiesRes = await getProperties();
    const list =
      propertiesRes?.data?.properties ??
      propertiesRes?.properties ??
      propertiesRes?.data ??
      [];
    for (const prop of list) {
      const id = String(prop.property_id ?? prop.id);
      const name = prop.title ?? prop.name ?? `Property ${id}`;
      const location = [prop.city, prop.province, prop.country]
        .filter(Boolean)
        .join(", ");
      propertyMap.set(id, { name, location });
    }
  } catch {
    // Non-fatal — we'll show property IDs as fallback
  }

  // 3. Fetch all reviews for host properties from client API
  const { data } = await clientApi.get("/api/host/property-reviews", {
    params: { property_ids: propertyIds.join(",") },
  });

  const rawReviews = data?.data ?? data?.reviews ?? [];

  // 4. Shape + enrich each review
  return rawReviews.map((r) => {
    const propId = String(r.property_id);
    const propMeta = propertyMap.get(propId) ?? {
      name: `Property ${propId}`,
      location: "",
    };

    const subcategories = {
      accuracy: r.accuracy ?? null,
      check_in: r.check_in ?? null,
      cleanliness: r.cleanliness ?? null,
      communication: r.communication ?? null,
      location: r.location ?? null,
      value: r.value ?? null,
    };

    return {
      id: r.id,
      booking_id: r.booking_id,
      user_id: r.user_id,
      property_id: propId,
      rating: parseFloat(r.rating),
      review_text: r.review_text ?? "",
      created_at: r.created_at,
      subcategories,
      guest: {
        id: r.guest?.id ?? r.user_id,
        full_name: r.guest?.full_name ?? r.guest?.username ?? "Guest",
        email: r.guest?.email ?? "",
        avatar_url: r.guest?.avatar_url ?? "",
      },
      property: {
        id: propId,
        name: propMeta.name,
        location: propMeta.location,
      },
      booking: {
        check_in: r.booking?.check_in ?? null,
        check_out: r.booking?.check_out ?? null,
      },
      // Merge locally-stored reply
      host_reply: getLocalReply(r.id),
      // Derive status from whether a reply exists
      status: getLocalReply(r.id) ? "published" : "needs_reply",
    };
  });
}

/**
 * GET /api/host/property-reviews/stats?property_ids=...
 *
 * Returns aggregated stats: avg rating, total count, per-subcategory avg.
 * If the endpoint doesn't exist yet, we return null and let the hook
 * compute stats client-side from the full review list.
 */
export async function getReviewStats(propertyIds) {
  try {
    const { data } = await clientApi.get("/api/host/property-reviews/stats", {
      params: { property_ids: propertyIds.join(",") },
    });
    return data?.data ?? null;
  } catch {
    return null;
  }
}