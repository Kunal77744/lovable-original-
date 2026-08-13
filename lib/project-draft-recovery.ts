const PROJECT_DRAFT_RECOVERY_PREFIX = "lovable:project-draft-recovery:v1";

export type ProjectDraftRecovery = {
  source: string;
  updatedAt: string;
};

export function getProjectDraftRecoveryKey(
  browserRecoveryScope: string,
  projectSlug: string,
  fileId: string,
) {
  return `${PROJECT_DRAFT_RECOVERY_PREFIX}:${browserRecoveryScope}:${projectSlug}:${fileId}`;
}

export function serializeProjectDraftRecovery(
  source: string,
  updatedAt = new Date().toISOString(),
) {
  return JSON.stringify({ source, updatedAt });
}

export function parseProjectDraftRecovery(
  storedValue: string | null,
  maxSourceLength: number,
): ProjectDraftRecovery | null {
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(storedValue) as Partial<ProjectDraftRecovery>;

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
