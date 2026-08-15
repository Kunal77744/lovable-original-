const JAVASCRIPT_LAB_DRAFT_RECOVERY_PREFIX =
  "lovable:guided-javascript-draft-recovery:v1";

export type JavaScriptLabDraftRecovery = {
  source: string;
  updatedAt: string;
};

export function getJavaScriptLabDraftRecoveryKey(
  browserRecoveryScope: string,
  labSlug: string,
  exerciseId: string,
) {
  return `${JAVASCRIPT_LAB_DRAFT_RECOVERY_PREFIX}:${browserRecoveryScope}:${labSlug}:${exerciseId}`;
}

export function serializeJavaScriptLabDraftRecovery(
  source: string,
  updatedAt = new Date().toISOString(),
) {
  return JSON.stringify({ source, updatedAt });
}

export function parseJavaScriptLabDraftRecovery(
  storedValue: string | null,
  maxSourceLength: number,
): JavaScriptLabDraftRecovery | null {
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(
      storedValue,
    ) as Partial<JavaScriptLabDraftRecovery>;

    if (
      typeof parsed.source !== "string" ||
      parsed.source.length > maxSourceLength ||
      typeof parsed.updatedAt !== "string" ||
      Number.isNaN(Date.parse(parsed.updatedAt))
    ) {
      return null;
    }

    return { source: parsed.source, updatedAt: parsed.updatedAt };
  } catch {
    return null;
  }
}
