import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unlockApp } from "@/lib/lock/unlock";
import { isUnlocked, markUnlocked } from "@/lib/lock/session";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isUnlocked()) {
      void navigate({ to: "/" });
    }
  }, [navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await unlockApp({
        data: { username: username.trim(), password },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      markUnlocked();
      await navigate({ to: "/" });
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 text-ink">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg bg-panel p-6 shadow-card"
      >
        <p className="text-xs font-medium tracking-widest text-muted">墨衡</p>
        <h1 className="mt-1 font-display text-2xl font-medium tracking-tight">进入看板</h1>
        <p className="mt-1.5 text-sm text-muted">私隐数据已开启，请先输入账号密码。</p>

        <div className="mt-5 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="lock-user">账号</Label>
            <Input
              id="lock-user"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lock-pass">密码</Label>
            <Input
              id="lock-pass"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}

        <Button type="submit" className="mt-5 w-full" disabled={busy}>
          {busy ? "正在验证…" : "进入"}
        </Button>
      </form>
    </div>
  );
}
