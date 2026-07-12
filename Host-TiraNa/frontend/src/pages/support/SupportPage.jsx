import { useState, useEffect, useCallback, useMemo } from "react";
import { getHostIdentity } from "../../lib/hostIdentity";
import {
  IconMessage,
  IconCalendarCheck,
  IconMoney,
  IconUser,
  IconBuilding,
  IconReceipt,
  IconInfo,
  IconEdit,
  IconSearch,
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconBookOpen,
} from "../../components/icons.jsx";
import {
  DeskMark,
  RailCategoryPicker,
  RailStatusLegend,
  AsideCard,
  MiniStats,
  EmptyLedger,
} from "../../components/support/SupportUI.jsx";
import "../../styles/support.css";

const ADMIN_API = "";

const CATEGORIES = [
  { value: "general", label: "General Inquiry", icon: IconMessage },
  { value: "booking", label: "Booking Issue", icon: IconCalendarCheck },
  { value: "payment", label: "Payment Problem", icon: IconMoney },
  { value: "account", label: "Account Help", icon: IconUser },
  { value: "property", label: "Property Issue", icon: IconBuilding },
  { value: "refund", label: "Refund Request", icon: IconReceipt },
  { value: "other", label: "Other", icon: IconInfo },
];

const PRIORITIES = [
  { value: "low", label: "Low", eta: "48h" },
  { value: "medium", label: "Medium", eta: "24h" },
  { value: "high", label: "High", eta: "8h" },
  { value: "urgent", label: "Urgent", eta: "2h" },
];

const STATUS_LEGEND = [
  { value: "open", label: "Open", desc: "Received, awaiting review." },
  { value: "in-progress", label: "In Progress", desc: "A host-ops agent is on it." },
  { value: "resolved", label: "Resolved", desc: "Fixed — see the resolution note." },
  { value: "closed", label: "Closed", desc: "Ticket archived." },
];

function formatDate(str) {
  if (!str) return "—";
  return new Date(str).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SupportPage() {
  const host = getHostIdentity();
  const [mode, setMode] = useState("form");
  const [form, setForm] = useState({
    subject: "",
    description: "",
    category: "general",
    priority: "medium",
    requester_name: "",
    requester_email: "",
  });
  const [lookupEmail, setLookupEmail] = useState("");
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (host) {
      setForm((prev) => ({
        ...prev,
        requester_name: host.full_name || "",
        requester_email: host.email || "",
      }));
      setLookupEmail(host.email || "");
    }
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`${ADMIN_API}/admin/support/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to submit ticket");
      }
      const ticket = await res.json();
      setSuccess(`Ticket #${ticket.id} submitted successfully! Our team will review it shortly.`);
      setForm((prev) => ({
        ...prev,
        subject: "",
        description: "",
        category: "general",
        priority: "medium",
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchTickets = useCallback(async () => {
    if (!lookupEmail.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${ADMIN_API}/admin/support/my-tickets?email=${encodeURIComponent(lookupEmail)}`);
      if (!res.ok) throw new Error("Failed to fetch tickets");
      const data = await res.json();
      setTickets(data);
      setSelected(null);
      if (data.length === 0) setError("No tickets found for this email address.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lookupEmail]);

  const stats = useMemo(() => {
    const active = tickets.filter((t) => t.status === "open" || t.status === "in-progress").length;
    const resolved = tickets.filter((t) => t.status === "resolved" || t.status === "closed").length;
    return [
      { label: "Total", value: tickets.length, color: "var(--color-primary)" },
      { label: "Active", value: active, color: "#2563EB" },
      { label: "Resolved", value: resolved, color: "#16A34A" },
    ];
  }, [tickets]);

  return (
    <div className="desk">
      <DeskMark />

      <header className="desk-header">
        <span className="desk-kicker">Host Operations · Support</span>
        <h1 className="desk-title">Support Desk</h1>
        <p className="desk-subtitle">
          Log an issue with a booking, payout, or listing — or trace the status of something you've already filed.
        </p>

        <div className="desk-tabs" role="tablist" aria-label="Support view">
          <button
            role="tab"
            aria-selected={mode === "form"}
            className={`desk-tab${mode === "form" ? " active" : ""}`}
            onClick={() => switchMode("form")}
          >
            <IconEdit /> Submit a Ticket
          </button>
          <button
            role="tab"
            aria-selected={mode === "lookup"}
            className={`desk-tab${mode === "lookup" ? " active" : ""}`}
            onClick={() => switchMode("lookup")}
          >
            <IconSearch /> Check Status
          </button>
        </div>
      </header>

      {error && (
        <div className="sup-alert sup-alert-error">
          <IconAlertTriangle />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="sup-alert sup-alert-success">
          <IconCheck />
          <span>{success}</span>
        </div>
      )}

      <div className="desk-body">
        {mode === "form" ? (
          <RailCategoryPicker
            items={CATEGORIES}
            value={form.category}
            onChange={(value) => setForm((prev) => ({ ...prev, category: value }))}
          />
        ) : (
          <RailStatusLegend statuses={STATUS_LEGEND} />
        )}

        <div className="desk-main">
          {mode === "form" && (
            <div className="sup-card">
              <div className="sup-card-title">Ticket Details</div>
              <form className="sup-form" onSubmit={handleSubmit}>
                <div className="sup-form-row">
                  <div className="sup-field">
                    <label className="sup-label">Your Name</label>
                    <input
                      className="sup-input"
                      type="text"
                      name="requester_name"
                      value={form.requester_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="sup-field">
                    <label className="sup-label">Your Email</label>
                    <input
                      className="sup-input"
                      type="email"
                      name="requester_email"
                      value={form.requester_email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="sup-field">
                  <label className="sup-label">Subject</label>
                  <input
                    className="sup-input"
                    type="text"
                    name="subject"
                    value={form.subject}
                    onChange={handleChange}
                    required
                    placeholder="Brief summary of your issue"
                  />
                </div>

                <div className="sup-field">
                  <label className="sup-label">Priority</label>
                  <div className="priority-pills">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        className={`priority-pill pill-${p.value}${form.priority === p.value ? " active" : ""}`}
                        onClick={() => setForm((prev) => ({ ...prev, priority: p.value }))}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="sup-field">
                  <label className="sup-label">Description</label>
                  <textarea
                    className="sup-textarea"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    required
                    rows={5}
                    placeholder="Provide as much detail as possible about your issue..."
                  />
                </div>

                <div className="sup-btn-row">
                  <button type="submit" className="sup-btn sup-btn-accent" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit Ticket"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {mode === "lookup" && (
            <>
              <div className="sup-card">
                <div className="sup-card-title">Check Your Ticket Status</div>
                <div className="sup-lookup">
                  <input
                    className="sup-input"
                    type="email"
                    value={lookupEmail}
                    onChange={(e) => setLookupEmail(e.target.value)}
                    placeholder="Enter your email address"
                    onKeyDown={(e) => e.key === "Enter" && fetchTickets()}
                  />
                  <button
                    className="sup-btn sup-btn-primary"
                    onClick={fetchTickets}
                    disabled={loading || !lookupEmail.trim()}
                  >
                    {loading ? "Searching..." : "Search"}
                  </button>
                </div>
              </div>

              {tickets.length > 0 && (
                <div className="ledger">
                  {tickets.map((ticket) => {
                    const expanded = selected?.id === ticket.id;
                    return (
                      <div key={ticket.id}>
                        <div
                          className="ledger-row"
                          role="button"
                          tabIndex={0}
                          aria-expanded={expanded}
                          onClick={() => setSelected(expanded ? null : ticket)}
                          onKeyDown={(e) => e.key === "Enter" && setSelected(expanded ? null : ticket)}
                        >
                          <span className="ledger-index">#{ticket.id}</span>
                          <span className="ledger-main">
                            <span className="ledger-title">{ticket.subject}</span>
                            <span className="ledger-meta">
                              {formatDate(ticket.created_at)}
                              <span className="ledger-tag">
                                {CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category}
                              </span>
                            </span>
                          </span>
                          <span className="ledger-badges">
                            <span className={`sup-badge sup-badge-${ticket.priority}`}>{ticket.priority}</span>
                            <span className={`sup-badge sup-badge-${ticket.status}`}>{ticket.status}</span>
                          </span>
                          <span className="ledger-chevron"><IconChevronDown /></span>
                        </div>

                        {expanded && (
                          <div className="ledger-detail">
                            <div className="sup-detail-grid">
                              <div className="sup-detail-field sup-detail-full">
                                <span className="sup-detail-label">Description</span>
                                <span className="sup-detail-value" style={{ whiteSpace: "pre-wrap" }}>
                                  {ticket.description}
                                </span>
                              </div>
                              {ticket.assigned_to && (
                                <div className="sup-detail-field">
                                  <span className="sup-detail-label">Assigned To</span>
                                  <span className="sup-detail-value">{ticket.assigned_to}</span>
                                </div>
                              )}
                              {ticket.resolution && (
                                <div className="sup-detail-field sup-detail-full">
                                  <span className="sup-detail-label">Resolution</span>
                                  <span className="sup-detail-value" style={{ whiteSpace: "pre-wrap" }}>
                                    {ticket.resolution}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="ledger-detail-meta">Last updated: {formatDate(ticket.updated_at)}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {tickets.length === 0 && !loading && lookupEmail && !error && (
                <EmptyLedger icon={IconBookOpen} text="No tickets found for this email address." />
              )}
            </>
          )}
        </div>

        <div className="desk-aside-slot">
          {mode === "form" ? (
            <AsideCard title="Response Times">
              <div className="aside-list">
                {PRIORITIES.map((p) => (
                  <div className="aside-row" key={p.value}>
                    <span className={`sup-badge sup-badge-${p.value}`}>{p.label}</span>
                    <span className="aside-row-copy">first reply in ~{p.eta}</span>
                  </div>
                ))}
              </div>
              <p className="aside-note">Business hours are 8:00 AM – 8:00 PM PHT, Monday to Saturday.</p>
            </AsideCard>
          ) : (
            <AsideCard title="Your Tickets">
              {tickets.length > 0 ? (
                <MiniStats items={stats} />
              ) : (
                <p className="aside-note">
                  Enter your email above to pull up every ticket you've filed with the Support Desk.
                </p>
              )}
            </AsideCard>
          )}
        </div>
      </div>
    </div>
  );
}