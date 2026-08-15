"use client";

import { PrivateRouteError } from "@/components/private-route-error";

export default function PlaygroundError({ reset }: { reset: () => void }) {
  return (
    <PrivateRouteError
      eyebrow="Playground interrupted"
      title="We couldn’t load your private playground."
      description="Your saved files stay with your account. Try loading this page again, or return to the practice path."
      returnHref="/practice"
      returnLabel="Return to practice"
      reset={reset}
    />
  );
}
