import { createContext, useEffect, useState, useRef, type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { AddTransactionSheet } from "./AddTransactionSheet";
import { useFinance } from "@/store/useFinance";
import { useAuth } from "@/store/useAuth";
import { AuthGuard } from "./AuthGuard";

export const AddTransactionContext = createContext<() => void>(() => {});

export function AppShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const initialized = useAuth((s) => s.initialized);
  const user = useAuth((s) => s.user);
  const fetchAll = useFinance((s) => s.fetchAll);
  const migrateFromLocalStorage = useFinance((s) => s.migrateFromLocalStorage);
  const initCalled = useRef(false);

  useEffect(() => {
    useAuth.getState().initialize();
  }, []);

  useEffect(() => {
    if (!initialized || !user || initCalled.current) return;
    initCalled.current = true;

    const init = async () => {
      await migrateFromLocalStorage();
      if (!useFinance.getState()._hydrated) {
        await fetchAll();
        useFinance.getState().setHydrated();
      }
      setDataReady(true);
      setMounted(true);
    };

    init();
  }, [initialized, user, fetchAll, migrateFromLocalStorage]);

  useEffect(() => {
    if (initialized && !user) {
      setDataReady(true);
      setMounted(true);
    }
  }, [initialized, user]);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background">
        <div className="mx-auto min-h-screen max-w-md pb-32">
          {dataReady ? (
            <AddTransactionContext.Provider value={() => setAddOpen(true)}>
              {children}
            </AddTransactionContext.Provider>
          ) : (
            <ShellSkeleton />
          )}
        </div>
        <BottomNav onAdd={() => setAddOpen(true)} />
        <AddTransactionSheet open={addOpen} onOpenChange={setAddOpen} />
      </div>
    </AuthGuard>
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
