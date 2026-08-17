export const MAX_PLAYGROUND_CODE_LENGTH = 20_000;
export const MAX_PLAYGROUND_CHECKS = 6;
export const MAX_PLAYGROUND_FILES = 6;
export const MAX_PLAYGROUND_FILE_NAME_LENGTH = 32;
export const MAX_PLAYGROUND_CHECK_LENGTH = 300;
export const MAX_PLAYGROUND_CHECK_SOURCE_LENGTH =
  MAX_PLAYGROUND_CHECKS * MAX_PLAYGROUND_CHECK_LENGTH +
  (MAX_PLAYGROUND_CHECKS - 1);

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

export function validatePlaygroundFile(payload: unknown) {
  const codeResult = validatePlaygroundCode(payload);

  if (!codeResult.valid) {
    return codeResult;
  }

  const quickChecks =
    typeof payload === "object" &&
    payload !== null &&
    "quickChecks" in payload &&
    typeof payload.quickChecks === "string"
      ? payload.quickChecks
      : "";

  if (quickChecks.length > MAX_PLAYGROUND_CHECK_SOURCE_LENGTH) {
    return {
      valid: false as const,
      error: `Keep saved quick checks under ${MAX_PLAYGROUND_CHECK_SOURCE_LENGTH.toLocaleString()} characters.`,
    };
  }

  if (quickChecks.trim().length > 0) {
    const checkResult = validatePlaygroundChecks(quickChecks);

    if (!checkResult.valid) {
      return checkResult;
    }
  }

  const fileId =
    typeof payload === "object" &&
    payload !== null &&
    "fileId" in payload &&
    typeof payload.fileId === "string" &&
    payload.fileId.length > 0
      ? payload.fileId
      : null;

  return {
    valid: true as const,
    fileId,
    code: codeResult.code,
    quickChecks,
  };
}

export function validatePlaygroundFileName(payload: unknown) {
  const rawName =
    typeof payload === "object" &&
    payload !== null &&
    "name" in payload &&
    typeof payload.name === "string"
      ? payload.name.trim().toLowerCase()
      : "";
  const name = rawName.endsWith(".js") ? rawName : `${rawName}.js`;

  if (
    name.length < 4 ||
    name.length > MAX_PLAYGROUND_FILE_NAME_LENGTH ||
    !/^[a-z][a-z0-9_-]*\.js$/.test(name)
  ) {
    return {
      valid: false as const,
      error:
        "Use 1–29 lowercase letters, numbers, hyphens, or underscores, followed by .js.",
    };
  }

  return { valid: true as const, name };
}

export function validatePlaygroundFileId(payload: unknown) {
  const fileId =
    typeof payload === "object" &&
    payload !== null &&
    "fileId" in payload &&
    typeof payload.fileId === "string"
      ? payload.fileId
      : "";

  if (fileId.length < 1 || fileId.length > 100) {
    return {
      valid: false as const,
      error: "Choose a private JavaScript file and try again.",
    };
  }

  return { valid: true as const, fileId };
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
