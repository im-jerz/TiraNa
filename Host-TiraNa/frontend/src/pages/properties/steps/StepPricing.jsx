import { IconAlertCircle } from "../../../components/icons";

export default function StepPricing({ data, errors, onChange }) {
  const set = (field, value) => onChange({ ...data, [field]: value });

  const base = Number(data.base_price) || 0;
  const cleaning = Number(data.cleaning_fee) || 0;
  const serviceFee = Math.round(base * 0.03);
  const total = base + cleaning + serviceFee;

  return (
    <div>
      <div className="builder-panel-head">
        <h2>Set your price</h2>
        <p>You can always change this later — pricing updates apply immediately.</p>
      </div>

      <div className="builder-field-grid cols-2">
        <div className="form-group">
          <label className="form-label" htmlFor="base_price">
            Base price per night
          </label>
          <div className="price-input-wrap">
            <span className="price-currency">₱</span>
            <input
              id="base_price"
              type="number"
              min="0"
              className={`form-input price-input ${errors.base_price ? "has-error" : ""}`}
              placeholder="3,200"
              value={data.base_price}
              onChange={(e) => set("base_price", e.target.value)}
            />
          </div>
          {errors.base_price && (
            <span className="field-error" role="alert">
              <IconAlertCircle width={14} height={14} /> {errors.base_price}
            </span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="cleaning_fee">
            Cleaning fee <span>(optional)</span>
          </label>
          <div className="price-input-wrap">
            <span className="price-currency">₱</span>
            <input
              id="cleaning_fee"
              type="number"
              min="0"
              className="form-input price-input"
              placeholder="400"
              value={data.cleaning_fee}
              onChange={(e) => set("cleaning_fee", e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="weekend_price">
            Weekend price override <span>(optional)</span>
          </label>
          <div className="price-input-wrap">
            <span className="price-currency">₱</span>
            <input
              id="weekend_price"
              type="number"
              min="0"
              className="form-input price-input"
              placeholder="Same as base price"
              value={data.weekend_price}
              onChange={(e) => set("weekend_price", e.target.value)}
            />
          </div>
        </div>

        <div className="builder-field-grid cols-2">
          <div className="form-group">
            <label className="form-label" htmlFor="min_nights">
              Minimum nights
            </label>
            <input
              id="min_nights"
              type="number"
              min="1"
              className={`form-input form-input-no-icon ${errors.min_nights ? "has-error" : ""}`}
              value={data.min_nights}
              onChange={(e) => set("min_nights", e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="max_nights">
              Maximum nights
            </label>
            <input
              id="max_nights"
              type="number"
              min="1"
              className="form-input form-input-no-icon"
              value={data.max_nights}
              onChange={(e) => set("max_nights", e.target.value)}
            />
          </div>
        </div>
        {errors.min_nights && (
          <span className="field-error" role="alert">
            <IconAlertCircle width={14} height={14} /> {errors.min_nights}
          </span>
        )}
      </div>

      {base > 0 && (
        <div className="price-summary-box" style={{ marginTop: "var(--space-6)" }}>
          <div className="price-summary-row">
            <span>Base price</span>
            <span>₱{base.toLocaleString("en-PH")}</span>
          </div>
          {cleaning > 0 && (
            <div className="price-summary-row">
              <span>Cleaning fee</span>
              <span>₱{cleaning.toLocaleString("en-PH")}</span>
            </div>
          )}
          <div className="price-summary-row">
            <span>Service fee (3%, estimate)</span>
            <span>₱{serviceFee.toLocaleString("en-PH")}</span>
          </div>
          <div className="price-summary-row total">
            <span>Guest pays per night</span>
            <span>₱{total.toLocaleString("en-PH")}</span>
          </div>
        </div>
      )}
    </div>
  );
}
