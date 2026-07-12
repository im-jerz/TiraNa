function Counter({ label, hint, value, onChange, min = 0, max = 50, step = 1 }) {
  return (
    <div className="counter-row">
      <div className="counter-row-text">
        <strong>{label}</strong>
        {hint && <span>{hint}</span>}
      </div>
      <div className="counter-control">
        <button
          type="button"
          className="counter-btn"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, +(value - step).toFixed(1)))}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="counter-value">{value}</span>
        <button
          type="button"
          className="counter-btn"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, +(value + step).toFixed(1)))}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export default function StepCapacity({ data, errors, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div>
      <div className="builder-panel-head">
        <h2>Capacity & rooms</h2>
        <p>Let guests know how many people can comfortably stay.</p>
      </div>

      <div className="builder-panel" style={{ padding: 0, border: "none" }}>
        <Counter
          label="Max guests"
          hint="Total number of guests allowed"
          value={data.max_guests}
          min={1}
          max={20}
          onChange={(v) => set("max_guests", v)}
        />
        <Counter
          label="Bedrooms"
          value={data.bedrooms}
          min={0}
          max={15}
          onChange={(v) => set("bedrooms", v)}
        />
        <Counter label="Beds" value={data.beds} min={1} max={20} onChange={(v) => set("beds", v)} />
        <Counter
          label="Bathrooms"
          hint="Half-baths count as 0.5"
          value={data.bathrooms}
          min={0.5}
          max={10}
          step={0.5}
          onChange={(v) => set("bathrooms", v)}
        />
      </div>

      {errors.max_guests && <span className="field-error">{errors.max_guests}</span>}
    </div>
  );
}
