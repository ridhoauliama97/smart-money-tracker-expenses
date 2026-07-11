import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronLeft, Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/store/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Feedback — Money Tracker" },
      { name: "description", content: "Kirim kritik, saran, atau laporan bug." },
    ],
  }),
  component: () => (
    <AppShell>
      <FeedbackPage />
    </AppShell>
  ),
});

const types = [
  { value: "kritik", label: "Kritik" },
  { value: "saran", label: "Saran" },
  { value: "bug", label: "Laporan Bug" },
] as const;

function FeedbackPage() {
  const user = useAuth((s) => s.user);
  const [type, setType] = useState<string>("saran");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("Tulis pesan terlebih dahulu");
      return;
    }
    if (!user) return;
    setSending(true);
    try {
      const { error } = await supabase.from("feedback").insert({
        user_id: user.id,
        type,
        message: message.trim(),
      });
      if (error) throw error;
      toast.success("Terima kasih! Feedback Anda telah dikirim.");
      setMessage("");
      setType("saran");
    } catch {
      toast.error("Gagal mengirim feedback. Coba lagi nanti.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 pt-2">
        <Link
          to="/"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <div className="text-xs text-muted-foreground">Kirim</div>
          <h1 className="text-xl font-bold">Feedback</h1>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-surface p-1 text-sm">
        <div className="grid grid-cols-3 gap-1">
          {types.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={cn(
                "rounded-lg py-2 font-medium transition",
                type === t.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tulis kritik, saran, atau laporan bug Anda..."
          rows={6}
          className="w-full resize-none rounded-2xl border border-border bg-surface p-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary"
        />

        <Button type="submit" disabled={sending} className="h-12 w-full rounded-2xl">
          {sending ? (
            "Mengirim..."
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> Kirim Feedback
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
