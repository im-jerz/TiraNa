/**
 * settings.js
 *
 * Account & Profile Settings API — Host-TiraNa
 * Mirrors backend/app/blueprints/settings/routes.py
 *
 * Every backend response has the shape:
 *   { success: true,  message: "...", data: {...} }
 *   { success: false, message: "...", errors: {...} }
 *
 * On error, axios throws — callers should catch and read
 * error.response.data.message / error.response.data.errors.
 *
 * Active Sessions has no real backend yet (GET /security/sessions
 * currently returns 501 "not yet available") — keep using the
 * localStorage mock in useSettingsData.js for that piece until a
 * real endpoint exists.
 */

import axiosInstance, { API_BASE_URL } from "./axiosInstance";

/**
 * avatar_url comes back from the backend as a path relative to the
 * Flask origin (e.g. "/uploads/avatars/12/abc.jpg"). Prefix it with
 * API_BASE_URL the same way properties.js does for property photos.
 * Data URLs (local preview) and absolute URLs pass through untouched.
 */
export function resolveAvatarUrl(path) {
  if (!path) return path;
  if (/^(https?|blob|data):/i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

/** GET /api/settings/profile */
export async function getProfile() {
  const { data } = await axiosInstance.get("/api/settings/profile");
  return data.data;
}

/**
 * PATCH /api/settings/profile
 * @param {{ full_name: string, phone: string, bio?: string }} payload
 */
export async function updateProfile(payload) {
  const { data } = await axiosInstance.patch("/api/settings/profile", {
    full_name: payload.full_name,
    phone: payload.phone,
    bio: payload.bio ?? "",
  });
  return data.data;
}

/**
 * POST /api/settings/profile/avatar
 * multipart/form-data — field name must be "avatar".
 * @param {File} file
 * @returns {Promise<{ avatar_url: string }>}
 */
export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append("avatar", file);

  const { data } = await axiosInstance.post("/api/settings/profile/avatar", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

/**
 * POST /api/settings/security/change-password
 * @param {string} currentPassword
 * @param {string} newPassword
 * @param {string} confirmPassword
 */
export async function changePassword(currentPassword, newPassword, confirmPassword) {
  const { data } = await axiosInstance.post("/api/settings/security/change-password", {
    current_password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
  return data;
}

/** GET /api/settings/security/2fa/status */
export async function get2FAStatus() {
  const { data } = await axiosInstance.get("/api/settings/security/2fa/status");
  return data.data;
}

/** POST /api/settings/security/2fa/setup */
export async function setup2FA() {
  const { data } = await axiosInstance.post("/api/settings/security/2fa/setup");
  return data.data;
}

/** POST /api/settings/security/2fa/enable */
export async function enable2FA(totpCode) {
  const { data } = await axiosInstance.post("/api/settings/security/2fa/enable", {
    totp_code: totpCode,
  });
  return data;
}

/** POST /api/settings/security/2fa/disable */
export async function disable2FA(totpCode) {
  const { data } = await axiosInstance.post("/api/settings/security/2fa/disable", {
    totp_code: totpCode,
  });
  return data;
}