// Persists an in-progress "Add Property" draft to the browser's localStorage
// so navigating to another page and back doesn't wipe out the form.
//
// Scope (by design):
// - New-property flow only — editing an existing property always loads from
//   the server (draftFromExisting), so it's excluded here.
// - Photo files/blob URLs are never persisted — File objects can't be
//   serialized to localStorage, and blob URLs stop working once the tab's
//   in-memory reference to the File is gone. We only remember *how many*
//   photos were selected so the Photos step can tell the host to re-add them.

const STORAGE_KEY = "hosttirana:property-draft:v1";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isMeaningfulDraft(draft) {
  if (!draft) return false;
  const b = draft.basics || {};
  const l = draft.location || {};
  return Boolean(
    (b.title && b.title.trim()) ||
      (b.description && b.description.trim()) ||
      (l.street && l.street.trim()) ||
      (l.city && l.city.trim())
  );
}

/** Strip anything that can't survive JSON.stringify (File objects, blob URLs). */
function toStorable(draft) {
  const photoCount = draft.photos?.files?.length || 0;
  return {
    ...draft,
    photos: { files: [], coverId: null, _previousCount: photoCount },
  };
}

export function savePropertyDraftLocal(draft, stepIndex) {
  try {
    if (!isMeaningfulDraft(draft)) return;
    const payload = {
      savedAt: Date.now(),
      stepIndex,
      draft: toStorable(draft),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage full/unavailable — fail silently, this is a convenience feature.
  }
}

export function loadPropertyDraftLocal() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.draft || !parsed?.savedAt) return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (!isMeaningfulDraft(parsed.draft)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPropertyDraftLocal() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}