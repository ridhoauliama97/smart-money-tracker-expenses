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
}
