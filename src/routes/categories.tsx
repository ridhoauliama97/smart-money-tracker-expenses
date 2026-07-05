import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { COLOR_CHOICES, ICON_CHOICES } from "@/lib/defaults";
import { useFinance } from "@/store/useFinance";
import { formatCurrency, monthKey, todayISO, parseAmountInput } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TxType } from "@/lib/types";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "Kategori & Budget — Money Tracker" },
      { name: "description", content: "Kelola kategori dan atur limit budget per bulan." },
    ],
  }),
  component: () => (
    <AppShell>
      <CategoriesPage />
    </AppShell>
  ),
});

function CategoriesPage() {
  const categories = useFinance((s) => s.categories);
  const budgets = useFinance((s) => s.budgets);
  const transactions = useFinance((s) => s.transactions);
  const currency = useFinance((s) => s.settings.currency);
  const setBudget = useFinance((s) => s.setBudget);
  const deleteBudget = useFinance((s) => s.deleteBudget);
  const deleteCategory = useFinance((s) => s.deleteCategory);
  const addCategory = useFinance((s) => s.addCategory);

  const [tab, setTab] = useState<TxType>("expense");
  const [editing, setEditing] = useState<string | null>(null);
  const [budgetInput, setBudgetInput] = useState<string>("");

  const [newOpen, setNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState(ICON_CHOICES[0]);
  const [newColor, setNewColor] = useState(COLOR_CHOICES[0]);
  const [newType, setNewType] = useState<TxType>("expense");

  const filtered = categories.filter((c) => c.type === tab || c.type === "both");

  const spentMap = useMemo(() => {
    const mk = monthKey(todayISO());
    const map = new Map<string, number>();
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      if (monthKey(t.date) !== mk) continue;
      map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount);
    }
    return map;
  }, [transactions]);

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error("Masukkan nama kategori");
      return;
    }
    addCategory({ name: newName.trim(), icon: newIcon, color: newColor, type: newType });
    toast.success("Kategori ditambahkan");
    setNewOpen(false);
    setNewName("");
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 pt-2">
        <Link
          to="/settings"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="text-xs text-muted-foreground">Kelola</div>
          <h1 className="text-xl font-bold">Kategori & Budget</h1>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-surface p-1 text-sm">
        {(["expense", "income"] as TxType[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg py-2 font-medium transition",
              tab === t
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

      <div className="mt-4 space-y-2">
        {filtered.map((cat) => {
          const budget = budgets.find((b) => b.categoryId === cat.id);
          const spent = spentMap.get(cat.id) ?? 0;
          const pct = budget && budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
          const isEditing = editing === cat.id;

          return (
            <div key={cat.id} className="rounded-2xl bg-surface p-3">
              <div className="flex items-center gap-3">
                <CategoryIcon name={cat.icon} color={cat.color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium">{cat.name}</div>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus kategori "${cat.name}"?`)) {
                          deleteCategory(cat.id);
                          toast.success("Kategori dihapus");
                        }
                      }}
                      className="rounded-lg p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {tab === "expense" && (
                    <div className="mt-1">
                      {budget ? (
                        <div className="text-[11px] text-muted-foreground tnum">
                          {formatCurrency(spent, currency)} /{" "}
                          {formatCurrency(budget.limit, currency)} · {pct.toFixed(0)}%
                        </div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground">Belum ada budget</div>
                      )}
                      {budget && (
                        <Progress
                          value={Math.min(pct, 100)}
                          className={cn(
                            "mt-1 h-1.5",
                            pct >= 100
                              ? "[&>div]:bg-expense"
                              : pct >= 80
                                ? "[&>div]:bg-amber-400"
                                : "[&>div]:bg-income",
                          )}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {tab === "expense" && (
                <>
                  {isEditing ? (
                    <div className="mt-3 flex gap-2">
                      <Input
                        autoFocus
                        inputMode="numeric"
                        value={budgetInput}
                        onChange={(e) => setBudgetInput(e.target.value)}
                        placeholder="Limit budget"
                        className="bg-background"
                      />
                      <Button
                        onClick={() => {
                          const val = parseAmountInput(budgetInput);
                          if (val > 0) {
                            setBudget(cat.id, val);
                            toast.success("Budget disimpan");
                          }
                          setEditing(null);
                          setBudgetInput("");
                        }}
                      >
                        Simpan
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(cat.id);
                          setBudgetInput(budget ? String(budget.limit) : "");
                        }}
                        className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium"
                      >
                        {budget ? "Ubah budget" : "Set budget"}
                      </button>
                      {budget && (
                        <button
                          onClick={() => {
                            deleteBudget(budget.id);
                            toast.success("Budget dihapus");
                          }}
                          className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs font-medium text-muted-foreground"
                        >
                          Hapus budget
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4 h-12 w-full rounded-2xl bg-primary text-primary-foreground">
            <Plus className="mr-2 h-4 w-4" /> Tambah kategori
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>Kategori baru</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Nama</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Tipe</label>
              <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1 text-sm">
                {(["expense", "income"] as TxType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setNewType(t)}
                    className={cn(
                      "rounded-lg py-1.5 font-medium transition",
                      newType === t ? "bg-surface-2 text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {t === "income" ? "Pemasukan" : "Pengeluaran"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Ikon</label>
              <div className="grid max-h-40 grid-cols-6 gap-1.5 overflow-y-auto rounded-xl bg-surface p-2">
                {ICON_CHOICES.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setNewIcon(ic)}
                    className={cn(
                      "grid aspect-square place-items-center rounded-lg transition",
                      newIcon === ic ? "bg-primary/20 ring-2 ring-primary" : "hover:bg-surface-2",
                    )}
                  >
                    <CategoryIcon name={ic} color={newColor} size={16} bg={false} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted-foreground">Warna</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_CHOICES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "h-7 w-7 rounded-full border-2 transition",
                      newColor === c ? "border-foreground scale-110" : "border-transparent",
                    )}
                    style={{ background: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreate} className="w-full">
              Buat kategori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
