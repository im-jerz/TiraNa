import { useEffect, useState } from "react";
import {
  IconX,
  IconReceipt,
  IconSmartphone,
  IconMoney,
  IconCheck,
  IconAlertCircle,
  IconUser,
} from "../../components/icons";
import { getRefundReceipt, sendRefund } from "../../api/refund";

const fmt = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const dateFmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function RefundFlowModal({ bookingId, propertyIds, propertyTitle, onClose, onCompleted }) {
  const [phase, setPhase] = useState("loading"); // loading | receipt | processing | success | error
  const [receipt, setReceipt] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    getRefundReceipt(bookingId, propertyIds)
      .then((data) => {
        if (cancelled) return;
        setReceipt(data);
        setPhase("receipt");
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(
          err?.response?.data?.error || err?.message || "Couldn't load this refund. Please try again."
        );
        setPhase("error");
      });
    return () => { cancelled = true; };
  }, [bookingId, propertyIds]);

  async function handleSend(forceManual = false) {
    setPhase("processing");
    try {
      const res = await sendRefund(bookingId, propertyIds, { forceManual });
      setResult(res);
      setPhase("success");
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.error || err?.message || "The refund couldn't be processed. Please try again."
      );
      setPhase("error");
    }
  }

  function handleDone() {
    onCompleted?.();
    onClose();
  }

  const isOnline = receipt?.payment_method === "online";
  const needsManualFallback = isOnline && !receipt?.can_auto_refund;

  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && phase !== "processing") onClose();
      }}
    >
      <div className="wlt-refund-card" role="dialog" aria-modal="true" aria-labelledby="refund-title">
        <div className="wlt-slip-head">
          <h3 id="refund-title">
            {phase === "loading" && "Loading refund…"}
            {phase === "receipt" && "Refund Receipt"}
            {phase === "processing" && "Processing refund"}
            {phase === "success" && "Refund Successful"}
            {phase === "error" && "Refund"}
          </h3>
          {phase !== "processing" && (
            <button type="button" className="wlt-slip-close" onClick={onClose} aria-label="Close">
              <IconX width={18} height={18} />
            </button>
          )}
        </div>

        {phase === "loading" && (
          <div className="wlt-refund-loading">
            <span className="wlt-refund-spinner" />
            <p>Fetching booking and payment details…</p>
          </div>
        )}

        {phase === "error" && (
          <div className="wlt-refund-loading">
            <IconAlertCircle width={26} height={26} />
            <p>{errorMsg}</p>
            <button type="button" className="btn-inline btn-secondary" onClick={onClose}>
              Back to wallet
            </button>
          </div>
        )}

        {phase === "receipt" && receipt && (
          <div className="wlt-receipt">
            <div className="wlt-receipt-icon"><IconReceipt width={20} height={20} /></div>
            <p className="wlt-receipt-note">
              This is a preview only — nothing has been sent yet. Review the details, then send the refund
              below.
            </p>

            <div className="wlt-receipt-body">
              <div className="wlt-receipt-row">
                <span className="wlt-receipt-label"><IconUser width={14} height={14} /> Guest</span>
                <span className="wlt-receipt-value">{receipt.guest_name}</span>
              </div>
              <div className="wlt-receipt-row">
                <span className="wlt-receipt-label">Property</span>
                <span className="wlt-receipt-value">{propertyTitle || `Property #${receipt.property_id}`}</span>
              </div>
              <div className="wlt-receipt-row">
                <span className="wlt-receipt-label">Stay dates</span>
                <span className="wlt-receipt-value">{dateFmt(receipt.check_in)} – {dateFmt(receipt.check_out)}</span>
              </div>
              <div className="wlt-receipt-row">
                <span className="wlt-receipt-label">Booking #</span>
                <span className="wlt-receipt-value">{receipt.booking_id}</span>
              </div>
              <div className="wlt-receipt-row">
                <span className="wlt-receipt-label">Paid via</span>
                <span className="wlt-receipt-value">
                  <span className="wlt-receipt-method">
                    {isOnline ? <IconSmartphone width={13} height={13} /> : <IconMoney width={13} height={13} />}
                    {isOnline ? "Online payment" : "Cash"}
                  </span>
                </span>
              </div>
            </div>

            <div className="wlt-receipt-total">
              <span>Amount to refund</span>
              <strong>{fmt(receipt.amount)}</strong>
            </div>

            {!isOnline && (
              <p className="wlt-slip-hint">
                This was a cash booking — there's no online payment to reverse. Sending this will mark the
                refund as completed manually; make sure you've returned the guest's payment outside the app.
              </p>
            )}

            <div className="wlt-slip-actions">
              <button type="button" className="btn-inline btn-secondary" onClick={onClose}>Cancel</button>
              {needsManualFallback ? (
                <button
                  type="button"
                  className="btn-inline btn-primary"
                  onClick={() => handleSend(true)}
                >
                  Mark Refund as Completed
                </button>
              ) : (
                <button type="button" className="btn-inline btn-primary" onClick={() => handleSend(false)}>
                  {isOnline ? "Send Refund" : "Mark Refund as Completed"}
                </button>
              )}
            </div>
          </div>
        )}

        {phase === "processing" && (
          <div className="wlt-refund-loading">
            <span className="wlt-refund-spinner" />
            <p>{isOnline && !needsManualFallback ? "Sending this refund through PayMongo…" : "Completing this refund…"}</p>
          </div>
        )}

        {phase === "success" && receipt && (
          <div className="wlt-refund-success">
            <div className="wlt-done-badge"><IconCheck width={22} height={22} /></div>
            <p className="wlt-done-title">Refund successful</p>
            <p className="wlt-slip-hint" style={{ textAlign: "center" }}>
              {fmt(receipt.amount)} has been refunded to {receipt.guest_name}
              {result?.refund?.id ? ` — reference ${result.refund.id}.` : "."}
            </p>
            <button type="button" className="btn-inline btn-primary" style={{ width: "100%" }} onClick={handleDone}>
              Back to wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}