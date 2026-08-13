"use client";

import { useState } from "react";
import styles from "./submission-source-download.module.css";

type SubmissionSourceDownloadProps = {
  createdAt: string;
  problemSlug: string;
  problemTitle: string;
  source: string;
};

export function submissionSourceFileName(
  problemSlug: string,
  createdAt: string,
) {
  const timestamp = new Date(createdAt)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z")
    .replace("T", "-");

  return `${problemSlug}.${timestamp}.js`;
}
export function SubmissionSourceDownload({
  createdAt,
  problemSlug,
  problemTitle,
  source,
}: SubmissionSourceDownloadProps) {
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const fileName = submissionSourceFileName(problemSlug, createdAt);

  function downloadSubmissionSource() {
    const blob = new Blob([source], {
      type: "text/javascript;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setDownloadedFile(fileName);
  }

  return (
    <aside
      className={styles.download}
      aria-labelledby="submission-source-download-title"
    >
      <div className={styles.copy}>
        <span>Portable snapshot</span>
        <strong id="submission-source-download-title">
          Keep this exact try as a JavaScript file
        </strong>
        <p>
          Download the submitted source for {problemTitle}. This keeps the
          private record and your current editor unchanged.
        </p>
      </div>
      <div className={styles.action}>
        <button type="button" onClick={downloadSubmissionSource}>
          Download this submission .js
        </button>
        <p aria-live="polite">
          {downloadedFile ? `${downloadedFile} downloaded.` : ""}
        </p>
      </div>
    </aside>
  );
}
