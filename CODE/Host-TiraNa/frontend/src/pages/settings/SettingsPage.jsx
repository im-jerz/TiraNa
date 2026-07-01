import { useEffect, useRef, useState } from "react";
import {
  IconUser,
  IconCamera,
  IconShield,
  IconAlertCircle,
  IconAlertTriangle,
  IconLock,
  IconGlobe,
  IconLaptop,
  IconSmartphone,
  IconClock,
  IconMapPin,
  IconTrash,
  IconEdit,
} from "../../components/icons";
import { useToast } from "../../components/common/Toast";
import ConfirmModal from "../../components/common/ConfirmModal";
import useSettingsData from "./useSettingsData";
import "../../styles/settings.css";

/* ─── Password strength (mirrors auth pages) ─────────────────── */
function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}
const STRENGTH_MAP = [
  { label: "", className: "" },
  { label: "Weak", className: "weak" },
  { label: "Fair", className: "fair" },
  { label: "Good", className: "good" },
  { label: "Strong", className: "strong" },
];
const STRENGTH_ACTIVE = ["", "active-weak", "active-fair", "active-good", "active-strong"];

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = getPasswordStrength(password);
  const { label, className } = STRENGTH_MAP[score];
  return (
    <div>
      <div className="strength-bar-wrap" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`strength-bar-seg${i <= score ? ` ${STRENGTH_ACTIVE[score]}` : ""}`} />
        ))}
      </div>
      {label && (
        <div className={`strength-label ${className}`} aria-live="polite">
          {label} password
        </div>
      )}
    </div>
  );
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function getAvatarHue(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff;
  return Math.abs(h) % 360;
}

function formatMemberSince(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-PH", { month: "long", year: "numeric" });
}

function HostIdCard({ draft, fileInputRef, onFile, onPick, uploading }) {
  const hue = getAvatarHue(draft.full_name);
  return (
    <div className="stg-idcard">
      <div className="stg-idcard-top">
        <div className="stg-idcard-avatar" style={{ "--avatar-hue": hue }}>
          {draft.avatar_url ? <img src={draft.avatar_url} alt="" /> : <span>{getInitials(draft.full_name)}</span>}
          <button type="button" className="stg-avatar-edit" onClick={onPick} disabled={uploading} aria-label="Change photo">
            <IconCamera width={15} height={15} />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={onFile} />
        </div>

        <div className="stg-idcard-name">
          <h2>{draft.full_name || "Unnamed host"}</h2>
          {draft.verification_status === "verified" ? (
            <span className="stg-verified-pill">
              <IconShield width={13} height={13} /> Verified Host
            </span>
          ) : (
            <span className="stg-verified-pill pending">
              <IconAlertTriangle width={13} height={13} /> Pending verification
            </span>
          )}
        </div>
      </div>

      {draft.bio && <p className="stg-idcard-bio">{draft.bio}</p>}

      <div className="stg-idcard-contacts">
        <div className="stg-idcard-contact-row">
          <span className="stg-idcard-stat-label">Email</span>
          <span className="stg-idcard-contact-value">{draft.email}</span>
        </div>
        <div className="stg-idcard-contact-row">
          <span className="stg-idcard-stat-label">Phone</span>
          <span className="stg-idcard-contact-value">{draft.phone || "—"}</span>
        </div>
      </div>

      <div className="stg-idcard-stats">
        <div>
          <span className="stg-idcard-stat-label">Member since</span>
          <span className="stg-idcard-stat-value">{formatMemberSince(draft.member_since)}</span>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const {
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
  } = useSettingsData();
  const toast = useToast();

  const [draft, setDraft] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});
  const fileInputRef = useRef(null);

  const [activeSection, setActiveSection] = useState("profile");
  const profileRef = useRef(null);
  const securityRef = useRef(null);
  const sectionRefs = { profile: profileRef, security: securityRef };

  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState({});
  const [revokeTarget, setRevokeTarget] = useState(null);

  useEffect(() => {
    if (profile && !draft) setDraft(profile);
  }, [profile, draft]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.dataset.section);
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: [0.1, 0.3, 0.6] }
    );
    Object.values(sectionRefs).forEach((ref) => ref.current && observer.observe(ref.current));
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  function scrollToSection(key) {
    sectionRefs[key].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setField(field, value) {
    setDraft((d) => ({ ...d, [field]: value }));
    setDirty(true);
    setProfileErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.push("Photo must be under 5MB.", "error");
      return;
    }

    // Instant local preview while the real upload is in flight.
    const reader = new FileReader();
    reader.onload = () => setField("avatar_url", reader.result);
    reader.readAsDataURL(file);

    try {
      const avatarUrl = await uploadAvatar(file);
      setField("avatar_url", avatarUrl);
      toast.push("Photo updated.", "success");
    } catch (err) {
      toast.push(err.response?.data?.message || "Couldn't upload photo. Try again.", "error");
    } finally {
      e.target.value = "";
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    const errs = {};
    if (!draft.full_name.trim()) errs.full_name = "Full name is required.";
    if (!draft.phone.trim()) errs.phone = "Phone number is required.";
    if (draft.bio.length > 500) errs.bio = "Bio must be 500 characters or fewer.";
    if (Object.keys(errs).length) {
      setProfileErrors(errs);
      return;
    }
    try {
      await saveProfile(draft);
      setDirty(false);
      toast.push("Profile updated successfully.", "success");
    } catch (err) {
      const backendErrors = err.response?.data?.errors;
      if (backendErrors) {
        setProfileErrors(
          Object.fromEntries(Object.entries(backendErrors).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]))
        );
      } else {
        toast.push(err.response?.data?.message || "Couldn't save profile. Try again.", "error");
      }
    }
  }

  function handleDiscard() {
    setDraft(profile);
    setProfileErrors({});
    setDirty(false);
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    const errs = {};
    if (!pwForm.current) errs.current = "Enter your current password.";
    if (getPasswordStrength(pwForm.next) < 4) errs.next = "Use at least 8 characters, an uppercase letter, a number, and a symbol.";
    if (pwForm.confirm !== pwForm.next) errs.confirm = "Passwords don't match.";
    if (Object.keys(errs).length) {
      setPwErrors(errs);
      return;
    }
    setPwErrors({});
    try {
      await changePassword(pwForm.current, pwForm.next, pwForm.confirm);
      setPwForm({ current: "", next: "", confirm: "" });
      toast.push("Password changed. Other sessions have been kept active.", "success");
    } catch (err) {
      const status = err.response?.status;
      const message = err.response?.data?.message;
      if (status === 401) {
        setPwErrors({ current: message || "Current password is incorrect." });
      } else {
        toast.push(message || "Couldn't change password. Try again.", "error");
      }
    }
  }

  async function confirmRevoke() {
    if (!revokeTarget) return;
    await revokeSession(revokeTarget.id);
    toast.push(`Signed out of ${revokeTarget.device}.`, "success");
    setRevokeTarget(null);
  }

  if (loadError && !loading && !draft) {
    return (
      <div className="stg-wrap">
        <div className="stg-content">
          <div className="stg-card">
            <div className="stg-card-head">
              <h2>Couldn't load your profile</h2>
              <p>{loadError}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !draft) {
    return (
      <div className="stg-wrap">
        <div className="stg-idcard skeleton-pulse" style={{ height: 260 }} />
        <div className="stg-content">
          <div className="stg-card skeleton-pulse" style={{ height: 360 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="stg-wrap">
      <aside className="stg-rail">
        <HostIdCard
          draft={draft}
          fileInputRef={fileInputRef}
          onFile={handleFile}
          onPick={() => fileInputRef.current?.click()}
          uploading={uploadingAvatar}
        />
      </aside>

      <div className="stg-content">
        <nav className="stg-pillnav" aria-label="Settings sections">
          <button type="button" className={`stg-pill${activeSection === "profile" ? " active" : ""}`} onClick={() => scrollToSection("profile")}>
            <IconUser width={15} height={15} /> Profile
          </button>
          <button type="button" className={`stg-pill${activeSection === "security" ? " active" : ""}`} onClick={() => scrollToSection("security")}>
            <IconShield width={15} height={15} /> Security
          </button>
        </nav>

        {/* ── 12.1 Profile Settings ───────────────────────────── */}
        <section className="stg-card" ref={profileRef} data-section="profile" id="profile">
          <div className="stg-card-head">
            <h2>Profile</h2>
            <p>How you appear to guests and on your listing pages.</p>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="stg-photo-row">
              <div className="stg-photo-avatar" style={{ "--avatar-hue": getAvatarHue(draft.full_name) }}>
                {draft.avatar_url ? <img src={draft.avatar_url} alt="" /> : <span>{getInitials(draft.full_name)}</span>}
              </div>
              <div>
                <button
                  type="button"
                  className="btn-inline btn-secondary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <IconCamera width={16} height={16} /> {uploadingAvatar ? "Uploading…" : "Upload new photo"}
                </button>
                <p className="field-hint" style={{ marginTop: "var(--space-2)" }}>JPG or PNG, up to 5MB.</p>
              </div>
            </div>

            <div className="builder-field-grid cols-2">
              <div className="form-group">
                <label className="form-label" htmlFor="full_name">Full name<span>*</span></label>
                <input
                  id="full_name"
                  type="text"
                  className={`form-input form-input-no-icon ${profileErrors.full_name ? "has-error" : ""}`}
                  value={draft.full_name}
                  maxLength={80}
                  onChange={(e) => setField("full_name", e.target.value)}
                />
                {profileErrors.full_name && (
                  <span className="field-error" role="alert"><IconAlertCircle width={14} height={14} /> {profileErrors.full_name}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone number<span>*</span></label>
                <input
                  id="phone"
                  type="tel"
                  className={`form-input form-input-no-icon ${profileErrors.phone ? "has-error" : ""}`}
                  value={draft.phone}
                  onChange={(e) => setField("phone", e.target.value)}
                />
                {profileErrors.phone && (
                  <span className="field-error" role="alert"><IconAlertCircle width={14} height={14} /> {profileErrors.phone}</span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <div className="stg-readonly-field">
                <span>{draft.email}</span>
                <span className="stg-readonly-badge"><IconLock width={12} height={12} /> Verify by OTP to change</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bio">Bio / About me</label>
              <textarea
                id="bio"
                className={`builder-textarea ${profileErrors.bio ? "has-error" : ""}`}
                style={{ minHeight: 110 }}
                placeholder="Tell guests a little about yourself and your hosting style."
                maxLength={500}
                value={draft.bio}
                onChange={(e) => setField("bio", e.target.value)}
              />
              <div className="char-counter">{draft.bio.length} / 500</div>
              {profileErrors.bio && (
                <span className="field-error" role="alert"><IconAlertCircle width={14} height={14} /> {profileErrors.bio}</span>
              )}
            </div>

            <div className="stg-form-actions">
              {dirty && <span className="stg-unsaved"><IconEdit width={13} height={13} /> Unsaved changes</span>}
              <button type="button" className="btn-inline btn-secondary" onClick={handleDiscard} disabled={!dirty || savingProfile}>
                Discard
              </button>
              <button type="submit" className="btn-inline btn-primary" disabled={!dirty || savingProfile}>
                {savingProfile ? "Saving…" : "Save changes"}
              </button>
            </div>
          </form>
        </section>

        {/* ── 12.2 Security Settings ──────────────────────────── */}
        <section className="stg-card" ref={securityRef} data-section="security" id="security">
          <div className="stg-card-head">
            <h2>Security</h2>
            <p>Password, sessions, and how your account stays protected.</p>
          </div>

          <div className="stg-security-grid">
            <form className="stg-subcard" onSubmit={handleChangePassword}>
              <div className="stg-subcard-head">
                <span className="stg-subcard-icon"><IconLock width={16} height={16} /></span>
                <h3>Change password</h3>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="current_password">Current password</label>
                <input
                  id="current_password"
                  type="password"
                  className={`form-input form-input-no-icon ${pwErrors.current ? "has-error" : ""}`}
                  value={pwForm.current}
                  onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                />
                {pwErrors.current && (
                  <span className="field-error" role="alert"><IconAlertCircle width={14} height={14} /> {pwErrors.current}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new_password">New password</label>
                <input
                  id="new_password"
                  type="password"
                  className={`form-input form-input-no-icon ${pwErrors.next ? "has-error" : ""}`}
                  value={pwForm.next}
                  onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                />
                <PasswordStrength password={pwForm.next} />
                {pwErrors.next && (
                  <span className="field-error" role="alert"><IconAlertCircle width={14} height={14} /> {pwErrors.next}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="confirm_password">Confirm new password</label>
                <input
                  id="confirm_password"
                  type="password"
                  className={`form-input form-input-no-icon ${pwErrors.confirm ? "has-error" : ""}`}
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                />
                {pwErrors.confirm && (
                  <span className="field-error" role="alert"><IconAlertCircle width={14} height={14} /> {pwErrors.confirm}</span>
                )}
              </div>

              <button type="submit" className="btn-inline btn-primary" style={{ width: "100%" }} disabled={changingPassword}>
                {changingPassword ? "Updating…" : "Update password"}
              </button>
            </form>

            <div className="stg-subcard">
              <div className="stg-subcard-head">
                <span className="stg-subcard-icon"><IconGlobe width={16} height={16} /></span>
                <h3>Active sessions</h3>
              </div>

              <ul className="stg-session-list">
                {sessions.map((s) => (
                  <li key={s.id} className="stg-session-row">
                    <span className="stg-session-icon">
                      {s.kind === "mobile" ? <IconSmartphone width={17} height={17} /> : <IconLaptop width={17} height={17} />}
                    </span>
                    <div className="stg-session-info">
                      <div className="stg-session-device">
                        {s.device}
                        {s.current && <span className="stg-current-badge">Current</span>}
                      </div>
                      <div className="stg-session-meta">
                        <span><IconMapPin width={12} height={12} /> {s.location}</span>
                        <span><IconClock width={12} height={12} /> {s.last_active}</span>
                      </div>
                    </div>
                    {!s.current && (
                      <button
                        type="button"
                        className="stg-revoke-btn"
                        onClick={() => setRevokeTarget(s)}
                        disabled={revokingId === s.id}
                        aria-label={`Sign out of ${s.device}`}
                      >
                        <IconTrash width={15} height={15} />
                      </button>
                    )}
                  </li>
                ))}
                {sessions.length === 0 && <li className="stg-session-empty">No other active sessions.</li>}
              </ul>
            </div>

            <div className="stg-subcard stg-subcard-span">
              <div className="stg-subcard-head">
                <span className="stg-subcard-icon"><IconShield width={16} height={16} /></span>
                <h3>Two-factor authentication</h3>
              </div>
              <div className="stg-2fa-row">
                <div>
                  <p>Add a one-time code on top of your password for sign-in.</p>
                  <span className="stg-soon-badge">Coming soon</span>
                </div>
                <div className="switch" aria-disabled="true" title="Available in a future update">
                  <div className="switch-knob" />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <ConfirmModal
        open={!!revokeTarget}
        tone="danger"
        title="Sign out of this device?"
        description={revokeTarget ? `${revokeTarget.device} will be signed out immediately and will need to log in again.` : ""}
        confirmLabel="Sign out device"
        busy={revokingId === revokeTarget?.id}
        onConfirm={confirmRevoke}
        onCancel={() => setRevokeTarget(null)}
      />
    </div>
  );
}