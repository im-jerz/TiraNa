import { useState, useEffect, useCallback } from "react";
import {
  getWallet,
  getPayoutMethods,
  getTransactions,
  getWithdrawals,
  submitWithdrawal,
  retryWithdrawal,
  addPayoutMethod,
} from "../../api/wallet";

export default function useWalletData() {
  const [wallet, setWallet] = useState(null);
  const [methods, setMethods] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, m, t, wd] = await Promise.all([
        getWallet(),
        getPayoutMethods(),
        getTransactions(),
        getWithdrawals(),
      ]);
      setWallet(w);
      setMethods(m);
      setTransactions(t);
      setWithdrawals(wd);
    } catch (err) {
      setError(err?.message ?? "Couldn't load your wallet. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const requestWithdrawal = useCallback(async ({ amount, methodId }) => {
    const result = await submitWithdrawal({ amount, methodId });
    await load();
    return result;
  }, [load]);

  const retry = useCallback(async (id) => {
    await retryWithdrawal(id);
    await load();
  }, [load]);

  const saveMethod = useCallback(async (input) => {
    const method = await addPayoutMethod(input);
    setMethods((prev) => [...prev, method]);
    return method;
  }, []);

  return {
    wallet,
    methods,
    transactions,
    withdrawals,
    loading,
    error,
    reload: load,
    requestWithdrawal,
    retry,
    saveMethod,
  };
}