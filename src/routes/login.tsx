import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unlockApp } from "@/lib/lock/unlock";
import { isUnlocked, markUnlocked } from "@/lib/lock/session";
import {
  readAccount,
  saveAccount,
  verifyPassword,
  verifyRecovery,
} from "@/lib/lock/account";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [recovery, setRecovery] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isUnlocked()) {
      void navigate({ to: "/" });
    }
  }, [navigate]);

  async function handleLogin(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const account = readAccount();
      if (account) {
        if (username.trim() !== account.username || !(await verifyPassword(password, account))) {
          setError("账号或密码不对");
          return;
        }
        markUnlocked();
        await navigate({ to: "/" });
        return;
      }

      const result = await unlockApp({
        data: { username: username.trim(), password },
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      await saveAccount({ username: username.trim(), password, keepRecovery: true });
      markUnlocked();
      await navigate({ to: "/" });
    } catch {
      setError("登录失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  async function handleReset(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const account = readAccount();
      if (!account) {
        setError("还没有本地账号。请先用现有账密登录，再设置找回口令。");
        return;
      }
      if (username.trim() !== account.username) {
        setError("账号不对");
        return;
      }
      if (!account.recoveryHash) {
        setError("这个账号还没设找回口令。请先登录后在「账号」里设置。");
        return;
      }
      if (!(await verifyRecovery(recovery, account))) {
        setError("找回口令不对");
        return;
      }
      if (nextPassword.trim().length < 6) {
        setError("新密码至少 6 位");
        return;
      }
      await saveAccount({
        username: account.username,
        password: nextPassword,
        keepRecovery: true,
      });
      setMode("login");
      setPassword("");
      setRecovery("");
      setNextPassword("");
      setNotice("密码已更新，请用新密码登录");
    } catch {
      setError("重置失败，请稍后重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 text-ink">
      <form
        onSubmit={mode === "login" ? handleLogin : handleReset}
        className="w-full max-w-sm rounded-lg bg-panel p-6 shadow-card"
      >
        <p className="text-xs font-medium tracking-widest text-muted">墨衡</p>
        <h1 className="mt-1 font-display text-2xl font-medium tracking-tight">
          {mode === "login" ? "进入看板" : "重置密码"}
        </h1>
        <p className="mt-1.5 text-sm text-muted">
          {mode === "login"
            ? "输入账号密码。忘记密码可用找回口令重置。"
            : "输入账号和找回口令，再设新密码。"}
        </p>

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
          {mode === "login" ? (
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
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="lock-recovery">找回口令</Label>
                <Input
                  id="lock-recovery"
                  type="password"
                  value={recovery}
                  onChange={(event) => setRecovery(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lock-next">新密码</Label>
                <Input
                  id="lock-next"
                  type="password"
                  autoComplete="new-password"
                  value={nextPassword}
                  onChange={(event) => setNextPassword(event.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </>
          )}
        </div>

        {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
        {notice ? <p className="mt-3 text-sm text-done">{notice}</p> : null}

        <Button type="submit" className="mt-5 w-full" disabled={busy}>
          {busy ? "请稍候…" : mode === "login" ? "进入" : "更新密码"}
        </Button>
        <button
          type="button"
          className="mt-3 w-full text-center text-sm text-muted underline-offset-4 hover:underline"
          onClick={() => {
            setMode(mode === "login" ? "forgot" : "login");
            setError(null);
            setNotice(null);
          }}
        >
          {mode === "login" ? "忘记密码？" : "返回登录"}
        </button>
      </form>
    </div>
  );
}
