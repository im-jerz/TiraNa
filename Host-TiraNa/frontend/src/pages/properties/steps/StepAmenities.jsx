import { useState } from "react";
import * as Icons from "../../../components/icons";
import { AMENITIES_CATALOG } from "../../../data/mockProperties";
import { IconPlus, IconX, IconCheck } from "../../../components/icons";

export default function StepAmenities({ data, onChange }) {
  const [customInput, setCustomInput] = useState("");

  function toggleAmenity(key) {
    const selected = data.selected.includes(key)
      ? data.selected.filter((k) => k !== key)
      : [...data.selected, key];
    onChange({ ...data, selected });
  }

  function addCustom() {
    const val = customInput.trim();
    if (!val) return;
    onChange({ ...data, custom: [...data.custom, val] });
    setCustomInput("");
  }

  function removeCustom(idx) {
    onChange({ ...data, custom: data.custom.filter((_, i) => i !== idx) });
  }

  return (
    <div>
      <div className="builder-panel-head">
        <h2>What can guests use?</h2>
        <p>Select everything that's available at your place.</p>
      </div>

      <div className="amenity-grid">
        {AMENITIES_CATALOG.map((a) => {
          const Icon = Icons[a.icon];
          const isSelected = data.selected.includes(a.key);
          return (
            <button
              type="button"
              key={a.key}
              className={`amenity-chip ${isSelected ? "selected" : ""}`}
              onClick={() => toggleAmenity(a.key)}
            >
              <Icon />
              {a.label}
              <span className="amenity-chip-check">{isSelected ? <IconCheck width={11} height={11} /> : ""}</span>
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: "var(--space-6)" }}>
        <label className="form-label">Add a custom amenity</label>
        <div className="add-custom-row">
          <input
            type="text"
            className="form-input form-input-no-icon"
            placeholder="e.g. Beachfront access, Hammock"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          />
          <button type="button" className="btn-inline btn-secondary" onClick={addCustom}>
            <IconPlus /> Add
          </button>
        </div>

        {data.custom.length > 0 && (
          <div className="filter-tabs" style={{ marginTop: "var(--space-3)", flexWrap: "wrap", width: "100%", background: "transparent", padding: 0 }}>
            {data.custom.map((item, idx) => (
              <span key={idx} className="filter-tab active" style={{ gap: "var(--space-2)" }}>
                {item}
                <button type="button" onClick={() => removeCustom(idx)} aria-label={`Remove ${item}`} style={{ display: "flex" }}>
                  <IconX width={13} height={13} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
