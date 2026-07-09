import { useCallback, useEffect, useState } from "react";
import {
  getProperties,
  togglePropertyStatus as apiToggleStatus,
  deleteProperty as apiDeleteProperty,
} from "../../api/properties";
import { MOCK_PROPERTIES } from "../../data/mockProperties";
import useSilentPoll from "../../utils/useSilentPoll";

// Backend is live — see backend/app/blueprints/properties/.
// Flip back to `true` only if you need to work on the UI without
// a running Flask server.
const USE_MOCK = false;
const POLL_INTERVAL_MS = 20_000;

export default function usePropertiesData() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 650));
        setProperties(MOCK_PROPERTIES);
      } else {
        const res = await getProperties();
        setProperties(res.data?.properties ?? []);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load your properties. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Background refresh: keeps counts like "upcoming bookings" current
  // (e.g. right after a guest books) without a full reload/spinner.
  const silentRefresh = useCallback(async () => {
    if (USE_MOCK) return;
    const res = await getProperties();
    setProperties(res.data?.properties ?? []);
  }, []);

  useSilentPoll(silentRefresh, POLL_INTERVAL_MS);

  const toggleStatus = useCallback(async (property) => {
    const nextStatus = property.status === "active" ? "inactive" : "active";
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      setProperties((list) =>
        list.map((p) => (p.property_id === property.property_id ? { ...p, status: nextStatus } : p))
      );
      return nextStatus;
    }
    await apiToggleStatus(property.property_id, nextStatus);
    setProperties((list) =>
      list.map((p) => (p.property_id === property.property_id ? { ...p, status: nextStatus } : p))
    );
    return nextStatus;
  }, []);

  const removeProperty = useCallback(async (property) => {
    if (USE_MOCK) {
      await new Promise((r) => setTimeout(r, 400));
      setProperties((list) => list.filter((p) => p.property_id !== property.property_id));
      return;
    }
    await apiDeleteProperty(property.property_id);
    setProperties((list) => list.filter((p) => p.property_id !== property.property_id));
  }, []);

  return { properties, loading, error, reload: load, toggleStatus, removeProperty };
}