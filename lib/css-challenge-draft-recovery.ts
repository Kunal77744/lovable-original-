import { MAX_CSS_CHALLENGE_LENGTH } from "@/lib/css-practice-challenges";

const CSS_CHALLENGE_DRAFT_RECOVERY_PREFIX =
  "lovable:css-challenge-draft-recovery:v1";

export type CssChallengeDraftRecovery = {
  css: string;
  updatedAt: string;
};

export function getCssChallengeDraftRecoveryKey(
  browserRecoveryScope: string,
  challengeSlug: string,
) {
  return `${CSS_CHALLENGE_DRAFT_RECOVERY_PREFIX}:${browserRecoveryScope}:${challengeSlug}`;
}

export function serializeCssChallengeDraftRecovery(
  css: string,
  updatedAt = new Date().toISOString(),
) {
  return JSON.stringify({ css, updatedAt });
}

export function parseCssChallengeDraftRecovery(
  storedValue: string | null,
): CssChallengeDraftRecovery | null {
  if (!storedValue) return null;

  try {
    const parsed = JSON.parse(
      storedValue,
    ) as Partial<CssChallengeDraftRecovery>;

    if (
      typeof parsed.css !== "string" ||
      parsed.css.length > MAX_CSS_CHALLENGE_LENGTH ||
      typeof parsed.updatedAt !== "string" ||
      Number.isNaN(Date.parse(parsed.updatedAt))
    ) {
      return null;
    }

    return {
      css: parsed.css,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}
