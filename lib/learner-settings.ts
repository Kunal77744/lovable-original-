export const MIN_CERTIFICATE_DISPLAY_NAME_LENGTH = 2;
export const MAX_CERTIFICATE_DISPLAY_NAME_LENGTH = 60;

export type LearnerSettings = {
  certificateDisplayName: string;
  updatedAt: string | null;
};

type ValidSettings = {
  valid: true;
  certificateDisplayName: string;
};

type InvalidSettings = {
  valid: false;
  error: string;
};

export function validateLearnerSettings(
  payload: unknown,
): ValidSettings | InvalidSettings {
  if (!payload || typeof payload !== "object") {
    return {
      valid: false,
      error: "Enter the name you want on your certificate.",
    };
  }

  const rawName = (payload as { certificateDisplayName?: unknown })
    .certificateDisplayName;

  if (typeof rawName !== "string") {
    return {
      valid: false,
      error: "Enter the name you want on your certificate.",
    };
  }

  const certificateDisplayName = rawName.trim().replace(/\s+/g, " ");

  if (certificateDisplayName.length < MIN_CERTIFICATE_DISPLAY_NAME_LENGTH) {
    return {
      valid: false,
      error: "Use at least 2 characters for your certificate name.",
    };
  }

  if (certificateDisplayName.length > MAX_CERTIFICATE_DISPLAY_NAME_LENGTH) {
    return {
      valid: false,
      error: "Keep your certificate name to 60 characters or fewer.",
    };
  }

  if (
    !/^[\p{L}\p{M}][\p{L}\p{M}\p{N} .,'’\-]*$/u.test(
      certificateDisplayName,
    )
  ) {
    return {
      valid: false,
      error:
        "Use letters, numbers, spaces, periods, apostrophes, commas, or hyphens.",
    };
  }

  return {
    valid: true,
    certificateDisplayName,
  };
}

export function getDefaultCertificateDisplayName(accountName: string) {
  const result = validateLearnerSettings({
    certificateDisplayName: accountName,
  });

  return result.valid ? result.certificateDisplayName : "Learner";
}
