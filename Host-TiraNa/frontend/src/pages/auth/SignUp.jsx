import { useState } from "react";
import "./../../index.css";
import { register } from "../../api/auth";

/* ─── Icons ──────────────────────────────────────────────────── */
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="3"/>
    <path d="m2 7 8.67 6.06a2 2 0 0 0 2.66 0L22 7"/>
  </svg>
);

const IconPhone = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.84 11a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.78 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.16 6.16l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
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

const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const IconUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="17 8 12 3 7 8"/>
    <line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);

const IconFile = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
  </svg>
);

const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const IconAlertCircle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

/* ─── Password Strength ──────────────────────────────────────── */
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
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`strength-bar-seg${i <= score ? ` ${STRENGTH_ACTIVE[score]}` : ""}`}
          />
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

/* ─── Stepper ─────────────────────────────────────────────────── */
const STEPS = ["Account", "Contact", "Verify"];

function Stepper({ current }) {
  return (
    <nav className="stepper" aria-label="Sign up progress">
      {STEPS.map((step, i) => (
        <div className="step-item" key={step}>
          <div
            className={`step-circle ${i < current ? "done" : i === current ? "active" : "pending"}`}
            aria-current={i === current ? "step" : undefined}
          >
            {i < current ? <IconCheck /> : i + 1}
          </div>
          {i < STEPS.length - 1 && (
            <div className={`step-line ${i < current ? "done" : ""}`} />
          )}
        </div>
      ))}
    </nav>
  );
}

/* ─── Visual Panel Illustration ─────────────────────────────── */
// Remove the SVG and use:
const TeamImage = () => (
  <img 
    src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=1000&fit=crop"
    alt="Team collaboration"
    style={{
      position: "absolute",
      top: "0px",
      left: "0px",
      transform: "translate(0%, 0%)",
      width: "100%",
      height: "auto",
      opacity: 0.20,
      objectFit: "contain"
    }}
  />
);

/* ─── Sign Up ─────────────────────────────────────────────────── */
export default function SignUp({ onNavigate }) {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirmPassword: "",
    phone: "", idFile: null, selfieFile: null, agreed: false,
  });

  const handleChange = (field) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm(p => ({ ...p, [field]: val }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
  };

  const handleFile = (field) => (e) => {
    const file = e.target.files?.[0] || null;
    setForm(p => ({ ...p, [field]: file }));
    if (errors[field]) setErrors(p => ({ ...p, [field]: "" }));
  };

  const removeFile = (field) => () => setForm(p => ({ ...p, [field]: null }));

  const validateStep0 = () => {
    const errs = {};
    if (!form.fullName.trim()) errs.fullName = "Full name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email";
    if (!form.password) errs.password = "Password is required";
    else if (getPasswordStrength(form.password) < 4) errs.password = "Password must include an uppercase letter, a number, and a special character.";
    if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const validateStep1 = () => {
    const errs = {};
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    else if (!/^(\+63|0)[0-9]{10}$/.test(form.phone.replace(/\s/g, ""))) errs.phone = "Enter a valid PH number (e.g. 09xxxxxxxxx)";
    if (!form.idFile) errs.idFile = "Government ID is required";
    if (!form.selfieFile) errs.selfieFile = "Selfie with ID is required";
    if (!form.agreed) errs.agreed = "You must agree to the terms to continue";
    return errs;
  };

  const nextStep = async () => {
    if (step === 0) {
      const errs = validateStep0();
      if (Object.keys(errs).length) { setErrors(errs); return; }
    }
    if (step === 1) {
      const errs = validateStep1();
      if (Object.keys(errs).length) { setErrors(errs); return; }

      setServerError("");
      setLoading(true);
      try {
        await register(
          {
            full_name: form.fullName,
            email: form.email,
            password: form.password,
            confirm_password: form.confirmPassword,
            phone: form.phone,
          },
          form.idFile,
          form.selfieFile
        );
      } catch (err) {
        setLoading(false);
        const res = err.response?.data;
        if (res?.errors) {
          // Map backend field errors (e.g. { email: ["Email already registered..."] })
          // onto the same `errors` state used for client-side validation.
          const mapped = {};
          const fieldMap = {
            full_name: "fullName",
            confirm_password: "confirmPassword",
          };
          Object.entries(res.errors).forEach(([key, msgs]) => {
            const field = fieldMap[key] || key;
            mapped[field] = Array.isArray(msgs) ? msgs[0] : String(msgs);
          });
          setErrors(mapped);
          // If the error is on a step-0 field, send the user back there.
          if (mapped.fullName || mapped.email || mapped.password || mapped.confirmPassword) {
            setStep(0);
          }
        } else {
          setServerError(res?.message || "Something went wrong. Please try again.");
        }
        return;
      }
      setLoading(false);
    }
    setErrors({});
    setStep(s => s + 1);
  };

  const prevStep = () => { setErrors({}); setStep(s => s - 1); };

  const steps = [
    /* ── Step 0: Account ──────────────────────────────────── */
    <div key="step0">
      <h1 className="auth-heading">Create your<br/>host account.</h1>
      <p className="auth-subheading">Start earning from your property in minutes.</p>

      <Stepper current={0} />

      {/* Full name */}
      <div className="form-group">
        <label className="form-label" htmlFor="fullName">Full name <span>*</span></label>
        <div className="input-wrapper">
          <span className="input-icon"><IconUser /></span>
          <input id="fullName" type="text"
            className={`form-input${errors.fullName ? " has-error" : ""}`}
            placeholder="Juan dela Cruz"
            value={form.fullName} onChange={handleChange("fullName")}
            autoComplete="name"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "fullName-err" : undefined}
          />
        </div>
        {errors.fullName && <span id="fullName-err" className="field-error" role="alert"><IconAlertCircle />{errors.fullName}</span>}
      </div>

      {/* Email */}
      <div className="form-group">
        <label className="form-label" htmlFor="reg-email">Email address <span>*</span></label>
        <div className="input-wrapper">
          <span className="input-icon"><IconMail /></span>
          <input id="reg-email" type="email"
            className={`form-input${errors.email ? " has-error" : ""}`}
            placeholder="you@example.com"
            value={form.email} onChange={handleChange("email")}
            autoComplete="email"
            aria-invalid={!!errors.email}
          />
        </div>
        {errors.email && <span className="field-error" role="alert"><IconAlertCircle />{errors.email}</span>}
      </div>

      {/* Password */}
      <div className="form-group">
        <label className="form-label" htmlFor="reg-password">Password <span>*</span></label>
        <div className="input-wrapper">
          <span className="input-icon"><IconLock /></span>
          <input id="reg-password" type={showPassword ? "text" : "password"}
            className={`form-input${errors.password ? " has-error" : ""}`}
            placeholder="Min 8 characters"
            value={form.password} onChange={handleChange("password")}
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
        {errors.password && <span className="field-error" role="alert"><IconAlertCircle />{errors.password}</span>}
      </div>

      {/* Confirm password */}
      <div className="form-group">
        <label className="form-label" htmlFor="confirmPassword">Confirm password <span>*</span></label>
        <div className="input-wrapper">
          <span className="input-icon"><IconLock /></span>
          <input id="confirmPassword" type={showConfirm ? "text" : "password"}
            className={`form-input${errors.confirmPassword ? " has-error" : ""}`}
            placeholder="Repeat your password"
            value={form.confirmPassword} onChange={handleChange("confirmPassword")}
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
          />
          <button type="button" className="input-icon-right"
            onClick={() => setShowConfirm(p => !p)}
            aria-label={showConfirm ? "Hide password" : "Show password"}>
            {showConfirm ? <IconEyeOff /> : <IconEye />}
          </button>
        </div>
        {errors.confirmPassword && <span className="field-error" role="alert"><IconAlertCircle />{errors.confirmPassword}</span>}
      </div>

      <button type="button" className="btn btn-primary" onClick={nextStep}>Continue</button>

      <p className="auth-footer-text">
        Already have an account?{" "}
        <button className="auth-link" onClick={() => onNavigate?.("signin")}>Sign in</button>
      </p>
    </div>,

    /* ── Step 1: Contact & KYC ──────────────────────────── */
    <div key="step1">
      <h1 className="auth-heading">Verify your<br/>identity.</h1>
      <p className="auth-subheading">This is required for all hosts. Your data is securely stored.</p>

      <Stepper current={1} />

      {serverError && (
        <div className="alert alert-error" role="alert">
          <IconAlertCircle />
          <span>{serverError}</span>
        </div>
      )}

      {/* Phone */}
      <div className="form-group">
        <label className="form-label" htmlFor="phone">Phone number <span>*</span></label>
        <div className="input-wrapper">
          <span className="input-icon"><IconPhone /></span>
          <input id="phone" type="tel"
            className={`form-input${errors.phone ? " has-error" : ""}`}
            placeholder="09xxxxxxxxx or +639xxxxxxxxx"
            value={form.phone} onChange={handleChange("phone")}
            autoComplete="tel"
            aria-invalid={!!errors.phone}
          />
        </div>
        {errors.phone && <span className="field-error" role="alert"><IconAlertCircle />{errors.phone}</span>}
        <span className="field-hint">Used for booking notifications. PH numbers only.</span>
      </div>

      {/* Government ID */}
      <div className="form-group">
        <label className="form-label" htmlFor="idFile">Government-issued ID <span>*</span></label>
        {!form.idFile ? (
          <label htmlFor="idFile" className={`upload-zone${errors.idFile ? " has-error" : ""}`}>
            <div style={{ color: "var(--color-text-muted)" }}><IconUpload /></div>
            <div className="upload-zone-label">
              <strong>Click to upload</strong> or drag and drop<br/>
              <span style={{ fontSize: "var(--text-xs)" }}>PHIL-SYS, SSS, UMID, Passport, Driver's License · JPG, PNG, PDF · Max 5MB</span>
            </div>
            <input id="idFile" type="file" accept=".jpg,.jpeg,.png,.pdf"
              style={{ display: "none" }} onChange={handleFile("idFile")} />
          </label>
        ) : (
          <div className="upload-preview">
            <IconFile />
            <span className="upload-preview-name">{form.idFile.name}</span>
            <button type="button" className="upload-preview-remove"
              onClick={removeFile("idFile")} aria-label="Remove ID file">
              <IconX />
            </button>
          </div>
        )}
        {errors.idFile && <span className="field-error" role="alert"><IconAlertCircle />{errors.idFile}</span>}
      </div>

      {/* Selfie with ID */}
      <div className="form-group">
        <label className="form-label" htmlFor="selfieFile">Selfie holding your ID <span>*</span></label>
        {!form.selfieFile ? (
          <label htmlFor="selfieFile" className={`upload-zone${errors.selfieFile ? " has-error" : ""}`}>
            <div style={{ color: "var(--color-text-muted)" }}><IconUpload /></div>
            <div className="upload-zone-label">
              <strong>Click to upload</strong> a clear selfie<br/>
              <span style={{ fontSize: "var(--text-xs)" }}>Hold your ID next to your face · JPG, PNG · Max 5MB</span>
            </div>
            <input id="selfieFile" type="file" accept=".jpg,.jpeg,.png"
              style={{ display: "none" }} onChange={handleFile("selfieFile")} />
          </label>
        ) : (
          <div className="upload-preview">
            <IconFile />
            <span className="upload-preview-name">{form.selfieFile.name}</span>
            <button type="button" className="upload-preview-remove"
              onClick={removeFile("selfieFile")} aria-label="Remove selfie file">
              <IconX />
            </button>
          </div>
        )}
        {errors.selfieFile && <span className="field-error" role="alert"><IconAlertCircle />{errors.selfieFile}</span>}
      </div>

      {/* Terms */}
      <div className="checkbox-group">
        <input id="agreed" type="checkbox" className="checkbox-input"
          checked={form.agreed} onChange={handleChange("agreed")} />
        <label htmlFor="agreed" className="checkbox-label">
          I agree to HostSpace's <a href="#" onClick={e => e.preventDefault()}>Terms of Service</a> and{" "}
          <a href="#" onClick={e => e.preventDefault()}>Privacy Policy</a>. I confirm all information is accurate.
        </label>
      </div>
      {errors.agreed && <span className="field-error" role="alert" style={{ marginTop: "-12px", marginBottom: "16px" }}><IconAlertCircle />{errors.agreed}</span>}

      <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
        <button type="button" className="btn btn-secondary" onClick={prevStep} style={{ flex: "0 0 auto", width: "auto", minWidth: 100 }}>
          Back
        </button>
        <button type="button" className="btn btn-primary" onClick={nextStep} disabled={loading}>
          {loading ? <><span className="btn-spinner" /> Submitting...</> : "Submit application"}
        </button>
      </div>
    </div>,

    /* ── Step 2: Success ────────────────────────────────── */
    <div key="step2" style={{ textAlign: "center" }}>
      <Stepper current={2} />

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
        Application submitted!
      </h1>
      <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--text-base)", marginBottom: "var(--space-8)", lineHeight: 1.6 }}>
        We've sent a 6-digit verification code to <strong>{form.email}</strong>. Verify your email to continue —
        our team will separately review your KYC documents within <strong>1–2 business days</strong>.
      </p>

      <div style={{
        background: "var(--color-bg)", border: "1.5px solid var(--color-border)",
        borderRadius: "var(--radius-lg)", padding: "var(--space-5)", marginBottom: "var(--space-8)",
        textAlign: "left"
      }}>
        <p style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-primary)", marginBottom: "var(--space-3)" }}>
          What happens next?
        </p>
        {[
          "Verify your email using the code we sent",
          "Admin reviews your submitted ID and selfie",
          "Sign in and start listing your property",
        ].map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "var(--space-3)", marginBottom: i < 2 ? "var(--space-3)" : 0, alignItems: "flex-start" }}>
            <div style={{
              width: 20, height: 20, borderRadius: "50%",
              background: "var(--color-primary)", color: "white",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "var(--text-xs)", fontWeight: 700, flexShrink: 0, marginTop: 2
            }}>{i + 1}</div>
            <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>{item}</span>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-primary" onClick={() => onNavigate?.("verify-email", { email: form.email })}>
        Verify my email
      </button>
    </div>,
  ];

  return (
    <div className="auth-shell">
      {/* Form Side */}
      <main className="auth-form-side">
        <div className="auth-form-body">
          {steps[step]}
        </div>
      </main>

      {/* Visual Side */}
      <aside className="auth-visual-side" aria-hidden="true">
        <TeamImage />
        <div className="visual-panel-content">
          <div className="auth-logo">
            <img 
              src="/src/assets/images/logo.png" 
              alt="Logo" 
              style={{ height: '50px', width: 'auto' }}
            />
            <span className="auth-logo-text" style={{ color: "var(--color-text-inverse)" }}>TiraNa</span>
          </div>
          <div>
            <div className="visual-stats">
              <div>
                <div className="visual-stat-num">3 days</div>
                <div className="visual-stat-label">Avg. first booking</div>
              </div>
              <div>
                <div className="visual-stat-num">₱38k</div>
                <div className="visual-stat-label">Avg. monthly earn</div>
              </div>
            </div>
            <div className="visual-panel-quote">
              <blockquote>"I listed my condo on a Tuesday. By Thursday I had my first confirmed booking."</blockquote>
              <cite>— Carlo Reyes, Host · Quezon City</cite>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}