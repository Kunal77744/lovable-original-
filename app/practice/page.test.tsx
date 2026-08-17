import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCodingCatalogProgress,
  getCodingMistakeReviewQueueForStudent,
  getCodingProblemBookmarksForStudent,
} from "@/db/coding-practice";
import { getJavaScriptLabCatalogProgress } from "@/db/javascript-lab-progress";
import { getJavaScriptCapstoneSummary } from "@/db/javascript-capstone";
import { getJavaScriptMixedReviewResultForStudent } from "@/db/javascript-mixed-review";
import { auth } from "@/lib/auth";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import PracticePage from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingCatalogProgress: vi.fn(),
  getCodingMistakeReviewQueueForStudent: vi.fn(),
  getCodingProblemBookmarksForStudent: vi.fn(),
}));
vi.mock("@/db/javascript-lab-progress", () => ({
  getJavaScriptLabCatalogProgress: vi.fn(),
}));
vi.mock("@/db/javascript-capstone", () => ({
  getJavaScriptCapstoneSummary: vi.fn(),
}));
vi.mock("@/db/javascript-mixed-review", () => ({
  getJavaScriptMixedReviewResultForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getProgress = vi.mocked(getCodingCatalogProgress);
const getReviewQueue = vi.mocked(getCodingMistakeReviewQueueForStudent);
const getBookmarks = vi.mocked(getCodingProblemBookmarksForStudent);
const getLabProgress = vi.mocked(getJavaScriptLabCatalogProgress);
const getCapstoneSummary = vi.mocked(getJavaScriptCapstoneSummary);
const getMixedReviewResult = vi.mocked(
  getJavaScriptMixedReviewResultForStudent,
);

describe("PracticePage progress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getBookmarks.mockResolvedValue([]);
    getReviewQueue.mockResolvedValue([]);
    getLabProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 55,
      nextLabSlug: "foundations",
      nextLabTitle: "JavaScript foundations",
      nextHref: "/practice/judge-basics",
      nextExerciseNumber: 1,
      labs: [
        {
          slug: "foundations",
          title: "JavaScript foundations",
          href: "/practice/judge-basics",
          completedCount: 0,
          totalCount: 4,
          nextExerciseNumber: 1,
          state: "not-started",
        },
      ],
    });
    getCapstoneSummary.mockResolvedValue({
      state: "not-started",
      passedChecks: 0,
    });
    getMixedReviewResult.mockResolvedValue(null);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a fresh signed-in learner Accepted 0 of 12", async () => {
    getSession.mockResolvedValue({
      user: { id: "fresh-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 12,
      completedSlugs: [],
    });

    render(await PracticePage());

    expect(screen.getByText("Accepted 0 of 12")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start JavaScript foundations" }),
    ).toHaveAttribute("href", "/practice/judge-basics");
    expect(screen.getByLabelText("Accepted 0 of 12")).toHaveTextContent(
      "Accepted 0 of 12",
    );
    expect(
      screen.getByText("Saved privately to your account"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review saved submissions" }),
    ).toHaveAttribute("href", "/submissions");
    expect(
      screen.getByText(
        "Each problem runs in browser-based JavaScript. Signed-in attempts are saved to your account.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View private skill record" }),
    ).toHaveAttribute("href", "/practice/progress");
    expect(
      screen.getByRole("link", { name: "Open today’s challenge" }),
    ).toHaveAttribute("href", "/practice/daily");
    expect(getProgress).toHaveBeenCalledWith("fresh-learner");
    expect(getBookmarks).toHaveBeenCalledWith("fresh-learner");
    expect(getReviewQueue).toHaveBeenCalledWith("fresh-learner");
    expect(getLabProgress).toHaveBeenCalledWith("fresh-learner");
    expect(getCapstoneSummary).toHaveBeenCalledWith("fresh-learner");
    expect(getMixedReviewResult).toHaveBeenCalledWith("fresh-learner");
    expect(
      screen.getByRole("link", {
        name: /Build an expense report from raw data/,
      }),
    ).toHaveAttribute("href", "/practice/judge-basics");
    expect(screen.getByText("Guided path first")).toBeInTheDocument();
    expect(screen.getByText("0/55 steps saved")).toBeInTheDocument();
    expect(document.querySelector(".practice-capstone-entry")).toHaveClass(
      "is-locked",
    );
    expect(
      screen.getByRole("link", { name: "Check review status" }),
    ).toHaveAttribute("href", "/practice/review");
    expect(
      screen.getByRole("link", { name: "View saved collection" }),
    ).toHaveAttribute("href", "/practice/bookmarks");
    expect(screen.getByText("Nothing saved yet. Use Save for later on any problem.")).toBeInTheDocument();
    expect(screen.getByText("No concepts waiting. A saved Wrong Answer adds one here; an Accepted retry clears it.")).toBeInTheDocument();
  });

  it("offers mixed review after three completed labs without replacing exact resume", async () => {
    getSession.mockResolvedValue({
      user: { id: "review-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 1,
      totalCount: 12,
      completedSlugs: ["sum-two-numbers"],
    });
    getLabProgress.mockResolvedValue({
      completedCount: 12,
      totalCount: 55,
      nextLabSlug: "test-design",
      nextLabTitle: "Test design",
      nextHref: "/practice/test-design?exercise=1",
      nextExerciseNumber: 1,
      labs: [
        { slug: "foundations", title: "Foundations", href: "/practice/foundations", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
        { slug: "tracing", title: "Tracing", href: "/practice/tracing", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
        { slug: "debugging", title: "Debugging", href: "/practice/debugging", completedCount: 4, totalCount: 4, nextExerciseNumber: null, state: "complete" },
        { slug: "test-design", title: "Test design", href: "/practice/test-design", completedCount: 0, totalCount: 4, nextExerciseNumber: 1, state: "not-started" },
      ],
    });

    render(await PracticePage());

    expect(
      screen.getByRole("link", {
        name: /Continue Test design, exercise 1/,
      }),
    ).toHaveAttribute("href", "/practice/test-design?exercise=1");
    expect(
      screen.getByRole("link", { name: "Start spaced review" }),
    ).toHaveAttribute("href", "/practice/mixed-review");
    expect(screen.getByText(/without changing judged mastery/)).toBeInTheDocument();
  });

  it("restores a returning learner's saved Accepted total", async () => {
    getSession.mockResolvedValue({
      user: { id: "returning-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 12,
      completedSlugs: ["sum-two-numbers", "reverse-a-word"],
    });
    getBookmarks.mockResolvedValue([
      {
        slug: "reverse-a-word",
        number: 5,
        title: "Reverse a word",
        skill: "String traversal",
      },
    ]);
    getReviewQueue.mockResolvedValue([
      {
        slug: "largest-value",
        number: 4,
        title: "Largest value",
        skill: "Arrays",
        concept: "Compare only the data values",
        recoveryHint:
          "Separate the leading count from the values you compare. Test an all-negative list so a starting value of zero cannot hide the mistake.",
        passedTests: 3,
        totalTests: 4,
        attemptedAt: "2026-08-04T09:00:00.000Z",
      },
    ]);
    getCapstoneSummary.mockResolvedValue({
      state: "in-progress",
      passedChecks: 4,
    });

    render(await PracticePage());

    expect(screen.getByText("Accepted 2 of 12")).toBeInTheDocument();
    expect(screen.getByLabelText("Accepted 2 of 12")).toHaveTextContent(
      "Accepted 2 of 12",
    );
    expect(
      document.querySelectorAll(".problem-row.is-complete"),
    ).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "Language foundations" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Data and iteration" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Collections and structure" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Search patterns" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "All 12" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Unfinished 10" }),
    ).toHaveAttribute("href", "/practice?status=unfinished");
    expect(
      screen.getByRole("link", { name: "Accepted 2" }),
    ).toHaveAttribute("href", "/practice?status=accepted");
    expect(
      screen.getByRole("link", { name: "Continue at step 2 of 12" }),
    ).toHaveAttribute("href", "/practice/even-or-odd");
    expect(
      screen.getByRole("link", { name: "Open the playground" }),
    ).toHaveAttribute("href", "/playground");
    const privateLabLinks: Array<[RegExp, string]> = [
      [/Check my readiness/, "/practice/readiness"],
      [/Continue JavaScript foundations, exercise 1/, "/practice/judge-basics"],
      [/Trace values/, "/practice/tracing"],
      [/Repair defects/, "/practice/debugging"],
      [/Find edge cases/, "/practice/test-design"],
      [/Use data structures/, "/practice/data-structures"],
      [/Practice functions and scope/, "/practice/functions"],
      [/Practice recursion/, "/practice/recursion"],
      [/Search and sort values/, "/practice/search-sort"],
      [/Use stacks and queues/, "/practice/stacks-queues"],
      [/Follow linked lists/, "/practice/linked-lists"],
      [/Traverse trees and graphs/, "/practice/trees-graphs"],
      [/Work with the DOM/, "/practice/dom"],
      [/Compare efficiency/, "/practice/efficiency"],
      [/Implement algorithm patterns/, "/practice/algorithm-patterns"],
      [/Take the 30-minute challenge/, "/practice/challenge"],
    ];

    for (const [name, href] of privateLabLinks) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
    expect(getProgress).toHaveBeenCalledWith("returning-learner");
    expect(
      screen.getByRole("link", {
        name: /05\s*Reverse a word\s*String traversal/,
      }),
    ).toHaveAttribute("href", "/practice/reverse-a-word");
    expect(screen.getByText("Compare only the data values")).toBeInTheDocument();
    expect(screen.getByText("Latest attempt: 3/4 checks")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review Largest value" }),
    ).toHaveAttribute("href", "/practice/largest-value");
    expect(
      screen.getByRole("link", { name: "Open review session" }),
    ).toHaveAttribute("href", "/practice/review");
    expect(
      screen.getByRole("link", { name: "View saved collection" }),
    ).toHaveAttribute("href", "/practice/bookmarks");
    expect(
      document.querySelector(".practice-review-entry"),
    ).toHaveTextContent("2 problems");
    expect(document.querySelector(".mistake-review")).not.toHaveTextContent(
      /function solve|learner code/i,
    );
    expect(getLabProgress).toHaveBeenCalledWith("returning-learner");
    expect(screen.getByText("4/6 outcomes")).toBeInTheDocument();
    expect(screen.getByText("Continue project")).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: /Build an expense report from raw data/,
      }),
    ).toHaveAttribute("href", "/projects/javascript-expense-report");
  });

  it("unlocks a new capstone after all guided JavaScript steps", async () => {
    getSession.mockResolvedValue({
      user: { id: "guided-path-complete" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 12,
      completedSlugs: [],
    });
    getLabProgress.mockResolvedValue({
      completedCount: 55,
      totalCount: 55,
      nextLabSlug: null,
      nextLabTitle: null,
      nextHref: "/practice",
      nextExerciseNumber: null,
      labs: [],
    });

    render(await PracticePage());

    expect(
      screen.getByRole("link", {
        name: /Build an expense report from raw data/,
      }),
    ).toHaveAttribute("href", "/projects/javascript-expense-report");
    expect(screen.getByText("Start project")).toBeInTheDocument();
  });

  it("resumes the saved foundations unit before problem 01", async () => {
    getSession.mockResolvedValue({
      user: { id: "foundations-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 12,
      completedSlugs: [],
    });
    getLabProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 55,
      nextLabSlug: "foundations",
      nextLabTitle: "JavaScript foundations",
      nextHref: "/practice/foundations",
      nextExerciseNumber: 3,
      labs: [
        {
          slug: "foundations",
          title: "JavaScript foundations",
          href: "/practice/foundations",
          completedCount: 2,
          totalCount: 4,
          nextExerciseNumber: 3,
          state: "in-progress",
        },
      ],
    });

    render(await PracticePage());

    expect(
      screen.getByRole("link", {
        name: "Continue foundations · step 3 of 4",
      }),
    ).toHaveAttribute("href", "/practice/foundations");
  });

  it("filters a signed-in catalog by saved Accepted status", async () => {
    getSession.mockResolvedValue({
      user: { id: "filter-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 2,
      totalCount: 12,
      completedSlugs: ["sum-two-numbers", "balanced-brackets"],
    });

    render(
      await PracticePage({
        searchParams: Promise.resolve({ status: "accepted" }),
      }),
    );

    expect(
      screen.getByRole("link", { name: "Accepted 2" }),
    ).toHaveAttribute("aria-current", "page");
    expect(document.querySelectorAll(".problem-row")).toHaveLength(2);
    expect(
      document.querySelector('[href="/practice/sum-two-numbers"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[href="/practice/balanced-brackets"]'),
    ).toBeInTheDocument();
    expect(
      document.querySelector('[href="/practice/even-or-odd"]'),
    ).not.toHaveClass("problem-row");
    expect(
      screen.getByRole("link", { name: "Continue at step 2 of 12" }),
    ).toHaveAttribute("href", "/practice/even-or-odd");
  });

  it("shows a truthful empty Unfinished view after all problems are Accepted", async () => {
    getSession.mockResolvedValue({
      user: { id: "complete-filter-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 12,
      totalCount: 12,
      completedSlugs: CODING_PROBLEMS.map((problem) => problem.slug),
    });

    render(
      await PracticePage({
        searchParams: Promise.resolve({ status: "unfinished" }),
      }),
    );

    expect(screen.getByText("Every problem is Accepted.")).toBeInTheDocument();
    expect(document.querySelectorAll(".problem-row")).toHaveLength(0);
    expect(
      screen.getByRole("link", { name: "Show all 12 problems" }),
    ).toHaveAttribute("href", "/practice");
    expect(
      screen.getByRole("link", { name: "Review the 12-problem path" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
  });

  it("opens problem 01 after all four foundations steps are saved", async () => {
    getSession.mockResolvedValue({
      user: { id: "foundations-complete" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 12,
      completedSlugs: [],
    });
    getLabProgress.mockResolvedValue({
      completedCount: 4,
      totalCount: 55,
      nextLabSlug: "tracing",
      nextLabTitle: "Code tracing",
      nextHref: "/practice/tracing",
      nextExerciseNumber: 1,
      labs: [
        {
          slug: "foundations",
          title: "JavaScript foundations",
          href: "/practice/foundations",
          completedCount: 4,
          totalCount: 4,
          nextExerciseNumber: null,
          state: "complete",
        },
      ],
    });

    render(await PracticePage());

    expect(screen.getByRole("link", { name: "Start problem 01" })).toHaveAttribute(
      "href",
      "/practice/sum-two-numbers",
    );
  });

  it("describes the catalog without implying personal progress when signed out", async () => {
    getSession.mockResolvedValue(null);
    getProgress.mockResolvedValue({
      completedCount: 0,
      totalCount: 12,
      completedSlugs: [],
    });

    render(await PracticePage());

    expect(screen.getByText("12 problems")).toBeInTheDocument();
    expect(screen.getByLabelText("12 problems")).toHaveTextContent("12 problems");
    expect(
      screen.queryByText("Saved privately to your account"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("navigation", { name: "Filter problems" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Open the playground" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Review saved submissions" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Choose the skill you need next." }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Accepted 0 of 12")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start step 1 of 12" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
    expect(getProgress).toHaveBeenCalledWith(null);
    expect(getBookmarks).not.toHaveBeenCalled();
    expect(getReviewQueue).not.toHaveBeenCalled();
    expect(getLabProgress).not.toHaveBeenCalled();
    expect(getCapstoneSummary).not.toHaveBeenCalled();
    expect(getMixedReviewResult).not.toHaveBeenCalled();
    expect(
      screen.queryByText("Private JavaScript capstone"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Saved for later")).not.toBeInTheDocument();
    expect(screen.queryByText("Mistakes to revisit")).not.toBeInTheDocument();
    expect(screen.queryByText("Private review session")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "View saved collection" }),
    ).not.toBeInTheDocument();
  });

  it("shows one completed 12-step outcome without inventing another step", async () => {
    getSession.mockResolvedValue({
      user: { id: "complete-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProgress.mockResolvedValue({
      completedCount: 12,
      totalCount: 12,
      completedSlugs: CODING_PROBLEMS.map((problem) => problem.slug),
    });

    render(await PracticePage());

    expect(
      screen.getByText(
        "Twelve-problem path complete. Every Accepted result is saved.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Review the 12-problem path" }),
    ).toHaveAttribute("href", "/practice/sum-two-numbers");
    expect(document.querySelectorAll(".problem-state")).toHaveLength(12);
    expect(
      Array.from(document.querySelectorAll(".problem-state")).every(
        (state) => state.textContent === "Accepted",
      ),
    ).toBe(true);
  });
});
