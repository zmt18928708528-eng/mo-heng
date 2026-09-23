import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { isUnlocked } from "@/lib/lock/session";

export function LockGate({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unlocked = isUnlocked();
    setOpen(unlocked);
    setReady(true);
    if (!unlocked) {
      void navigate({ to: "/login" });
    }
  }, [navigate]);

  if (!ready || !open) return null;
  return <>{children}</>;
}
