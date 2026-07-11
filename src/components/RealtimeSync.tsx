import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/store/useAuth";
import { useFinance } from "@/store/useFinance";
import { fromDbTransaction, fromDbCategory, fromDbBudget, fromDbSettings } from "@/lib/db-mappers";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

function handleTxChange(payload: RealtimePostgresChangesPayload<any>) {
  const store = useFinance.getState();
  if (payload.eventType === "INSERT") {
    const tx = fromDbTransaction(payload.new);
    const exists = store.transactions.some((t) => t.id === tx.id);
    if (!exists) {
      store.importData({ transactions: [tx, ...store.transactions] });
    }
  } else if (payload.eventType === "UPDATE") {
    const tx = fromDbTransaction(payload.new);
    store.importData({
      transactions: store.transactions.map((t) => (t.id === tx.id ? tx : t)),
    });
  } else if (payload.eventType === "DELETE") {
    store.importData({
      transactions: store.transactions.filter((t) => t.id !== payload.old.id),
    });
  }
}

function handleCategoryChange(payload: RealtimePostgresChangesPayload<any>) {
  const store = useFinance.getState();
  if (payload.eventType === "INSERT") {
    const cat = fromDbCategory(payload.new);
    const exists = store.categories.some((c) => c.id === cat.id);
    if (!exists) {
      store.importData({ categories: [...store.categories, cat] });
    }
  } else if (payload.eventType === "UPDATE") {
    const cat = fromDbCategory(payload.new);
    store.importData({
      categories: store.categories.map((c) => (c.id === cat.id ? cat : c)),
    });
  } else if (payload.eventType === "DELETE") {
    store.importData({
      categories: store.categories.filter((c) => c.id !== payload.old.id),
      budgets: store.budgets.filter((b) => b.categoryId !== payload.old.id),
    });
  }
}

function handleBudgetChange(payload: RealtimePostgresChangesPayload<any>) {
  const store = useFinance.getState();
  if (payload.eventType === "INSERT") {
    const b = fromDbBudget(payload.new);
    const exists = store.budgets.some((x) => x.id === b.id);
    if (!exists) {
      store.importData({ budgets: [...store.budgets, b] });
    }
  } else if (payload.eventType === "UPDATE") {
    const b = fromDbBudget(payload.new);
    store.importData({
      budgets: store.budgets.map((x) => (x.id === b.id ? b : x)),
    });
  } else if (payload.eventType === "DELETE") {
    store.importData({
      budgets: store.budgets.filter((x) => x.id !== payload.old.id),
    });
  }
}

function handleSettingsChange(payload: RealtimePostgresChangesPayload<any>) {
  const store = useFinance.getState();
  if (payload.eventType === "UPDATE" || payload.eventType === "INSERT") {
    store.importData({ settings: fromDbSettings(payload.new) });
  }
}

export function RealtimeSync() {
  const user = useAuth((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("realtime-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` },
        handleTxChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories", filter: `user_id=eq.${user.id}` },
        handleCategoryChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "budgets", filter: `user_id=eq.${user.id}` },
        handleBudgetChange,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_settings", filter: `user_id=eq.${user.id}` },
        handleSettingsChange,
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return null;
}
