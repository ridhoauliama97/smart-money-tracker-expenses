import { createFileRoute } from "@tanstack/react-router";
import { useContext, useEffect, useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { IconReceipt } from "@tabler/icons-react";
import { AppShell } from "@/components/AppShell";
import { TransactionItem } from "@/components/TransactionItem";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CategoryIcon } from "@/components/CategoryIcon";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AddTransactionContext } from "@/components/AppShell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFinance } from "@/store/useFinance";
import { formatDateLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

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
  const openAdd = useContext(AddTransactionContext);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [catFilter, setCatFilter] = useState<string>("all");

  const expenseCategories = useMemo(
    () => categories.filter((c) => c.type === "expense"),
    [categories],
  );
  const incomeCategories = useMemo(
    () => categories.filter((c) => c.type === "income"),
    [categories],
  );

  useEffect(() => {
    if (catFilter === "all") return;
    if (filter === "all") return;
    const cat = categories.find((c) => c.id === catFilter);
    if (cat && cat.type !== filter) {
      setCatFilter("all");
    }
  }, [filter, catFilter, categories]);

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-11 w-full justify-between rounded-xl border-border bg-surface px-3 text-sm font-normal"
            >
              <span>
                {catFilter === "all"
                  ? "Semua Kategori"
                  : (categories.find((c) => c.id === catFilter)?.name ?? "Semua Kategori")}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) max-h-72 overflow-y-auto rounded-xl border-border bg-surface"
            align="start"
          >
            <DropdownMenuRadioGroup value={catFilter} onValueChange={setCatFilter}>
              <DropdownMenuRadioItem value="all" className="cursor-pointer pl-2 [&>span]:hidden">
                Semua Kategori
              </DropdownMenuRadioItem>

              {(filter === "all" || filter === "expense") && expenseCategories.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                      Pengeluaran
                    </DropdownMenuLabel>
                    {expenseCategories.map((c) => (
                      <DropdownMenuRadioItem
                        key={c.id}
                        value={c.id}
                        className="cursor-pointer gap-3"
                      >
                        <CategoryIcon name={c.icon} color={c.color} size={16} bg={false} />
                        {c.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              )}

              {(filter === "all" || filter === "income") && incomeCategories.length > 0 && (
                <>
                  {filter === "all" &&
                    expenseCategories.length > 0 &&
                    incomeCategories.length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                      Pemasukan
                    </DropdownMenuLabel>
                    {incomeCategories.map((c) => (
                      <DropdownMenuRadioItem
                        key={c.id}
                        value={c.id}
                        className="cursor-pointer gap-3"
                      >
                        <CategoryIcon name={c.icon} color={c.color} size={16} bg={false} />
                        {c.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4">
        {grouped.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <IconReceipt />
              </EmptyMedia>
              <EmptyTitle>Belum Ada Transaksi</EmptyTitle>
              <EmptyDescription>
                Belum ada catatan transaksi. Tambah pemasukan atau pengeluaran pertama Anda.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={openAdd}>Tambah Transaksi Baru</Button>
            </EmptyContent>
          </Empty>
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
