"use client";

import { useId, useState } from "react";

type GuidedStarterRestoreProps = {
  disabled?: boolean;
  isStarterLoaded: boolean;
  onRestore: () => void;
};

export function GuidedStarterRestore({
  disabled = false,
  isStarterLoaded,
  onRestore,
}: GuidedStarterRestoreProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmationId = useId();

  if (!isConfirming) {
    return (
      <div className="guided-starter-restore">
        <button
          type="button"
          className="guided-starter-restore-trigger"
          aria-expanded="false"
          aria-controls={confirmationId}
          disabled={disabled || isStarterLoaded}
          onClick={() => setIsConfirming(true)}
        >
          {isStarterLoaded ? "Starter loaded" : "Restore starter"}
        </button>
      </div>
    );
  }

  return (
    <div className="guided-starter-restore">
      <div
        className="guided-starter-restore-confirmation"
        id={confirmationId}
      >
        <div>
          <strong>Restore the authored starter?</strong>
          <p>
            This replaces the editor text. Saved completion and past check
            results stay unchanged.
          </p>
        </div>
        <div className="guided-starter-restore-actions">
          <button
            type="button"
            className="guided-starter-restore-cancel"
            onClick={() => setIsConfirming(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="guided-starter-restore-confirm"
            disabled={disabled}
            onClick={() => {
              onRestore();
              setIsConfirming(false);
            }}
          >
            Restore starter
          </button>
        </div>
      </div>
    </div>
  );
}
