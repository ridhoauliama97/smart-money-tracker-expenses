import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ArrowDownRight, ArrowUpRight, Sparkles, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TransactionItem } from "@/components/TransactionItem";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Progress } from "@/components/ui/progress";
import { useFinance } from "@/store/useFinance";
import { formatCurrency, formatDateLabel, monthKey, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Beranda — Money Tracker" },
      {
        name: "description",
        content: "Lihat saldo, ringkasan bulanan, dan transaksi terbaru Anda.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Home />
    </AppShell>
  ),
});

function Home() {
  const transactions = useFinance((s) => s.transactions);
  const budgets = useFinance((s) => s.budgets);
  const categories = useFinance((s) => s.categories);
  const currency = useFinance((s) => s.settings.currency);

  const { balance, incomeMonth, expenseMonth } = useMemo(() => {
    const mk = monthKey(todayISO());
    let inc = 0,
      exp = 0,
      bal = 0;
    for (const t of transactions) {
      const signed = t.type === "income" ? t.amount : -t.amount;
      bal += signed;
      if (monthKey(t.date) === mk) {
        if (t.type === "income") inc += t.amount;
        else exp += t.amount;
      }
    }
    return { balance: bal, incomeMonth: inc, expenseMonth: exp };
  }, [transactions]);

  const recent = transactions.slice(0, 7);
  const grouped = useMemo(() => groupByDate(recent), [recent]);

  const budgetsWithUsage = useMemo(() => {
    const mk = monthKey(todayISO());
    return budgets
      .map((b) => {
        const spent = transactions
          .filter(
            (t) =>
              t.type === "expense" && t.categoryId === b.categoryId && monthKey(t.date) === mk,
          )
          .reduce((s, t) => s + t.amount, 0);
        const cat = categories.find((c) => c.id === b.categoryId);
        return { budget: b, spent, cat, pct: b.limit > 0 ? (spent / b.limit) * 100 : 0 };
      })
      .filter((x) => x.pct >= 60)
      .sort((a, b) => b.pct - a.pct)
      .slice(0, 3);
  }, [budgets, transactions, categories]);

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <div className="text-xs text-muted-foreground">Selamat datang</div>
          <div className="text-lg font-semibold">Money Tracker</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-full bg-surface">
          <Sparkles className="h-5 w-5 text-brand" />
        </div>
      </div>

      {/* Balance card */}
      <div className="relative mt-5 overflow-hidden rounded-3xl p-5 gradient-hero">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <div className="text-xs font-medium uppercase tracking-wider text-white/70">
            Total Saldo
          </div>
          <div
            key={balance}
            className="tnum animate-count mt-1 text-3xl font-bold text-white"
          >
            {formatCurrency(balance, currency)}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <StatMini
              label="Pemasukan"
              value={formatCurrency(incomeMonth, currency)}
              icon={<ArrowDownRight className="h-4 w-4" />}
              variant="income"
            />
            <StatMini
              label="Pengeluaran"
              value={formatCurrency(expenseMonth, currency)}
              icon={<ArrowUpRight className="h-4 w-4" />}
              variant="expense"
            />
          </div>
        </div>
      </div>

      {/* Budget alerts */}
      {budgetsWithUsage.length > 0 && (
        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Budget Terpakai</h2>
            <span className="text-xs text-muted-foreground">Bulan ini</span>
          </div>
          <div className="space-y-2">
            {budgetsWithUsage.map(({ budget, spent, cat, pct }) => (
              <div key={budget.id} className="rounded-2xl bg-surface p-3">
                <div className="flex items-center gap-3">
                  <CategoryIcon name={cat?.icon ?? "Circle"} color={cat?.color} size={16} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{cat?.name}</span>
                      <span
                        className={cn(
                          "tnum text-xs font-semibold",
                          pct >= 100 ? "text-expense" : pct >= 80 ? "text-amber-400" : "text-income",
                        )}
                      >
                        {pct.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted-foreground tnum">
                      {formatCurrency(spent, currency)} / {formatCurrency(budget.limit, currency)}
                    </div>
                    <Progress
                      value={Math.min(pct, 100)}
                      className={cn(
                        "mt-2 h-1.5",
                        pct >= 100
                          ? "[&>div]:bg-expense"
                          : pct >= 80
                            ? "[&>div]:bg-amber-400"
                            : "[&>div]:bg-income",
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Transaksi Terbaru</h2>
        </div>

        {recent.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {grouped.map(([date, items]) => (
              <div key={date}>
                <div className="mb-1 px-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {formatDateLabel(date)}
                </div>
                <div className="rounded-2xl bg-surface/50 p-1">
                  {items.map((tx) => (
                    <TransactionItem key={tx.id} tx={tx} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatMini({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  variant: "income" | "expense";
}) {
  return (
    <div className="rounded-2xl bg-black/25 p-3 backdrop-blur">
      <div className="flex items-center gap-1.5 text-[11px] text-white/70">
        <span
          className={cn(
            "grid h-5 w-5 place-items-center rounded-full",
            variant === "income" ? "bg-income/30 text-white" : "bg-expense/30 text-white",
          )}
        >
          {icon}
        </span>
        {label}
      </div>
      <div className="tnum mt-1 truncate text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 flex flex-col items-center rounded-3xl border border-dashed border-border/70 p-8 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface">
        <TrendingUp className="h-6 w-6 text-brand" />
      </div>
      <div className="mt-3 text-sm font-medium">Belum ada transaksi</div>
      <div className="mt-1 text-xs text-muted-foreground">
        Ketuk tombol + di bawah untuk mencatat transaksi pertama Anda.
      </div>
    </div>
  );
}

function groupByDate<T extends { date: string }>(items: T[]): [string, T[]][] {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const arr = map.get(it.date) ?? [];
    arr.push(it);
    map.set(it.date, arr);
  }
  return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
}
