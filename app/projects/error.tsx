"use client";

import { PrivateRouteError } from "@/components/private-route-error";

export default function ProjectsError({ reset }: { reset: () => void }) {
  return (
    <PrivateRouteError
      eyebrow="Projects interrupted"
      title="We couldn’t load your private project work."
      description="Your saved projects and reviews stay with your account. Try loading this page again, or return to your profile."
      returnHref="/profile"
      returnLabel="Return to profile"
      reset={reset}
    />
  );
}
