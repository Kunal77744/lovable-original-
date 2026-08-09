"use client";

import { useRef, useState } from "react";
import {
  MAX_CERTIFICATE_DISPLAY_NAME_LENGTH,
  type LearnerSettings,
} from "@/lib/learner-settings";

type LearnerSettingsFormProps = {
  initialSettings: LearnerSettings;
};

export function LearnerSettingsForm({
  initialSettings,
}: LearnerSettingsFormProps) {
  const [certificateDisplayName, setCertificateDisplayName] = useState(
    initialSettings.certificateDisplayName,
  );
  const [savedName, setSavedName] = useState(
    initialSettings.certificateDisplayName,
  );
  const [message, setMessage] = useState(
    initialSettings.updatedAt
      ? "Your saved certificate name is back."
      : "This name is private and belongs only to your account.",
  );
  const [isError, setIsError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const currentNameRef = useRef(initialSettings.certificateDisplayName);
  const hasChanges = certificateDisplayName !== savedName;

  async function saveSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedName = certificateDisplayName;
    setIsSaving(true);
    setIsError(false);
    setMessage("Saving your certificate name…");

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateDisplayName }),
      });
      const payload = (await response.json()) as {
        error?: string;
        settings?: LearnerSettings;
      };

      if (!response.ok || !payload.settings) {
        setIsError(true);
        setMessage(
          payload.error ?? "We couldn’t save your settings. Try again.",
        );
        return;
      }

      setSavedName(payload.settings.certificateDisplayName);

      if (currentNameRef.current === submittedName) {
        currentNameRef.current = payload.settings.certificateDisplayName;
        setCertificateDisplayName(payload.settings.certificateDisplayName);
        setMessage(
          "Certificate name saved. It will return with your account.",
        );
      } else {
        setMessage(
          "Certificate name saved. Your newer changes are still unsaved.",
        );
      }
    } catch {
      setIsError(true);
      setMessage(
        "We couldn’t save your settings. Check your connection and try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="settings-form" onSubmit={saveSettings}>
      <label className="settings-field" htmlFor="certificate-display-name">
        <span id="certificate-display-name-label">Certificate display name</span>
        <input
          id="certificate-display-name"
          name="certificateDisplayName"
          aria-labelledby="certificate-display-name-label"
          value={certificateDisplayName}
          maxLength={MAX_CERTIFICATE_DISPLAY_NAME_LENGTH}
          autoComplete="name"
          onChange={(event) => {
            currentNameRef.current = event.target.value;
            setCertificateDisplayName(event.target.value);
            setIsError(false);
            setMessage(
              event.target.value === savedName
                ? "Your saved certificate name is unchanged."
                : "You have unsaved changes.",
            );
          }}
        />
        <small>
          Use the name you want printed on your private course certificate.{" "}
          <span>{certificateDisplayName.length}</span>/
          {MAX_CERTIFICATE_DISPLAY_NAME_LENGTH}
        </small>
      </label>
      <div className="settings-save-row">
        <button type="submit" disabled={isSaving || !hasChanges}>
          {isSaving ? "Saving…" : "Save certificate name"}
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
