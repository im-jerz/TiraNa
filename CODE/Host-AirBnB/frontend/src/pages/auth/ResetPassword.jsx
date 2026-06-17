import { useState } from "react";
import "./../../index.css";
import { resetPassword } from "../../api/auth";

const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const IconEye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconAlertCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const LogoMark = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 2L3 8v10h5v-6h4v6h5V8L10 2z" fill="#F7F4EF"/>
    <path d="M10 2L3 8h14L10 2z" fill="#C9A84C"/>
  </svg>
);

function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_MAP = ["", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_CLASS = ["", "weak", "fair", "good", "strong"];
const STRENGTH_ACTIVE = ["", "active-weak", "active-fair", "active-good", "active-strong"];

function PasswordStrength({ password }) {
  if (!password) return null;
  const score = getPasswordStrength(password);
  return (
    <div>
      <div className="strength-bar-wrap" aria-hidden="true">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`strength-bar-seg${i <= score ? ` ${STRENGTH_ACTIVE[score]}` : ""}`} />
        ))}
      </div>
      {STRENGTH_MAP[score] && (
        <div className={`strength-label ${STRENGTH_CLASS[score]}`} aria-live="polite">
          {STRENGTH_MAP[score]} password
        </div>
      )}
    </div>
  );
}

/* Requirements checklist */
const REQUIREMENTS = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { label: "One number", test: (p) => /[0-9]/.test(p) },
  { label: "One special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

function RequirementItem({ met, label }) {
  return (
    <li style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "var(--space-1)" }}>
      <span style={{
        width: 16, height: 16, borderRadius: "50%",
        background: met ? "var(--color-success)" : "var(--color-border)",
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0, transition: "background var(--transition-fast)"
      }}>
        {met && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        )}
      </span>
      <span style={{
        fontSize: "var(--text-xs)", color: met ? "var(--color-success)" : "var(--color-text-muted)",
        transition: "color var(--transition-fast)"
      }}>
        {label}
      </span>
    </li>
  );
}

/* Visual panel illustration */
// Remove the SVG and use:
const SecurityShieldImage = () => (
  <img 
    src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=1000&fit=crop"
    alt="Cybersecurity"
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%,-50%)",
      width: "100%",
      height: "auto",
      opacity: 0.20,
      objectFit: "contain"
    }}
  />
);

export default function ResetPassword({ onNavigate, email = "" }) {
  const [form, setForm] = useState({ email, otpCode: "", password: "", confirmPassword: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address.";
    if (!form.otpCode) errs.otpCode = "Enter the 6-digit code sent to your email.";
    else if (!/^[0-9]{6}$/.test(form.otpCode)) errs.otpCode = "Code must be 6 digits.";
    if (!form.password) errs.password = "New password is required.";
    else if (getPasswordStrength(form.password) < 4) errs.password = "Password must include an uppercase letter, a number, and a special character.";
    if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password.";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match.";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await resetPassword(form.email, form.otpCode, form.password, form.confirmPassword);
      setLoading(false);
      setSuccess(true);
    } catch (err) {
      setLoading(false);
      setServerError(err.response?.data?.message || "Something went wrong. Please try again.");
    }
  };

  /* ── Success state ── */
  if (success) {
    return (
      <div className="auth-shell">
        <main className="auth-form-side">
          <div className="auth-form-body" style={{ textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "var(--color-success-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto var(--space-6)",
              border: "2px solid rgba(22,163,74,0.2)"
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="auth-heading" style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-3)" }}>
              Password updated!
            </h1>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-8)", lineHeight: 1.6 }}>
              Your password has been changed successfully. You can now sign in with your new password.
            </p>
            <button className="btn btn-primary" onClick={() => onNavigate?.("signin")}>
              Sign in now
            </button>
          </div>
        </main>
        <aside className="auth-visual-side" aria-hidden="true">
          <SecurityShieldImage />
          <div className="visual-panel-content">
            <div className="auth-logo">
              <img 
                src="/src/assets/images/logo.png" 
                alt="Logo" 
                style={{ height: '50px', width: 'auto' }}
              />
              <span className="auth-logo-text" style={{ color: "var(--color-text-inverse)" }}>TiraNa</span>
            </div>
            <div className="visual-panel-quote">
              <blockquote>"A strong password is the first wall between your earnings and the outside world."</blockquote>
              <cite>— HostSpace Security Team</cite>
            </div>
          </div>
        </aside>
      </div>
    );
  }

  /* ── Form ── */
  return (
    <div className="auth-shell">
      <main className="auth-form-side">

        <div className="auth-form-body">
          <h1 className="auth-heading">Set a new<br/>password.</h1>
          <p className="auth-subheading">
            Choose something strong. You won't be asked for this again for a while.
          </p>

          <form onSubmit={handleSubmit} noValidate>
            {serverError && (
              <div className="alert alert-error" role="alert">
                <IconAlertCircle />
                <span>{serverError}</span>
              </div>
            )}

            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="reset-email">Email address <span>*</span></label>
              <div className="input-wrapper">
                <input
                  id="reset-email"
                  type="email"
                  className={`form-input form-input-no-icon${errors.email ? " has-error" : ""}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <span className="field-error" role="alert"><IconAlertCircle />{errors.email}</span>
              )}
            </div>

            {/* OTP code */}
            <div className="form-group">
              <label className="form-label" htmlFor="reset-otp">6-digit code <span>*</span></label>
              <div className="input-wrapper">
                <input
                  id="reset-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={`form-input form-input-no-icon${errors.otpCode ? " has-error" : ""}`}
                  placeholder="123456"
                  value={form.otpCode}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setForm(p => ({ ...p, otpCode: digits }));
                    if (errors.otpCode) setErrors(p => ({ ...p, otpCode: "" }));
                  }}
                  aria-invalid={!!errors.otpCode}
                />
              </div>
              {errors.otpCode && (
                <span className="field-error" role="alert"><IconAlertCircle />{errors.otpCode}</span>
              )}
              <span className="field-hint">Check the email we sent for your password reset code.</span>
            </div>

            {/* New password */}
            <div className="form-group">
              <label className="form-label" htmlFor="new-password">New password <span>*</span></label>
              <div className="input-wrapper">
                <span className="input-icon"><IconLock /></span>
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input${errors.password ? " has-error" : ""}`}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange("password")}
                  autoComplete="new-password"
                  aria-invalid={!!errors.password}
                />
                <button type="button" className="input-icon-right"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}>
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              <PasswordStrength password={form.password} />
              {errors.password && (
                <span className="field-error" role="alert"><IconAlertCircle />{errors.password}</span>
              )}
            </div>

            {/* Requirements */}
            {form.password && (
              <ul style={{ marginBottom: "var(--space-5)", marginTop: "calc(var(--space-2) * -1)" }}
                  aria-label="Password requirements">
                {REQUIREMENTS.map(req => (
                  <RequirementItem key={req.label} label={req.label} met={req.test(form.password)} />
                ))}
              </ul>
            )}

            {/* Confirm password */}
            <div className="form-group">
              <label className="form-label" htmlFor="confirm-password">Confirm new password <span>*</span></label>
              <div className="input-wrapper">
                <span className="input-icon"><IconLock /></span>
                <input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  className={`form-input${errors.confirmPassword ? " has-error" : ""}`}
                  placeholder="Repeat your password"
                  value={form.confirmPassword}
                  onChange={handleChange("confirmPassword")}
                  autoComplete="new-password"
                  aria-invalid={!!errors.confirmPassword}
                />
                <button type="button" className="input-icon-right"
                  onClick={() => setShowConfirm(p => !p)}
                  aria-label={showConfirm ? "Hide password" : "Show password"}>
                  {showConfirm ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="field-error" role="alert"><IconAlertCircle />{errors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              aria-busy={loading}
            >
              {loading
                ? <><span className="btn-spinner" aria-hidden="true" /> Updating password…</>
                : "Update password"
              }
            </button>
          </form>
        </div>
      </main>

      <aside className="auth-visual-side" aria-hidden="true">
        <SecurityShieldImage />
        <div className="visual-panel-content">
              <div className="auth-logo">
                <img 
                  src="/src/assets/images/logo.png" 
                  alt="Logo" 
                  style={{ height: '50px', width: 'auto' }}
                />
                <span className="auth-logo-text" style={{ color: "var(--color-text-inverse)" }}>TiraNa</span>
              </div>
          <div className="visual-panel-quote">
            <blockquote>"A strong password is the first wall between your earnings and the outside world."</blockquote>
            <cite>— HostSpace Security Team</cite>
          </div>
        </div>
      </aside>
    </div>
  );
}