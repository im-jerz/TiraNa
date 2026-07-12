/**
 * guests.js
 *
 * Guest Management API — Host-TiraNa
 *
 * Guest data is derived by aggregating all bookings across the host's
 * properties (via GET /api/host/property-bookings on client port 5000).
 * Property names are resolved from the host's own property list so we
 * can show "Bamboo Nook Studio" instead of a raw UUID.
 *
 * Shape of each derived guest object:
 * {
 *   guest_id         : string
 *   full_name        : string
 *   email            : string
 *   avatar_url       : string
 *   total_stays      : number
 *   last_booking_date: string (ISO)
 *   last_property    : string (resolved property name)
 *   bookings         : Booking[] (newest first, each has property_name)
 *   private_note     : string  (localStorage)
 * }
 */

import { getHostPropertyIds, getBookings } from "./bookings";
import { getProperties } from "./properties";

/* ─── Local-state helpers (note only — block removed) ───────── */

function noteKey(guestId) { return `tirana_guest_note_${guestId}`; }

export function getGuestNote(guestId) {
  return localStorage.getItem(noteKey(guestId)) ?? "";
}

export function setGuestNote(guestId, note) {
  if (note) localStorage.setItem(noteKey(guestId), note);
  else      localStorage.removeItem(noteKey(guestId));
}

/* ─── Derive guest list from bookings ────────────────────────── */

export async function getGuests() {
  // 1. Get host's property IDs
  const propertyIds = await getHostPropertyIds();
  if (!propertyIds.length) return [];

  // 2. Fetch property list for name resolution, and bookings in parallel
  const [propertiesRes, bookingsRes] = await Promise.all([
    getProperties(),
    getBookings(propertyIds),
  ]);

  // Build a map: property_id → property title
  const propertyMap = new Map();
  const propertiesList = propertiesRes?.properties ?? propertiesRes?.data?.properties ?? propertiesRes?.data ?? [];
  for (const prop of propertiesList) {
    const id = prop.property_id ?? prop.id;
    const name = prop.title ?? prop.name ?? `Property ${id}`;
    if (id) propertyMap.set(String(id), name);
  }

  const bookings = bookingsRes.data ?? [];

  // 3. Aggregate per guest_id
  const map = new Map();

  for (const booking of bookings) {
    const g = booking.guest;
    const gid = g.id;
    const propIdStr = String(booking.property_id);
    const propertyName = propertyMap.get(propIdStr) ?? `Property ${booking.property_id}`;

    if (!map.has(gid)) {
      map.set(gid, {
        guest_id: gid,
        full_name: g.full_name || g.username || "Unknown Guest",
        email: g.email,
        avatar_url: g.avatar_url || "",
        total_stays: 0,
        last_booking_date: null,
        last_property: null,
        bookings: [],
        private_note: getGuestNote(gid),
      });
    }

    const record = map.get(gid);
    record.total_stays += 1;

    const bookingDate = booking.created_at ?? booking.check_in;
    if (!record.last_booking_date || bookingDate > record.last_booking_date) {
      record.last_booking_date = bookingDate;
      record.last_property = propertyName;
    }

    record.bookings.push({
      id: booking.id,
      property_id: booking.property_id,
      property_name: propertyName,
      check_in: booking.check_in,
      check_out: booking.check_out,
      status: booking.status,
      total_price: booking.total_price,
      payment_method: booking.payment_method,
      adults: booking.adults,
      children: booking.children,
      infants: booking.infants,
      created_at: booking.created_at,
    });
  }

  // 4. Sort each guest's bookings newest-first
  for (const record of map.values()) {
    record.bookings.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
  }

  // 5. Return guests sorted by most recent booking
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.last_booking_date) - new Date(a.last_booking_date)
  );
}