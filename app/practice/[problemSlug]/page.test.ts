import { cleanup, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  getCodingProblemForStudent,
  getPracticeFeedbackForStudent,
} from "@/db/coding-practice";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import { capturePracticeProblemStarted } from "@/lib/product-analytics";
import ProblemPage, { generateMetadata } from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("@/lib/product-analytics", () => ({
  capturePracticeProblemAccepted: vi.fn(),
  capturePracticeFeedbackSubmitted: vi.fn(),
  capturePracticeProblemStarted: vi.fn(),
}));

vi.mock("@/db/coding-practice", () => ({
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
          }
        : null,
    );
  }),
  getPracticeFeedbackForStudent: vi.fn(),
}));

describe("practice problem metadata", () => {
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

      cleanup();
    }

    expect(capturePracticeProblemStarted).toHaveBeenCalledOnce();
    expect(capturePracticeProblemStarted).toHaveBeenCalledWith({
      problemSlug: CODING_PROBLEMS[0].slug,
    });
  });
});
