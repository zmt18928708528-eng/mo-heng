import { timingSafeEqual } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_LOCK_PASSWORD, DEFAULT_LOCK_USER } from "./config";

function readEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function same(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

export const unlockApp = createServerFn({ method: "POST" }).handler(
  async (ctx: { data?: { username?: string; password?: string } }) => {
    const username = String(ctx.data?.username ?? "");
    const password = String(ctx.data?.password ?? "");
    const expectedUser = readEnv("MO_HENG_USER") ?? DEFAULT_LOCK_USER;
    const expectedPass = readEnv("MO_HENG_PASSWORD") ?? DEFAULT_LOCK_PASSWORD;
    const ok = same(username, expectedUser) && same(password, expectedPass);
    if (!ok) {
      return { ok: false as const, message: "账号或密码不对" };
    }
    return { ok: true as const };
  },
);
