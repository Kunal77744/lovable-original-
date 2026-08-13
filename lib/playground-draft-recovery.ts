import {
  MAX_PLAYGROUND_CHECK_SOURCE_LENGTH,
  MAX_PLAYGROUND_CODE_LENGTH,
} from "@/lib/javascript-playground";

const PLAYGROUND_DRAFT_RECOVERY_PREFIX =
  "lovable:playground-draft-recovery:v1";

export const INITIAL_PLAYGROUND_RECOVERY_FILE_ID = "initial-playground-file";

export type PlaygroundDraftRecovery = {
  code: string;
  quickChecks: string;
  updatedAt: string;
};

export function getPlaygroundDraftRecoveryKey(
  browserRecoveryScope: string,
  fileId: string,
) {
  return `${PLAYGROUND_DRAFT_RECOVERY_PREFIX}:${browserRecoveryScope}:${fileId}`;
}

export function serializePlaygroundDraftRecovery(
  code: string,
  quickChecks: string,
  updatedAt = new Date().toISOString(),
) {
  return JSON.stringify({ code, quickChecks, updatedAt });
}

export function parsePlaygroundDraftRecovery(
  storedValue: string | null,
): PlaygroundDraftRecovery | null {
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue) as Partial<PlaygroundDraftRecovery>;

    if (
      typeof parsed.code !== "string" ||
      parsed.code.length > MAX_PLAYGROUND_CODE_LENGTH ||
      typeof parsed.quickChecks !== "string" ||
      parsed.quickChecks.length > MAX_PLAYGROUND_CHECK_SOURCE_LENGTH ||
      typeof parsed.updatedAt !== "string" ||
      Number.isNaN(Date.parse(parsed.updatedAt))
    ) {
      return null;
    }

    return {
      code: parsed.code,
      quickChecks: parsed.quickChecks,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}
