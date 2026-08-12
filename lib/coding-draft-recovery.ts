import { MAX_CODING_SOLUTION_LENGTH } from "@/lib/coding-problems";

const CODING_DRAFT_RECOVERY_PREFIX = "lovable:judged-draft-recovery:v1";

export type CodingDraftRecovery = {
  code: string;
  updatedAt: string;
};

export function getCodingDraftRecoveryKey(
  browserRecoveryScope: string,
  problemSlug: string,
) {
  return `${CODING_DRAFT_RECOVERY_PREFIX}:${browserRecoveryScope}:${problemSlug}`;
}

export function serializeCodingDraftRecovery(
  code: string,
  updatedAt = new Date().toISOString(),
) {
  return JSON.stringify({ code, updatedAt });
}

export function parseCodingDraftRecovery(
  storedValue: string | null,
): CodingDraftRecovery | null {
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue) as Partial<CodingDraftRecovery>;

    if (
      typeof parsed.code !== "string" ||
      parsed.code.length > MAX_CODING_SOLUTION_LENGTH ||
      typeof parsed.updatedAt !== "string" ||
      Number.isNaN(Date.parse(parsed.updatedAt))
    ) {
      return null;
    }

    return {
      code: parsed.code,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}
