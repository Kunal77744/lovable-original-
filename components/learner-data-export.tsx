"use client";

import { useState } from "react";

type ExportStatus = "idle" | "preparing" | "ready" | "error";

function downloadFilename(response: Response) {
  const disposition = response.headers.get("content-disposition");
  const match = disposition?.match(/filename="([^"]+)"/);
  return match?.[1] ?? "lovable-original-learning-data.json";
}

export function LearnerDataExport() {
  const [status, setStatus] = useState<ExportStatus>("idle");

  async function exportLearningData() {
    setStatus("preparing");

    try {
      const response = await fetch("/api/settings/export", {
        headers: { accept: "application/json" },
      });

      if (!response.ok) {
        throw new Error("Learning data export failed");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const download = document.createElement("a");
      download.href = objectUrl;
      download.download = downloadFilename(response);
      document.body.append(download);
      download.click();
      download.remove();
      URL.revokeObjectURL(objectUrl);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="settings-export-action">
      <button
        type="button"
        onClick={exportLearningData}
        disabled={status === "preparing"}
      >
        {status === "preparing" ? "Preparing download…" : "Download my learning data"}
      </button>
      <p className={status === "error" ? "is-error" : undefined} role="status" aria-live="polite">
        {status === "ready"
          ? "Your private JSON file is ready."
          : status === "error"
            ? "The download didn’t finish. Try again."
            : "Nothing is published or shared when you download."}
      </p>
    </div>
  );
}
