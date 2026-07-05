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
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)] pt-2"
      aria-label="Primary"
    >
      <div className="relative rounded-2xl card-elevated bg-surface/90 backdrop-blur-xl">
        <div className="grid grid-cols-5 items-center px-2 py-2">
          {items.slice(0, 2).map((it) => (
            <NavItem key={it.to} to={it.to} label={it.label} Icon={it.icon} active={pathname === it.to} />
          ))}
          <div className="grid place-items-center">
            <button
              type="button"
              onClick={onAdd}
              aria-label="Tambah transaksi"
              className="-mt-8 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground fab-shadow transition-transform active:scale-95"
            >
              <Plus className="h-6 w-6" />
            </button>
          </div>
          {items.slice(2).map((it) => (
            <NavItem key={it.to} to={it.to} label={it.label} Icon={it.icon} active={pathname === it.to} />
          ))}
        </div>
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
        active ? "text-primary" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}
