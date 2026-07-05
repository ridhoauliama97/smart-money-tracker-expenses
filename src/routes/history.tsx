import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { TransactionItem } from "@/components/TransactionItem";
import { Input } from "@/components/ui/input";
import { useFinance } from "@/store/useFinance";
import { formatDateLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Riwayat — Money Tracker" },
      { name: "description", content: "Cari, saring, dan kelola semua transaksi Anda." },
    ],
  }),
  component: () => (
    <AppShell>
      <History />
    </AppShell>
  ),
});

type Filter = "all" | "income" | "expense";

function History() {
  const transactions = useFinance((s) => s.transactions);
  const categories = useFinance((s) => s.categories);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [catFilter, setCatFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    return transactions
      .filter((t) => (filter === "all" ? true : t.type === filter))
      .filter((t) => (catFilter === "all" ? true : t.categoryId === catFilter))
      .filter((t) => {
        if (!q.trim()) return true;
        const cat = categories.find((c) => c.id === t.categoryId);
        const hay = `${cat?.name ?? ""} ${t.note ?? ""} ${t.amount}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      });
  }, [transactions, filter, catFilter, categories, q]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const t of filtered) {
      const arr = map.get(t.date) ?? [];
      arr.push(t);
      map.set(t.date, arr);
    }
    return Array.from(map.entries()).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [filtered]);

  return (
    <div className="p-4">
      <div className="pt-2">
        <div className="text-xs text-muted-foreground">Semua transaksi</div>
        <h1 className="text-2xl font-bold">Riwayat</h1>
      </div>

      <div className="mt-4 space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari catatan, kategori, nominal..."
            className="bg-surface pl-9"
          />
        </div>

        <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface p-1 text-xs">
          {(
            [
              { k: "all", l: "Semua" },
              { k: "income", l: "Pemasukan" },
              { k: "expense", l: "Pengeluaran" },
            ] as { k: Filter; l: string }[]
          ).map((o) => (
            <button
              key={o.k}
              onClick={() => setFilter(o.k)}
              className={cn(
                "rounded-lg py-2 font-medium transition",
                filter === o.k ? "bg-primary/15 text-primary" : "text-muted-foreground",
              )}
            >
              {o.l}
            </button>
          ))}
        </div>

        <Select value={catFilter} onValueChange={setCatFilter}>
          <SelectTrigger className="h-11 rounded-xl border-border bg-surface px-3 text-sm">
            <SelectValue placeholder="Semua kategori" />
          </SelectTrigger>
          <SelectContent className="max-h-72 rounded-xl border-border bg-surface">
            <SelectItem value="all">Semua kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        {grouped.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 p-8 text-center text-sm text-muted-foreground">
            Tidak ada transaksi yang cocok.
          </div>
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
