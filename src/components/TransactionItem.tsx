import { Trash2 } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import type { Transaction } from "@/lib/types";
import { useFinance } from "@/store/useFinance";
import { formatCurrency, formatDateLong, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Props {
  tx: Transaction;
  onClick?: () => void;
}

export function TransactionItem({ tx, onClick }: Props) {
  const categories = useFinance((s) => s.categories);
  const deleteTransaction = useFinance((s) => s.deleteTransaction);
  const currency = useFinance((s) => s.settings.currency);
  const cat = categories.find((c) => c.id === tx.categoryId);

  return (
    <div className="group flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-surface-2">
      <CategoryIcon name={cat?.icon ?? "Circle"} color={cat?.color} />
      <button onClick={onClick} className="min-w-0 flex-1 text-left">
        <div className="truncate text-sm font-medium text-foreground">
          {cat?.name ?? "Lainnya"}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {tx.note ? tx.note : formatDateLong(tx.date)}
        </div>
      </button>
      <div className="flex flex-col items-end gap-0.5">
        <div
          className={cn(
            "tnum text-sm font-semibold",
            tx.type === "income" ? "text-income" : "text-expense",
          )}
        >
          {tx.type === "income" ? "+" : "−"} {formatCurrency(tx.amount, currency)}
        </div>
        <div className="tnum text-[10px] text-muted-foreground">
          {formatTime(tx.createdAt)}
        </div>
      </div>
      <button
        onClick={() => deleteTransaction(tx.id)}
        aria-label="Hapus"
        className="ml-1 rounded-lg p-2 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
