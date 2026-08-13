"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignOut() {
    setIsSigningOut(true);
    setError(null);

    let result: Awaited<ReturnType<typeof authClient.signOut>>;

    try {
      result = await authClient.signOut();
    } catch {
      setError("We couldn’t sign you out. Check your connection and try again.");
      setIsSigningOut(false);
      return;
    }

    if (result.error) {
      setError("We couldn’t sign you out. Try again.");
      setIsSigningOut(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="sign-out-control">
      <button type="button" onClick={handleSignOut} disabled={isSigningOut}>
        {isSigningOut ? "Signing out…" : "Sign out"}
      </button>
      {error ? (
        <span className="sign-out-error" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}
