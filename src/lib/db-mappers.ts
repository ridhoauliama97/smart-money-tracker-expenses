import type { Category, Transaction, Budget, Settings } from "./types";

export const toDbCategory = (cat: Category, userId: string) => ({
  id: cat.id,
  user_id: userId,
  name: cat.name,
  icon: cat.icon,
  color: cat.color,
  type: cat.type,
});

export const toDbTransaction = (tx: Transaction, userId: string) => ({
  id: tx.id,
  user_id: userId,
  type: tx.type,
  amount: tx.amount,
  category_id: tx.categoryId,
  date: tx.date,
  note: tx.note ?? null,
  created_at: new Date(tx.createdAt).toISOString(),
});

export const toDbBudget = (budget: Budget, userId: string) => ({
  id: budget.id,
  user_id: userId,
  category_id: budget.categoryId,
  limit_amount: budget.limit,
  period: budget.period,
});

export const fromDbCategory = (row: any): Category => ({
  id: row.id,
  name: row.name,
  icon: row.icon,
  color: row.color,
  type: row.type,
});

export const fromDbTransaction = (row: any): Transaction => ({
  id: row.id,
  type: row.type,
  amount: Number(row.amount),
  categoryId: row.category_id,
  date: row.date,
  note: row.note ?? undefined,
  createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
});

export const fromDbBudget = (row: any): Budget => ({
  id: row.id,
  categoryId: row.category_id,
  limit: Number(row.limit_amount),
  period: row.period,
});

export const fromDbSettings = (row: any): Settings => ({
  currency: row.currency ?? "IDR",
  theme: row.theme ?? "dark",
});
