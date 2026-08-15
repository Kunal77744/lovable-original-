"use client";

import { PrivateRouteError } from "@/components/private-route-error";

export default function SettingsError({ reset }: { reset: () => void }) {
  return (
    <PrivateRouteError
      eyebrow="Settings interrupted"
      title="We couldn’t load your learner settings."
      description="Your saved settings and learning work stay with your account. Try loading this page again, or return to your dashboard."
      returnHref="/dashboard"
      returnLabel="Return to dashboard"
      reset={reset}
    />
  );
}
