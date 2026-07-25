export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function validateEarlyAccessEmail(email: string) {
  const normalized = normalizeEmail(email);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return "Enter a valid email address.";
  }

  if (normalized.length > 254) {
    return "Keep your email address under 255 characters.";
  }

  return null;
}
