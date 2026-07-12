// Placeholder data for the parts of the wallet that are still
// frontend-only: saved payout methods and withdrawal history
// (see host_flow.md §8.3 — a teammate is building the real
// withdrawal backend separately, so this stays local/mock for now).
//
// Balances and the transaction ledger (§8.1 / §8.2) are REAL — they
// come from Client-TiraNa's `wallets` table via:
//   GET /api/host/wallet/summary
//   GET /api/host/wallet/transactions
// (see routes/hostBookings.js on the client backend, and
// src/api/wallet.js on this frontend).

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
];