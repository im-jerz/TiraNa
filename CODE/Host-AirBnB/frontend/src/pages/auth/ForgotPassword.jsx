import { useState } from "react";
import "./../../index.css";
import { forgotPassword } from "../../api/auth";

const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="3"/>
    <path d="m2 7 8.67 6.06a2 2 0 0 0 2.66 0L22 7"/>
  </svg>
);

const IconAlertCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

/* SVG: lock with question mark */
// Remove the SVG and use:
const AccountRecoveryImage = () => (
  <img 
    src="https://images.unsplash.com/photo-1555421689-d68471e189f2?w=800&h=1000&fit=crop"
    alt="Account recovery"
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

export default function ForgotPassword({ onNavigate }) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    if (!email.trim()) return "Email address is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
    return "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      await forgotPassword(email);
    } catch (err) {
      // Backend always returns a generic success message regardless of
      // whether the email exists, so a thrown error here means something
      // genuinely went wrong (network, 500, etc.) — still show "sent"
      // state to avoid leaking which emails are registered, but log it.
      console.error("forgot-password request failed:", err);
    }
    setLoading(false);
    setSent(true);
  };

  /* ── Sent confirmation ── */
  if (sent) {
    return (
      <div className="auth-shell">
        <main className="auth-form-side">

          <div className="auth-form-body" style={{ textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "var(--radius-xl)",
              background: "rgba(28,58,47,0.06)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto var(--space-6)"
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 2L11 13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </div>

            <h1 className="auth-heading" style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-3)" }}>
              Check your inbox.
            </h1>
            <p style={{ color: "var(--color-text-secondary)", lineHeight: 1.6, marginBottom: "var(--space-8)" }}>
              If <strong style={{ color: "var(--color-text-primary)" }}>{email}</strong> is registered, you'll receive a 6-digit reset code within a few minutes.
              Check your spam folder if you don't see it.
            </p>

            <button className="btn btn-primary" onClick={() => onNavigate?.("reset-password", { email })} style={{ marginBottom: "var(--space-4)" }}>
              I have my code
            </button>

            <p className="auth-footer-text">
              Didn't receive it?{" "}
              <button className="auth-link" onClick={() => setSent(false)}>Try again</button>
              {" · "}
              <button className="auth-link" onClick={() => onNavigate?.("signin")}>Back to Sign In</button>
            </p>
          </div>
        </main>

        <aside className="auth-visual-side" aria-hidden="true">
          <AccountRecoveryImage />
          <div className="visual-panel-content">
              <div className="auth-logo">
                <img 
                  src="/src/assets/images/logo.png" 
                  alt="Logo" 
                  style={{ height: '50px', width: 'auto' }}
                />
                <span className="auth-logo-text" style={{ color: "var(--color-text-inverse)" }}>TiraNa</span>
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
          {/* Back button */}
          <button
            type="button"
            onClick={() => onNavigate?.("signin")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "var(--space-2)",
              color: "var(--color-text-secondary)", fontSize: "var(--text-sm)",
              background: "none", border: "none", cursor: "pointer",
              padding: "var(--space-1) 0", marginBottom: "var(--space-6)",
              transition: "color var(--transition-fast)",
              minHeight: 44,
            }}
            onMouseEnter={e => e.currentTarget.style.color = "var(--color-primary)"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--color-text-secondary)"}
            aria-label="Back to Sign In"
          >
            <IconArrowLeft /> Back to Sign In
          </button>

          <h1 className="auth-heading">Forgot your<br/>password?</h1>
          <p className="auth-subheading">
            No worries. Enter your registered email and we'll send you a reset link.
          </p>

          {error && (
            <div className="alert alert-error" role="alert">
              <IconAlertCircle /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="forgot-email">
                Registered email <span aria-hidden="true">*</span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><IconMail /></span>
                <input
                  id="forgot-email"
                  type="email"
                  className={`form-input${error ? " has-error" : ""}`}
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError(""); }}
                  autoComplete="email"
                  autoFocus
                  aria-invalid={!!error}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              aria-busy={loading}
            >
              {loading
                ? <><span className="btn-spinner" aria-hidden="true" /> Sending link…</>
                : "Send reset link"
              }
            </button>
          </form>

          <p className="auth-footer-text">
            Remembered it?{" "}
            <button className="auth-link" onClick={() => onNavigate?.("signin")}>Sign in</button>
          </p>
        </div>
      </main>

      <aside className="auth-visual-side" aria-hidden="true">
        <AccountRecoveryImage />
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
            <blockquote>"Your account, your data. Reset in seconds, back in minutes."</blockquote>
            <cite>— HostSpace Account Security</cite>
          </div>
        </div>
      </aside>
    </div>
  );
}