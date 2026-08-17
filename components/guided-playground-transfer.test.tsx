import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GUIDED_PLAYGROUND_TRANSFER_STORAGE_KEY } from "@/lib/guided-playground-transfer";
import { GuidedPlaygroundTransfer } from "./guided-playground-transfer";

describe("GuidedPlaygroundTransfer", () => {
  afterEach(cleanup);

  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("keeps the exact passed source in a one-tab transfer before opening the playground", () => {
    const source = "function applyDiscount(price) { return price * 0.9; }";
    render(
      <GuidedPlaygroundTransfer
        labSlug="functions"
        exerciseId="return-a-result"
        source={source}
      />,
    );

    const link = screen.getByRole("link", { name: "Open a playground copy" });
    link.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(link);

    expect(
      window.sessionStorage.getItem(
        GUIDED_PLAYGROUND_TRANSFER_STORAGE_KEY,
      ),
    ).toContain(source);
    expect(link).toHaveAttribute("href", "/playground?guided_copy=1");
  });
});
