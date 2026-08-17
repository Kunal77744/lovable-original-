"use client";

import { PrivateRouteError } from "@/components/private-route-error";

export default function CertificateError({ reset }: { reset: () => void }) {
  return (
    <PrivateRouteError
      eyebrow="Certificate interrupted"
      title="We couldn’t load your course certificate."
      description="Your course result stays with your account. Try loading this page again, or return to your dashboard."
      returnHref="/dashboard"
      returnLabel="Return to dashboard"
      reset={reset}
    />
  );
}
