import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PrivateRouteError } from "./private-route-error";

describe("PrivateRouteError", () => {
  it("retries in place and offers one safe return", () => {
    const reset = vi.fn();

    render(
      <PrivateRouteError
        eyebrow="Workspace interrupted"
        title="We couldn’t load this private workspace."
        description="Your saved work stays with your account."
        returnHref="/dashboard"
        returnLabel="Return to dashboard"
        reset={reset}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("link", { name: "Return to dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
