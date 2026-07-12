import axiosInstance, { API_BASE_URL } from "./axiosInstance";

/**
 * Properties API calls — mirrors backend/app/blueprints/properties/routes.py
 *
 * Every backend response has the shape:
 *   { success: true,  message: "...", data: {...} }
 *   { success: false, message: "...", errors: {...} }
 *
 * On error, axios throws — callers should catch and read
 * `error.response.data.message` / `error.response.data.errors`.
 */

/**
 * Property photos come back from the backend as paths relative to the
 * Flask origin (e.g. "/uploads/properties/3/abc.jpg") — physical files
 * live under frontend/src/assets/uploads/properties/, served back out
 * by Flask's static route. Since the Vite dev server and Flask run on
 * different ports, a bare relative path won't resolve in <img src>;
 * this prefixes it with the same API_BASE_URL axiosInstance uses.
 * External URLs (e.g. seed/demo Unsplash links) pass through untouched.
 */
export function resolveMediaUrl(path) {
  if (!path) return path;
  if (/^(https?|blob|data):/i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

/**
 * GET /api/host/properties
 * @param {object} params - { status, sort } e.g. { status: 'active', sort: 'price' }
 */
export async function getProperties(params = {}) {
  const { data } = await axiosInstance.get("/api/host/properties", { params });
  return data;
}

export async function getProperty(id) {
  const { data } = await axiosInstance.get(`/api/host/properties/${id}`);
  return data;
}

/**
 * POST /api/host/properties
 * multipart/form-data — required for photo uploads.
 *
 * @param {object} payload - full property draft (basics, location, capacity,
 *   amenities, rules, pricing, cancellation_policy)
 * @param {File[]} photos
 */
export async function createProperty(payload, photos = []) {
  const formData = new FormData();
  formData.append("payload", JSON.stringify(payload));
  photos.forEach((file) => formData.append("photos", file));

  const { data } = await axiosInstance.post("/api/host/properties", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * PUT /api/host/properties/:id
 * @param {string|number} id
 * @param {object} payload
 * @param {File[]} newPhotos - any newly added photos (existing ones referenced by URL/id in payload)
 */
export async function updateProperty(id, payload, newPhotos = []) {
  const formData = new FormData();
  formData.append("payload", JSON.stringify(payload));
  newPhotos.forEach((file) => formData.append("photos", file));

  const { data } = await axiosInstance.put(`/api/host/properties/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

/**
 * PATCH /api/host/properties/:id/status
 * @param {string|number} id
 * @param {"active"|"inactive"} status
 */
export async function togglePropertyStatus(id, status) {
  const { data } = await axiosInstance.patch(`/api/host/properties/${id}/status`, { status });
  return data;
}

export async function deleteProperty(id) {
  const { data } = await axiosInstance.delete(`/api/host/properties/${id}`);
  return data;
}

export async function savePropertyDraft(payload) {
  const { data } = await axiosInstance.post("/api/host/properties/draft", { payload });
  return data;
}
