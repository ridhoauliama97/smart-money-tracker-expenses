import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  Home,
  PieChart,
  List,
  Plus,
  CircleUser,
  User,
  Settings as SettingsIcon,
  Bell,
  BellDot,
  LogOut,
} from "lucide-react";
import { useNotifications } from "@/store/useNotifications";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/store/useAuth";
import { useProfile } from "@/store/useProfile";
import { toast } from "sonner";

interface Props {
  onAdd: () => void;
}

const items = [
  { to: "/", label: "Beranda", icon: Home },
  { to: "/reports", label: "Laporan", icon: PieChart },
  { to: "/history", label: "Riwayat", icon: List },
] as const;

export function BottomNav({ onAdd }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const profile = useProfile((s) => s.profile);
  const signOut = useAuth((s) => s.signOut);
  const unreadNotifCount = useNotifications((s) => s.notifications.filter((n) => !n.read).length);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate({ to: "/login" });
    } catch {
      toast.error("Gagal logout");
    }
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]"
      aria-label="Primary"
    >
      <div
        className="relative flex h-[66px] items-center justify-between rounded-[22px] border border-border/50 bg-background/80 px-[18px] backdrop-blur-[14px]"
        data-tour="tour-nav"
      >
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
            data-tour="tour-add"
            className="-mt-7 grid h-[50px] w-[50px] place-items-center rounded-[16px] bg-gradient-to-br from-[#C8FF52] to-[#1FE5B8] text-[#0A0D14] shadow-[0_10px_24px_-6px_rgba(31,229,184,0.55)] transition-transform active:scale-95"
          >
            <Plus className="h-[22px] w-[22px]" />
          </button>
        </div>
        <NavItem
          to={items[2].to}
          label={items[2].label}
          Icon={items[2].icon}
          active={pathname === items[2].to}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              data-tour="tour-profile"
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
                pathname === "/profile" || pathname === "/settings"
                  ? "text-lime"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CircleUser className="h-5 w-5" />
              <span>Profil</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="end" className="min-w-[180px]">
            <DropdownMenuLabel className="truncate text-xs font-normal text-muted-foreground">
              {profile?.name || user?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>
              <User className="h-4 w-4" />
              Profil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
              <SettingsIcon className="h-4 w-4" />
              Pengaturan
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate({ to: "/notifications" })}>
              <div className="relative">
                {unreadNotifCount > 0 ? (
                  <BellDot className="h-4 w-4" />
                ) : (
                  <Bell className="h-4 w-4" />
                )}
              </div>
              <span className="flex-1">Notifikasi</span>
              {unreadNotifCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-lime px-1 text-[10px] font-bold text-[#0A0D14]">
                  {unreadNotifCount > 99 ? "99+" : unreadNotifCount}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
