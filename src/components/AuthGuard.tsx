import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/store/useAuth";

export function AuthGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const initialized = useAuth((s) => s.initialized);

  useEffect(() => {
    if (initialized && !user) {
      navigate({ to: "/login", replace: true });
    }
  }, [user, initialized, navigate]);

  if (!initialized || !user) return null;

  return <>{children}</>;
}
