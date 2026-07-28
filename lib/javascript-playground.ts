export const MAX_PLAYGROUND_CODE_LENGTH = 20_000;

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
