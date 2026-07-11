import { Link, useRouterState } from "@tanstack/react-router";
import { Home, PieChart, List, Settings as SettingsIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onAdd: () => void;
}

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/reports", label: "Reports", icon: PieChart },
  { to: "/history", label: "History", icon: List },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

export function BottomNav({ onAdd }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      aria-label="Primary"
    >
      <div className="relative flex h-[66px] items-center justify-between rounded-[22px] border border-border/50 bg-background/80 px-[18px] backdrop-blur-[14px]">
        {items.slice(0, 2).map((it) => (
          <NavItem
            key={it.to}
            to={it.to}
            label={it.label}
            Icon={it.icon}
            active={pathname === it.to}
          />
        ))}
        <div className="grid place-items-center">
          <button
            type="button"
            onClick={onAdd}
            aria-label="Tambah transaksi"
            className="-mt-7 grid h-[50px] w-[50px] place-items-center rounded-[16px] bg-gradient-to-br from-[#C8FF52] to-[#1FE5B8] text-[#0A0D14] shadow-[0_10px_24px_-6px_rgba(31,229,184,0.55)] transition-transform active:scale-95"
          >
            <Plus className="h-[22px] w-[22px]" />
          </button>
        </div>
        {items.slice(2).map((it) => (
          <NavItem
            key={it.to}
            to={it.to}
            label={it.label}
            Icon={it.icon}
            active={pathname === it.to}
          />
        ))}
      </div>
    </nav>
  );
}

function NavItem({
  to,
  label,
  Icon,
  active,
}: {
  to: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
        active ? "text-lime" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
