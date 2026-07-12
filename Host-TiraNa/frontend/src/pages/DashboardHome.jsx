import { Link } from "react-router-dom";
import { IconBuilding, IconCalendar, IconWallet, IconStar, IconPlus } from "../components/icons";
import usePropertiesData from "./properties/usePropertiesData";

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="property-card" style={{ padding: "var(--space-5)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        <span className="option-card-icon" style={{ background: "var(--color-surface-alt)" }}>
          <Icon />
        </span>
        <span style={{ fontSize: "var(--text-sm)", fontWeight: 600, color: "var(--color-text-secondary)" }}>{label}</span>
      </div>
      <div style={{ fontFamily: "var(--font-heading)", fontSize: "var(--text-2xl)", fontWeight: 800, color: "var(--color-text-primary)" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-muted)", marginTop: "var(--space-1)" }}>{sub}</div>}
    </div>
  );
}

export default function DashboardHome() {
  const { properties, loading } = usePropertiesData();
  const raw = localStorage.getItem("host");
  const host = raw ? JSON.parse(raw) : null;
  const firstName = host?.full_name?.split(" ")[0] || "Host";

  const activeCount = properties.filter((p) => p.status === "active").length;
  const upcoming = properties.reduce((sum, p) => sum + p.upcoming_bookings, 0);
  const avgRating =
    properties.filter((p) => p.rating_avg).reduce((sum, p) => sum + p.rating_avg, 0) /
    (properties.filter((p) => p.rating_avg).length || 1);

  return (
    <div>
      <div className="page-head">
        <div className="page-head-text">
          <h1>Welcome back, {firstName}</h1>
          <p>Here's how your portfolio is doing today.</p>
        </div>
        <Link to="/dashboard/properties/new" className="btn-inline btn-primary">
          <IconPlus /> Add property
        </Link>
      </div>

      <div className="builder-field-grid cols-3" style={{ marginBottom: "var(--space-6)" }}>
        <StatCard icon={IconBuilding} label="Active listings" value={loading ? "—" : activeCount} sub={`${properties.length} total properties`} />
        <StatCard icon={IconCalendar} label="Upcoming bookings" value={loading ? "—" : upcoming} sub="Across all properties" />
        <StatCard icon={IconStar} label="Average rating" value={loading ? "—" : avgRating.toFixed(2)} sub="Based on guest reviews" />
      </div>

      <div className="empty-state">
        <h3>Manage your listings</h3>
        <p>Head to Property Management to view, edit, or add new listings to your portfolio.</p>
        <Link to="/dashboard/properties" className="btn-inline btn-primary">
          <IconBuilding /> Go to Property Management
        </Link>
      </div>
    </div>
  );
}
