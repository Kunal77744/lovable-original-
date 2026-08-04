"use client";

import { useState } from "react";

type ProblemBookmarkButtonProps = {
  initialBookmarked: boolean;
  problemSlug: string;
  problemTitle: string;
};

export function ProblemBookmarkButton({
  initialBookmarked,
  problemSlug,
  problemTitle,
}: ProblemBookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [status, setStatus] = useState<
    "idle" | "saving" | "saved" | "removed" | "error"
  >("idle");

  async function toggleBookmark() {
    const nextBookmarked = !bookmarked;
    setStatus("saving");

    try {
      const response = await fetch(`/api/practice/${problemSlug}/bookmark`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookmarked: nextBookmarked }),
      });

      if (!response.ok) throw new Error("Bookmark update failed");

      setBookmarked(nextBookmarked);
      setStatus(nextBookmarked ? "saved" : "removed");
    } catch {
      setStatus("error");
    }
  }

  const statusMessage =
    status === "saving"
      ? "Saving…"
      : status === "saved"
        ? "Saved privately to your account."
        : status === "removed"
          ? "Removed from your saved problems."
          : status === "error"
            ? "Couldn’t update saved problems. Try again."
            : "";

  return (
    <div className="problem-bookmark-control">
      <button
        aria-label={
          bookmarked
            ? `Remove ${problemTitle} from saved problems`
            : `Save ${problemTitle} for later`
        }
        aria-pressed={bookmarked}
        className={
          bookmarked
            ? "problem-bookmark-button is-bookmarked"
            : "problem-bookmark-button"
        }
        disabled={status === "saving"}
        onClick={toggleBookmark}
        type="button"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20">
          <path d="M5.5 3.5h9v13l-4.5-3-4.5 3v-13Z" />
        </svg>
        {bookmarked ? "Saved for later" : "Save for later"}
      </button>
      <span aria-atomic="true" aria-live="polite" role="status">
        {statusMessage}
      </span>
    </div>
  );
}
