// Placeholder data shaped exactly like the future API responses
// (see host_flow.md §8 Wallet & Financial Management).
// Swap useWalletData's mock branch for real calls to:
//   GET  /api/host/wallet
//   GET  /api/host/wallet/transactions
//   POST /api/host/wallet/withdraw
//   GET  /api/host/wallet/withdrawals
// once the backend endpoints are live — no shape changes needed.

export const MOCK_WALLET_SUMMARY = {
  total_balance: 284560,
  pending_balance: 18200,
  available_balance: 152340,
  on_hold_balance: 6400,
  total_withdrawn: 107620,
  last_withdrawal_date: "2026-06-22",
};

export const MOCK_PAYOUT_METHODS = [
  {
    id: "acc-bdo-1",
    kind: "bank",
    bank_name: "BDO Unibank",
    account_number: "4821",
    account_number_full: "0021 4009 4821",
    account_name: "Maria Santos",
    is_default: true,
  },
  {
    id: "acc-gcash-1",
    kind: "gcash",
    provider_label: "GCash",
    phone: "0917 220 4432",
    account_name: "Maria Santos",
    is_default: false,
  },
];

const PROPS = [
  "Sea Breeze Cabin",
  "Old Manila Heritage Loft",
  "Banaue Rice Terrace View Villa",
  "Coron Cliffside Bungalow",
  "Baguio Pine Hideaway",
];

// type: booking_payment | refund_deduction | withdrawal | adjustment
const RAW_TX = [
  ["2026-07-02T09:14:00", "booking_payment", `Booking #1042 — ${PROPS[0]}`, 8400],
  ["2026-06-29T15:02:00", "booking_payment", `Booking #1041 — ${PROPS[2]}`, 15200],
  ["2026-06-27T11:30:00", "withdrawal", "Withdrawal to BDO •••• 4821", -32000],
  ["2026-06-24T08:45:00", "refund_deduction", `Refund — Booking #1033 — ${PROPS[1]}`, -2100],
  ["2026-06-22T10:05:00", "withdrawal", "Withdrawal to GCash 0917 •••4432", -18000],
  ["2026-06-19T14:20:00", "booking_payment", `Booking #1029 — ${PROPS[3]}`, 11600],
  ["2026-06-15T09:00:00", "adjustment", "Goodwill credit — late check-in", 500],
  ["2026-06-12T17:40:00", "booking_payment", `Booking #1022 — ${PROPS[0]}`, 7200],
  ["2026-06-09T12:10:00", "refund_deduction", `Refund — Booking #1015 — ${PROPS[4]}`, -1800],
  ["2026-06-05T09:55:00", "booking_payment", `Booking #1011 — ${PROPS[2]}`, 19400],
  ["2026-05-30T16:00:00", "withdrawal", "Withdrawal to BDO •••• 4821", -25000],
  ["2026-05-27T13:25:00", "booking_payment", `Booking #1004 — ${PROPS[1]}`, 6800],
  ["2026-05-24T10:30:00", "adjustment", "Correction — commission recalculation", -320],
  ["2026-05-20T08:15:00", "booking_payment", `Booking #0998 — ${PROPS[3]}`, 13950],
  ["2026-05-16T11:50:00", "refund_deduction", `Refund — Booking #0991 — ${PROPS[0]}`, -1400],
];

function buildTransactions() {
  let running = MOCK_WALLET_SUMMARY.total_balance;
  // running balance walked backwards from current total, newest first
  return RAW_TX.map((row, i) => {
    const [date, type, description, amount] = row;
    const entry = {
      id: `txn-${1050 - i}`,
      date,
      type,
      description,
      amount,
      running_balance: running,
    };
    running -= amount;
    return entry;
  });
}

export const MOCK_TRANSACTIONS = buildTransactions();

export const MOCK_WITHDRAWALS = [
  {
    id: "wd-2091",
    date: "2026-06-27T11:30:00",
    amount: 32000,
    method_label: "BDO Unibank •••• 4821",
    status: "processed",
  },
  {
    id: "wd-2077",
    date: "2026-06-22T10:05:00",
    amount: 18000,
    method_label: "GCash 0917 •••4432",
    status: "processed",
  },
  {
    id: "wd-2054",
    date: "2026-05-30T16:00:00",
    amount: 25000,
    method_label: "BDO Unibank •••• 4821",
    status: "processed",
  },
  {
    id: "wd-2039",
    date: "2026-05-11T09:12:00",
    amount: 9600,
    method_label: "GCash 0917 •••4432",
    status: "failed",
  },
];