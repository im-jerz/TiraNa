import { useCallback, useEffect, useState } from "react";
import {
  getHostPropertyIds,
  getBookings as apiGetBookings,
  getBookingStats as apiGetStats,
  confirmBooking as apiConfirmBooking,
  cancelBooking as apiCancelBooking,
  completeRefund as apiCompleteRefund,
} from "../../api/bookings";

export default function useBookingsData() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [propertyIds, setPropertyIds] = useState([]);

  const loadBookings = useCallback(async (status) => {
    setLoading(true);
    setError(null);
    try {
      const ids = await getHostPropertyIds();
      setPropertyIds(ids);

      if (ids.length === 0) {
        setBookings([]);
        setLoading(false);
        return;
      }

      const params = {};
      if (status && status !== "all") params.status = status;
      const res = await apiGetBookings(ids, params);
      setBookings(res.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async (ids) => {
    try {
      const res = await apiGetStats(ids);
      const data = res.data ?? {};

      let totalBookings = 0;
      let totalPending = 0;
      let totalConfirmed = 0;
      let totalCompleted = 0;
      let totalCancelled = 0;
      let totalRefundRequested = 0;
      let totalRefundCompleted = 0;
      let totalRevenue = 0;

      for (const s of Object.values(data)) {
        totalBookings += s.total_bookings || 0;
        totalPending += s.pending || 0;
        totalConfirmed += s.confirmed || 0;
        totalCompleted += s.completed || 0;
        totalCancelled += s.cancelled || 0;
        totalRefundRequested += s.refund_requested || 0;
        totalRefundCompleted += s.refund_completed || 0;
        totalRevenue += s.total_revenue || 0;
      }

      setStats({
        total: totalBookings,
        pending: totalPending,
        confirmed: totalConfirmed,
        completed: totalCompleted,
        cancelled: totalCancelled,
        refund_requested: totalRefundRequested,
        refund_completed: totalRefundCompleted,
        total_revenue: totalRevenue,
      });
    } catch (err) {
      console.error("Failed to load booking stats:", err);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (propertyIds.length > 0) {
      loadStats(propertyIds);
    }
  }, [propertyIds, loadStats]);

  const confirm = useCallback(async (bookingId) => {
    await apiConfirmBooking(bookingId, propertyIds);
    setBookings((list) =>
      list.map((b) => (b.id === bookingId ? { ...b, status: "confirmed" } : b))
    );
    if (propertyIds.length > 0) loadStats(propertyIds);
  }, [propertyIds, loadStats]);

  const cancel = useCallback(async (bookingId) => {
    await apiCancelBooking(bookingId, propertyIds);
    setBookings((list) =>
      list.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
    );
    if (propertyIds.length > 0) loadStats(propertyIds);
  }, [propertyIds, loadStats]);

  const completeRefund = useCallback(async (bookingId) => {
    await apiCompleteRefund(bookingId, propertyIds);
    setBookings((list) =>
      list.map((b) => (b.id === bookingId ? { ...b, status: "refund_completed" } : b))
    );
    if (propertyIds.length > 0) loadStats(propertyIds);
  }, [propertyIds, loadStats]);

  return {
    bookings,
    stats,
    loading,
    error,
    reload: loadBookings,
    confirm,
    cancel,
    completeRefund,
  };
}
