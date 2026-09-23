const ACCOUNT_KEY = "mo-heng-lock-account";

export type StoredAccount = {
  username: string;
  passwordHash: string;
  recoveryHash: string | null;
};

async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashSecret(value: string): Promise<string> {
  return sha256(value.normalize("NFKC"));
}

export function readAccount(): StoredAccount | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACCOUNT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAccount;
    if (!parsed?.username || !parsed?.passwordHash) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeAccount(account: StoredAccount): void {
  window.localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}

export async function verifyPassword(password: string, account = readAccount()): Promise<boolean> {
  if (!account) return false;
  return (await hashSecret(password)) === account.passwordHash;
}

export async function verifyRecovery(recovery: string, account = readAccount()): Promise<boolean> {
  if (!account?.recoveryHash) return false;
  return (await hashSecret(recovery.trim())) === account.recoveryHash;
}

export async function saveAccount(input: {
  username: string;
  password: string;
  recovery?: string | null;
  keepRecovery?: boolean;
}): Promise<StoredAccount> {
  const prev = readAccount();
  const recoveryText = input.recovery?.trim() ?? "";
  const account: StoredAccount = {
    username: input.username.trim(),
    passwordHash: await hashSecret(input.password),
    recoveryHash: recoveryText
      ? await hashSecret(recoveryText)
      : input.keepRecovery
        ? (prev?.recoveryHash ?? null)
        : null,
  };
  writeAccount(account);
  return account;
}
