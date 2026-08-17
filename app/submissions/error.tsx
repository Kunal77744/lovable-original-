"use client";

import { PrivateRouteError } from "@/components/private-route-error";

export default function SubmissionsError({ reset }: { reset: () => void }) {
  return (
    <PrivateRouteError
      eyebrow="Submission history interrupted"
      title="We couldn’t load your private submission history."
      description="Your saved attempts and source snapshots stay with your account. Try loading this page again, or return to the practice path."
      returnHref="/practice"
      returnLabel="Return to practice"
      reset={reset}
    />
  );
}
