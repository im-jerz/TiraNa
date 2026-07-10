/**
 * Resolves the destination route for a notification, used by the Topbar
 * dropdown, the Notifications page, and the slide-in toast so all three
 * navigate consistently when a notification is clicked.
 *
 * `related_id` is the CockroachDB id of the booking or review (passed
 * through from the Client backend when the notification was created).
 * When present, the destination page picks it up via `?highlight=<id>`
 * and scrolls/highlights the matching card.
 */
const BOOKING_TYPES = new Set([
  "new_booking",
  "booking_confirmed",
  "booking_cancelled",
  "refund_requested",
  "refund_completed",
]);

const REVIEW_TYPES = new Set(["new_review", "review_updated"]);

const STAY_TYPES = new Set(["guest_checkin", "guest_checkout"]);

const LISTING_TYPES = new Set(["listing_approved", "listing_rejected"]);

export function resolveNotificationLink(notification) {
  const { type, related_id } = notification;

  if (BOOKING_TYPES.has(type)) {
    return related_id
      ? `/dashboard/bookings?highlight=${related_id}`
      : `/dashboard/bookings`;
  }

  if (REVIEW_TYPES.has(type)) {
    return related_id
      ? `/dashboard/reviews?highlight=${related_id}`
      : `/dashboard/reviews`;
  }

  if (STAY_TYPES.has(type)) {
    return related_id
      ? `/dashboard/bookings?highlight=${related_id}`
      : `/dashboard/bookings`;
  }

  if (LISTING_TYPES.has(type)) {
    return related_id
      ? `/dashboard/properties/${related_id}/edit`
      : `/dashboard/properties`;
  }

  if (type === "payment_credited" || type === "withdrawal_done") {
    return `/dashboard/revenue`;
  }

  // announcement, support_update, or anything unrecognized: stay on the
  // notifications page itself, no further navigation.
  return null;
}