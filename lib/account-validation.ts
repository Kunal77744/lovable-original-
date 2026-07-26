export const PASSWORD_MIN_LENGTH = 10;

export function validateName(name: string) {
  const normalized = name.trim();

  if (normalized.length < 2) {
    return "Enter your name.";
  }

  if (normalized.length > 80) {
    return "Keep your name under 80 characters.";
  }

  return null;
}

export function validateEmail(email: string) {
  const normalized = email.trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return "Enter a valid email address.";
  }

  return null;
}

export function validatePassword(password: string) {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  if (password.length > 128) {
    return "Keep your password under 129 characters.";
  }

  return null;
}
