import { IconAlertCircle } from "../../../components/icons";

function Toggle({ label, hint, value, onChange }) {
  return (
    <div className="rule-toggle-row">
      <div className="rule-toggle-text">
        <strong>{label}</strong>
        {hint && <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-secondary)" }}>{hint}</span>}
      </div>
      <button
        type="button"
        className={`switch ${value ? "on" : ""}`}
        onClick={() => onChange(!value)}
        role="switch"
        aria-checked={value}
        aria-label={label}
      >
        <span className="switch-knob" />
      </button>
    </div>
  );
}

export default function StepRules({ data, errors, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div>
      <div className="builder-panel-head">
        <h2>House rules</h2>
        <p>Set expectations up front so there are no surprises for your guests.</p>
      </div>

      <div className="builder-field-grid cols-2">
        <div className="form-group">
          <label className="form-label" htmlFor="checkin">
            Check-in time (from)
          </label>
          <input
            id="checkin"
            type="time"
            className={`form-input form-input-no-icon ${errors.checkin_time ? "has-error" : ""}`}
            value={data.checkin_time}
            onChange={(e) => set("checkin_time", e.target.value)}
          />
          {errors.checkin_time && (
            <span className="field-error" role="alert">
              <IconAlertCircle width={14} height={14} /> {errors.checkin_time}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="checkout">
            Check-out time (until)
          </label>
          <input
            id="checkout"
            type="time"
            className={`form-input form-input-no-icon ${errors.checkout_time ? "has-error" : ""}`}
            value={data.checkout_time}
            onChange={(e) => set("checkout_time", e.target.value)}
          />
          {errors.checkout_time && (
            <span className="field-error" role="alert">
              <IconAlertCircle width={14} height={14} /> {errors.checkout_time}
            </span>
          )}
        </div>
      </div>

      <div style={{ marginTop: "var(--space-2)" }}>
        <Toggle label="Smoking allowed" value={data.smoking} onChange={(v) => set("smoking", v)} />
        <Toggle label="Pets allowed" value={data.pets} onChange={(v) => set("pets", v)} />
        <Toggle label="Parties or events allowed" value={data.parties} onChange={(v) => set("parties", v)} />
      </div>

      <div className="form-group" style={{ marginTop: "var(--space-5)" }}>
        <label className="form-label" htmlFor="additional-rules">
          Additional rules <span>(optional)</span>
        </label>
        <textarea
          id="additional-rules"
          className="builder-textarea"
          style={{ minHeight: "100px" }}
          placeholder="e.g. Quiet hours after 10PM, no outside visitors past midnight…"
          value={data.additional}
          maxLength={500}
          onChange={(e) => set("additional", e.target.value)}
        />
      </div>
    </div>
  );
}
