import { useEffect, useState, useCallback } from "react";
import {
  getProfile,
  updateProfile,
  uploadAvatar as uploadAvatarRequest,
  changePassword as changePasswordRequest,
  resolveAvatarUrl,
} from "../../api/settings";
import { syncHostIdentity } from "../../lib/hostIdentity";

/**
 * Account & Profile Management (host_flow.md §12.1–12.2).
 *
 * Profile + password now go through the real backend
 * (app/blueprints/settings). Active Sessions stays a localStorage
 * mock — GET /api/settings/security/sessions currently returns 501
 * "Active Sessions management is not yet available" — swap this out
 * once that endpoint ships.
 */

const SESSIONS_KEY = "host_active_sessions";

function defaultSessions() {
  return [
    {
      id: "sess_current",
      device: "Chrome on Windows",
      kind: "desktop",
      location: "Tagaytay, Cavite, PH",
      ip: "203.177.42.18",
      last_active: "now",
      current: true,
    },
    {
      id: "sess_2",
      device: "Safari on iPhone 14",
      kind: "mobile",
      location: "Quezon City, Metro Manila, PH",
      ip: "112.198.90.4",
      last_active: "2 hours ago",
      current: false,
    },
    {
      id: "sess_3",
      device: "Chrome on macOS",
      kind: "desktop",
      location: "Cebu City, Cebu, PH",
      ip: "120.28.71.150",
      last_active: "3 days ago",
      current: false,
    },
  ];
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

/** Maps the backend's ProfileResponseSchema-shaped payload to the draft shape SettingsPage expects. */
function normalizeProfile(data) {
  return {
    avatar_url: resolveAvatarUrl(data.avatar_url) || "",
    full_name: data.full_name || "",
    email: data.email || "",
    phone: data.phone || "",
    bio: data.bio || "",
    verification_status: data.verification_status || "pending",
    member_since: data.member_since || "",
  };
}

export default function useSettingsData() {
  const [profile, setProfile] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [revokingId, setRevokingId] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getProfile();
      const normalized = normalizeProfile(data);
      setProfile(normalized);
      syncHostIdentity({ full_name: normalized.full_name, avatar_url: normalized.avatar_url });
    } catch (err) {
      setLoadError(err.response?.data?.message || "Couldn't load your profile.");
    } finally {
      setSessions(readJSON(SESSIONS_KEY, defaultSessions()));
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const saveProfile = useCallback(async (next) => {
    setSavingProfile(true);
    try {
      const data = await updateProfile({
        full_name: next.full_name,
        phone: next.phone,
        bio: next.bio,
      });
      const normalized = normalizeProfile(data);
      setProfile((prev) => ({ ...normalized, avatar_url: prev?.avatar_url ?? "" }));
      syncHostIdentity({ full_name: normalized.full_name });
      return true;
    } finally {
      setSavingProfile(false);
    }
  }, []);

  /** Avatar is a separate multipart endpoint on the backend — upload immediately on selection. */
  const uploadAvatar = useCallback(async (file) => {
    setUploadingAvatar(true);
    try {
      const { avatar_url } = await uploadAvatarRequest(file);
      const resolved = resolveAvatarUrl(avatar_url);
      setProfile((prev) => (prev ? { ...prev, avatar_url: resolved } : prev));
      syncHostIdentity({ avatar_url: resolved });
      return resolved;
    } finally {
      setUploadingAvatar(false);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword, confirmPassword) => {
    setChangingPassword(true);
    try {
      await changePasswordRequest(currentPassword, newPassword, confirmPassword);
      return true;
    } finally {
      setChangingPassword(false);
    }
  }, []);

  // Active Sessions — mock until the backend endpoint is implemented (see file header).
  const revokeSession = useCallback(async (id) => {
    setRevokingId(id);
    await wait(500);
    setSessions((list) => {
      const next = list.filter((s) => s.id !== id);
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(next));
      return next;
    });
    setRevokingId(null);
  }, []);

  return {
    profile,
    sessions,
    loading,
    loadError,
    savingProfile,
    uploadingAvatar,
    changingPassword,
    revokingId,
    saveProfile,
    uploadAvatar,
    changePassword,
    revokeSession,
  };
}