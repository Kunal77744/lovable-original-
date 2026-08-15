"use client";

import { PrivateRouteError } from "@/components/private-route-error";

export default function WebFoundationsError({ reset }: { reset: () => void }) {
  return (
    <PrivateRouteError
      eyebrow="Course interrupted"
      title="We couldn’t load Web Development Foundations."
      description="Any saved progress stays with your account. Try loading this page again, or return to your dashboard."
      returnHref="/dashboard"
      returnLabel="Return to dashboard"
      reset={reset}
    />
  );
}
