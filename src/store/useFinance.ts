import { create } from "zustand";
import type { Budget, Category, Settings, Transaction, TxType } from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/defaults";
import { supabase } from "@/lib/supabase";
import {
  toDbCategory,
  toDbTransaction,
  toDbBudget,
  fromDbCategory,
  fromDbTransaction,
  fromDbBudget,
  fromDbSettings,
} from "@/lib/db-mappers";

interface State {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  settings: Settings;
  _hydrated: boolean;
  _loading: boolean;

  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<Transaction>;
  updateTransaction: (id: string, patch: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  addCategory: (cat: Omit<Category, "id">) => Promise<Category>;
  updateCategory: (id: string, patch: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  setBudget: (categoryId: string, limit: number, period?: "monthly" | "weekly") => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  resetAll: () => Promise<void>;
  importData: (data: Partial<State>) => void;
  setHydrated: () => void;
  fetchAll: () => Promise<void>;
  migrateFromLocalStorage: () => Promise<void>;
}

const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)) as string;

export const useFinance = create<State>()((set, get) => ({
  transactions: [],
  categories: [],
  budgets: [],
  settings: { currency: "IDR", theme: "dark" },
  _hydrated: false,
  _loading: false,

  fetchAll: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    set({ _loading: true });

    const [txResult, catResult, budResult, settingsResult] = await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("categories").select("*").eq("user_id", user.id),
      supabase.from("budgets").select("*").eq("user_id", user.id),
      supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    const txData = (txResult.data ?? []).map(fromDbTransaction);
    let catData = (catResult.data ?? []).map(fromDbCategory);
    const budData = (budResult.data ?? []).map(fromDbBudget);
    const settingsData = settingsResult.data
      ? fromDbSettings(settingsResult.data)
      : { currency: "IDR", theme: "dark" };

    if (catData.length === 0) {
      const defaults = DEFAULT_CATEGORIES.map((cat) => ({
        ...toDbCategory(cat, user.id),
        id: uid(),
      }));
      const { data: inserted, error: seedErr } = await supabase
        .from("categories")
        .insert(defaults)
        .select();
      if (seedErr) {
        console.error("[seed categories] gagal:", seedErr);
      }
      if (inserted) {
        catData = inserted.map(fromDbCategory);
        console.log("[seed categories] berhasil:", inserted.length, "kategori");
      }
    }

    get().importData({
      transactions: txData,
      categories: catData,
      budgets: budData,
      settings: settingsData,
    });

    set({ _loading: false, _hydrated: true });
  },

  addTransaction: async (tx) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const newTx: Transaction = { ...tx, id: uid(), createdAt: Date.now() };
    const { error } = await supabase.from("transactions").insert(toDbTransaction(newTx, user.id));
    if (error) throw error;

    set({ transactions: [newTx, ...get().transactions] });
    return newTx;
  },

  updateTransaction: async (id, patch) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const dbPatch: Record<string, unknown> = {};
    if (patch.type !== undefined) dbPatch.type = patch.type;
    if (patch.amount !== undefined) dbPatch.amount = patch.amount;
    if (patch.categoryId !== undefined) dbPatch.category_id = patch.categoryId;
    if (patch.date !== undefined) dbPatch.date = patch.date;
    if (patch.note !== undefined) dbPatch.note = patch.note;

    const { error } = await supabase
      .from("transactions")
      .update(dbPatch)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;

    set({
      transactions: get().transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    });
  },

  deleteTransaction: async (id) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;

    set({ transactions: get().transactions.filter((t) => t.id !== id) });
  },

  addCategory: async (cat) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const newCat: Category = { ...cat, id: uid() };
    const { error } = await supabase.from("categories").insert(toDbCategory(newCat, user.id));
    if (error) throw error;

    set({ categories: [...get().categories, newCat] });
    return newCat;
  },

  updateCategory: async (id, patch) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.icon !== undefined) dbPatch.icon = patch.icon;
    if (patch.color !== undefined) dbPatch.color = patch.color;
    if (patch.type !== undefined) dbPatch.type = patch.type;

    const { error } = await supabase
      .from("categories")
      .update(dbPatch)
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;

    set({
      categories: get().categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  },

  deleteCategory: async (id) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;

    set({
      categories: get().categories.filter((c) => c.id !== id),
      budgets: get().budgets.filter((b) => b.categoryId !== id),
    });
  },

  setBudget: async (categoryId, limit, period = "monthly") => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const existing = get().budgets.find((b) => b.categoryId === categoryId);
    if (existing) {
      const { error } = await supabase
        .from("budgets")
        .update({ limit_amount: limit, period })
        .eq("id", existing.id)
        .eq("user_id", user.id);
      if (error) throw error;

      set({
        budgets: get().budgets.map((b) => (b.id === existing.id ? { ...b, limit, period } : b)),
      });
    } else {
      const newBudget: Budget = { id: uid(), categoryId, limit, period };
      const { error } = await supabase.from("budgets").insert(toDbBudget(newBudget, user.id));
      if (error) throw error;

      set({ budgets: [...get().budgets, newBudget] });
    }
  },

  deleteBudget: async (id) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase.from("budgets").delete().eq("id", id).eq("user_id", user.id);
    if (error) throw error;

    set({ budgets: get().budgets.filter((b) => b.id !== id) });
  },

  updateSettings: async (patch) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, ...patch, updated_at: new Date().toISOString() });

    if (error) throw error;

    const next = { ...get().settings, ...patch };
    set({ settings: next });

    localStorage.setItem("money-tracker-theme", next.theme);
  },

  resetAll: async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    await Promise.all([
      supabase.from("transactions").delete().eq("user_id", user.id),
      supabase.from("budgets").delete().eq("user_id", user.id),
      supabase.from("categories").delete().eq("user_id", user.id).neq("id", ""),
      supabase.from("user_settings").upsert({ user_id: user.id, currency: "IDR", theme: "dark" }),
    ]);

    const defaults = DEFAULT_CATEGORIES.map((cat) => ({
      ...toDbCategory(cat, user.id),
      id: uid(),
    }));
    const { data: inserted, error: seedErr } = await supabase
      .from("categories")
      .insert(defaults)
      .select();
    if (seedErr) {
      console.error("[seed categories reset] gagal:", seedErr);
    }
    if (inserted) {
      console.log("[seed categories reset] berhasil:", inserted.length, "kategori");
    }

    set({
      transactions: [],
      categories: inserted ? inserted.map(fromDbCategory) : [],
      budgets: [],
      settings: { currency: "IDR", theme: "dark" },
    });
  },

  importData: (data) =>
    set({
      transactions: data.transactions ?? get().transactions,
      categories: data.categories ?? get().categories,
      budgets: data.budgets ?? get().budgets,
      settings: data.settings ?? get().settings,
    }),

  setHydrated: () => set({ _hydrated: true }),

  migrateFromLocalStorage: async () => {
    const raw = localStorage.getItem("money-tracker-v1");
    if (!raw) return;

    const parsed = JSON.parse(raw);
    const state = parsed.state;
    if (!state?.transactions?.length && !state?.categories?.length) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const uploadCategories = (state.categories ?? []).map((c: Category) =>
      toDbCategory(c, user.id),
    );
    if (uploadCategories.length > 0) {
      await supabase.from("categories").upsert(uploadCategories, { onConflict: "id" });
    }

    const uploadTransactions = (state.transactions ?? []).map((t: Transaction) =>
      toDbTransaction(t, user.id),
    );
    if (uploadTransactions.length > 0) {
      await supabase.from("transactions").upsert(uploadTransactions, { onConflict: "id" });
    }

    const uploadBudgets = (state.budgets ?? []).map((b: Budget) => toDbBudget(b, user.id));
    if (uploadBudgets.length > 0) {
      await supabase.from("budgets").upsert(uploadBudgets, { onConflict: "id" });
    }

    if (state.settings) {
      await supabase.from("user_settings").upsert({ user_id: user.id, ...state.settings });
    }

    localStorage.removeItem("money-tracker-v1");

    await get().fetchAll();
  },
}));

export function useHydrated() {
  return useFinance((s) => s._hydrated);
}
