import { useState, useEffect, useCallback } from "react";
import { getHostIdentity } from "../../lib/hostIdentity";
import "../../styles/support.css";

const ADMIN_API = "";

const CATEGORIES = [
  { value: "general", label: "General Inquiry" },
  { value: "booking", label: "Booking Issue" },
  { value: "payment", label: "Payment Problem" },
  { value: "account", label: "Account Help" },
  { value: "property", label: "Property Issue" },
  { value: "refund", label: "Refund Request" },
  { value: "other", label: "Other" },
];

const PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
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

  return (
    <div className="sup-page">
      <div>
        <h1 className="sup-card-title" style={{ fontSize: "var(--text-2xl)" }}>Support Center</h1>
        <p className="sup-label" style={{ fontWeight: 400, color: "var(--color-text-secondary)" }}>
          Submit a ticket or check the status of an existing one.
        </p>
      </div>

      <div className="sup-tabs">
        <button
          className={`sup-tab${mode === "form" ? " active" : ""}`}
          onClick={() => { setMode("form"); setError(""); setSuccess(""); }}
        >
          Submit a Ticket
        </button>
        <button
          className={`sup-tab${mode === "lookup" ? " active" : ""}`}
          onClick={() => { setMode("lookup"); setError(""); setSuccess(""); }}
        >
          Check Status
        </button>
      </div>

      {error && <div className="sup-alert sup-alert-error">{error}</div>}
      {success && <div className="sup-alert sup-alert-success">{success}</div>}

      {mode === "form" && (
        <div className="sup-card">
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

            <div className="sup-form-row">
              <div className="sup-field">
                <label className="sup-label">Category</label>
                <select
                  className="sup-select"
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="sup-field">
                <label className="sup-label">Priority</label>
                <select
                  className="sup-select"
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
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
              <button
                type="submit"
                className="sup-btn sup-btn-accent"
                disabled={submitting}
              >
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
            <div className="sup-list">
              {tickets.map((ticket) => (
                <div key={ticket.id}>
                  <div
                    className="sup-list-item"
                    onClick={() => setSelected(selected?.id === ticket.id ? null : ticket)}
                  >
                    <div className="sup-list-item-main">
                      <div className="sup-list-item-id">#{ticket.id}</div>
                      <div className="sup-list-item-title">{ticket.subject}</div>
                      <div className="sup-list-item-meta">
                        {formatDate(ticket.created_at)} · {CATEGORIES.find((c) => c.value === ticket.category)?.label || ticket.category}
                      </div>
                    </div>
                    <div className="sup-list-item-badges">
                      <span className={`sup-badge sup-badge-${ticket.priority}`}>{ticket.priority}</span>
                      <span className={`sup-badge sup-badge-${ticket.status}`}>{ticket.status}</span>
                    </div>
                  </div>

                  {selected?.id === ticket.id && (
                    <div className="sup-detail">
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
                      <div className="sup-list-item-meta">
                        Last updated: {formatDate(ticket.updated_at)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {tickets.length === 0 && !loading && lookupEmail && !error && (
            <div className="sup-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="sup-empty-text">No tickets found for this email address.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
