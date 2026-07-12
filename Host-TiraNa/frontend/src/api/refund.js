/**
 * refund.js
 *
 * Refund flow API — Host-TiraNa
 *
 * Backs the Wallet page's refund receipt/send flow (host_flow.md §8, plus
 * the "Refund Completed" action on the Bookings page). See:
 *   Client-TiraNa/backend/routes/hostRefund.js
 *
 * GET  /refund-receipt/:bookingId       — read-only preview, nothing sent
 * POST /refund-receipt/:bookingId/send  — actually processes it (real
 *                                          PayMongo Refunds API call for
 *                                          online payments; manual complete
 *                                          for cash bookings)
 */

import clientApi from "./clientApi";

export async function getRefundReceipt(bookingId, propertyIds) {
  const { data } = await clientApi.get(`/api/host/refund-receipt/${bookingId}`, {
    params: { property_ids: propertyIds.join(",") },
  });
  return data.data;
}

export async function sendRefund(bookingId, propertyIds, options = {}) {
  const { data } = await clientApi.post(`/api/host/refund-receipt/${bookingId}/send`, {
    property_ids: propertyIds,
    force_manual: options.forceManual === true,
  });
  return data;
}