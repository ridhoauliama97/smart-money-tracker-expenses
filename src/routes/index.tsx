import { createFileRoute } from "@tanstack/react-router";
import { useContext, useMemo, useState } from "react";
import { IconReceipt } from "@tabler/icons-react";
import { BanknoteArrowDown, BanknoteArrowUp, Eye, EyeOff, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TransactionItem } from "@/components/TransactionItem";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Progress } from "@/components/ui/progress";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { AddTransactionContext } from "@/components/AppShell";
import { useFinance } from "@/store/useFinance";
import { useAuth } from "@/store/useAuth";
import { useProfile } from "@/store/useProfile";
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

function greetingByHour() {
  const h = new Date().getHours();
  if (h < 12) return "Selamat pagi!👋";
  if (h <= 15) return "Selamat siang!👋";
  if (h <= 18) return "Selamat sore!👋";
  return "Selamat malam!👋";
}

function Home() {
  const [hidden, setHidden] = useState(false);
  const openAdd = useContext(AddTransactionContext);
  const user = useAuth((s) => s.user);
  const profile = useProfile((s) => s.profile);
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

  const sparklineBalances = useMemo(() => {
    const today = new Date();
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      days.push(`${y}-${m}-${day}`);
    }
    const sorted = [...transactions].sort((a, b) => (a.date < b.date ? -1 : 1));
    const balances: number[] = [];
    let running = 0;
    let txIdx = 0;
    for (const day of days) {
      while (txIdx < sorted.length && sorted[txIdx].date <= day) {
        running += sorted[txIdx].type === "income" ? sorted[txIdx].amount : -sorted[txIdx].amount;
        txIdx++;
      }
      balances.push(running);
    }
    return balances;
  }, [transactions]);

  const sparklinePoints = useMemo(() => {
    if (sparklineBalances.length < 2) return "";
    const min = Math.min(...sparklineBalances);
    const max = Math.max(...sparklineBalances);
    const range = max - min || 1;
    const w = 300 / (sparklineBalances.length - 1);
    return sparklineBalances
      .map((v, i) => {
        const x = i * w;
        const y = 30 - ((v - min) / range) * 24;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [sparklineBalances]);

  const recent = transactions.slice(0, 7);
  const grouped = useMemo(() => groupByDate(recent), [recent]);

  const budgetsWithUsage = useMemo(() => {
    const mk = monthKey(todayISO());
    return budgets
      .map((b) => {
        const spent = transactions
          .filter(
            (t) => t.type === "expense" && t.categoryId === b.categoryId && monthKey(t.date) === mk,
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
      {/* Topbar */}
      <div className="flex items-start justify-between pt-2">
        <div>
          <div className="text-[13px] text-muted-foreground">{greetingByHour()}</div>
          <div className="mt-0.5 font-display text-[22px] font-semibold text-foreground">
            {profile?.name || user?.email || "Pengguna"}
          </div>
        </div>
        <div className="relative hidden grid h-[42px] w-[42px] place-items-center rounded-[14px] border border-border/50 bg-surface">
          <User className="h-5 w-5 text-muted-foreground" />
          <div className="absolute right-[9px] top-[9px] h-[7px] w-[7px] rounded-full bg-lime shadow-[0_0_8px_var(--lime)]" />
        </div>
      </div>

      {/* Hero card */}
      <div className="relative mt-6 overflow-hidden rounded-[26px] border border-border/50 p-6 gradient-hero">
        <div
          className="pointer-events-none absolute -right-[40%] -top-[40%] h-[220px] w-[220px] blur-sm"
          style={{
            background: "radial-gradient(circle, rgba(200,255,82,0.18), transparent 70%)",
          }}
        />
        <div className="relative z-[2]">
          {/* Label + eye toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-medium uppercase tracking-[1.2px] text-muted-foreground">
              Total saldo
            </span>
            <button
              type="button"
              onClick={() => setHidden((h) => !h)}
              className="grid h-[30px] w-[30px] place-items-center rounded-[9px] border border-border bg-surface text-foreground"
            >
              {hidden ? (
                <EyeOff className="h-[15px] w-[15px]" />
              ) : (
                <Eye className="h-[15px] w-[15px]" />
              )}
            </button>
          </div>
          {/* Balance */}
          <div className="font-mono text-[33px] font-semibold tracking-[-0.5px] text-foreground">
            {hidden ? "Rp ••••••••" : formatCurrency(balance, currency)}
          </div>
          {/* Sparkline */}
          {sparklineBalances.length >= 2 && (
            <div className="relative z-[2] mb-[18px] mt-[6px] h-[34px]">
              <svg viewBox="0 0 300 34" preserveAspectRatio="none" className="h-full w-full">
                <defs>
                  <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopOpacity="0.22" style={{ stopColor: "var(--lime)" }} />
                    <stop offset="100%" stopOpacity="0" style={{ stopColor: "var(--lime)" }} />
                  </linearGradient>
                </defs>
                <polyline
                  points={sparklinePoints}
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                  style={{ stroke: "var(--lime)" }}
                />
                <polyline
                  points={`${sparklinePoints} 300,34 0,34`}
                  fill="url(#sparkFill)"
                  stroke="none"
                />
              </svg>
            </div>
          )}
          {/* Stat chips */}
          <div className="grid grid-cols-2 gap-[10px]">
            <StatMini
              label="Pemasukan"
              value={formatCurrency(incomeMonth, currency)}
              variant="income"
            />
            <StatMini
              label="Pengeluaran"
              value={formatCurrency(expenseMonth, currency)}
              variant="expense"
            />
          </div>
        </div>
      </div>

      {/* Budget alerts */}
      {budgetsWithUsage.length > 0 && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">
              Budget Terpakai
            </h2>
            <span className="text-xs text-muted-foreground">Bulan ini</span>
          </div>
          <div className="space-y-2">
            {budgetsWithUsage.map(({ budget, spent, cat, pct }) => (
              <div key={budget.id} className="rounded-2xl border border-border/50 bg-surface p-3">
                <div className="flex items-center gap-3">
                  <CategoryIcon name={cat?.icon ?? "Circle"} color={cat?.color} size={16} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-foreground">
                        {cat?.name}
                      </span>
                      <span
                        className={cn(
                          "tnum text-xs font-semibold",
                          pct >= 100 ? "text-coral" : pct >= 80 ? "text-amber" : "text-lime",
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
                          ? "[&>div]:bg-coral"
                          : pct >= 80
                            ? "[&>div]:bg-amber"
                            : "[&>div]:bg-lime",
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaksi Terbaru */}
      <div className="mt-6">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-foreground">
            Transaksi terbaru
          </h2>
          <span className="text-[12.5px] font-medium text-teal">Lihat semua</span>
        </div>
        {recent.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconReceipt />
              </EmptyMedia>
              <EmptyTitle>Belum Ada Transaksi</EmptyTitle>
              <EmptyDescription>
                Mulai catat pemasukan atau pengeluaran pertama Anda dengan mengetuk tombol{" "}
                <span className="font-semibold">+</span> di bawah.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={openAdd}>Tambah Transaksi Baru</Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="space-y-3">
            {grouped.map(([date, items]) => (
              <div key={date}>
                <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[1px] text-muted-foreground">
                  {formatDateLabel(date)}
                </div>
                <div>
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
  variant,
}: {
  label: string;
  value: string;
  variant: "income" | "expense";
}) {
  const isIncome = variant === "income";
  return (
    <div className="rounded-[16px] border border-border/50 bg-card p-3">
      <div className="flex items-center gap-[7px]">
        <div
          className={cn(
            "grid h-[22px] w-[22px] place-items-center rounded-[7px]",
            isIncome ? "bg-lime/15 text-lime" : "bg-coral/15 text-coral",
          )}
        >
          {isIncome ? (
            <BanknoteArrowUp className="h-3 w-3" strokeWidth={2.4} />
          ) : (
            <BanknoteArrowDown className="h-3 w-3" strokeWidth={2.4} />
          )}
        </div>
        <span className="text-[11.5px] text-muted-foreground">{label}</span>
      </div>
      <div className="mt-2 font-mono text-[15px] font-semibold text-foreground">{value}</div>
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
