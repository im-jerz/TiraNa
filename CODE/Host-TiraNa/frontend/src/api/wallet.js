/**
 * wallet.js
 *
 * Wallet & Financial Management API — Host-TiraNa
 *
 * §8.1 balances and §8.2 transaction history are REAL, sourced from
 * Client-TiraNa's `wallets` table:
 *   GET {CLIENT_API_URL}/api/host/wallet/summary
 *   GET {CLIENT_API_URL}/api/host/wallet/transactions
 * (see Client-TiraNa/backend/routes/hostBookings.js)
 *
 * A booking only ever appears here once the host approves it — see the
 * 'confirmed' branch of PATCH /:id/status on the client backend. Nothing
 * is credited at checkout time, so pending/unapproved bookings never show
 * up in the balance or the transaction history.
 *
 * §8.3 withdrawals are FRONTEND-ONLY for now (another teammate is building
 * the real withdrawal backend) — saved payout methods and withdrawal
 * history stay local, persisted to localStorage so the flow still feels
 * real across reloads.
 */

import axiosInstance from "./axiosInstance";
import clientApi from "./clientApi";
import { MOCK_PAYOUT_METHODS, MOCK_WITHDRAWALS } from "../data/mockWallet";

const STATE_KEY = "tirana_wallet_withdrawals_v1";
const MIN_WITHDRAWAL = 500;

function loadMockState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw);
    return {
      methods: parsed.methods ?? MOCK_PAYOUT_METHODS,
      withdrawals: parsed.withdrawals ?? MOCK_WITHDRAWALS,
    };
  } catch {
    return {
      methods: MOCK_PAYOUT_METHODS.map((m) => ({ ...m })),
      withdrawals: MOCK_WITHDRAWALS.map((w) => ({ ...w })),
    };
  }
}

function persistMockState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

/* ─── Fee schedule (still used by the §8.3 withdrawal modal) ────── */
export function computeFee(amount, methodKind) {
  if (!amount || amount <= 0) return 0;
  if (methodKind === "bank") return amount >= 10000 ? 0 : 25;
  return 15; // gcash / maya
}

export { MIN_WITHDRAWAL };

/* ─── Host properties → { ids, propertyMap } ──────────────────────
   Same pattern RevenuePage.jsx uses: fetch host properties from the
   Flask backend for id → title/type, then fetch the actual booking-
   derived data straight from the Client backend. */

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

  // total_withdrawn / last_withdrawal_date are placeholders sourced from
  // the local mock withdrawal ledger until the real withdrawal backend
  // exists — they never affect the real balances above.
  const { withdrawals } = loadMockState();
  const totalWithdrawn = withdrawals
    .filter((w) => w.status !== "failed")
    .reduce((sum, w) => sum + w.amount, 0);

  return {
    ...summary,
    total_withdrawn: totalWithdrawn,
    last_withdrawal_date: withdrawals[0]?.date ?? null,
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

  // Rows come back newest-first; walk backwards to build a running
  // balance (the list already only contains approved, non-refunded
  // bookings, so the running balance naturally lands on total_balance).
  let running = rows.reduce((sum, r) => sum + r.amount, 0);

  return rows.map((r) => {
    const prop = propertyMap[String(r.property_id)];
    const label = prop?.title ?? `Property #${r.property_id}`;
    const entry = {
      id: r.id,
      booking_id: r.booking_id,
      date: r.created_at,
      type: "booking_payment",
      bucket: r.bucket, // 'pending' | 'available' | 'on_hold'
      property_title: label,
      description: `Booking payment — ${label}`,
      amount: r.amount,
      check_in: r.check_in,
      check_out: r.check_out,
      running_balance: running,
    };
    running -= r.amount;
    return entry;
  });
}

/* ─── 8.3 Payout methods (mock — frontend only) ─────────────────── */

export async function getPayoutMethods() {
  const { methods } = loadMockState();
  return methods;
}

export async function addPayoutMethod(input) {
  const state = loadMockState();
  const method =
    input.kind === "bank"
      ? {
          id: `acc-${Date.now()}`,
          kind: "bank",
          bank_name: input.bank_name,
          account_number: input.account_number.slice(-4),
          account_number_full: input.account_number,
          account_name: input.account_name,
          is_default: state.methods.length === 0,
        }
      : {
          id: `acc-${Date.now()}`,
          kind: input.kind,
          provider_label: input.kind === "gcash" ? "GCash" : "Maya",
          phone: input.phone,
          account_name: input.account_name,
          is_default: state.methods.length === 0,
        };
  state.methods = [...state.methods, method];
  persistMockState(state);
  return method;
}

/* ─── 8.3 Withdrawal flow (mock — frontend only, per teammate build) ── */

export async function getWithdrawals() {
  const { withdrawals } = loadMockState();
  return withdrawals;
}

export async function submitWithdrawal({ amount, methodId }) {
  const state = loadMockState();

  if (amount < MIN_WITHDRAWAL) {
    throw new Error(`Minimum withdrawal is ₱${MIN_WITHDRAWAL.toLocaleString("en-PH")}.`);
  }
  const method = state.methods.find((m) => m.id === methodId);
  if (!method) throw new Error("Select a payout method to continue.");

  const label =
    method.kind === "bank"
      ? `${method.bank_name} •••• ${method.account_number}`
      : `${method.provider_label} ${method.phone}`;

  const fee = computeFee(amount, method.kind);
  const now = new Date().toISOString();

  const withdrawal = {
    id: `wd-${Math.floor(Math.random() * 9000) + 3000}`,
    date: now,
    amount,
    method_label: label,
    status: "pending",
  };

  state.withdrawals = [withdrawal, ...state.withdrawals];
  persistMockState(state);
  return { withdrawal, fee, net: amount - fee };
}

export async function retryWithdrawal(withdrawalId) {
  const state = loadMockState();
  state.withdrawals = state.withdrawals.map((w) =>
    w.id === withdrawalId ? { ...w, status: "pending", date: new Date().toISOString() } : w
  );
  persistMockState(state);
  return state.withdrawals.find((w) => w.id === withdrawalId);
}