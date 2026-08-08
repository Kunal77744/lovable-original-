import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LessonReadingProgress } from "./lesson-reading-progress";

const sections = [
  { id: "lesson-idea", label: "Document structure" },
  { id: "lesson-section-2", label: "Semantic landmarks" },
  { id: "lesson-section-3", label: "Heading hierarchy" },
];

let observerCallback: IntersectionObserverCallback;

class IntersectionObserverMock {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }

  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
  takeRecords = vi.fn(() => []);
  root = null;
  rootMargin = "0px";
  thresholds = [0.1];
}

function renderProgress(initialFurthestSection = 2) {
  return render(
    <>
      <LessonReadingProgress
        lessonSlug="semantic-html"
        sections={sections}
        initialFurthestSection={initialFurthestSection}
      />
      {sections.map((section) => (
        <section id={section.id} key={section.id} />
      ))}
    </>,
  );
}

describe("LessonReadingProgress", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("offers the exact saved section as the return point", () => {
    renderProgress();

    expect(
      screen.getByRole("link", { name: /continue: semantic landmarks/i }),
    ).toHaveAttribute("href", "#lesson-section-2");
    expect(
      screen.getByRole("list", { name: "2 of 3 sections reached" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Saved privately to your account."),
    ).toBeInTheDocument();
  });

  it("persists the furthest section before showing it as saved", async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ furthestSection: 3 }), { status: 200 }),
    );
    renderProgress(0);
    const thirdSection = document.getElementById("lesson-section-3");

    act(() => {
      observerCallback(
        [
          {
            isIntersecting: true,
            target: thirdSection,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(screen.getByText("Saving your reading place…")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: /continue: heading hierarchy/i }),
      ).toHaveAttribute("href", "#lesson-section-3"),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/lessons/semantic-html/reading-progress",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ section: 3 }),
      }),
    );
  });

  it("keeps failed progress retryable without claiming it saved", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(null, { status: 503 }));
    renderProgress(0);
    const secondSection = document.getElementById("lesson-section-2");

    act(() => {
      observerCallback(
        [
          {
            isIntersecting: true,
            target: secondSection,
          } as unknown as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    });

    expect(
      await screen.findByRole("button", { name: "Retry save" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Saved privately to your account."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: /continue:/i }),
    ).not.toBeInTheDocument();
  });
});
