export type TxType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  color: string; // css color token or hex
  type: TxType | "both";
}

export interface Transaction {
  id: string;
  type: TxType;
  amount: number;
  categoryId: string;
  date: string; // ISO date (yyyy-mm-dd)
  note?: string;
  createdAt: number;
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  period: "monthly" | "weekly";
}

export interface Settings {
  currency: "IDR" | "USD" | "EUR";
  theme: "dark" | "light" | "system";
}

export type AppNotificationType =
  "budget_warning" | "budget_exceeded" | "large_transaction" | "daily_reminder";

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  read: boolean;
  createdAt: number;
  data?: { categoryId?: string; transactionId?: string; amount?: number };
}

export interface NotificationPrefs {
  budgetWarning: boolean;
  budgetExceeded: boolean;
  largeTransaction: boolean;
  largeTransactionThreshold: number;
  dailyReminder: boolean;
  dailyReminderTime: string;
}
