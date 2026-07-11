import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Bell, BellOff, CheckCheck, CircleAlert, Settings, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatNumberInput } from "@/lib/format";
import { useNotifications } from "@/store/useNotifications";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifikasi — Money Tracker" },
      { name: "description", content: "Lihat notifikasi dan pengingat keuangan Anda." },
    ],
  }),
  component: () => (
    <AppShell>
      <NotificationsPage />
    </AppShell>
  ),
});

const typeMeta: Record<string, { icon: typeof Bell; color: string }> = {
  budget_warning: { icon: AlertTriangle, color: "text-amber" },
  budget_exceeded: { icon: CircleAlert, color: "text-coral" },
  large_transaction: { icon: Zap, color: "text-lime" },
  daily_reminder: { icon: Bell, color: "text-sky" },
};

function NotificationsPage() {
  const [showPrefs, setShowPrefs] = useState(false);
  const notifications = useNotifications((s) => s.notifications);
  const markRead = useNotifications((s) => s.markRead);
  const markAllRead = useNotifications((s) => s.markAllRead);
  const clearAll = useNotifications((s) => s.clearAll);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between pt-2">
        <div>
          <div className="text-xs text-muted-foreground">Pemberitahuan</div>
          <h1 className="text-2xl font-bold">Notifikasi</h1>
        </div>
        <button
          onClick={() => setShowPrefs((v) => !v)}
          className={cn(
            "grid h-9 w-9 place-items-center rounded-xl bg-surface transition",
            showPrefs ? "text-lime" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {showPrefs && <PrefsPanel />}

      {notifications.length > 0 && (
        <div className="mt-3 flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllRead}
              className="h-8 rounded-xl border-border bg-surface text-xs"
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Tandai sudah dibaca
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={clearAll}
            className="h-8 rounded-xl border-border bg-surface text-xs"
          >
            <BellOff className="mr-1 h-3.5 w-3.5" />
            Hapus semua
          </Button>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {notifications.length === 0 ? (
          <div className="text-center py-12 text-xs text-muted-foreground">
            Belum ada notifikasi. Ketuk ikon{" "}
            <Settings className="inline h-3 w-3 align-text-bottom" /> untuk mengatur preferensi.
          </div>
        ) : (
          notifications.map((n) => {
            const meta = typeMeta[n.type] ?? { icon: Bell, color: "text-muted-foreground" };
            const Icon = meta.icon;
            return (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.read) markRead(n.id);
                }}
                className={cn(
                  "flex w-full items-start gap-3 rounded-2xl border border-border/50 p-3.5 text-left transition",
                  n.read ? "bg-surface/50" : "bg-surface",
                )}
              >
                <div
                  className={cn(
                    "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl",
                    meta.color,
                    n.read ? "bg-transparent" : "bg-background",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{n.title}</span>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-lime" />}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.message}</p>
                  <span className="mt-1 block text-[11px] text-muted-foreground">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

function PrefsPanel() {
  const prefs = useNotifications((s) => s.prefs);
  const updatePrefs = useNotifications((s) => s.updatePrefs);

  return (
    <div className="mt-4 space-y-2">
      <NotifToggle
        icon={<Bell />}
        label="Pengingat Harian"
        desc="Ingatkan untuk mencatat transaksi setiap hari"
        checked={prefs.dailyReminder}
        onChecked={(v) => updatePrefs({ dailyReminder: v })}
      />
      {prefs.dailyReminder && (
        <div className="px-1">
          <label className="mb-1 block text-xs text-muted-foreground">Jam pengingat</label>
          <input
            type="time"
            value={prefs.dailyReminderTime}
            onChange={(e) => updatePrefs({ dailyReminderTime: e.target.value })}
            className="tnum w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
      )}
      <NotifToggle
        icon={<AlertTriangle />}
        label="Peringatan Budget"
        desc="Ketika budget kategori hampir habis (≥80%)"
        checked={prefs.budgetWarning}
        onChecked={(v) => updatePrefs({ budgetWarning: v })}
      />
      <NotifToggle
        icon={<BellOff />}
        label="Budget Terlewati"
        desc="Ketika budget kategori sudah terlampaui (≥100%)"
        checked={prefs.budgetExceeded}
        onChecked={(v) => updatePrefs({ budgetExceeded: v })}
      />
      <NotifToggle
        icon={<Zap />}
        label="Transaksi Besar"
        desc="Notifikasi untuk pengeluaran di atas nominal tertentu"
        checked={prefs.largeTransaction}
        onChecked={(v) => updatePrefs({ largeTransaction: v })}
      />
      {prefs.largeTransaction && (
        <div className="px-1">
          <label className="mb-1 block text-xs text-muted-foreground">Batas nominal (Rp)</label>
          <input
            type="text"
            inputMode="numeric"
            value={formatNumberInput(String(prefs.largeTransactionThreshold))}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              updatePrefs({ largeTransactionThreshold: raw ? parseInt(raw, 10) : 0 });
            }}
            className="tnum w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>
      )}
    </div>
  );
}

function NotifToggle({
  icon,
  label,
  desc,
  checked,
  onChecked,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  checked: boolean;
  onChecked: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-border/50 bg-surface p-3.5">
      <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChecked} />
    </label>
  );
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(ts).toLocaleDateString("id-ID");
}
