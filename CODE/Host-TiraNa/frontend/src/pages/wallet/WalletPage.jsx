import { useMemo, useState } from "react";
import "../../styles/wallet.css";
import useWalletData from "./useWalletData";
import WithdrawModal from "./WithdrawModal";
import { useToast } from "../../components/common/Toast";
import {
  IconVault,
  IconArrowUp,
  IconArrowDown,
  IconWallet,
  IconClock,
  IconDownload,
  IconRefresh,
  IconBank,
  IconSmartphone,
  IconReceipt,
  IconAlertCircle,
} from "../../components/icons";

const fmt = (n) =>
  "₱" + Number(n || 0).toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const dateFmt = (iso) =>
  new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });

const timeFmt = (iso) =>
  new Date(iso).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" });

const TX_FILTERS = [
  { key: "all", label: "All" },
  { key: "credit", label: "Credits" },
  { key: "debit", label: "Debits" },
  { key: "withdrawal", label: "Withdrawals" },
];

const TX_META = {
  booking_payment: { label: "Booking payment", tone: "credit" },
  refund_deduction: { label: "Refund deduction", tone: "debit" },
  withdrawal: { label: "Withdrawal", tone: "withdrawal" },
  adjustment: { label: "Adjustment", tone: "adjust" },
};

function classify(tx) {
  if (tx.type === "withdrawal") return "withdrawal";
  return tx.amount >= 0 ? "credit" : "debit";
}

function exportCsv(rows, filename) {
  if (!rows.length) return;
  const header = Object.keys(rows[0]).join(",");
  const body = rows.map((r) => Object.values(r).join(",")).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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
  const { wallet, methods, transactions, withdrawals, loading, error, requestWithdrawal, retry, saveMethod, reload } =
    useWalletData();
  const { push } = useToast();

  const [showWithdraw, setShowWithdraw] = useState(false);
  const [txFilter, setTxFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [retryingId, setRetryingId] = useState(null);

  const filteredTx = useMemo(() => {
    return transactions.filter((tx) => {
      if (txFilter !== "all" && classify(tx) !== txFilter) return false;
      const d = new Date(tx.date);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(`${dateTo}T23:59:59`)) return false;
      return true;
    });
  }, [transactions, txFilter, dateFrom, dateTo]);

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
            Cleared funds ready to send to your bank or e-wallet. Held and pending amounts settle automatically.
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
            <span className="wlt-passbook-label"><IconClock width={15} height={15} /> Pending</span>
            <strong>{fmt(wallet.pending_balance)}</strong>
          </div>
          <div className="wlt-passbook-row">
            <span className="wlt-passbook-label"><IconArrowDown width={15} height={15} /> Available</span>
            <strong>{fmt(wallet.available_balance)}</strong>
          </div>
          <div className="wlt-passbook-row">
            <span className="wlt-passbook-label"><IconAlertCircle width={15} height={15} /> On hold</span>
            <strong>{fmt(wallet.on_hold_balance)}</strong>
          </div>
          <p className="wlt-passbook-foot">On hold covers bookings currently under dispute.</p>
        </div>
      </section>

      {/* ── Body: transactions + withdrawal history ── */}
      <div className="wlt-content-grid">
        <section className="wlt-tx-card" aria-label="Transaction history">
          <div className="wlt-tx-head">
            <span className="wlt-card-title"><IconReceipt width={16} height={16} /> Transaction history</span>
            <button
              className="wlt-export-btn"
              onClick={() =>
                exportCsv(
                  filteredTx.map((t) => ({
                    Date: dateFmt(t.date),
                    Type: TX_META[t.type]?.label ?? t.type,
                    Description: t.description,
                    Amount: t.amount.toFixed(2),
                    "Running balance": t.running_balance.toFixed(2),
                  })),
                  "wallet-transactions.csv"
                )
              }
            >
              <IconDownload width={14} height={14} /> Export CSV
            </button>
          </div>

          <div className="wlt-tx-filters">
            <div className="wlt-tx-tabs" role="tablist" aria-label="Transaction filter">
              {TX_FILTERS.map((f) => (
                <button
                  key={f.key}
                  role="tab"
                  aria-selected={txFilter === f.key}
                  className={`wlt-tx-tab${txFilter === f.key ? " active" : ""}`}
                  onClick={() => setTxFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="wlt-date-range">
              <input type="date" aria-label="From date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <span>to</span>
              <input type="date" aria-label="To date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          {filteredTx.length === 0 ? (
            <div className="wlt-empty">
              <IconReceipt width={26} height={26} />
              <p>No transactions match these filters.</p>
            </div>
          ) : (
            <div className="wlt-tx-table-wrap">
              <table className="wlt-tx-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th className="num">Amount</th>
                    <th className="num">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTx.map((tx) => {
                    const meta = TX_META[tx.type] ?? { label: tx.type, tone: "adjust" };
                    return (
                      <tr key={tx.id}>
                        <td data-label="Date">
                          <div className="wlt-tx-date">{dateFmt(tx.date)}<span>{timeFmt(tx.date)}</span></div>
                        </td>
                        <td data-label="Type">
                          <span className={`wlt-tx-badge wlt-tx-badge--${meta.tone}`}>{meta.label}</span>
                        </td>
                        <td data-label="Description" className="wlt-tx-desc">{tx.description}</td>
                        <td data-label="Amount" className={`num wlt-tx-amount wlt-tx-amount--${tx.amount >= 0 ? "pos" : "neg"}`}>
                          {tx.amount >= 0 ? "+" : "−"}{fmt(Math.abs(tx.amount))}
                        </td>
                        <td data-label="Balance" className="num wlt-tx-balance">{fmt(tx.running_balance)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

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
                    {w.method_label.toLowerCase().includes("gcash") || w.method_label.toLowerCase().includes("maya")
                      ? <IconSmartphone width={16} height={16} />
                      : <IconBank width={16} height={16} />}
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
      </div>

      {showWithdraw && (
        <WithdrawModal
          available={wallet.available_balance}
          methods={methods}
          onClose={() => setShowWithdraw(false)}
          onSubmit={handleWithdrawSubmit}
          onSaveMethod={saveMethod}
        />
      )}
    </div>
  );
}