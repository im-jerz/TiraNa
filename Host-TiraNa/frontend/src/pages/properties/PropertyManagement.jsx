import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { IconPlus, IconChevronDown } from "../../components/icons";
import PropertyCard from "../../components/property/PropertyCard";
import SkeletonGrid from "../../components/property/SkeletonGrid";
import EmptyState from "../../components/property/EmptyState";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../components/common/Toast";
import usePropertiesData from "./usePropertiesData";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "suspended", label: "Suspended" },
];

const SORTS = [
  { key: "recent", label: "Recently added" },
  { key: "price_high", label: "Price: high to low" },
  { key: "price_low", label: "Price: low to high" },
  { key: "rating", label: "Highest rated" },
  { key: "bookings", label: "Most upcoming bookings" },
];

export default function PropertyManagement() {
  const { properties, loading, error, toggleStatus, removeProperty } = usePropertiesData();
  const { push } = useToast();

  const [activeFilter, setActiveFilter] = useState("all");
  const [sortKey, setSortKey] = useState("recent");
  const [pendingAction, setPendingAction] = useState(null); // { type: 'toggle'|'delete', property }
  const [busy, setBusy] = useState(false);

  const counts = useMemo(() => {
    const c = { all: properties.length };
    for (const p of properties) c[p.status] = (c[p.status] || 0) + 1;
    return c;
  }, [properties]);

  const visible = useMemo(() => {
    let list = properties;
    if (activeFilter !== "all") list = list.filter((p) => p.status === activeFilter);

    const sorted = [...list];
    switch (sortKey) {
      case "price_high":
        sorted.sort((a, b) => b.base_price - a.base_price);
        break;
      case "price_low":
        sorted.sort((a, b) => a.base_price - b.base_price);
        break;
      case "rating":
        sorted.sort((a, b) => (b.rating_avg || 0) - (a.rating_avg || 0));
        break;
      case "bookings":
        sorted.sort((a, b) => b.upcoming_bookings - a.upcoming_bookings);
        break;
      default:
        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return sorted;
  }, [properties, activeFilter, sortKey]);

  function handleToggleRequest(property) {
    setPendingAction({ type: "toggle", property });
  }

  function handleDeleteRequest(property) {
    setPendingAction({ type: "delete", property });
  }

  async function handleConfirm() {
    if (!pendingAction) return;
    setBusy(true);
    try {
      if (pendingAction.type === "toggle") {
        const next = await toggleStatus(pendingAction.property);
        push(
          next === "active"
            ? `${pendingAction.property.title} is now visible to guests.`
            : `${pendingAction.property.title} has been deactivated.`,
          "success"
        );
      } else {
        await removeProperty(pendingAction.property);
        push(`${pendingAction.property.title} was removed from your portfolio.`, "success");
      }
      setPendingAction(null);
    } catch (err) {
      push(err.message || "Something went wrong. Please try again.", "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div className="page-head-text">
          <h1>Property Management</h1>
          <p>Manage your listings, pricing, and availability in one place.</p>
        </div>
        <Link to="/dashboard/properties/new" className="btn-inline btn-primary">
          <IconPlus /> Add property
        </Link>
      </div>

      <div className="toolbar-row">
        <div className="filter-tabs" role="tablist" aria-label="Filter properties by status">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={activeFilter === f.key}
              className={`filter-tab ${activeFilter === f.key ? "active" : ""}`}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
              {counts[f.key] ? <span className="filter-tab-count">{counts[f.key]}</span> : null}
            </button>
          ))}
        </div>

        {properties.length > 0 && (
          <div className="sort-select-wrap">
            <select
              className="sort-select"
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value)}
              aria-label="Sort properties"
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  Sort: {s.label}
                </option>
              ))}
            </select>
            <IconChevronDown width={16} height={16} />
          </div>
        )}
      </div>

      {loading ? (
        <SkeletonGrid count={6} />
      ) : error ? (
        <div className="empty-state">
          <h3>Couldn't load your properties</h3>
          <p>{error}</p>
        </div>
      ) : properties.length === 0 ? (
        <EmptyState />
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <h3>No properties match this filter</h3>
          <p>Try a different status tab to see the rest of your portfolio.</p>
        </div>
      ) : (
        <div className="property-grid">
          {visible.map((p) => (
            <PropertyCard
              key={p.property_id}
              property={p}
              onToggleStatus={handleToggleRequest}
              onDelete={handleDeleteRequest}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!pendingAction}
        tone={pendingAction?.type === "delete" ? "danger" : "warn"}
        title={
          pendingAction?.type === "delete"
            ? `Delete "${pendingAction.property.title}"?`
            : pendingAction?.property.status === "active"
            ? `Deactivate "${pendingAction.property.title}"?`
            : `Activate "${pendingAction?.property.title}"?`
        }
        description={
          pendingAction?.type === "delete"
            ? "This removes the listing permanently. Guests with existing bookings will still be honored — cancel those first if needed."
            : pendingAction?.property.status === "active"
            ? "Guests won't be able to find or book this property while it's deactivated. You can reactivate it anytime."
            : "This property will become visible and bookable by guests again."
        }
        notice={
          pendingAction?.property.upcoming_bookings > 0
            ? `Heads up: this property has ${pendingAction.property.upcoming_bookings} upcoming booking${pendingAction.property.upcoming_bookings > 1 ? "s" : ""}.`
            : null
        }
        confirmLabel={pendingAction?.type === "delete" ? "Delete listing" : "Yes, continue"}
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  );
}
