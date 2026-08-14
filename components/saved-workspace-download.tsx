"use client";

import { useState } from "react";

type SavedWorkspaceDownloadProps = {
  fileName: string;
  label: string;
  mimeType: string;
  source: string;
};

export function savedWorkspaceFileContents(source: string) {
  return source.endsWith("\n") ? source : `${source}\n`;
}

export function SavedWorkspaceDownload({
  fileName,
  label,
  mimeType,
  source,
}: SavedWorkspaceDownloadProps) {
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);

  function downloadSavedSource() {
    const blob = new Blob([savedWorkspaceFileContents(source)], {
      type: `${mimeType};charset=utf-8`,
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
    <div className="workspace-download">
      <button type="button" onClick={downloadSavedSource}>
        {label}
      </button>
      <span className="workspace-download-status" aria-live="polite">
        {downloadedFile ? `${downloadedFile} downloaded.` : ""}
      </span>
    </div>
  );
}
