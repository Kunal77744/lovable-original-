"use client";

import { useId, useState } from "react";

type LessonStarterRestoreProps = {
  disabled?: boolean;
  isStarterLoaded: boolean;
  onRestore: () => void;
};

export function LessonStarterRestore({
  disabled = false,
  isStarterLoaded,
  onRestore,
}: LessonStarterRestoreProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const confirmationId = useId();

  if (!isConfirming) {
    return (
      <div className="starter-restore">
        <button
          type="button"
          className="starter-restore-trigger"
          aria-expanded="false"
          aria-controls={confirmationId}
          disabled={disabled || isStarterLoaded}
          onClick={() => setIsConfirming(true)}
        >
          {isStarterLoaded ? "Starter loaded" : "Restore lesson starter"}
        </button>
      </div>
    );
  }

  return (
    <div className="starter-restore">
      <div className="starter-restore-confirmation" id={confirmationId}>
        <div>
          <strong>Restore the authored lesson starter?</strong>
          <p>
            This replaces only the editor text. Your saved result and past
            checks stay unchanged until you submit again.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="starter-restore-cancel"
            onClick={() => setIsConfirming(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="starter-restore-confirm"
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
