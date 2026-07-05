import { useEffect, useState, type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { AddTransactionSheet } from "./AddTransactionSheet";
import { useFinance } from "@/store/useFinance";

export function AppShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    useFinance.persist.rehydrate();
    useFinance.getState().setHydrated();
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto min-h-screen max-w-md pb-32">
        {mounted ? children : <ShellSkeleton />}
      </div>
      <BottomNav onAdd={() => setAddOpen(true)} />
      <AddTransactionSheet open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <div className="h-40 animate-pulse rounded-3xl bg-surface" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 animate-pulse rounded-2xl bg-surface" />
        <div className="h-20 animate-pulse rounded-2xl bg-surface" />
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-surface" />
    </div>
  );
}
