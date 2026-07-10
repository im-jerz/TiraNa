/**
 * hostIdentity.js
 *
 * Small shared helper around the "host" localStorage record.
 * auth.js writes the full host object here on login. Pages that only
 * change a slice of it (currently: Settings → full_name/avatar_url)
 * should go through syncHostIdentity() instead of writing to
 * localStorage directly, so every listener (e.g. the dashboard
 * Topbar) picks up the change immediately — no route change or
 * page reload required.
 */

export const HOST_IDENTITY_EVENT = "host-identity-updated";

export function getHostIdentity() {
  try {
    const raw = localStorage.getItem("host");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Merges `patch` into the stored host object and notifies listeners.
 * @param {Partial<{ full_name: string, avatar_url: string }>} patch
 */
export function syncHostIdentity(patch) {
  const current = getHostIdentity();
  if (!current) return; // not logged in / nothing to merge into

  const updated = { ...current, ...patch };
  localStorage.setItem("host", JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent(HOST_IDENTITY_EVENT, { detail: updated }));
}