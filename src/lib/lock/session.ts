import { LOCK_SESSION_KEY } from "./config";

export function isUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(LOCK_SESSION_KEY) === "ok";
  } catch {
    return false;
  }
}

export function markUnlocked(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(LOCK_SESSION_KEY, "ok");
  } catch {
    /* ignore */
  }
}

export function markLocked(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(LOCK_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
