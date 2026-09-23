import { createServerFn } from "@tanstack/react-start";
import { DEFAULT_LOCK_PASSWORD, DEFAULT_LOCK_USER } from "./config";

type LockPayload = { username: string; password: string };

export const unlockApp = createServerFn({ method: "POST" })
  .validator((input: unknown): LockPayload => {
    const rec = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
    return {
      username: typeof rec.username === "string" ? rec.username : "",
      password: typeof rec.password === "string" ? rec.password : "",
    };
  })
  .handler(async ({ data }) => {
    const { timingSafeEqual } = await import("node:crypto");
    const expectedUser = (process.env.MO_HENG_USER ?? DEFAULT_LOCK_USER).trim();
    const expectedPass = (process.env.MO_HENG_PASSWORD ?? DEFAULT_LOCK_PASSWORD).trim();

    function same(a: string, b: string): boolean {
      const left = Buffer.from(a);
      const right = Buffer.from(b);
      if (left.length !== right.length) {
        timingSafeEqual(left, left);
        return false;
      }
      return timingSafeEqual(left, right);
    }

    const ok = same(data.username, expectedUser) && same(data.password, expectedPass);
    if (!ok) {
      return { ok: false as const, message: "账号或密码不对" };
    }
    return { ok: true as const };
  });
