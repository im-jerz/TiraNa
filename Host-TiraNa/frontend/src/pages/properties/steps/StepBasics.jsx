import { IconHome, IconBuilding, IconUsers, IconAlertCircle, IconCheck } from "../../../components/icons";

const PROPERTY_TYPES = [
  { key: "entire_place", label: "Entire place", desc: "Guests have the whole property to themselves.", icon: IconHome },
  { key: "private_room", label: "Private room", desc: "A private room in a shared property.", icon: IconBuilding },
  { key: "shared_room", label: "Shared room", desc: "A shared room with other guests.", icon: IconUsers },
];

const CATEGORIES = ["House", "Apartment", "Villa", "Cabin", "Condo", "Cottage", "Farm stay", "Tiny home"];

export default function StepBasics({ data, errors, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value });

  return (
    <div>
      <div className="builder-panel-head">
        <h2>Tell us about your place</h2>
        <p>Start with the essentials — guests will see this first.</p>
      </div>

      <div className="builder-field-grid">
        <div>
          <label className="form-label">Property type</label>
          <div className="option-card-grid" style={{ marginTop: "var(--space-2)" }}>
            {PROPERTY_TYPES.map((t) => (
              <button
                type="button"
                key={t.key}
                className={`option-card ${data.property_type === t.key ? "selected" : ""}`}
                onClick={() => set("property_type", t.key)}
              >
                <span className="option-card-icon">
                  <t.icon />
                </span>
                <span className="option-card-text">
                  <strong>{t.label}</strong>
                  <span>{t.desc}</span>
                </span>
                <span className="option-card-check">
                  {data.property_type === t.key ? <IconCheck width={13} height={13} /> : ""}
                </span>
              </button>
            ))}
          </div>
          {errors.property_type && (
            <span className="field-error" role="alert">
              <IconAlertCircle width={14} height={14} /> {errors.property_type}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="title">
            Property title
          </label>
          <input
            id="title"
            type="text"
            className={`form-input form-input-no-icon ${errors.title ? "has-error" : ""}`}
            placeholder="e.g. Sea Breeze Cabin with Mountain View"
            value={data.title}
            maxLength={100}
            onChange={(e) => set("title", e.target.value)}
          />
          {errors.title && (
            <span className="field-error" role="alert">
              <IconAlertCircle width={14} height={14} /> {errors.title}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className={`builder-textarea ${errors.description ? "has-error" : ""}`}
            placeholder="Describe what makes your place special — the space, the neighborhood, what guests can look forward to."
            value={data.description}
            maxLength={2000}
            onChange={(e) => set("description", e.target.value)}
          />
          <div className="char-counter">{data.description.length} / 2000</div>
          {errors.description && (
            <span className="field-error" role="alert">
              <IconAlertCircle width={14} height={14} /> {errors.description}
            </span>
          )}
        </div>

        <div>
          <label className="form-label">Category</label>
          <div className="filter-tabs" style={{ marginTop: "var(--space-2)", flexWrap: "wrap", width: "100%" }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-tab ${data.category === cat.toLowerCase() ? "active" : ""}`}
                onClick={() => set("category", cat.toLowerCase())}
              >
                {cat}
              </button>
            ))}
          </div>
          {errors.category && (
            <span className="field-error" role="alert">
              <IconAlertCircle width={14} height={14} /> {errors.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
