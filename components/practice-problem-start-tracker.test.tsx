import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PracticeProblemStartTracker } from "./practice-problem-start-tracker";

const analyticsMocks = vi.hoisted(() => ({
  capturePracticeProblemStarted: vi.fn(),
}));

vi.mock("@/lib/product-analytics", () => analyticsMocks);

describe("PracticeProblemStartTracker", () => {
  it("records entry for the supplied first problem", () => {
    render(<PracticeProblemStartTracker problemSlug="sum-two-numbers" />);

    expect(analyticsMocks.capturePracticeProblemStarted).toHaveBeenCalledOnce();
    expect(analyticsMocks.capturePracticeProblemStarted).toHaveBeenCalledWith({
      problemSlug: "sum-two-numbers",
    });
  });
});
