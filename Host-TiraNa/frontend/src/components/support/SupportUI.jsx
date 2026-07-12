/* ────────────────────────────────────────────────────────────────
   Shared "Desk" building blocks used by SupportPage & DisputesPage.
   Hospitality-ledger aesthetic: navy + antique gold, flat line-art
   SVG only — no emoji, no gradients.
   ──────────────────────────────────────────────────────────────── */

/** Corner watermark: a key + roofline mark, low-opacity, decorative only. */
export function DeskMark() {
  return (
    <svg className="desk-mark" viewBox="0 0 160 160" fill="none" aria-hidden="true">
      <path d="M20 92 80 40l60 52" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M34 84v46a4 4 0 0 0 4 4h30V108h24v26h30a4 4 0 0 0 4-4V84" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="80" cy="18" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path d="M80 27v14M74 34h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/** Vertical/horizontal rail of interactive category tiles (Support > new ticket). */
export function RailCategoryPicker({ items, value, onChange }) {
  return (
    <nav className="desk-rail" aria-label="Ticket category">
      {items.map((item, i) => {
        const Icon = item.icon;
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            className={`rail-tile${active ? " active" : ""}`}
            onClick={() => onChange(item.value)}
            aria-pressed={active}
          >
            <span className="rail-tile-index">{String(i + 1).padStart(2, "0")}</span>
            <span className="rail-tile-icon"><Icon /></span>
            <span className="rail-tile-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/** Non-interactive vertical step guide, reused as the rail on the Disputes form. */
export function RailStepper({ steps }) {
  return (
    <nav className="desk-rail desk-rail-steps" aria-label="Process steps">
      {steps.map((step, i) => {
        const Icon = step.icon;
        return (
          <div className="rail-step" key={step.label}>
            <span className="rail-step-node">
              <Icon />
            </span>
            <span className="rail-step-copy">
              <span className="rail-step-index">Step {i + 1}</span>
              <span className="rail-step-label">{step.label}</span>
              <span className="rail-step-desc">{step.desc}</span>
            </span>
          </div>
        );
      })}
    </nav>
  );
}

/** Status legend used in the rail slot while in "lookup" mode. */
export function RailStatusLegend({ statuses }) {
  return (
    <nav className="desk-rail desk-rail-legend" aria-label="Status legend">
      {statuses.map((s) => (
        <div className="rail-legend-row" key={s.value}>
          <span className={`rail-legend-dot sup-badge-${s.value}`} />
          <span className="rail-legend-copy">
            <span className="rail-legend-label">{s.label}</span>
            <span className="rail-legend-desc">{s.desc}</span>
          </span>
        </div>
      ))}
    </nav>
  );
}

/** Aside "ledger" card with a title and children — generic wrapper for the right rail. */
export function AsideCard({ title, children }) {
  return (
    <div className="aside-card">
      <span className="aside-card-title">{title}</span>
      {children}
    </div>
  );
}

/** Mini stat tally shown in the aside once records are fetched. */
export function MiniStats({ items }) {
  return (
    <div className="mini-stats">
      {items.map((it) => (
        <div className="mini-stat" key={it.label}>
          <span className="mini-stat-bar" style={{ background: it.color }} />
          <span className="mini-stat-value">{it.value}</span>
          <span className="mini-stat-label">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

/** Empty-state illustration: concentric seal with an icon at the center. */
export function EmptyLedger({ icon: Icon, text }) {
  return (
    <div className="ledger-empty">
      <span className="ledger-empty-seal">
        <span className="ledger-empty-ring" />
        <Icon />
      </span>
      <span className="ledger-empty-text">{text}</span>
    </div>
  );
}