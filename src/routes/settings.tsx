import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { toast } from "sonner";
import { Download, Upload, RotateCcw, FileText, FileSpreadsheet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { exportPDF, exportXLSX } from "@/lib/export";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useFinance } from "@/store/useFinance";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan — Money Tracker" },
      { name: "description", content: "Kelola mata uang, backup, dan reset data aplikasi." },
    ],
  }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

function SettingsPage() {
  const settings = useFinance((s) => s.settings);
  const updateSettings = useFinance((s) => s.updateSettings);
  const resetAll = useFinance((s) => s.resetAll);
  const importData = useFinance((s) => s.importData);
  const fileRef = useRef<HTMLInputElement>(null);

  const exportBackup = () => {
    const state = useFinance.getState();
    const data = {
      transactions: state.transactions,
      categories: state.categories,
      budgets: state.budgets,
      settings: state.settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `money-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup berhasil diunduh");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      importData(data);
      toast.success("Data berhasil diimpor");
    } catch {
      toast.error("Gagal membaca file backup");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="p-4">
      <div className="pt-2">
        <div className="text-xs text-muted-foreground">Preferensi</div>
        <h1 className="text-2xl font-bold">Pengaturan</h1>
      </div>

      {/* Currency */}
      <Section title="Mata Uang">
        <div className="grid grid-cols-3 gap-2">
          {(["IDR", "USD", "EUR"] as const).map((c) => (
            <button
              key={c}
              onClick={() => updateSettings({ currency: c })}
              className={
                "rounded-xl border py-3 text-sm font-medium transition " +
                (settings.currency === c
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-surface text-muted-foreground hover:text-foreground")
              }
            >
              {c}
            </button>
          ))}
        </div>
      </Section>

      {/* Kategori link */}
      <Section title="Kategori & Budget">
        <Link
          to="/categories"
          className="block rounded-2xl bg-surface p-4 text-sm transition hover:bg-surface-2"
        >
          <div className="font-medium">Kelola kategori & budget</div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Tambah kategori baru, atur limit budget bulanan.
          </div>
        </Link>
      </Section>

      {/* Backup */}
      <Section title="Backup Data">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={exportBackup}
            className="h-12 rounded-xl border-border bg-surface"
          >
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button
            variant="outline"
            onClick={() => fileRef.current?.click()}
            className="h-12 rounded-xl border-border bg-surface"
          >
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>
      </Section>

      {/* Reset */}
      <Section title="Zona Berbahaya">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="h-12 w-full rounded-xl">
              <RotateCcw className="mr-2 h-4 w-4" /> Reset semua data
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Reset semua data?</AlertDialogTitle>
              <AlertDialogDescription>
                Semua transaksi, kategori kustom, dan budget akan dihapus. Tindakan ini
                tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  resetAll();
                  toast.success("Data telah direset");
                }}
              >
                Ya, reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Section>

      <div className="mt-8 text-center text-[11px] text-muted-foreground">
        Money Tracker · Semua data disimpan di perangkat Anda
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      {children}
    </div>
  );
}
