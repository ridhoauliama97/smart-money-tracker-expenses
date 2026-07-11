import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppNotification,
  AppNotificationType,
  Budget,
  Category,
  NotificationPrefs,
  Transaction,
} from "@/lib/types";

interface NotificationState {
  notifications: AppNotification[];
  prefs: NotificationPrefs;
  addNotification: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
  updatePrefs: (patch: Partial<NotificationPrefs>) => void;
}

function uid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

export const useNotifications = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],
      prefs: {
        budgetWarning: true,
        budgetExceeded: true,
        largeTransaction: true,
        largeTransactionThreshold: 1_000_000,
        dailyReminder: false,
        dailyReminderTime: "20:00",
      },

      addNotification: (n) => {
        const notif: AppNotification = {
          ...n,
          id: uid(),
          read: false,
          createdAt: Date.now(),
        };
        set({ notifications: [notif, ...get().notifications] });
      },

      markRead: (id) => {
        set({
          notifications: get().notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        });
      },

      markAllRead: () => {
        set({
          notifications: get().notifications.map((n) => ({ ...n, read: true })),
        });
      },

      clearAll: () => set({ notifications: [] }),

      updatePrefs: (patch) => {
        set({ prefs: { ...get().prefs, ...patch } });
      },
    }),
    { name: "money-tracker-notifications-v1" },
  ),
);

export function checkAndNotifyAfterTransaction(
  tx: Transaction,
  budgets: Budget[],
  categories: Category[],
  allTransactions: Transaction[],
  prefs: NotificationPrefs,
  addNotification: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void,
) {
  if (tx.type !== "expense") return;

  const budget = budgets.find((b) => b.categoryId === tx.categoryId);
  if (!budget) return;

  const monthPrefix = tx.date.slice(0, 7);
  const totalSpent = allTransactions
    .filter(
      (t) =>
        t.type === "expense" && t.categoryId === tx.categoryId && t.date.startsWith(monthPrefix),
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const cat = categories.find((c) => c.id === tx.categoryId);
  const catName = cat?.name ?? "Kategori";
  const pct = (totalSpent / budget.limit) * 100;

  if (pct >= 100 && prefs.budgetExceeded) {
    addNotification({
      type: "budget_exceeded",
      title: "Budget Terlewati",
      message: `Budget ${catName} sudah terlewati (${pct.toFixed(0)}% dari Rp${budget.limit.toLocaleString("id-ID")})`,
      data: { categoryId: tx.categoryId, transactionId: tx.id, amount: totalSpent },
    });
  } else if (pct >= 80 && prefs.budgetWarning) {
    addNotification({
      type: "budget_warning",
      title: "Budget Hampir Habis",
      message: `Budget ${catName} sudah ${pct.toFixed(0)}% terpakai dari Rp${budget.limit.toLocaleString("id-ID")}`,
      data: { categoryId: tx.categoryId, transactionId: tx.id, amount: totalSpent },
    });
  }

  if (prefs.largeTransaction && tx.amount >= prefs.largeTransactionThreshold) {
    addNotification({
      type: "large_transaction",
      title: "Transaksi Besar",
      message: `Pengeluaran sebesar Rp${tx.amount.toLocaleString("id-ID")} untuk ${catName}`,
      data: { categoryId: tx.categoryId, transactionId: tx.id, amount: tx.amount },
    });
  }
}

export function checkDailyReminder(
  allTransactions: Transaction[],
  prefs: NotificationPrefs,
  existingNotifications: AppNotification[],
  addNotification: (n: Omit<AppNotification, "id" | "read" | "createdAt">) => void,
) {
  if (!prefs.dailyReminder) return;

  const today = new Date().toISOString().slice(0, 10);
  const hasTransactionToday = allTransactions.some((t) => t.date === today);
  if (hasTransactionToday) return;

  const alreadyNotified = existingNotifications.some(
    (n) => n.type === "daily_reminder" && n.createdAt > Date.now() - 86400000,
  );
  if (alreadyNotified) return;

  addNotification({
    type: "daily_reminder",
    title: "Pengingat Catat Transaksi",
    message: "Kamu belum mencatat transaksi apa pun hari ini. Yuk catat sekarang!",
  });
}
