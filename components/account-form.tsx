"use client";

import { FormEvent, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getSafeAccountDestination } from "@/lib/account-destination";
import { captureAccountCreated } from "@/lib/product-analytics";
import {
  validateEmail,
  validateName,
  validatePassword,
} from "@/lib/account-validation";

type Mode = "create" | "signin";

const emptySubscribe = () => () => {};

export function AccountForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const destination = getSafeAccountDestination(searchParams.get("next"));
  const [mode, setMode] = useState<Mode>(
    searchParams.get("mode") === "signin" ? "signin" : "create",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isReady = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  function changeMode(nextMode: Mode) {
    setMode(nextMode);
    setError(null);
    setPassword("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationError =
      (mode === "create" ? validateName(name) : null) ??
      validateEmail(email) ??
      validatePassword(password);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const result =
        mode === "create"
          ? await authClient.signUp.email({
              name: name.trim(),
              email: email.trim().toLowerCase(),
              password,
              callbackURL: destination,
            })
          : await authClient.signIn.email({
              email: email.trim().toLowerCase(),
              password,
              callbackURL: destination,
            });

      if (result.error) {
        setError(
          mode === "signin"
            ? "That email and password didn’t match. Try again."
            : result.error.message ??
                "We couldn’t create your account. Try signing in instead.",
        );
        return;
      }

      if (mode === "create") {
        captureAccountCreated();
      }

      router.push(destination);
      router.refresh();
    } catch {
      setError("Something went wrong. Check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="account-card">
      <div className="account-tabs" role="tablist" aria-label="Account action">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "create"}
          className="account-tab"
          onClick={() => changeMode("create")}
        >
          Create account
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className="account-tab"
          onClick={() => changeMode("signin")}
        >
          Sign in
        </button>
      </div>

      <form
        className="account-form"
        method="post"
        onSubmit={handleSubmit}
        noValidate
      >
        {mode === "create" ? (
          <label htmlFor="account-name">
            <span>Name</span>
            <input
              id="account-name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={80}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
        ) : null}

        <label htmlFor="account-email">
          <span>Email</span>
          <input
            id="account-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label htmlFor="account-password">
          <span>Password</span>
          <input
            id="account-password"
            name="password"
            type="password"
            autoComplete={mode === "create" ? "new-password" : "current-password"}
            minLength={10}
            maxLength={128}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-describedby={mode === "create" ? "password-help" : undefined}
            required
          />
          {mode === "create" ? (
            <small id="password-help">Use at least 10 characters.</small>
          ) : null}
        </label>

        <div className="form-message" aria-live="polite">
          {error ? <p className="form-error">{error}</p> : null}
        </div>

        <button
          className="account-submit"
          type="submit"
          disabled={!isReady || isSubmitting}
        >
          {!isReady
            ? "Preparing secure sign in…"
            : isSubmitting
            ? mode === "create"
              ? "Creating your account…"
              : "Signing you in…"
            : mode === "create"
              ? "Create my account"
              : "Sign in"}
        </button>

        <p className="account-free-access">
          Free. No payment details required.
        </p>
      </form>

      <p className="account-privacy">
        We only ask for what you need to enter your learning space.
      </p>
    </div>
  );
}
