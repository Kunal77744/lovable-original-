export const MAX_PLAYGROUND_CODE_LENGTH = 20_000;
export const MAX_PLAYGROUND_CHECKS = 6;
export const MAX_PLAYGROUND_CHECK_LENGTH = 300;

export const PLAYGROUND_STARTER_CODE = `const topic = "semantic HTML";
const minutes = 18;

console.log(\`I practiced \${topic} for \${minutes} minutes.\`);`;

export function validatePlaygroundCode(payload: unknown) {
  const code =
    typeof payload === "object" &&
    payload !== null &&
    "code" in payload &&
    typeof payload.code === "string"
      ? payload.code
      : "";

  if (code.length < 1 || code.length > MAX_PLAYGROUND_CODE_LENGTH) {
    return {
      valid: false as const,
      error: `Keep playground.js between 1 and ${MAX_PLAYGROUND_CODE_LENGTH.toLocaleString()} characters.`,
    };
  }

  return { valid: true as const, code };
}

export function validatePlaygroundChecks(input: string) {
  const checks = input
    .split(/\r?\n/)
    .map((check) => check.trim())
    .filter(Boolean);

  if (checks.length === 0) {
    return {
      valid: false as const,
      error: "Add at least one true-or-false JavaScript expression.",
    };
  }

  if (checks.length > MAX_PLAYGROUND_CHECKS) {
    return {
      valid: false as const,
      error: `Run up to ${MAX_PLAYGROUND_CHECKS} quick checks at a time.`,
    };
  }

  if (checks.some((check) => check.length > MAX_PLAYGROUND_CHECK_LENGTH)) {
    return {
      valid: false as const,
      error: `Keep each quick check under ${MAX_PLAYGROUND_CHECK_LENGTH} characters.`,
    };
  }

  return { valid: true as const, checks };
}
