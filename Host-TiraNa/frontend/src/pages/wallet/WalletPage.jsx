import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "../../styles/wallet.css";
import useWalletData from "./useWalletData";
import WithdrawModal from "./WithdrawModal";
import RefundFlowModal from "./RefundFlowModal";
import { useToast } from "../../components/common/Toast";
import { getHostPropertyIds } from "../../api/bookings";
import {
  IconVault,
  IconArrowUp,
  IconArrowDown,
  IconWallet,
  IconLock,
  IconRefresh,
  IconSmartphone,
  IconAlertCircle,
} from "../../components/icons";

const fmt = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const dateFmt = (iso) =>
  new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

function releaseLabel(iso) {
  const target = new Date(iso);
  const now = new Date();
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const days = Math.round((startOfDay(target) - startOfDay(now)) / 86400000);
  if (days <= 0) return "Releases today";
  if (days === 1) return "Releases tomorrow";
  if (days <= 13) return `Releases in ${days} days`;
  return `Releases ${dateFmt(iso)}`;
}

/* ─── Skeleton ─────────────────────────────────────────────── */

function WalletSkeleton() {
  return (
    <div className="wlt-page">
      <div className="wlt-header">
        <div className="wlt-skel" style={{ width: 140, height: 30 }} />
        <div className="wlt-skel" style={{ width: 260, height: 16, marginTop: 8 }} />
      </div>
      <div className="wlt-top-grid">
        <div className="wlt-skel" style={{ height: 200, borderRadius: "var(--radius-lg)" }} />
        <div className="wlt-skel" style={{ height: 200, borderRadius: "var(--radius-lg)" }} />
      </div>
      <div className="wlt-skel" style={{ height: 140, borderRadius: "var(--radius-lg)" }} />
      <div className="wlt-skel" style={{ height: 320, borderRadius: "var(--radius-lg)" }} />
    </div>
  );
}

function WalletError({ message, onRetry }) {
  return (
    <div className="wlt-page">
      <div className="wlt-empty" style={{ minHeight: 320 }}>
        <IconAlertCircle width={28} height={28} />
        <p>{message || "Failed to load your wallet."}</p>
        <button className="wlt-export-btn" onClick={onRetry}>Try again</button>
      </div>
    </div>
  );
}

/* ─── Main ─────────────────────────────────────────────────── */

export default function WalletPage() {
  const { wallet, transactions, withdrawals, loading, error, requestWithdrawal, retry, reload } =
    useWalletData();
  const { push } = useToast();

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [retryingId, setRetryingId] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [propertyIds, setPropertyIds] = useState([]);
  const refundBookingId = searchParams.get("refund");

  useEffect(() => {
    getHostPropertyIds().then(setPropertyIds).catch(() => setPropertyIds([]));
  }, []);

  function closeRefundFlow() {
    searchParams.delete("refund");
    setSearchParams(searchParams, { replace: true });
  }

  const reserved = useMemo(() => {
    return transactions
      .filter((tx) => tx.bucket === "pending")
      .slice()
      .sort((a, b) => new Date(a.check_out) - new Date(b.check_out));
  }, [transactions]);

  const refundPropertyTitle = useMemo(() => {
    if (!refundBookingId) return null;
    const match = transactions.find((tx) => String(tx.booking_id) === String(refundBookingId));
    return match?.property_title ?? null;
  }, [transactions, refundBookingId]);

  if (loading) return <WalletSkeleton />;
  if (error) return <WalletError message={error} onRetry={reload} />;

  async function handleWithdrawSubmit(payload) {
    const res = await requestWithdrawal(payload);
    push("Withdrawal request submitted.", "success");
    return res;
  }

  async function handleRetry(id) {
    setRetryingId(id);
    try {
      await retry(id);
      push("Withdrawal resubmitted for processing.", "success");
    } catch {
      push("Couldn't retry this withdrawal.", "error");
    } finally {
      setRetryingId(null);
    }
  }

  return (
    <div className="wlt-page">
      {/* ── Header ── */}
      <header className="wlt-header">
        <div>
          <h1 className="wlt-title">Wallet</h1>
          <p className="wlt-subtitle">Your balances, transaction ledger, and payouts — all in one book.</p>
        </div>
      </header>

      {/* ── 8.1 Overview: hero + passbook ── */}
      <section className="wlt-top-grid" aria-label="Wallet overview">
        <div className="wlt-hero">
          <div className="wlt-hero-top">
            <span className="wlt-hero-icon"><IconVault width={22} height={22} /></span>
            <span className="wlt-hero-eyebrow">Available for withdrawal</span>
          </div>
          <div className="wlt-hero-amount">{fmt(wallet.available_balance)}</div>
          <p className="wlt-hero-note">
            Cleared funds ready to send to your bank or e-wallet. Reserved and on-hold amounts settle once bookings are approved or refunds resolved.
          </p>
          <button type="button" className="wlt-withdraw-btn" onClick={() => setShowWithdraw(true)}>
            <IconArrowUp width={16} height={16} /> Withdraw funds
          </button>
          <div className="wlt-hero-quickstats">
            <div>
              <span>Total withdrawn</span>
              <strong>{fmt(wallet.total_withdrawn)}</strong>
            </div>
            <div>
              <span>Last withdrawal</span>
              <strong>{wallet.last_withdrawal_date ? dateFmt(wallet.last_withdrawal_date) : "—"}</strong>
            </div>
          </div>
        </div>

        <div className="wlt-passbook" aria-label="Balance breakdown">
          <div className="wlt-passbook-title">Balance breakdown</div>
          <div className="wlt-passbook-row">
            <span className="wlt-passbook-label"><IconWallet width={15} height={15} /> Total balance</span>
            <strong>{fmt(wallet.total_balance)}</strong>
          </div>
          <div className="wlt-passbook-row">
            <span className="wlt-passbook-label"><IconArrowDown width={15} height={15} /> Available</span>
            <strong>{fmt(wallet.available_balance)}</strong>
          </div>
          <div className="wlt-passbook-row">
            <span className="wlt-passbook-label"><IconAlertCircle width={15} height={15} /> On hold</span>
            <strong>{fmt(wallet.on_hold_balance)}</strong>
          </div>
          <p className="wlt-passbook-foot">
            On hold covers bookings with a refund request pending resolution. Reserved funds — pending bookings
            awaiting host approval — have their own breakdown below.
          </p>
        </div>
      </section>

      {/* ── Reserved for Refund: separate from Balance Breakdown ──
          Money lands here the moment a booking is created with online
          payment, and moves to Available for Withdrawal once the host
          approves the booking — see wallet/summary + wallet/transactions
          on the client backend. */}
      <section className="wlt-reserve-card" aria-label="Reserved for refund">
        <div className="wlt-reserve-main">
          <div className="wlt-reserve-heading">
            <span className="wlt-reserve-icon"><IconLock width={18} height={18} /></span>
            <div className="wlt-reserve-heading-text">
              <span className="wlt-reserve-eyebrow">Reserved for refund</span>
              <span className="wlt-reserve-chip">Refund window open</span>
            </div>
          </div>
          <div className="wlt-reserve-amount-panel">
            <div className="wlt-reserve-amount">{fmt(wallet.pending_balance)}</div>
            <span className="wlt-reserve-count">
              {reserved.length === 0 ? "No bookings held" : `Across ${reserved.length} booking${reserved.length === 1 ? "" : "s"}`}
            </span>
          </div>
          <p className="wlt-reserve-note">
            Held from pending or cancelled bookings awaiting resolution. Each booking's share moves to
            Available for Withdrawal once the host approves it.
          </p>
        </div>

        <div className="wlt-reserve-list-wrap">
          <div className="wlt-reserve-list-title">Upcoming releases</div>
          {reserved.length === 0 ? (
            <p className="wlt-reserve-empty">Nothing reserved right now — pending or cancelled bookings will show up here.</p>
          ) : (
            <>
              <ul className="wlt-reserve-list">
                {reserved.slice(0, 4).map((tx) => (
                  <li key={tx.id} className="wlt-reserve-row">
                    <span className="wlt-reserve-row-avatar" aria-hidden="true">
                      {tx.property_title.trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="wlt-reserve-row-mid">
                      <span className="wlt-reserve-row-prop">{tx.property_title}</span>
                      <span className="wlt-reserve-row-date">{releaseLabel(tx.check_out)}</span>
                    </div>
                    <strong className="wlt-reserve-row-amt">{fmt(tx.amount)}</strong>
                  </li>
                ))}
              </ul>
              {reserved.length > 4 && (
                <button type="button" className="wlt-reserve-more" onClick={() => setTxFilter("pending")}>
                  +{reserved.length - 4} more — view in transaction history
                </button>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── Withdrawal history ── */}
      <section className="wlt-wd-card" aria-label="Withdrawal history">
          <div className="wlt-tx-head">
            <span className="wlt-card-title"><IconArrowUp width={16} height={16} /> Withdrawal history</span>
          </div>
          {withdrawals.length === 0 ? (
            <div className="wlt-empty">
              <p>No withdrawals yet.</p>
            </div>
          ) : (
            <ul className="wlt-wd-list">
              {withdrawals.map((w) => (
                <li key={w.id} className="wlt-wd-row">
                  <span className="wlt-wd-icon">
                    <IconSmartphone width={16} height={16} />
                  </span>
                  <div className="wlt-wd-info">
                    <strong>{fmt(w.amount)}</strong>
                    <span>{w.method_label}</span>
                    <span className="wlt-wd-date">{dateFmt(w.date)}</span>
                  </div>
                  <div className="wlt-wd-status-wrap">
                    <span className={`wlt-wd-status wlt-wd-status--${w.status}`}>
                      {w.status === "processed" ? "Processed" : w.status === "pending" ? "Pending" : "Failed"}
                    </span>
                    {w.status === "failed" && (
                      <button
                        type="button"
                        className="wlt-retry-btn"
                        disabled={retryingId === w.id}
                        onClick={() => handleRetry(w.id)}
                      >
                        <IconRefresh width={13} height={13} /> {retryingId === w.id ? "Retrying…" : "Retry"}
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

      {showWithdraw && (
        <WithdrawModal
          available={wallet.available_balance}
          onClose={() => setShowWithdraw(false)}
          onSubmit={handleWithdrawSubmit}
        />
      )}

      {refundBookingId && propertyIds.length > 0 && (
        <RefundFlowModal
          bookingId={refundBookingId}
          propertyIds={propertyIds}
          propertyTitle={refundPropertyTitle}
          onClose={closeRefundFlow}
          onCompleted={() => {
            push("Refund completed successfully.", "success");
            reload();
          }}
        />
      )}
    </div>
  );
}