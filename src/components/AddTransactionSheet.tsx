import { useEffect, useMemo, useState } from "react";
import { Delete, X } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./CategoryIcon";
import { useFinance } from "@/store/useFinance";
import { formatCurrency, formatDateLong, todayISO } from "@/lib/format";
import type { TxType } from "@/lib/types";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function AddTransactionSheet({ open, onOpenChange }: Props) {
  const [type, setType] = useState<TxType>("expense");
  const [amount, setAmount] = useState<number>(0);
  const [categoryId, setCategoryId] = useState<string>("");
  const [date, setDate] = useState<string>(todayISO());
  const [note, setNote] = useState<string>("");

  const categories = useFinance((s) => s.categories);
  const budgets = useFinance((s) => s.budgets);
  const transactions = useFinance((s) => s.transactions);
  const addTransaction = useFinance((s) => s.addTransaction);
  const currency = useFinance((s) => s.settings.currency);

  const filteredCats = useMemo(
    () => categories.filter((c) => c.type === type || c.type === "both"),
    [categories, type],
  );

  useEffect(() => {
    if (open) {
      setAmount(0);
      setNote("");
      setDate(todayISO());
      setType("expense");
      setCategoryId("");
    }
  }, [open]);

  useEffect(() => {
    if (!categoryId && filteredCats.length) setCategoryId(filteredCats[0].id);
  }, [filteredCats, categoryId]);

  const handleKey = (k: string) => {
    if (k === "back") {
      setAmount((a) => Math.floor(a / 10));
    } else if (k === "000") {
      setAmount((a) => a * 1000);
    } else {
      const digit = parseInt(k, 10);
      if (Number.isNaN(digit)) return;
      setAmount((a) => (a * 10 + digit > 999_999_999_999 ? a : a * 10 + digit));
    }
  };

  const submit = () => {
    if (amount <= 0) {
      toast.error("Masukkan jumlah terlebih dahulu");
      return;
    }
    if (!categoryId) {
      toast.error("Pilih kategori");
      return;
    }
    addTransaction({ type, amount, categoryId, date, note: note.trim() || undefined });
    toast.success(type === "income" ? "Pemasukan ditambahkan" : "Pengeluaran ditambahkan");

    // Budget check
    if (type === "expense") {
      const budget = budgets.find((b) => b.categoryId === categoryId);
      if (budget) {
        const monthPrefix = date.slice(0, 7);
        const spent =
          transactions
            .filter(
              (t) =>
                t.type === "expense" &&
                t.categoryId === categoryId &&
                t.date.startsWith(monthPrefix),
            )
            .reduce((sum, t) => sum + t.amount, 0) + amount;
        const pct = (spent / budget.limit) * 100;
        if (pct >= 100) {
          toast.error(`Budget kategori ini sudah terlewati (${pct.toFixed(0)}%)`);
        } else if (pct >= 80) {
          toast.warning(`Budget kategori ini sudah ${pct.toFixed(0)}% terpakai`);
        }
      }
    }
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto flex h-[92vh] max-w-md flex-col rounded-t-3xl border-border bg-background p-0"
      >
        <SheetHeader className="flex-row items-center justify-between border-b border-border/60 p-4">
          <SheetTitle className="text-base">Transaksi Baru</SheetTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-surface-2"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Type toggle */}
          <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-surface p-1">
            {(["expense", "income"] as TxType[]).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "rounded-lg py-2 text-sm font-medium transition",
                  type === t
                    ? t === "income"
                      ? "bg-income/15 text-income"
                      : "bg-expense/15 text-expense"
                    : "text-muted-foreground",
                )}
              >
                {t === "income" ? "Pemasukan" : "Pengeluaran"}
              </button>
            ))}
          </div>

          {/* Amount display */}
          <div className="mt-6 text-center">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Jumlah</div>
            <div
              className={cn(
                "tnum mt-1 text-4xl font-bold",
                amount > 0
                  ? type === "income"
                    ? "text-income"
                    : "text-expense"
                  : "text-muted-foreground",
              )}
            >
              {formatCurrency(amount, currency)}
            </div>
          </div>

          {/* Categories */}
          <div className="mt-6">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Kategori
            </div>
            <div className="grid grid-cols-4 gap-2">
              {filteredCats.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCategoryId(c.id)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl p-2 transition",
                    categoryId === c.id
                      ? "bg-surface-2 ring-2 ring-primary"
                      : "bg-surface hover:bg-surface-2",
                  )}
                >
                  <CategoryIcon name={c.icon} color={c.color} size={18} />
                  <span className="line-clamp-1 text-[11px] text-foreground">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date + Note */}
          <div className="mt-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Tanggal
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-surface"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">
                Catatan (opsional)
              </label>
              <Input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="cth. Makan siang di kantin"
                className="bg-surface"
              />
            </div>
          </div>

          {/* Numpad */}
          <div className="mt-5 grid grid-cols-3 gap-2">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9", "000", "0", "back"].map((k) => (
              <button
                key={k}
                onClick={() => handleKey(k)}
                className="tnum grid h-12 place-items-center rounded-xl bg-surface text-lg font-semibold text-foreground transition active:scale-95 active:bg-surface-2"
              >
                {k === "back" ? <Delete className="h-5 w-5" /> : k}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t border-border/60 p-4">
          <Button
            onClick={submit}
            className="h-12 w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Simpan Transaksi
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
