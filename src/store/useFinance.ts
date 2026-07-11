import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Budget, Category, Settings, Transaction, TxType } from "@/lib/types";
import { DEFAULT_CATEGORIES } from "@/lib/defaults";

interface State {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  settings: Settings;
  _hydrated: boolean;

  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Transaction;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  addCategory: (cat: Omit<Category, "id">) => Category;
  updateCategory: (id: string, patch: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  setBudget: (categoryId: string, limit: number, period?: "monthly" | "weekly") => void;
  deleteBudget: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  resetAll: () => void;
  importData: (data: Partial<State>) => void;
  setHydrated: () => void;
}

const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2)) as string;

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export const useFinance = create<State>()(
  persist(
    (set, get) => ({
      transactions: [],
      categories: DEFAULT_CATEGORIES,
      budgets: [],
      settings: { currency: "IDR", theme: "dark" },
      _hydrated: false,

      addTransaction: (tx) => {
        const newTx: Transaction = { ...tx, id: uid(), createdAt: Date.now() };
        set({ transactions: [newTx, ...get().transactions] });
        return newTx;
      },
      updateTransaction: (id, patch) =>
        set({
          transactions: get().transactions.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }),
      deleteTransaction: (id) =>
        set({ transactions: get().transactions.filter((t) => t.id !== id) }),

      addCategory: (cat) => {
        const newCat: Category = { ...cat, id: uid() };
        set({ categories: [...get().categories, newCat] });
        return newCat;
      },
      updateCategory: (id, patch) =>
        set({
          categories: get().categories.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        }),
      deleteCategory: (id) =>
        set({
          categories: get().categories.filter((c) => c.id !== id),
          budgets: get().budgets.filter((b) => b.categoryId !== id),
        }),

      setBudget: (categoryId, limit, period = "monthly") => {
        const existing = get().budgets.find((b) => b.categoryId === categoryId);
        if (existing) {
          set({
            budgets: get().budgets.map((b) => (b.id === existing.id ? { ...b, limit, period } : b)),
          });
        } else {
          set({
            budgets: [...get().budgets, { id: uid(), categoryId, limit, period }],
          });
        }
      },
      deleteBudget: (id) => set({ budgets: get().budgets.filter((b) => b.id !== id) }),

      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
      resetAll: () =>
        set({
          transactions: [],
          categories: DEFAULT_CATEGORIES,
          budgets: [],
          settings: { currency: "IDR", theme: "dark" },
        }),
      importData: (data) =>
        set({
          transactions: data.transactions ?? get().transactions,
          categories: data.categories ?? get().categories,
          budgets: data.budgets ?? get().budgets,
          settings: data.settings ?? get().settings,
        }),
      setHydrated: () => set({ _hydrated: true }),
    }),
    {
      name: "money-tracker-v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : (noopStorage as unknown as Storage),
      ),
      partialize: (s) => ({
        transactions: s.transactions,
        categories: s.categories,
        budgets: s.budgets,
        settings: s.settings,
      }),
      skipHydration: true,
    },
  ),
);

export function useHydrated() {
  return useFinance((s) => s._hydrated);
}
