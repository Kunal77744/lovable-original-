"use client";

import { FormEvent, useState } from "react";
import { validateEarlyAccessEmail } from "@/lib/early-access-validation";

type FormState =
  | { kind: "idle"; message: "" }
  | { kind: "error" | "success"; message: string };

export function EarlyAccessForm() {
  const [email, setEmail] = useState("");
  const [formState, setFormState] = useState<FormState>({
    kind: "idle",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validationMessage = validateEarlyAccessEmail(email);

    if (validationMessage) {
      setFormState({ kind: "error", message: validationMessage });
      return;
    }

    setIsSubmitting(true);
    setFormState({ kind: "idle", message: "" });

    try {
      const response = await fetch("/api/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { message?: string };

      if (!response.ok) {
        setFormState({
          kind: "error",
          message:
            payload.message ??
            "We couldn't save your place. Your email is still here, so please try again.",
        });
        return;
      }

      setFormState({
        kind: "success",
        message: payload.message ?? "You're on the early-access list.",
      });
    } catch {
      setFormState({
        kind: "error",
        message:
          "We couldn't reach the signup service. Your email is still here, so please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="early-access">
      <form className="early-access-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="early-access-email">Email address</label>
        <div className="early-access-fields">
          <input
            id="early-access-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (formState.kind !== "idle") {
                setFormState({ kind: "idle", message: "" });
              }
            }}
            aria-describedby="early-access-consent early-access-message"
            aria-invalid={formState.kind === "error"}
            disabled={isSubmitting}
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving your place…" : "Join early access"}
          </button>
        </div>
        <p className="early-access-consent" id="early-access-consent">
          We&apos;ll only use your email for first-course access. No newsletter.
        </p>
        <p
          className={`early-access-message ${
            formState.kind === "error" ? "is-error" : ""
          }`}
          id="early-access-message"
          role={formState.kind === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          {formState.message}
        </p>
      </form>
      <a className="learning-path-link" href="#learning-path">
        See how the learning loop works
      </a>
    </div>
  );
}
