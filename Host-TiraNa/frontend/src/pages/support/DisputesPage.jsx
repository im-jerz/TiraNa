import { useState, useEffect, useCallback } from "react";
import { getHostIdentity } from "../../lib/hostIdentity";
import "../../styles/support.css";

const ADMIN_API = "";

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

export default function DisputesPage() {
  const host = getHostIdentity();
  const [mode, setMode] = useState("form");
  const [form, setForm] = useState({
    filed_by: "",
    filed_by_email: "",
    booking_external_id: "",
    reason: "",
    evidence: "",
  });
  const [lookupEmail, setLookupEmail] = useState("");
  const [disputes, setDisputes] = useState([]);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (host) {
      setForm((prev) => ({
        ...prev,
        filed_by: host.full_name || "",
        filed_by_email: host.email || "",
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
      const body = { ...form };
      if (!body.booking_external_id) delete body.booking_external_id;
      if (!body.evidence) delete body.evidence;
      const res = await fetch(`${ADMIN_API}/admin/disputes/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to submit dispute");
      }
      const dispute = await res.json();
      setSuccess(`Dispute #${dispute.id} submitted successfully! Our team will review it.`);
      setForm((prev) => ({
        ...prev,
        booking_external_id: "",
        reason: "",
        evidence: "",
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const fetchDisputes = useCallback(async () => {
    if (!lookupEmail.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${ADMIN_API}/admin/disputes/my-disputes?email=${encodeURIComponent(lookupEmail)}`);
      if (!res.ok) throw new Error("Failed to fetch disputes");
      const data = await res.json();
      setDisputes(data);
      setSelected(null);
      if (data.length === 0) setError("No disputes found for this email address.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lookupEmail]);

  return (
    <div className="sup-page">
      <div>
        <h1 className="sup-card-title" style={{ fontSize: "var(--text-2xl)" }}>Disputes</h1>
        <p className="sup-label" style={{ fontWeight: 400, color: "var(--color-text-secondary)" }}>
          File a dispute for a booking issue or check the status of an existing one.
        </p>
      </div>

      <div className="sup-tabs">
        <button
          className={`sup-tab${mode === "form" ? " active" : ""}`}
          onClick={() => { setMode("form"); setError(""); setSuccess(""); }}
        >
          File a Dispute
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
                  name="filed_by"
                  value={form.filed_by}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="sup-field">
                <label className="sup-label">Your Email</label>
                <input
                  className="sup-input"
                  type="email"
                  name="filed_by_email"
                  value={form.filed_by_email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="sup-field">
              <label className="sup-label">Booking Reference (optional)</label>
              <input
                className="sup-input"
                type="text"
                name="booking_external_id"
                value={form.booking_external_id}
                onChange={handleChange}
                placeholder="e.g. BK-12345"
              />
            </div>

            <div className="sup-field">
              <label className="sup-label">Reason for Dispute</label>
              <textarea
                className="sup-textarea"
                name="reason"
                value={form.reason}
                onChange={handleChange}
                required
                rows={5}
                placeholder="Explain why you are filing this dispute. Include relevant details such as dates, booking ID, and what went wrong..."
              />
            </div>

            <div className="sup-field">
              <label className="sup-label">Evidence (optional)</label>
              <input
                className="sup-input"
                type="text"
                name="evidence"
                value={form.evidence}
                onChange={handleChange}
                placeholder="URL to screenshots or supporting documents"
              />
            </div>

            <div className="sup-btn-row">
              <button
                type="submit"
                className="sup-btn sup-btn-accent"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Dispute"}
              </button>
            </div>
          </form>
        </div>
      )}

      {mode === "lookup" && (
        <>
          <div className="sup-card">
            <div className="sup-card-title">Check Your Dispute Status</div>
            <div className="sup-lookup">
              <input
                className="sup-input"
                type="email"
                value={lookupEmail}
                onChange={(e) => setLookupEmail(e.target.value)}
                placeholder="Enter your email address"
                onKeyDown={(e) => e.key === "Enter" && fetchDisputes()}
              />
              <button
                className="sup-btn sup-btn-primary"
                onClick={fetchDisputes}
                disabled={loading || !lookupEmail.trim()}
              >
                {loading ? "Searching..." : "Search"}
              </button>
            </div>
          </div>

          {disputes.length > 0 && (
            <div className="sup-list">
              {disputes.map((dispute) => (
                <div key={dispute.id}>
                  <div
                    className="sup-list-item"
                    onClick={() => setSelected(selected?.id === dispute.id ? null : dispute)}
                  >
                    <div className="sup-list-item-main">
                      <div className="sup-list-item-id">
                        #{dispute.id}
                        {dispute.booking_external_id && (
                          <span style={{ marginLeft: 8, background: "var(--color-surface-alt)", padding: "1px 6px", borderRadius: 4, fontSize: 11 }}>
                            {dispute.booking_external_id}
                          </span>
                        )}
                      </div>
                      <div className="sup-list-item-title" style={{ whiteSpace: "normal" }}>
                        {dispute.reason.length > 120 ? dispute.reason.slice(0, 120) + "..." : dispute.reason}
                      </div>
                      <div className="sup-list-item-meta">{formatDate(dispute.created_at)}</div>
                    </div>
                    <div className="sup-list-item-badges">
                      <span className={`sup-badge sup-badge-${dispute.status}`}>{dispute.status}</span>
                    </div>
                  </div>

                  {selected?.id === dispute.id && (
                    <div className="sup-detail">
                      <div className="sup-detail-grid">
                        <div className="sup-detail-field sup-detail-full">
                          <span className="sup-detail-label">Reason</span>
                          <span className="sup-detail-value" style={{ whiteSpace: "pre-wrap" }}>
                            {dispute.reason}
                          </span>
                        </div>
                        {dispute.evidence && (
                          <div className="sup-detail-field sup-detail-full">
                            <span className="sup-detail-label">Evidence</span>
                            <span className="sup-detail-value" style={{ wordBreak: "break-all" }}>
                              {dispute.evidence}
                            </span>
                          </div>
                        )}
                        {dispute.resolution && (
                          <div className="sup-detail-field sup-detail-full">
                            <span className="sup-detail-label">Resolution</span>
                            <span className="sup-detail-value" style={{ whiteSpace: "pre-wrap" }}>
                              {dispute.resolution}
                            </span>
                          </div>
                        )}
                        {dispute.resolved_by && (
                          <div className="sup-detail-field">
                            <span className="sup-detail-label">Resolved By</span>
                            <span className="sup-detail-value">{dispute.resolved_by}</span>
                          </div>
                        )}
                      </div>
                      <div className="sup-list-item-meta">
                        Last updated: {formatDate(dispute.updated_at)}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {disputes.length === 0 && !loading && lookupEmail && !error && (
            <div className="sup-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="sup-empty-text">No disputes found for this email address.</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
