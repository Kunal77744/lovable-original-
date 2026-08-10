import { render, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LearnerEntrySourceTracker } from "./learner-entry-source-tracker";

const analyticsMocks = vi.hoisted(() => ({
  rememberLearnerEntrySource: vi.fn(),
}));

vi.mock("@/lib/product-analytics", () => analyticsMocks);

vi.mock("next/navigation", () => ({
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

describe("LearnerEntrySourceTracker", () => {
  beforeEach(() => {
    analyticsMocks.rememberLearnerEntrySource.mockReset();
    window.history.replaceState({}, "", "/");
  });

  it.each([
    "search_page",
    "directory",
    "community",
    "walkthrough",
    "founder_warm",
  ])("offers the %s query label to the strict source boundary", async (source) => {
    window.history.replaceState({}, "", `/?entry_source=${source}`);

    render(<LearnerEntrySourceTracker />);

    await waitFor(() => {
      expect(analyticsMocks.rememberLearnerEntrySource).toHaveBeenCalledWith(
        source,
      );
    });
  });

  it("passes repeated query labels as a rejectable array", async () => {
    window.history.replaceState(
      {},
      "",
      "/?entry_source=directory&entry_source=community",
    );

    render(<LearnerEntrySourceTracker />);

    await waitFor(() => {
      expect(analyticsMocks.rememberLearnerEntrySource).toHaveBeenCalledWith([
        "directory",
        "community",
      ]);
    });
  });

  it.each([
    "/learn/why-use-semantic-html",
    "/learn/what-is-the-css-box-model",
    "/learn/how-to-practice-javascript",
  ])("classifies an untagged %s visit as a search-page entry", async (path) => {
    window.history.replaceState({}, "", path);

    render(<LearnerEntrySourceTracker />);

    await waitFor(() => {
      expect(analyticsMocks.rememberLearnerEntrySource).toHaveBeenCalledWith(
        "search_page",
      );
    });
  });
});
