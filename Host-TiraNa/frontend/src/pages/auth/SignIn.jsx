import { useState } from "react";
import "./../../index.css";
import { login } from "../../api/auth";

/* ─── SVG Icons ─────────────────────────────────────────────── */
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="3"/>
    <path d="m2 7 8.67 6.06a2 2 0 0 0 2.66 0L22 7"/>
  </svg>
);

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

/* ─── Visual Panel SVG Illustration ────────────────────────── */
const BuildingImage = () => (
  <img 
    src="https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=1000&fit=crop"
    alt="Modern apartment building"
    style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      opacity: 0.20
    }}
  />
);

/* ─── Logo Mark SVG ────────────────────────────────────────── */
const LogoMark = ({ dark = false }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 2L3 8v10h5v-6h4v6h5V8L10 2z" fill={dark ? "#F7F4EF" : "#F7F4EF"}/>
    <path d="M10 2L3 8h14L10 2z" fill="#C9A84C"/>
  </svg>
);

/* ─── SignIn Component ──────────────────────────────────────── */
export default function SignIn({ onNavigate }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const validate = () => {
    const errs = {};
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email address";
    if (!form.password) errs.password = "Password is required";
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await login(form.email, form.password);
      setLoading(false);

      const host = res.data.host;
      if (host.status !== "active") {
        setServerError(
          "Your account is still pending admin approval. Please wait for an administrator to review your application."
        );
        return;
      }
      onNavigate?.("dashboard");
    } catch (err) {
      setLoading(false);
      const res = err.response?.data;
      setServerError(res?.message || "Something went wrong. Please try again.");
    }
  };

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="auth-shell">
      {/* ── Form Side ── */}
      <main className="auth-form-side">

        <div className="auth-form-body">
          <h1 className="auth-heading">Welcome back,<br/>Host.</h1>
          <p className="auth-subheading">Manage your properties, bookings, and earnings from one place.</p>

          {serverError && (
            <div className="alert alert-error" role="alert">
              <IconAlertCircle />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email address <span aria-hidden="true">*</span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><IconMail /></span>
                <input
                  id="email"
                  type="email"
                  className={`form-input${errors.email ? " has-error" : ""}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange("email")}
                  autoComplete="email"
                  aria-describedby={errors.email ? "email-error" : undefined}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <span id="email-error" className="field-error" role="alert">
                  <IconAlertCircle />{errors.email}
                </span>
              )}
            </div>

            {/* Password */}
            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Password <span aria-hidden="true">*</span>
              </label>
              <div className="input-wrapper">
                <span className="input-icon"><IconLock /></span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className={`form-input${errors.password ? " has-error" : ""}`}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange("password")}
                  autoComplete="current-password"
                  aria-describedby={errors.password ? "password-error" : undefined}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="input-icon-right"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.password && (
                <span id="password-error" className="field-error" role="alert">
                  <IconAlertCircle />{errors.password}
                </span>
              )}
            </div>

            {/* Forgot password */}
            <button
              type="button"
              className="forgot-link"
              onClick={() => onNavigate?.("forgot-password")}
            >
              Forgot password?
            </button>

            {/* Submit */}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              aria-busy={loading}
            >
              {loading
                ? <><span className="btn-spinner" aria-hidden="true" /> Signing in...</>
                : "Sign in to dashboard"
              }
            </button>
          </form>

          <p className="auth-footer-text">
            New to HostSpace?{" "}
            <button className="auth-link" onClick={() => onNavigate?.("signup")}>
              Create a host account
            </button>
          </p>
        </div>
      </main>

      {/* ── Visual Side ── */}
      <aside className="auth-visual-side" aria-hidden="true">
        <BuildingImage />
        <div className="visual-panel-content">
          {/* White-label logo on dark */}
          <div className="auth-logo">
            <img 
              src="/src/assets/images/logo.png" 
              alt="Logo" 
              style={{ height: '50px', width: 'auto' }}
            />
            <span className="auth-logo-text" style={{ color: "var(--color-text-inverse)" }}>
              TiraNa
            </span>
          </div>

          <div className="auth-logo">

</div>

          <div>
            <div className="visual-stats">
              <div>
                <div className="visual-stat-num">12k+</div>
                <div className="visual-stat-label">Active hosts</div>
              </div>
              <div>
                <div className="visual-stat-num">₱4.2B</div>
                <div className="visual-stat-label">Total payouts</div>
              </div>
              <div>
                <div className="visual-stat-num">98%</div>
                <div className="visual-stat-label">Payout rate</div>
              </div>
            </div>

            <div className="visual-panel-quote">
              <blockquote>
                "Managing five properties used to be a full-time headache. Now it takes me two hours a week."
              </blockquote>
              <cite>— Maria Santos, Host since 2022 · Cebu City</cite>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}