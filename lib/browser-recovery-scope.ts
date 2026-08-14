import { createHash } from "node:crypto";

export function createBrowserRecoveryScope(accountId: string) {
  return createHash("sha256").update(accountId).digest("hex").slice(0, 24);
}
