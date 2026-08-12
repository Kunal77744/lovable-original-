"use client";

import { useState } from "react";

type AcceptedSolutionDownloadProps = {
  problemSlug: string;
  problemTitle: string;
  source: string;
};

export function acceptedSolutionFileContents(source: string) {
  return source.endsWith("\n") ? source : `${source}\n`;
}

export function AcceptedSolutionDownload({
  problemSlug,
  problemTitle,
  source,
}: AcceptedSolutionDownloadProps) {
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const fileName = `${problemSlug}.accepted.js`;

  function downloadAcceptedSource() {
    const blob = new Blob([acceptedSolutionFileContents(source)], {
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
    <section
      className="accepted-source-download"
      aria-labelledby={`accepted-source-download-${problemSlug}`}
    >
      <div>
        <span>Keep a local copy</span>
        <h3 id={`accepted-source-download-${problemSlug}`}>
          Take your Accepted source with you
        </h3>
        <p>
          Download your latest Accepted solution for {problemTitle} as a
          runnable JavaScript file. Your private saved work stays unchanged.
        </p>
      </div>
      <div className="accepted-source-download-action">
        <button type="button" onClick={downloadAcceptedSource}>
          Download Accepted .js
        </button>
        <p aria-live="polite">
          {downloadedFile ? `${downloadedFile} downloaded.` : ""}
        </p>
      </div>
    </section>
  );
}
