import { PROPERTY_TYPE_LABEL } from "../../../data/mockProperties";
import { resolveMediaUrl } from "../../../api/properties";

const PROPERTY_TYPE_LABELS = {
  ...PROPERTY_TYPE_LABEL,
};

export default function StepReview({ draft, onEditStep }) {
  const { basics, location, capacity, amenities, rules, photos, pricing, cancellation } = draft;
  const coverPhoto = photos.files.find((f) => f.id === photos.coverId) || photos.files[0];

  return (
    <div>
      <div className="builder-panel-head">
        <h2>Review your listing</h2>
        <p>Double-check everything below before sending it for approval.</p>
      </div>

      {coverPhoto && (
        <div style={{ marginBottom: "var(--space-5)", borderRadius: "var(--radius-md)", overflow: "hidden", aspectRatio: "16/7" }}>
          <img src={resolveMediaUrl(coverPhoto.url)} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      <div className="review-section">
        <div className="review-section-head">
          <h4>Basics</h4>
          <button type="button" className="review-edit-link" onClick={() => onEditStep("basics")}>
            Edit
          </button>
        </div>
        <div className="review-grid">
          <div className="review-item">
            <span>Title</span>
            <strong>{basics.title || "—"}</strong>
          </div>
          <div className="review-item">
            <span>Type</span>
            <strong>{PROPERTY_TYPE_LABELS[basics.property_type] || "—"}</strong>
          </div>
          <div className="review-item">
            <span>Category</span>
            <strong style={{ textTransform: "capitalize" }}>{basics.category || "—"}</strong>
          </div>
        </div>
      </div>

      <div className="review-section">
        <div className="review-section-head">
          <h4>Location</h4>
          <button type="button" className="review-edit-link" onClick={() => onEditStep("location")}>
            Edit
          </button>
        </div>
        <div className="review-grid">
          <div className="review-item">
            <span>Address</span>
            <strong>{location.street || "—"}</strong>
          </div>
          <div className="review-item">
            <span>City / Province</span>
            <strong>{location.city}, {location.province}</strong>
          </div>
          <div className="review-item">
            <span>ZIP</span>
            <strong>{location.zip_code || "—"}</strong>
          </div>
        </div>
      </div>

      <div className="review-section">
        <div className="review-section-head">
          <h4>Capacity</h4>
          <button type="button" className="review-edit-link" onClick={() => onEditStep("capacity")}>
            Edit
          </button>
        </div>
        <div className="review-grid">
          <div className="review-item">
            <span>Guests</span>
            <strong>{capacity.max_guests}</strong>
          </div>
          <div className="review-item">
            <span>Bedrooms</span>
            <strong>{capacity.bedrooms}</strong>
          </div>
          <div className="review-item">
            <span>Beds</span>
            <strong>{capacity.beds}</strong>
          </div>
          <div className="review-item">
            <span>Bathrooms</span>
            <strong>{capacity.bathrooms}</strong>
          </div>
        </div>
      </div>

      <div className="review-section">
        <div className="review-section-head">
          <h4>Amenities</h4>
          <button type="button" className="review-edit-link" onClick={() => onEditStep("amenities")}>
            Edit
          </button>
        </div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          {amenities.selected.length + amenities.custom.length === 0
            ? "No amenities added yet."
            : `${amenities.selected.length + amenities.custom.length} amenities selected`}
        </p>
      </div>

      <div className="review-section">
        <div className="review-section-head">
          <h4>House rules</h4>
          <button type="button" className="review-edit-link" onClick={() => onEditStep("rules")}>
            Edit
          </button>
        </div>
        <div className="review-grid">
          <div className="review-item">
            <span>Check-in / out</span>
            <strong>{rules.checkin_time} – {rules.checkout_time}</strong>
          </div>
          <div className="review-item">
            <span>Smoking</span>
            <strong>{rules.smoking ? "Allowed" : "Not allowed"}</strong>
          </div>
          <div className="review-item">
            <span>Pets</span>
            <strong>{rules.pets ? "Allowed" : "Not allowed"}</strong>
          </div>
        </div>
      </div>

      <div className="review-section">
        <div className="review-section-head">
          <h4>Photos</h4>
          <button type="button" className="review-edit-link" onClick={() => onEditStep("photos")}>
            Edit
          </button>
        </div>
        <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)" }}>
          {photos.files.length} photo{photos.files.length !== 1 ? "s" : ""} uploaded
        </p>
      </div>

      <div className="review-section">
        <div className="review-section-head">
          <h4>Pricing & policy</h4>
          <button type="button" className="review-edit-link" onClick={() => onEditStep("pricing")}>
            Edit
          </button>
        </div>
        <div className="review-grid">
          <div className="review-item">
            <span>Base price</span>
            <strong>₱{Number(pricing.base_price || 0).toLocaleString("en-PH")} / night</strong>
          </div>
          <div className="review-item">
            <span>Min – Max nights</span>
            <strong>{pricing.min_nights} – {pricing.max_nights}</strong>
          </div>
          <div className="review-item">
            <span>Cancellation</span>
            <strong style={{ textTransform: "capitalize" }}>{cancellation.policy}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
