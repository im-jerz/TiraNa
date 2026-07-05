/**
 * wallet.js
 *
 * Wallet & Financial Management API — Host-TiraNa
 *
 * FRONTEND-ONLY STAGE: no backend endpoint exists yet (see host_flow.md §8).
 * State (saved payout methods + withdrawal requests) is layered on top of
 * the shaped mock data and persisted to localStorage, so the flow feels
 * real across reloads. Swap the bodies of these functions for
 * axiosInstance calls once /api/host/wallet* is live — call sites and
 * return shapes are already written to match the documented endpoints.
 */

import {
  MOCK_WALLET_SUMMARY,
  MOCK_PAYOUT_METHODS,
  MOCK_TRANSACTIONS,
  MOCK_WITHDRAWALS,
} from "../data/mockWallet";

const STATE_KEY = "tirana_wallet_state_v1";
const MIN_WITHDRAWAL = 500;
const NETWORK_DELAY = 550;

function wait(ms = NETWORK_DELAY) {
  return new Promise((res) => setTimeout(res, ms));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) throw new Error("empty");
    const parsed = JSON.parse(raw);
    return {
      summary: parsed.summary ?? MOCK_WALLET_SUMMARY,
      methods: parsed.methods ?? MOCK_PAYOUT_METHODS,
      transactions: parsed.transactions ?? MOCK_TRANSACTIONS,
      withdrawals: parsed.withdrawals ?? MOCK_WITHDRAWALS,
    };
  } catch {
    return {
      summary: { ...MOCK_WALLET_SUMMARY },
      methods: MOCK_PAYOUT_METHODS.map((m) => ({ ...m })),
      transactions: MOCK_TRANSACTIONS.map((t) => ({ ...t })),
      withdrawals: MOCK_WITHDRAWALS.map((w) => ({ ...w })),
    };
  }
}

function persist(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

/* ─── Fee schedule ──────────────────────────────────────────────
   Flat, transparent fees kept in one place so the review step and
   the confirmation step never disagree with each other. */
export function computeFee(amount, methodKind) {
  if (!amount || amount <= 0) return 0;
  if (methodKind === "bank") return amount >= 10000 ? 0 : 25;
  return 15; // gcash / maya
}

/* ─── 8.1 Wallet overview ───────────────────────────────────────── */

export async function getWallet() {
  await wait();
  const { summary } = loadState();
  return { ...summary };
}

export async function getPayoutMethods() {
  await wait(300);
  const { methods } = loadState();
  return methods;
}

export async function addPayoutMethod(input) {
  await wait(400);
  const state = loadState();
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
  persist(state);
  return method;
}

/* ─── 8.2 Transaction history ───────────────────────────────────── */

export async function getTransactions() {
  await wait();
  const { transactions } = loadState();
  return transactions;
}

/* ─── 8.3 Withdrawal flow ────────────────────────────────────────── */

export { MIN_WITHDRAWAL };

export async function getWithdrawals() {
  await wait(400);
  const { withdrawals } = loadState();
  return withdrawals;
}

export async function submitWithdrawal({ amount, methodId }) {
  await wait(900);
  const state = loadState();

  if (amount < MIN_WITHDRAWAL) {
    throw new Error(`Minimum withdrawal is ₱${MIN_WITHDRAWAL.toLocaleString("en-PH")}.`);
  }
  if (amount > state.summary.available_balance) {
    throw new Error("Amount exceeds your available balance.");
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
  state.summary.available_balance -= amount;
  state.summary.total_withdrawn += amount;
  state.summary.last_withdrawal_date = now;
  state.transactions = [
    {
      id: `txn-${Date.now()}`,
      date: now,
      type: "withdrawal",
      description: `Withdrawal to ${label}`,
      amount: -amount,
      running_balance: state.summary.total_balance,
    },
    ...state.transactions,
  ];

  persist(state);
  return { withdrawal, fee, net: amount - fee };
}

export async function retryWithdrawal(withdrawalId) {
  await wait(700);
  const state = loadState();
  state.withdrawals = state.withdrawals.map((w) =>
    w.id === withdrawalId ? { ...w, status: "pending", date: new Date().toISOString() } : w
  );
  persist(state);
  return state.withdrawals.find((w) => w.id === withdrawalId);
}