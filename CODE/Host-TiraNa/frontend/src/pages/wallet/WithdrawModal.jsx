import { useState, useMemo } from "react";
import {
  IconX,
  IconBank,
  IconSmartphone,
  IconCheck,
  IconAlertCircle,
  IconPlus,
  IconChevronLeft,
} from "../../components/icons";
import { computeFee, MIN_WITHDRAWAL } from "../../api/wallet";

const fmt = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const STEPS = [
  { key: "amount", label: "Amount" },
  { key: "method", label: "Payout method" },
  { key: "review", label: "Review" },
  { key: "status", label: "Done" },
];

export default function WithdrawModal({ available, methods, onClose, onSubmit, onSaveMethod }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [amount, setAmount] = useState("");
  const [amountErr, setAmountErr] = useState("");
  const [methodId, setMethodId] = useState(
    methods.find((m) => m.is_default)?.id ?? methods[0]?.id ?? ""
  );
  const [addingMethod, setAddingMethod] = useState(methods.length === 0);
  const [newKind, setNewKind] = useState("bank");
  const [newForm, setNewForm] = useState({ bank_name: "", account_number: "", account_name: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState("");
  const [result, setResult] = useState(null);
  const [localMethods, setLocalMethods] = useState(methods);

  const numericAmount = Number(amount.replace(/,/g, "")) || 0;
  const selectedMethod = localMethods.find((m) => m.id === methodId) || null;
  const fee = useMemo(
    () => (selectedMethod ? computeFee(numericAmount, selectedMethod.kind) : 0),
    [numericAmount, selectedMethod]
  );
  const net = Math.max(numericAmount - fee, 0);

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

  async function handleAddMethod() {
    const payload =
      newKind === "bank"
        ? { kind: "bank", bank_name: newForm.bank_name, account_number: newForm.account_number, account_name: newForm.account_name }
        : { kind: newKind, phone: newForm.phone, account_name: newForm.account_name };
    const saved = await onSaveMethod(payload);
    setLocalMethods((prev) => [...prev, saved]);
    setMethodId(saved.id);
    setAddingMethod(false);
    setNewForm({ bank_name: "", account_number: "", account_name: "", phone: "" });
  }

  async function handleConfirm() {
    setSubmitting(true);
    setSubmitErr("");
    try {
      const res = await onSubmit({ amount: numericAmount, methodId });
      setResult(res);
      setStepIdx(3);
    } catch (err) {
      setSubmitErr(err?.message ?? "Couldn't submit your withdrawal. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canAddMethod =
    newKind === "bank"
      ? newForm.bank_name.trim() && newForm.account_number.trim() && newForm.account_name.trim()
      : newForm.phone.trim() && newForm.account_name.trim();

  return (
    <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget && stepIdx !== 3) onClose(); }}>
      <div className="wlt-slip" role="dialog" aria-modal="true" aria-labelledby="withdraw-slip-title">

        {/* ── Ledger tab rail (desktop) / stepper dots (mobile) ── */}
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
              {stepIdx === 1 && "Select payout method"}
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

          {/* ── Step 2: Method ── */}
          {stepIdx === 1 && (
            <div className="wlt-slip-step">
              {!addingMethod ? (
                <>
                  <div className="wlt-method-list">
                    {localMethods.map((m) => (
                      <label key={m.id} className={`wlt-method-option${methodId === m.id ? " selected" : ""}`}>
                        <input type="radio" name="payout-method" checked={methodId === m.id} onChange={() => setMethodId(m.id)} />
                        <span className="wlt-method-icon">
                          {m.kind === "bank" ? <IconBank width={18} height={18} /> : <IconSmartphone width={18} height={18} />}
                        </span>
                        <span className="wlt-method-text">
                          <strong>{m.kind === "bank" ? m.bank_name : m.provider_label}</strong>
                          <span>{m.kind === "bank" ? `•••• ${m.account_number}` : m.phone} — {m.account_name}</span>
                        </span>
                        {m.is_default && <span className="wlt-method-default">Default</span>}
                      </label>
                    ))}
                  </div>
                  <button type="button" className="wlt-add-method-btn" onClick={() => setAddingMethod(true)}>
                    <IconPlus width={15} height={15} /> Add bank or e-wallet
                  </button>
                  <div className="wlt-slip-actions">
                    <button type="button" className="btn-inline btn-secondary" onClick={() => setStepIdx(0)}>
                      <IconChevronLeft width={15} height={15} /> Back
                    </button>
                    <button type="button" className="btn-inline btn-primary" disabled={!methodId} onClick={() => setStepIdx(2)}>Continue</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="wlt-kind-toggle" role="group" aria-label="Payout type">
                    {[
                      { key: "bank", label: "Bank transfer" },
                      { key: "gcash", label: "GCash" },
                      { key: "maya", label: "Maya" },
                    ].map((opt) => (
                      <button key={opt.key} type="button" className={newKind === opt.key ? "active" : ""} onClick={() => setNewKind(opt.key)}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {newKind === "bank" ? (
                    <>
                      <label className="wlt-slip-field">
                        <span>Bank name</span>
                        <input value={newForm.bank_name} onChange={(e) => setNewForm({ ...newForm, bank_name: e.target.value })} placeholder="e.g. BDO Unibank" />
                      </label>
                      <label className="wlt-slip-field">
                        <span>Account number</span>
                        <input inputMode="numeric" value={newForm.account_number} onChange={(e) => setNewForm({ ...newForm, account_number: e.target.value.replace(/\D/g, "") })} placeholder="0000 0000 0000" />
                      </label>
                      <label className="wlt-slip-field">
                        <span>Account name</span>
                        <input value={newForm.account_name} onChange={(e) => setNewForm({ ...newForm, account_name: e.target.value })} placeholder="Name on the account" />
                      </label>
                    </>
                  ) : (
                    <>
                      <label className="wlt-slip-field">
                        <span>{newKind === "gcash" ? "GCash" : "Maya"} phone number</span>
                        <input inputMode="tel" value={newForm.phone} onChange={(e) => setNewForm({ ...newForm, phone: e.target.value.replace(/[^\d\s]/g, "") })} placeholder="09XX XXX XXXX" />
                      </label>
                      <label className="wlt-slip-field">
                        <span>Account name</span>
                        <input value={newForm.account_name} onChange={(e) => setNewForm({ ...newForm, account_name: e.target.value })} placeholder="Name on the account" />
                      </label>
                    </>
                  )}
                  <div className="wlt-slip-actions">
                    <button type="button" className="btn-inline btn-secondary" onClick={() => setAddingMethod(false)}>
                      <IconChevronLeft width={15} height={15} /> Back
                    </button>
                    <button type="button" className="btn-inline btn-primary" disabled={!canAddMethod} onClick={handleAddMethod}>Save method</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ── Step 3: Review ── */}
          {stepIdx === 2 && selectedMethod && (
            <div className="wlt-slip-step">
              <div className="wlt-review-lines">
                <div className="wlt-review-line"><span>Amount</span><strong>{fmt(numericAmount)}</strong></div>
                <div className="wlt-review-line"><span>Processing fee</span><strong>{fee > 0 ? `−${fmt(fee)}` : "Waived"}</strong></div>
                <div className="wlt-review-line total"><span>Net payout</span><strong>{fmt(net)}</strong></div>
              </div>
              <div className="wlt-review-method">
                <span className="wlt-method-icon">
                  {selectedMethod.kind === "bank" ? <IconBank width={18} height={18} /> : <IconSmartphone width={18} height={18} />}
                </span>
                <span className="wlt-method-text">
                  <strong>{selectedMethod.kind === "bank" ? selectedMethod.bank_name : selectedMethod.provider_label}</strong>
                  <span>{selectedMethod.kind === "bank" ? `•••• ${selectedMethod.account_number}` : selectedMethod.phone}</span>
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
                {fmt(net)} is on its way to {selectedMethod?.kind === "bank" ? selectedMethod.bank_name : selectedMethod?.provider_label}.
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