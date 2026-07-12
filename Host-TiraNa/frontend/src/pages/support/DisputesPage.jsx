import { useState, useEffect, useCallback, useMemo } from "react";
import { getHostIdentity } from "../../lib/hostIdentity";
import {
  IconEdit,
  IconSearch,
  IconScale,
  IconAlertTriangle,
  IconCheck,
  IconChevronDown,
  IconFolder,
} from "../../components/icons.jsx";
import {
  DeskMark,
  RailStepper,
  RailStatusLegend,
  AsideCard,
  MiniStats,
  EmptyLedger,
} from "../../components/support/SupportUI.jsx";
import "../../styles/support.css";

const ADMIN_API = "";

const FILING_STEPS = [
  { label: "File the Case", desc: "Tell us what happened and which booking it involves.", icon: IconEdit },
  { label: "Evidence Review", desc: "Our team checks your account of events against the record.", icon: IconSearch },
  { label: "Resolution", desc: "A ruling is issued and posted back to this case file.", icon: IconScale },
];

const STATUS_LEGEND = [
  { value: "open", label: "Open", desc: "Filed, awaiting review." },
  { value: "in-progress", label: "In Progress", desc: "Under active investigation." },
  { value: "resolved", label: "Resolved", desc: "Ruling issued — see the resolution note." },
  { value: "closed", label: "Closed", desc: "Case archived." },
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
  const [lastCaseId, setLastCaseId] = useState(null);

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
      setLastCaseId(dispute.id);
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

  const stats = useMemo(() => {
    const active = disputes.filter((d) => d.status === "open" || d.status === "in-progress").length;
    const resolved = disputes.filter((d) => d.status === "resolved" || d.status === "closed").length;
    return [
      { label: "Total", value: disputes.length, color: "var(--color-primary)" },
      { label: "Active", value: active, color: "#2563EB" },
      { label: "Resolved", value: resolved, color: "#16A34A" },
    ];
  }, [disputes]);

  return (
    <div className="desk">
      <DeskMark />

      <header className="desk-header">
        <span className="desk-kicker">Host Operations · Disputes</span>
        <h1 className="desk-title">Case Files</h1>
        <p className="desk-subtitle">
          File a formal dispute over a booking and we'll open a case — or check where an existing one stands.
        </p>

        <div className="desk-tabs" role="tablist" aria-label="Disputes view">
          <button
            role="tab"
            aria-selected={mode === "form"}
            className={`desk-tab${mode === "form" ? " active" : ""}`}
            onClick={() => switchMode("form")}
          >
            <IconEdit /> File a Dispute
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
          <RailStepper steps={FILING_STEPS} />
        ) : (
          <RailStatusLegend statuses={STATUS_LEGEND} />
        )}

        <div className="desk-main">
          {mode === "form" && (
            <div className="sup-card">
              <span className="case-stamp">
                <span className="case-stamp-label">Case File</span>
                <span className="case-stamp-value">{lastCaseId ? `NO. ${lastCaseId}` : "NO. —"}</span>
              </span>
              <div className="sup-card-title">Case Details</div>
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
                  <button type="submit" className="sup-btn sup-btn-accent" disabled={submitting}>
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
                <div className="ledger">
                  {disputes.map((dispute) => {
                    const expanded = selected?.id === dispute.id;
                    return (
                      <div key={dispute.id}>
                        <div
                          className="ledger-row"
                          role="button"
                          tabIndex={0}
                          aria-expanded={expanded}
                          onClick={() => setSelected(expanded ? null : dispute)}
                          onKeyDown={(e) => e.key === "Enter" && setSelected(expanded ? null : dispute)}
                        >
                          <span className="ledger-index">#{dispute.id}</span>
                          <span className="ledger-main">
                            <span className="ledger-title ledger-title-wrap">
                              {dispute.reason.length > 120 ? dispute.reason.slice(0, 120) + "..." : dispute.reason}
                            </span>
                            <span className="ledger-meta">
                              {formatDate(dispute.created_at)}
                              {dispute.booking_external_id && (
                                <span className="ledger-tag">{dispute.booking_external_id}</span>
                              )}
                            </span>
                          </span>
                          <span className="ledger-badges">
                            <span className={`sup-badge sup-badge-${dispute.status}`}>{dispute.status}</span>
                          </span>
                          <span className="ledger-chevron"><IconChevronDown /></span>
                        </div>

                        {expanded && (
                          <div className="ledger-detail">
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
                            <div className="ledger-detail-meta">Last updated: {formatDate(dispute.updated_at)}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {disputes.length === 0 && !loading && lookupEmail && !error && (
                <EmptyLedger icon={IconFolder} text="No disputes found for this email address." />
              )}
            </>
          )}
        </div>

        <div className="desk-aside-slot">
          {mode === "form" ? (
            <AsideCard title="Evidence Tips">
              <p className="aside-note">
                Cases move faster with specifics: exact dates, the booking reference, and any messages tied to the issue.
              </p>
              <div className="aside-tip">
                <IconFolder />
                <span>Link screenshots or documents via a shareable URL in the Evidence field — Google Drive and Imgur links both work.</span>
              </div>
            </AsideCard>
          ) : (
            <AsideCard title="Your Cases">
              {disputes.length > 0 ? (
                <MiniStats items={stats} />
              ) : (
                <p className="aside-note">
                  Enter your email above to pull up every case you've filed with Host Operations.
                </p>
              )}
            </AsideCard>
          )}
        </div>
      </div>
    </div>
  );
}