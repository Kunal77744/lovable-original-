const DEFAULT_ACCOUNT_DESTINATION = "/dashboard";
const ACCOUNT_DESTINATION_ORIGIN = "https://lovable-original.local";

export function getSafeAccountDestination(
  value: string | null | undefined,
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_ACCOUNT_DESTINATION;
  }

  try {
    const destination = new URL(value, ACCOUNT_DESTINATION_ORIGIN);

    if (destination.origin !== ACCOUNT_DESTINATION_ORIGIN) {
      return DEFAULT_ACCOUNT_DESTINATION;
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return DEFAULT_ACCOUNT_DESTINATION;
  }
}

export function getSignInHref(destination: string): string {
  const safeDestination = getSafeAccountDestination(destination);
  return `/account?mode=signin&next=${encodeURIComponent(safeDestination)}`;
}
