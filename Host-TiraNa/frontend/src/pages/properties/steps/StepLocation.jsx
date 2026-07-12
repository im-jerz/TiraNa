import { useCallback, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { IconAlertCircle } from "../../../components/icons";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const PH_CENTER = [12.8797, 121.7740];
const DEFAULT_ZOOM = 6;

function LocationMarker({ position, onPositionChange }) {
  const markerRef = useRef(null);

  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });

  const handleDrag = useCallback(
    (e) => {
      const { lat, lng } = e.target.getLatLng();
      onPositionChange(lat, lng);
    },
    [onPositionChange]
  );

  if (!position) return null;

  return (
    <Marker
      ref={markerRef}
      position={position}
      draggable
      eventHandlers={{ dragend: handleDrag }}
    />
  );
}

function MapView({ position }) {
  const map = useMap();
  const prev = useRef(position);

  if (
    position &&
    (prev.current?.lat !== position[0] || prev.current?.lng !== position[1])
  ) {
    prev.current = position;
    map.flyTo(position, Math.max(map.getZoom(), 13));
  }

  return null;
}

async function reverseGeocode(lat, lng) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=en`,
    { headers: { "User-Agent": "TiraNa/1.0" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data.address || null;
}

function pick(values) {
  for (const v of values) {
    if (v) return v;
  }
  return "";
}

export default function StepLocation({ data, errors, onChange }) {
  const [geocoding, setGeocoding] = useState(false);
  const set = (field, value) => onChange({ ...data, [field]: value });

  const position =
    data.lat && data.lng
      ? [Number(data.lat), Number(data.lng)]
      : null;

  const handlePositionChange = useCallback(
    async (lat, lng) => {
      setGeocoding(true);
      try {
        const addr = await reverseGeocode(lat, lng);
        if (addr) {
          onChange({
            ...data,
            lat: String(lat),
            lng: String(lng),
            street: addr.house_number
              ? `${addr.house_number} ${pick([addr.road, addr.pedestrian, addr.street, ""])}`
              : pick([addr.road, addr.pedestrian, addr.street, data.street]),
            city: pick([addr.city, addr.town, addr.village, addr.municipality, addr.county, data.city]),
            province: pick([addr.state, addr.province, data.province]),
            zip_code: pick([addr.postcode, data.zip_code]),
            country: pick([addr.country, data.country]),
          });
        } else {
          onChange({ ...data, lat: String(lat), lng: String(lng) });
        }
      } finally {
        setGeocoding(false);
      }
    },
    [data, onChange]
  );

  return (
    <div>
      <div className="builder-panel-head">
        <h2>Where's your place located?</h2>
        <p>Your exact address is only shared with guests after a confirmed booking.</p>
      </div>

      <div className="builder-field-grid">
        <div className="form-group">
          <label className="form-label" htmlFor="street">
            Street address
          </label>
          <input
            id="street"
            type="text"
            className={`form-input form-input-no-icon ${errors.street ? "has-error" : ""}`}
            placeholder="House no., street, barangay"
            value={data.street}
            onChange={(e) => set("street", e.target.value)}
          />
          {errors.street && (
            <span className="field-error" role="alert">
              <IconAlertCircle width={14} height={14} /> {errors.street}
            </span>
          )}
        </div>

        <div className="builder-field-grid cols-3">
          <div className="form-group">
            <label className="form-label" htmlFor="city">
              City
            </label>
            <input
              id="city"
              type="text"
              className={`form-input form-input-no-icon ${errors.city ? "has-error" : ""}`}
              placeholder="e.g. Tagaytay"
              value={data.city}
              onChange={(e) => set("city", e.target.value)}
            />
            {errors.city && (
              <span className="field-error" role="alert">
                <IconAlertCircle width={14} height={14} /> {errors.city}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="province">
              Province
            </label>
            <input
              id="province"
              type="text"
              className={`form-input form-input-no-icon ${errors.province ? "has-error" : ""}`}
              placeholder="e.g. Cavite"
              value={data.province}
              onChange={(e) => set("province", e.target.value)}
            />
            {errors.province && (
              <span className="field-error" role="alert">
                <IconAlertCircle width={14} height={14} /> {errors.province}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="zip">
              ZIP code
            </label>
            <input
              id="zip"
              type="text"
              className={`form-input form-input-no-icon ${errors.zip_code ? "has-error" : ""}`}
              placeholder="e.g. 4120"
              value={data.zip_code}
              onChange={(e) => set("zip_code", e.target.value)}
            />
            {errors.zip_code && (
              <span className="field-error" role="alert">
                <IconAlertCircle width={14} height={14} /> {errors.zip_code}
              </span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="country">
            Country
          </label>
          <input id="country" type="text" className="form-input form-input-no-icon" value={data.country} readOnly />
        </div>

        <div>
          <label className="form-label">Pin your exact location</label>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginLeft: "var(--space-2)" }}>
            {geocoding
              ? "Looking up address…"
              : "Click the map to drop a pin — drag to adjust"}
          </span>
          <div style={{ marginTop: "var(--space-2)", height: 320, borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
            <MapContainer
              center={position || PH_CENTER}
              zoom={position ? 13 : DEFAULT_ZOOM}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker
                position={position}
                onPositionChange={handlePositionChange}
              />
              <MapView position={position} />
            </MapContainer>
          </div>
          {position && (
            <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>
              {Number(data.lat).toFixed(6)}, {Number(data.lng).toFixed(6)}
            </div>
          )}
        </div>
      </div>
      {geocoding && (
        <div className="loading-overlay" style={{
          position: "fixed", inset: 0, background: "rgba(255,255,255,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, fontSize: "var(--text-sm)", color: "var(--color-text-secondary)",
        }}>
          Looking up address…
        </div>
      )}
    </div>
  );
}
