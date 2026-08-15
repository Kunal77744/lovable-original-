"use client";

import { PrivateRouteError } from "@/components/private-route-error";

export default function InterviewError({ reset }: { reset: () => void }) {
  return (
    <PrivateRouteError
      eyebrow="Interview practice interrupted"
      title="We couldn’t load your private interview practice."
      description="Your saved answers stay with your account. Try loading this page again, or return to your dashboard."
      returnHref="/dashboard"
      returnLabel="Return to dashboard"
      reset={reset}
    />
  );
}
