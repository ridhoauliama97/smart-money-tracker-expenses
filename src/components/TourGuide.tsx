import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useTour } from "@/store/useTour";

interface TourStep {
  target?: string;
  title: string;
  description: string;
  placement?: "bottom" | "top";
}

const steps: TourStep[] = [
  {
    title: "Selamat Datang!",
    description:
      "Selamat datang di Money Tracker! Aplikasi ini akan membantu kamu mencatat dan mengelola pemasukan serta pengeluaran dengan mudah.",
  },
  {
    target: "tour-balance",
    title: "Ringkasan Keuangan",
    description: "Lihat total saldo, pemasukan, dan pengeluaran bulan ini sekilas di kartu ini.",
    placement: "bottom",
  },
  {
    target: "tour-add",
    title: "Tambah Transaksi",
    description: "Ketuk tombol + untuk mencatat pemasukan atau pengeluaran baru.",
    placement: "top",
  },
  {
    target: "tour-nav",
    title: "Navigasi",
    description: "Gunakan menu ini untuk berpindah antara Beranda, Laporan, Riwayat, dan Profil.",
    placement: "top",
  },
  {
    target: "tour-profile",
    title: "Profil & Pengaturan",
    description: "Atur profil, ubah tema, ganti mata uang, dan kelola kategori di sini.",
    placement: "top",
  },
  {
    title: "Siap!",
    description: "Kamu sudah siap! Mulai catat pemasukan atau pengeluaran pertama kamu sekarang.",
  },
];

export function TourGuide() {
  const { active, step, next, prev, skip, completed } = useTour();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => setReady(true), 100);
      return () => clearTimeout(timer);
    }
    setReady(false);
  }, [active]);

  const s = steps[step];
  if (!active || !ready || !s) return null;

  return <TourOverlay step={step} s={s} next={next} prev={prev} skip={skip} />;
}

function TourOverlay({
  step,
  s,
  next,
  prev,
  skip,
}: {
  step: number;
  s: TourStep;
  next: () => void;
  prev: () => void;
  skip: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const isLast = step === steps.length - 1;
  const isFirst = step === 0 || step === steps.length - 1;

  useEffect(() => {
    if (s.target) {
      const el = document.querySelector(`[data-tour="${s.target}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
      }
    }
  }, [s.target]);

  useEffect(() => {
    if (!cardRef.current) return;

    if (s.target && targetRect) {
      const card = cardRef.current;
      const cardW = card.offsetWidth;
      const cardH = card.offsetHeight;

      let top: number;
      let left: number;

      if (s.placement === "top") {
        top = targetRect.top - cardH - 16;
        left = targetRect.left + targetRect.width / 2 - cardW / 2;
      } else {
        top = targetRect.bottom + 16;
        left = targetRect.left + targetRect.width / 2 - cardW / 2;
      }

      top = Math.max(16, Math.min(top, window.innerHeight - cardH - 16));
      left = Math.max(16, Math.min(left, window.innerWidth - cardW - 16));

      setPos({ top, left });
    } else {
      setPos({
        top: window.innerHeight / 2 - 120,
        left: window.innerWidth / 2 - 180,
      });
    }
  }, [s.target, targetRect]);

  const scrollToTarget = useMemo(
    () => () => {
      if (!s.target) return;
      const el = document.querySelector(`[data-tour="${s.target}"]`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    },
    [s.target],
  );

  useEffect(() => {
    scrollToTarget();
  }, [scrollToTarget]);

  const stepCount = steps.length - 2;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={skip} />

      {targetRect && (
        <div
          className="absolute rounded-2xl ring-2 ring-lime ring-offset-2 ring-offset-black/50 transition-all duration-300"
          style={{
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}

      <div
        ref={cardRef}
        className="absolute w-[340px] max-w-[calc(100vw-32px)] rounded-2xl border border-border bg-background p-5 shadow-2xl"
        style={{ top: pos.top, left: pos.left }}
      >
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{s.description}</p>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={skip}
            className="text-xs font-medium text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Skip
          </button>

          {!isFirst && (
            <div className="flex items-center gap-1.5">
              {Array.from({ length: stepCount }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all",
                    i === step - 1 ? "w-4 bg-lime" : "w-1.5 bg-border",
                  )}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={prev}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-surface"
              >
                Sebelumnya
              </button>
            )}
            {isLast ? (
              <button
                onClick={next}
                className="rounded-lg bg-lime px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-lime/90"
              >
                Selesai
              </button>
            ) : (
              <button
                onClick={next}
                className="rounded-lg bg-lime px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-lime/90"
              >
                {step === 0 ? "Mulai" : "Berikutnya"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
