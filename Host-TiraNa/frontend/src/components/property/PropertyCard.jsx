import { Link } from "react-router-dom";
import {
  IconMapPin,
  IconStar,
  IconCalendarCheck,
  IconEdit,
  IconPower,
  IconTrash,
} from "../icons";
import { PROPERTY_TYPE_LABEL, STATUS_LABEL } from "../../data/mockProperties";
import { resolveMediaUrl } from "../../api/properties";

function formatPHP(n) {
  return `₱${Number(n).toLocaleString("en-PH")}`;
}

export default function PropertyCard({ property, onToggleStatus, onDelete }) {
  const p = property;
  const isActive = p.status === "active";
  const isActionable = p.status === "active" || p.status === "inactive";

  return (
    <article className="property-card">
      <div className="property-card-media">
        <img src={resolveMediaUrl(p.cover_photo)} alt={p.title} loading="lazy" />
        <span className={`status-pill ${p.status}`}>{STATUS_LABEL[p.status]}</span>
        {p.rating_avg ? (
          <span className="property-card-rating">
            <IconStar style={{ fill: "currentColor" }} />
            {p.rating_avg.toFixed(2)}
          </span>
        ) : null}
      </div>

      <div className="property-card-body">
        <div className="property-card-heading">
          <span className="property-card-type">{PROPERTY_TYPE_LABEL[p.property_type]} · {p.category}</span>
          <h3 className="property-card-title">{p.title}</h3>
        </div>

        <div className="property-card-location">
          <IconMapPin />
          {p.address.city}, {p.address.province}
        </div>

        <div className="property-card-meta-row">
          <div className="property-card-price">
            <strong>{formatPHP(p.base_price)}</strong> <span>/ night</span>
          </div>
          <div className="property-card-bookings">
            <IconCalendarCheck />
            {p.upcoming_bookings} upcoming
          </div>
        </div>
      </div>

      <div className="property-card-actions">
        <Link to={`/dashboard/properties/${p.property_id}/edit`} className="card-action-btn">
          <IconEdit /> Edit
        </Link>
        {isActionable && (
          <button
            type="button"
            className={`card-action-btn ${isActive ? "danger" : "positive"}`}
            onClick={() => onToggleStatus(p)}
          >
            <IconPower /> {isActive ? "Deactivate" : "Activate"}
          </button>
        )}
        <button type="button" className="card-action-btn danger" onClick={() => onDelete(p)}>
          <IconTrash /> Delete
        </button>
      </div>
    </article>
  );
}
