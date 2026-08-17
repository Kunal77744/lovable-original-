"use client";

import Link from "next/link";
import { type MouseEvent, useState } from "react";
import {
  GUIDED_PLAYGROUND_TRANSFER_STORAGE_KEY,
  serializeGuidedPlaygroundTransfer,
} from "@/lib/guided-playground-transfer";
import type { JavaScriptCodeLabSlug } from "@/lib/javascript-lab-progress";

export function GuidedPlaygroundTransfer({
  labSlug,
  exerciseId,
  source,
}: {
  labSlug: JavaScriptCodeLabSlug;
  exerciseId: string;
  source: string;
}) {
  const [message, setMessage] = useState("");

  function keepCopyForPlayground(event: MouseEvent<HTMLAnchorElement>) {
    const transfer = serializeGuidedPlaygroundTransfer({
      labSlug,
      exerciseId,
      source,
    });
    if (!transfer) {
      event.preventDefault();
      setMessage("This passed copy is not available to transfer.");
      return;
    }

    try {
      window.sessionStorage.setItem(
        GUIDED_PLAYGROUND_TRANSFER_STORAGE_KEY,
        transfer,
      );
    } catch {
      event.preventDefault();
      setMessage(
        "Browser storage is blocked. Your guided draft is still safe here.",
      );
    }
  }

  return (
    <aside
      className="guided-playground-transfer"
      aria-label="Experiment with passed code"
    >
      <div>
        <span>Try another angle</span>
        <strong>Take this passed code into the playground.</strong>
        <p>
          Make an unsaved copy for experiments. Your guided draft, completion,
          and current playground files stay unchanged.
        </p>
      </div>
      <Link href="/playground?guided_copy=1" onClick={keepCopyForPlayground}>
        Open a playground copy <span aria-hidden="true">→</span>
      </Link>
      {message ? (
        <p className="guided-playground-transfer-error" role="status">
          {message}
        </p>
      ) : null}
    </aside>
  );
}
