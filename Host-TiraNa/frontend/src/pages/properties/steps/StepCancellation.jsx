const POLICIES = [
  {
    key: "flexible",
    label: "Flexible",
    desc: "Full refund 24 hours before check-in. Most appealing to guests.",
  },
  {
    key: "moderate",
    label: "Moderate",
    desc: "Full refund 5 days before check-in. A balance of guest comfort and host protection.",
  },
  {
    key: "strict",
    label: "Strict",
    desc: "50% refund up to 7 days before check-in. Best for high-demand or peak season listings.",
  },
];

export default function StepCancellation({ data, errors, onChange }) {
  return (
    <div>
      <div className="builder-panel-head">
        <h2>Cancellation policy</h2>
        <p>This determines how refunds are calculated when a guest cancels.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
        {POLICIES.map((p) => (
          <button
            type="button"
            key={p.key}
            className={`policy-card ${data.policy === p.key ? "selected" : ""}`}
            onClick={() => onChange({ ...data, policy: p.key })}
          >
            <div className="policy-card-head">
              <strong>{p.label}</strong>
              <span className="radio-dot" />
            </div>
            <p>{p.desc}</p>
          </button>
        ))}
      </div>

      {errors.policy && <span className="field-error">{errors.policy}</span>}
    </div>
  );
}
