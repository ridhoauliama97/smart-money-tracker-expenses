import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarIcon, RotateCcw, FileText, FileSpreadsheet, Braces, Table } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/AppShell";
import { useFinance } from "@/store/useFinance";
import { formatCurrency, formatCompact, formatDateLong, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import { exportPDF, exportXLSX } from "@/lib/export";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Laporan — Money Tracker" },
      {
        name: "description",
        content: "Analisis pengeluaran, tren bulanan, dan ringkasan saldo Anda.",
      },
    ],
  }),
  component: () => (
    <AppShell>
      <Reports />
    </AppShell>
  ),
});

type Period = "week" | "month" | "3m" | "custom";

function isoToLocalDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function localDateToISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function Reports() {
  const [period, setPeriod] = useState<Period>("month");
  const [customFrom, setCustomFrom] = useState(todayISO());
  const [customTo, setCustomTo] = useState(todayISO());
  const [rangeOpen, setRangeOpen] = useState(false);
  const transactions = useFinance((s) => s.transactions);
  const categories = useFinance((s) => s.categories);
  const currency = useFinance((s) => s.settings.currency);

  const filtered = useMemo(() => {
    if (period === "custom")
      return transactions.filter((t) => t.date >= customFrom && t.date <= customTo);
    const now = new Date();
    const start = new Date();
    if (period === "week") start.setDate(now.getDate() - 7);
    if (period === "month") start.setMonth(now.getMonth() - 1);
    if (period === "3m") start.setMonth(now.getMonth() - 3);
    const s = start.toISOString().slice(0, 10);
    return transactions.filter((t) => t.date >= s);
  }, [transactions, period, customFrom, customTo]);

  const pieData = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filtered) {
      if (t.type !== "expense") continue;
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    }
    return Array.from(map.entries())
      .map(([cid, value]) => {
        const cat = categories.find((c) => c.id === cid);
        return { name: cat?.name ?? "Lain", value, color: cat?.color ?? "#64748b" };
      })
      .sort((a, b) => b.value - a.value);
  }, [filtered, categories]);

  const totalExpense = pieData.reduce((s, d) => s + d.value, 0);

  const monthlyBars = useMemo(() => {
    const months: { key: string; label: string; income: number; expense: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        key,
        label: d.toLocaleDateString("id-ID", { month: "short" }),
        income: 0,
        expense: 0,
      });
    }
    for (const t of transactions) {
      const key = t.date.slice(0, 7);
      const row = months.find((m) => m.key === key);
      if (row) {
        if (t.type === "income") row.income += t.amount;
        else row.expense += t.amount;
      }
    }
    return months;
  }, [transactions]);

  const balanceLine = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => (a.date < b.date ? -1 : 1));
    let running = 0;
    const map = new Map<string, number>();
    for (const t of sorted) {
      running += t.type === "income" ? t.amount : -t.amount;
      map.set(t.date, running);
    }
    return Array.from(map.entries())
      .slice(-30)
      .map(([date, balance]) => ({ date: date.slice(5), balance }));
  }, [transactions]);

  const exportCSV = () => {
    const rows = [
      ["date", "type", "amount", "category", "note"],
      ...transactions.map((t) => [
        t.date,
        t.type,
        String(t.amount),
        categories.find((c) => c.id === t.categoryId)?.name ?? "",
        t.note?.replace(/"/g, '""') ?? "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    downloadFile("transactions.csv", csv, "text/csv");
  };

  const exportJSON = () => {
    const data = { transactions, categories, budgets: useFinance.getState().budgets };
    downloadFile("money-tracker.json", JSON.stringify(data, null, 2), "application/json");
  };

  const periodLabel = useMemo(() => {
    if (period === "custom") return `${formatDateLong(customFrom)} – ${formatDateLong(customTo)}`;
    if (filtered.length === 0) return "Tidak ada data";
    const dates = filtered.map((t) => t.date).sort();
    const start = dates[0];
    const end = dates[dates.length - 1];
    const suffix =
      period === "week"
        ? " (7 Hari)"
        : period === "month"
          ? " (30 Hari)"
          : period === "3m"
            ? " (90 Hari)"
            : "";
    return `${formatDateLong(start)} – ${formatDateLong(end)}${suffix}`;
  }, [filtered, period, customFrom, customTo]);

  const runExport = (kind: "pdf" | "xlsx") => {
    if (filtered.length === 0) {
      toast.error("Tidak ada data untuk di-export");
      return;
    }
    const payload = { transactions: filtered, categories, currency, periodLabel };
    try {
      if (kind === "pdf") exportPDF(payload);
      else exportXLSX(payload);
      toast.success(`Export ${kind.toUpperCase()} berhasil`);
    } catch {
      toast.error(`Gagal export ${kind.toUpperCase()}`);
    }
  };

  return (
    <div className="p-4">
      <div className="pt-2">
        <div className="text-xs text-muted-foreground">Analisis</div>
        <h1 className="text-2xl font-bold">Laporan</h1>
      </div>

      {/* Period filter */}
      <div className="mt-4 grid grid-cols-4 gap-1 rounded-xl bg-surface p-1 text-xs">
        {(
          [
            { k: "week", l: "7 Hari" },
            { k: "month", l: "30 Hari" },
            { k: "3m", l: "90 Hari" },
            { k: "custom", l: "Custom" },
          ] as { k: Period; l: string }[]
        ).map((o) => (
          <button
            key={o.k}
            onClick={() => setPeriod(o.k)}
            className={cn(
              "rounded-lg py-2 font-medium transition",
              period === o.k ? "bg-primary/15 text-primary" : "text-muted-foreground",
            )}
          >
            {o.l}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="mt-2">
          <Popover open={rangeOpen} onOpenChange={setRangeOpen}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Button
                  variant="outline"
                  className="w-full justify-start rounded-xl border-border bg-surface pr-10 font-normal text-foreground hover:bg-surface-2"
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                  {customFrom === customTo
                    ? formatDateLong(customFrom)
                    : `${formatDateLong(customFrom)} – ${formatDateLong(customTo)}`}
                </Button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCustomFrom(todayISO());
                    setCustomTo(todayISO());
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
                  aria-label="Reset tanggal"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto rounded-xl border-border bg-surface p-0"
              align="start"
            >
              <Calendar
                mode="range"
                selected={{ from: isoToLocalDate(customFrom), to: isoToLocalDate(customTo) }}
                onSelect={(range) => {
                  if (!range) return;
                  if (range.from) setCustomFrom(localDateToISO(range.from));
                  if (range.to) setCustomTo(localDateToISO(range.to));
                  if (range.from && range.to) setRangeOpen(false);
                }}
                numberOfMonths={1}
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Donut */}
      <Card title="Pengeluaran per Kategori">
        {pieData.length === 0 ? (
          <EmptyChart />
        ) : (
          <>
            <div className="relative h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={68}
                    outerRadius={92}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => formatCurrency(v, currency)}
                    contentStyle={tooltipStyle}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="tnum pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Total
                </div>
                <div className="max-w-27.5 truncate text-center text-sm font-bold">
                  {formatCurrency(totalExpense, currency)}
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {pieData.slice(0, 6).map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />
                    <span className="text-foreground">{p.name}</span>
                  </div>
                  <span className="tnum text-muted-foreground">
                    {formatCurrency(p.value, currency)} ·{" "}
                    {((p.value / totalExpense) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Bars */}
      <Card title="Income vs Expense — 6 Bulan">
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={monthlyBars} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={formatCompact}
              />
              <Tooltip
                formatter={(v: number) => formatCurrency(v, currency)}
                contentStyle={tooltipStyle}
                cursor={{ fill: "color-mix(in oklab, var(--foreground) 4%, transparent)" }}
              />
              <Bar dataKey="income" fill="var(--income)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" fill="var(--expense)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Line */}
      <Card title="Tren Saldo">
        {balanceLine.length < 2 ? (
          <EmptyChart message="Tren saldo akan muncul setelah kamu punya transaksi di lebih dari 1 hari." />
        ) : (
          <div className="h-48">
            <ResponsiveContainer>
              <LineChart data={balanceLine}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={formatCompact}
                />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v, currency)}
                  contentStyle={tooltipStyle}
                />
                <Line
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--brand)"
                  strokeWidth={2.5}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Export */}
      <Card title="Export Laporan">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => runExport("pdf")}
            className="flex items-center justify-center gap-2 rounded-xl bg-surface py-3 text-sm font-medium transition hover:bg-surface-2"
          >
            <FileText className="h-4 w-4 text-muted-foreground" /> PDF
          </button>
          <button
            onClick={() => runExport("xlsx")}
            className="flex items-center justify-center gap-2 rounded-xl bg-surface py-3 text-sm font-medium transition hover:bg-surface-2"
          >
            <FileSpreadsheet className="h-4 w-4 text-muted-foreground" /> Excel
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center justify-center gap-2 rounded-xl bg-surface py-3 text-sm font-medium transition hover:bg-surface-2"
          >
            <Table className="h-4 w-4 text-muted-foreground" /> CSV
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center justify-center gap-2 rounded-xl bg-surface py-3 text-sm font-medium transition hover:bg-surface-2"
          >
            <Braces className="h-4 w-4 text-muted-foreground" /> JSON
          </button>
        </div>
      </Card>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  fontSize: 12,
  color: "var(--foreground)",
};

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-3xl card-elevated p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function EmptyChart({ message = "Data belum tersedia" }: { message?: string }) {
  return (
    <div className="grid h-40 place-items-center rounded-xl bg-surface-2 px-4 text-center text-xs text-muted-foreground">
      {message}
    </div>
  );
}

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
