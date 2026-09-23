import { useState, type FormEvent } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readAccount, saveAccount, verifyPassword } from "@/lib/lock/account";

export function AccountDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const account = readAccount();
  const [username, setUsername] = useState(account?.username ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [recovery, setRecovery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const stored = readAccount();
      if (stored && !(await verifyPassword(currentPassword, stored))) {
        setError("当前密码不对");
        return;
      }
      const password = nextPassword.trim() || currentPassword;
      if (password.length < 6) {
        setError("密码至少 6 位");
        return;
      }
      if (!username.trim()) {
        setError("账号不能为空");
        return;
      }
      await saveAccount({
        username: username.trim(),
        password,
        recovery: recovery.trim() ? recovery : null,
        keepRecovery: !recovery.trim(),
      });
      setCurrentPassword("");
      setNextPassword("");
      setRecovery("");
      onOpenChange(false);
    } catch {
      setError("保存失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <form onSubmit={handleSave}>
          <AlertDialogHeader>
            <AlertDialogTitle>修改账号密码</AlertDialogTitle>
            <AlertDialogDescription>
              改密码要先输当前密码。找回口令用于登录页的「忘记密码」，留空则保留原口令。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="acc-user">账号名称</Label>
              <Input
                id="acc-user"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-current">当前密码</Label>
              <Input
                id="acc-current"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-next">新密码（留空表示不改）</Label>
              <Input
                id="acc-next"
                type="password"
                value={nextPassword}
                onChange={(event) => setNextPassword(event.target.value)}
                minLength={6}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="acc-recovery">找回口令（留空不改）</Label>
              <Input
                id="acc-recovery"
                type="password"
                value={recovery}
                onChange={(event) => setRecovery(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>
          <AlertDialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "保存中…" : "保存"}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
