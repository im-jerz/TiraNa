import { useState, useMemo } from "react";
import {
  IconX,
  IconSmartphone,
  IconCheck,
  IconAlertCircle,
  IconChevronLeft,
} from "../../components/icons";
import { computeFee, MIN_WITHDRAWAL } from "../../api/wallet";

const fmt = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const STEPS = [
  { key: "amount", label: "Amount" },
  { key: "details", label: "Details" },
  { key: "review", label: "Review" },
  { key: "status", label: "Done" },
];

const PROVIDERS = [
  { key: "gcash", label: "GCash" },
  { key: "maya", label: "Maya" },
];

export default function WithdrawModal({ available, onClose, onSubmit }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [amount, setAmount] = useState("");
  const [amountErr, setAmountErr] = useState("");
  const [provider, setProvider] = useState("gcash");
  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState("");
  const [accountName, setAccountName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [result, setResult] = useState(null);

  const numericAmount = Number(amount.replace(/,/g, "")) || 0;
  const fee = useMemo(() => computeFee(numericAmount, provider), [numericAmount, provider]);
  const net = Math.max(numericAmount - fee, 0);
  const providerLabel = provider === "gcash" ? "GCash" : "Maya";

  function validateAmount() {
    if (!numericAmount || numericAmount <= 0) {
      setAmountErr("Enter an amount to withdraw.");
      return false;
    }
    if (numericAmount < MIN_WITHDRAWAL) {
      setAmountErr(`Minimum withdrawal is ${fmt(MIN_WITHDRAWAL)}.`);
      return false;
    }
    if (numericAmount > available) {
      setAmountErr("This is more than your available balance.");
      return false;
    }
    setAmountErr("");
    return true;
  }

  function goNextFromAmount() {
    if (validateAmount()) setStepIdx(1);
  }

  function validateDetails() {
    const digits = phone.replace(/\D/g, "");
    if (!digits || digits.length < 10) {
      setPhoneErr("Enter a valid phone number.");
      return false;
    }
    if (!accountName.trim()) {
      setPhoneErr("Enter the account name.");
      return false;
    }
    setPhoneErr("");
    return true;
  }

  function goNextFromDetails() {
    if (validateDetails()) setStepIdx(2);
  }

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitErr("");
    try {
      const res = await onSubmit({
        amount: numericAmount,
        method: `${providerLabel} ${phone}`,
      });
      setResult(res);
      setStepIdx(3);
    } catch (err) {
      setSubmitErr(err?.message ?? err?.response?.data?.message ?? "Couldn't submit your withdrawal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const maskedPhone = phone.replace(/\D/g, "").replace(/(\d{4})$/, "•••$1");

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && stepIdx !== 3) onClose(); }}>
      <div className="wlt-slip" role="dialog" aria-modal="true" aria-labelledby="withdraw-slip-title">

        <div className="wlt-slip-rail" aria-hidden="true">
          <div className="wlt-slip-rail-brand">Withdrawal Slip</div>
          {STEPS.map((s, i) => (
            <div key={s.key} className={`wlt-slip-rail-step${i === stepIdx ? " active" : ""}${i < stepIdx ? " done" : ""}`}>
              <span className="wlt-slip-rail-num">{i < stepIdx ? <IconCheck width={12} height={12} /> : i + 1}</span>
              <span className="wlt-slip-rail-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="wlt-slip-body">
          <div className="wlt-slip-head">
            <div className="wlt-slip-dots">
              {STEPS.map((s, i) => (
                <span key={s.key} className={`wlt-slip-dot${i === stepIdx ? " active" : ""}${i < stepIdx ? " done" : ""}`} />
              ))}
            </div>
            <h3 id="withdraw-slip-title">
              {stepIdx === 0 && "Enter amount"}
              {stepIdx === 1 && "Payout details"}
              {stepIdx === 2 && "Review & confirm"}
              {stepIdx === 3 && "Request submitted"}
            </h3>
            {stepIdx !== 3 && (
              <button type="button" className="wlt-slip-close" onClick={onClose} aria-label="Close">
                <IconX width={18} height={18} />
              </button>
            )}
          </div>

          {/* ── Step 1: Amount ── */}
          {stepIdx === 0 && (
            <div className="wlt-slip-step">
              <div className="wlt-slip-avail">
                <span>Available balance</span>
                <strong>{fmt(available)}</strong>
              </div>
              <label className="wlt-slip-field">
                <span>Amount to withdraw</span>
                <div className={`wlt-amount-input${amountErr ? " error" : ""}`}>
                  <span className="wlt-amount-peso">₱</span>
                  <input
                    inputMode="decimal"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value.replace(/[^\d.]/g, "")); setAmountErr(""); }}
                    autoFocus
                  />
                </div>
                {amountErr && <span className="wlt-field-error" role="alert"><IconAlertCircle width={13} height={13} /> {amountErr}</span>}
              </label>
              <p className="wlt-slip-hint">Minimum withdrawal is {fmt(MIN_WITHDRAWAL)}.</p>
              <div className="wlt-quick-amounts">
                {[0.25, 0.5, 1].map((frac) => {
                  const val = Math.floor((available * frac) / 100) * 100;
                  if (val < MIN_WITHDRAWAL) return null;
                  return (
                    <button key={frac} type="button" onClick={() => { setAmount(String(val)); setAmountErr(""); }}>
                      {frac === 1 ? "All available" : `${fmt(val)}`}
                    </button>
                  );
                })}
              </div>
              <div className="wlt-slip-actions">
                <button type="button" className="btn-inline btn-secondary" onClick={onClose}>Cancel</button>
                <button type="button" className="btn-inline btn-primary" onClick={goNextFromAmount}>Continue</button>
              </div>
            </div>
          )}

          {/* ── Step 2: Payout details ── */}
          {stepIdx === 1 && (
            <div className="wlt-slip-step">
              <div className="wlt-kind-toggle" role="group" aria-label="Payout provider">
                {PROVIDERS.map((p) => (
                  <button key={p.key} type="button" className={provider === p.key ? "active" : ""} onClick={() => setProvider(p.key)}>
                    {p.label}
                  </button>
                ))}
              </div>
              <label className="wlt-slip-field">
                <span>{providerLabel} phone number</span>
                <input
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value.replace(/[^\d\s]/g, "")); setPhoneErr(""); }}
                  placeholder="09XX XXX XXXX"
                  autoFocus
                />
              </label>
              <label className="wlt-slip-field">
                <span>Account name</span>
                <input
                  value={accountName}
                  onChange={(e) => { setAccountName(e.target.value); setPhoneErr(""); }}
                  placeholder="Name on the account"
                />
              </label>
              {phoneErr && <span className="wlt-field-error" role="alert"><IconAlertCircle width={13} height={13} /> {phoneErr}</span>}
              <div className="wlt-slip-actions">
                <button type="button" className="btn-inline btn-secondary" onClick={() => setStepIdx(0)}>
                  <IconChevronLeft width={15} height={15} /> Back
                </button>
                <button type="button" className="btn-inline btn-primary" onClick={goNextFromDetails}>Continue</button>
              </div>
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {stepIdx === 2 && (
            <div className="wlt-slip-step">
              <div className="wlt-review-lines">
                <div className="wlt-review-line"><span>Amount</span><strong>{fmt(numericAmount)}</strong></div>
                <div className="wlt-review-line"><span>Processing fee</span><strong>{fee > 0 ? `−${fmt(fee)}` : "Waived"}</strong></div>
                <div className="wlt-review-line total"><span>Net payout</span><strong>{fmt(net)}</strong></div>
              </div>
              <div className="wlt-review-method">
                <span className="wlt-method-icon">
                  <IconSmartphone width={18} height={18} />
                </span>
                <span className="wlt-method-text">
                  <strong>{providerLabel}</strong>
                  <span>{maskedPhone} — {accountName}</span>
                </span>
              </div>
              <p className="wlt-slip-hint">Processing time is 1–3 business days. You'll get a notification once it's done.</p>
              {submitErr && <span className="wlt-field-error" role="alert"><IconAlertCircle width={13} height={13} /> {submitErr}</span>}
              <div className="wlt-slip-actions">
                <button type="button" className="btn-inline btn-secondary" onClick={() => setStepIdx(1)} disabled={submitting}>
                  <IconChevronLeft width={15} height={15} /> Back
                </button>
                <button type="button" className="btn-inline btn-primary" onClick={handleConfirm} disabled={submitting} aria-busy={submitting}>
                  {submitting ? "Submitting…" : "Confirm withdrawal"}
                </button>
              </div>
            </div>
          )}

          {/* ── Step 4: Status ── */}
          {stepIdx === 3 && result && (
            <div className="wlt-slip-step wlt-slip-done">
              <div className="wlt-done-badge"><IconCheck width={22} height={22} /></div>
              <p className="wlt-done-title">Withdrawal request submitted.</p>
              <p className="wlt-slip-hint" style={{ textAlign: "center" }}>
                {fmt(net)} is on its way to {providerLabel}.
                Processing usually takes 1–3 business days — we'll notify you when it's done.
              </p>
              <button type="button" className="btn-inline btn-primary" style={{ width: "100%" }} onClick={onClose}>Back to wallet</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
