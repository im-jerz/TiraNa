import { useState, useRef, useEffect } from "react";
import "./../../index.css";
import { verifyOtp, resendOtp } from "../../api/auth";

// Add this component and use it in the aside:
const EmailSecurityImage = () => (
  <img 
    src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&h=1000&fit=crop"
    alt="Email security"
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "100%",
      height: "auto",
      opacity: 0.20,
      objectFit: "contain"
    }}
  />
);

const IconMail = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function VerifyEmail({ onNavigate, email = "you@example.com" }) {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [timer, setTimer] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  /* Countdown timer */
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleOtpChange = (index, value) => {
    if (!/^[0-9]?$/.test(value)) return;
    setError("");
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const next = Array(OTP_LENGTH).fill("");
    paste.split("").forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    const focusIdx = Math.min(paste.length, OTP_LENGTH - 1);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < OTP_LENGTH) { setError("Please enter all 6 digits."); return; }

    setLoading(true);
    try {
      await verifyOtp(email, code, "email_verification");
      setLoading(false);
      setVerified(true);
    } catch (err) {
      setLoading(false);
      const res = err.response?.data;
      setError(res?.message || "Incorrect code. Please try again.");
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await resendOtp(email, "email_verification");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code. Please try again.");
    }
    setResending(false);
    setTimer(RESEND_COOLDOWN);
    setOtp(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
  };

  /* ── Verified state ── */
  if (verified) {
    return (
      <div className="auth-shell">
        <main className="auth-form-side" style={{ alignItems: "center", justifyContent: "center" }}>

          <div className="auth-form-body" style={{ textAlign: "center" }}>
            <div style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "var(--color-success-light)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto var(--space-6)",
              border: "2px solid rgba(22,163,74,0.2)"
            }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="auth-heading" style={{ fontSize: "var(--text-3xl)", marginBottom: "var(--space-3)" }}>Email verified!</h1>
            <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-8)", lineHeight: 1.6 }}>
              Your email address has been confirmed. You can now sign in to your host account.
            </p>
            <button className="btn btn-primary" onClick={() => onNavigate?.("signin")}>
              Go to Sign In
            </button>
          </div>
        </main>
        <aside className="auth-visual-side" aria-hidden="true">
            <EmailSecurityImage />
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
                    <blockquote>"Security first. TiraNa makes sure only real hosts manage real properties."</blockquote>
                <cite>— TiraNa Trust & Safety Team</cite>
                </div>
            </div>
        </aside>
      </div>
    );
  }

  /* ── OTP form ── */
  const maskedEmail = email.replace(/(.{2})(.*)(?=@)/, (_, a, b) => a + "*".repeat(b.length));

  return (
    <div className="auth-shell">
      <main className="auth-form-side">

        <div className="auth-form-body">
          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: "var(--radius-lg)",
            background: "rgba(27, 42, 74, 0.06)",
            display: "flex", alignItems: "center", justifyContent: "center",
            marginBottom: "var(--space-6)"
          }}>
            <IconMail />
          </div>

          <h1 className="auth-heading">Check your<br/>email.</h1>
          <p className="auth-subheading">
            We sent a 6-digit code to <strong style={{ color: "var(--color-text-primary)" }}>{maskedEmail}</strong>.
            Enter it below to verify your account.
          </p>

          {error && (
            <div className="alert alert-error" role="alert">
              <IconAlertCircle /><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <fieldset style={{ border: "none", padding: 0, margin: "0 0 var(--space-2)" }}>
              <legend className="form-label" style={{ marginBottom: "var(--space-3)" }}>
                Verification code
              </legend>
              <div className="otp-grid" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => inputRefs.current[i] = el}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className={`otp-cell${digit ? " filled" : ""}${error ? " has-error" : ""}`}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleKeyDown(i, e)}
                    aria-label={`Digit ${i + 1} of ${OTP_LENGTH}`}
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
            </fieldset>

            {/* Timer */}
            <div className="otp-timer" aria-live="polite">
              {timer > 0 ? (
                <>Resend code in <strong>{timer}s</strong></>
              ) : (
                <button
                  type="button"
                  className="auth-link"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? "Sending…" : "Resend code"}
                </button>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || otp.join("").length < OTP_LENGTH}
              aria-busy={loading}
              style={{ marginTop: "var(--space-6)" }}
            >
              {loading
                ? <><span className="btn-spinner" aria-hidden="true" /> Verifying…</>
                : "Verify email"
              }
            </button>
          </form>

          <p className="auth-footer-text">
            Wrong email?{" "}
            <button className="auth-link" onClick={() => onNavigate?.("signup")}>Go back</button>
          </p>
        </div>
      </main>

      <aside className="auth-visual-side" aria-hidden="true">
        <EmailSecurityImage />
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
            <blockquote>"Security first. TiraNa makes sure only real hosts manage real properties."</blockquote>
            <cite>— TiraNa Trust & Safety Team</cite>
          </div>
        </div>
      </aside>
    </div>
  );
}