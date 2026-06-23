import clientApi from "./clientApi";
import axiosInstance from "./axiosInstance";

export async function getHostPropertyIds() {
  const { data } = await axiosInstance.get("/api/host/properties");
  const properties = data.data?.properties ?? [];
  return properties.map((p) => String(p.property_id));
}

export async function getBookings(propertyIds, params = {}) {
  const { data } = await clientApi.get("/api/host/property-bookings", {
    params: { property_ids: propertyIds.join(","), ...params },
  });
  return data;
}

export async function getBookingStats(propertyIds) {
  const { data } = await clientApi.get("/api/host/property-bookings/stats", {
    params: { property_ids: propertyIds.join(",") },
  });
  return data;
}

export async function confirmBooking(bookingId, propertyIds) {
  const { data } = await clientApi.patch(`/api/host/${bookingId}/status`, {
    status: "confirmed",
    property_ids: propertyIds,
  });
  return data;
}

export async function cancelBooking(bookingId, propertyIds) {
  const { data } = await clientApi.patch(`/api/host/${bookingId}/status`, {
    status: "cancelled",
    property_ids: propertyIds,
  });
  return data;
}

export async function completeRefund(bookingId, propertyIds) {
  const { data } = await clientApi.patch(`/api/host/${bookingId}/refund-completed`, {
    property_ids: propertyIds,
  });
  return data;
}
