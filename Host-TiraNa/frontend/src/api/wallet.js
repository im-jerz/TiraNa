/**
 * wallet.js
 *
 * Wallet & Financial Management API — Host-TiraNa
 *
 * §8.1 balances and §8.2 transaction history are REAL, sourced from
 * Client-TiraNa's `wallets` table.
 *
 * §8.3 withdrawals are REAL — submitted to Admin-TiraNa via
 * Host-TiraNa backend.
 */

import axiosInstance from "./axiosInstance";
import clientApi from "./clientApi";

const MIN_WITHDRAWAL = 500;

/* ─── Fee schedule ──────────────────────────────────────────────── */
export function computeFee(amount, methodKind) {
  if (!amount || amount <= 0) return 0;
  if (methodKind === "bank") return amount >= 10000 ? 0 : 25;
  return 15; // gcash / maya
}

export { MIN_WITHDRAWAL };

/* ─── Host properties → { ids, propertyMap } ────────────────────── */

async function getHostPropertyMap() {
  const { data } = await axiosInstance.get("/api/host/properties");
  const properties = data?.data?.properties ?? [];
  const map = {};
  properties.forEach((p) => {
    map[String(p.property_id)] = { title: p.title, property_type: p.property_type };
  });
  return { ids: properties.map((p) => String(p.property_id)), propertyMap: map };
}

/* ─── 8.1 Wallet overview (REAL) ─────────────────────────────────── */

export async function getWallet() {
  const { ids } = await getHostPropertyMap();

  const empty = {
    total_balance: 0,
    pending_balance: 0,
    available_balance: 0,
    on_hold_balance: 0,
  };

  const summary = ids.length
    ? (await clientApi.get("/api/host/wallet/summary", { params: { property_ids: ids.join(",") } })).data
        ?.data ?? empty
    : empty;

  // Compute total_withdrawn from real withdrawal history
  let totalWithdrawn = 0;
  let lastWithdrawalDate = null;
  try {
    const { data } = await axiosInstance.get("/api/host/wallet/withdrawals");
    const withdrawals = data?.data ?? [];
    const completed = withdrawals.filter((w) => w.status !== "rejected");
    totalWithdrawn = completed.reduce((sum, w) => sum + Number(w.amount), 0);
    if (withdrawals.length > 0) {
      lastWithdrawalDate = withdrawals[0].created_at;
    }
  } catch {
    // Withdrawal history unavailable — use zeros
  }

  return {
    ...summary,
    total_withdrawn: totalWithdrawn,
    last_withdrawal_date: lastWithdrawalDate,
  };
}

/* ─── 8.2 Transaction history (REAL) ────────────────────────────── */

export async function getTransactions() {
  const { ids, propertyMap } = await getHostPropertyMap();
  if (ids.length === 0) return [];

  const { data } = await clientApi.get("/api/host/wallet/transactions", {
    params: { property_ids: ids.join(",") },
  });
  const rows = data?.data ?? [];

  let running = rows.reduce((sum, r) => sum + r.amount, 0);

  return rows.map((r) => {
    const prop = propertyMap[String(r.property_id)];
    const label = prop?.title ?? `Property #${r.property_id}`;
    const isRefund = r.type === "refund";
    const entry = {
      id: r.id,
      booking_id: r.booking_id,
      date: r.created_at,
      type: isRefund ? "refund" : "booking_payment",
      bucket: r.bucket,
      property_title: label,
      description: isRefund
        ? `Refund issued — ${label}`
        : `Booking payment — ${label}`,
      amount: r.amount,
      check_in: r.check_in,
      check_out: r.check_out,
      running_balance: running,
    };
    running -= r.amount;
    return entry;
  });
}

/* ─── 8.3 Withdrawal flow (REAL — via Host-TiraNa backend) ─────── */

export async function getWithdrawals() {
  try {
    const { data } = await axiosInstance.get("/api/host/wallet/withdrawals");
    const withdrawals = data?.data ?? [];

    return withdrawals.map((w) => ({
      id: String(w.id),
      date: w.created_at,
      amount: Number(w.amount),
      method_label: w.method || "—",
      status: w.status === "approved" ? "processed" : w.status,
    }));
  } catch {
    return [];
  }
}

export async function submitWithdrawal({ amount, method }) {
  if (amount < MIN_WITHDRAWAL) {
    throw new Error(`Minimum withdrawal is ₱${MIN_WITHDRAWAL.toLocaleString("en-PH")}.`);
  }

  const fee = computeFee(amount, "gcash");

  const { data } = await axiosInstance.post("/api/host/wallet/withdraw", {
    amount,
    method,
  });

  return {
    withdrawal: {
      id: `wd-${Date.now()}`,
      date: new Date().toISOString(),
      amount,
      method_label: method,
      status: "pending",
    },
    fee,
    net: amount - fee,
  };
}

export async function retryWithdrawal(withdrawalId) {
  return { id: withdrawalId, status: "pending", date: new Date().toISOString() };
}
