"use client";

import { FormEvent, useState } from "react";
import { validatePassword } from "@/lib/account-validation";
import { authClient } from "@/lib/auth-client";

const initialMessage =
  "Use 10–128 characters. Changing it signs out your other sessions.";

export function LearnerPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmedPassword, setConfirmedPassword] = useState("");
  const [message, setMessage] = useState(initialMessage);
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const hasCompleteForm = Boolean(
    currentPassword && newPassword && confirmedPassword,
  );

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsError(false);

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      setIsError(true);
      setMessage(passwordError);
      return;
    }

    if (newPassword === currentPassword) {
      setIsError(true);
      setMessage("Choose a password different from your current one.");
      return;
    }

    if (newPassword !== confirmedPassword) {
      setIsError(true);
      setMessage("Your new passwords don’t match.");
      return;
    }

    setIsSaving(true);
    setMessage("Changing your password…");

    try {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (result.error) {
        setIsError(true);
        setMessage(
          result.error.code === "SESSION_NOT_FRESH"
            ? "Sign out and back in, then change your password. Nothing changed."
            : result.error.code === "INVALID_PASSWORD"
              ? "Your current password didn’t match. Nothing changed."
              : "We couldn’t change your password. Check your current password and try again.",
        );
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmedPassword("");
      setMessage("Password changed. Your other signed-in sessions are closed.");
    } catch {
      setIsError(true);
      setMessage(
        "We couldn’t change your password. Check your connection and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function updateField(update: (value: string) => void, value: string) {
    update(value);
    setIsError(false);
    setMessage(initialMessage);
  }

  return (
    <form className="settings-form" onSubmit={changePassword} noValidate>
      <div className="settings-password-fields">
        <label className="settings-field" htmlFor="current-password">
          <span>Current password</span>
          <input
            id="current-password"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={currentPassword}
            disabled={isSaving}
            onChange={(event) =>
              updateField(setCurrentPassword, event.target.value)
            }
            required
          />
        </label>

        <label className="settings-field" htmlFor="new-password">
          <span>New password</span>
          <input
            id="new-password"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={128}
            value={newPassword}
            disabled={isSaving}
            onChange={(event) => updateField(setNewPassword, event.target.value)}
            required
          />
        </label>

        <label className="settings-field" htmlFor="confirm-new-password">
          <span>Confirm new password</span>
          <input
            id="confirm-new-password"
            name="confirmedPassword"
            type="password"
            autoComplete="new-password"
            minLength={10}
            maxLength={128}
            value={confirmedPassword}
            disabled={isSaving}
            onChange={(event) =>
              updateField(setConfirmedPassword, event.target.value)
            }
            required
          />
        </label>
      </div>

      <div className="settings-save-row">
        <button type="submit" disabled={isSaving || !hasCompleteForm}>
          {isSaving ? "Changing password…" : "Change password"}
        </button>
        <p
          className={isError ? "is-error" : ""}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {message}
        </p>
      </div>
    </form>
  );
}
