import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getCodingProblemBookmarkForStudent,
  getCodingProblemForStudent,
  getPracticeFeedbackForStudent,
} from "@/db/coding-practice";
import { auth } from "@/lib/auth";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import { capturePracticeProblemStarted } from "@/lib/product-analytics";
import ProblemPage, { generateMetadata } from "./page";

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

vi.mock("@/lib/product-analytics", () => ({
  capturePracticeProblemAccepted: vi.fn(),
  capturePracticeFeedbackSubmitted: vi.fn(),
  capturePracticeProblemStarted: vi.fn(),
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingProblemBookmarkForStudent: vi.fn(),
  getCodingProblemForStudent: vi.fn((_: string | null, problemSlug: string) => {
    const problem = CODING_PROBLEMS.find(
      (candidate) => candidate.slug === problemSlug,
    );

    return Promise.resolve(
      problem
        ? {
            attempts: [],
            bestVerdict: null,
            code: problem.starterCode,
            customTestCases: [],
            solutionNote: null,
          }
        : null,
    );
  }),
  getPracticeFeedbackForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getBookmark = vi.mocked(getCodingProblemBookmarkForStudent);
const getPracticeFeedback = vi.mocked(getPracticeFeedbackForStudent);

describe("practice problem metadata", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue(null);
    getBookmark.mockResolvedValue(false);
    getPracticeFeedback.mockResolvedValue({
      isEligible: false,
      feedback: null,
    });
  });

  it("renders distinct problem-specific previews for all six routes", async () => {
    const renderedMetadata = await Promise.all(
      CODING_PROBLEMS.map(async (problem) => ({
        problem,
        metadata: await generateMetadata({
          params: Promise.resolve({ problemSlug: problem.slug }),
        }),
      })),
    );

    expect(
      new Set(renderedMetadata.map(({ metadata }) => metadata.title)).size,
    ).toBe(6);
    expect(
      new Set(renderedMetadata.map(({ metadata }) => metadata.description)).size,
    ).toBe(6);

    for (const { problem, metadata } of renderedMetadata) {
      expect(metadata.title).toBe(
        `${problem.title} JavaScript problem | Lovable Original`,
      );
      expect(metadata.description).toBe(
        `${problem.title}: solve this beginner JavaScript problem with browser-run checks. Sign in to save your code, attempts, and Accepted result.`,
      );
      expect(metadata.alternates).toEqual({
        canonical: `/practice/${problem.slug}`,
      });
    }
  });

  it("keeps unknown problem previews generic", async () => {
    expect(
      await generateMetadata({
        params: Promise.resolve({ problemSlug: "missing-problem" }),
      }),
    ).toEqual({
      title: "Problem not found | Lovable Original",
    });
  });

  it("shows a stable path position and recovery cue on all six problem routes", async () => {
    for (const problem of CODING_PROBLEMS) {
      render(
        await ProblemPage({
          params: Promise.resolve({ problemSlug: problem.slug }),
        }),
      );

      expect(
        screen.getByText(
          "Sign in to save this work. Your code, attempts, and Accepted progress return with your account.",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getAllByText(
          `Step ${problem.number} of ${CODING_PROBLEMS.length}`,
          { exact: false },
        ),
      ).toHaveLength(2);
      expect(
        screen.getAllByText(
          `Step ${problem.number} of ${CODING_PROBLEMS.length}`,
          { exact: true },
        ),
      ).toHaveLength(1);
      expect(
        screen.getByText(
          `Step ${problem.number} of ${CODING_PROBLEMS.length}`,
          { exact: true },
        ),
      ).toHaveAttribute("aria-current", "step");
      expect(
        document.querySelectorAll('[aria-current="step"]'),
      ).toHaveLength(1);
      expect(getCodingProblemForStudent).toHaveBeenCalledWith(
        null,
        problem.slug,
      );
      expect(getPracticeFeedbackForStudent).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("button", { name: `Save ${problem.title} for later` }),
      ).not.toBeInTheDocument();

      cleanup();
    }

    expect(capturePracticeProblemStarted).toHaveBeenCalledOnce();
    expect(capturePracticeProblemStarted).toHaveBeenCalledWith({
      problemSlug: CODING_PROBLEMS[0].slug,
    });
  });

  it("restores a signed-in learner's saved state without changing the main workspace", async () => {
    const problem = CODING_PROBLEMS[0];
    getSession.mockResolvedValue({
      user: { id: "returning-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getBookmark.mockResolvedValue(true);
    vi.mocked(getCodingProblemForStudent).mockResolvedValueOnce({
      attempts: [],
      bestVerdict: null,
      code: problem.starterCode,
      customTestCases: ["19 23", "-5 8"],
      solutionNote: null,
    });

    render(
      await ProblemPage({
        params: Promise.resolve({ problemSlug: problem.slug }),
      }),
    );

    expect(
      screen.getByRole("button", {
        name: `Remove ${problem.title} from saved problems`,
      }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(getBookmark).toHaveBeenCalledWith("returning-learner", problem.slug);
    expect(getCodingProblemForStudent).toHaveBeenCalledWith(
      "returning-learner",
      problem.slug,
    );
    fireEvent.click(screen.getByText("Try your own input"));
    expect(screen.getByDisplayValue("19 23")).toBeInTheDocument();
    expect(screen.getByDisplayValue("-5 8")).toBeInTheDocument();
    expect(screen.getByText("2 private test cases restored.")).toBeInTheDocument();
  });
});
