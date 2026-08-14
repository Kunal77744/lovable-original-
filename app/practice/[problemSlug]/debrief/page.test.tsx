import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CODING_PROBLEMS } from "@/lib/coding-problems";
import { serializePracticeJournal } from "@/lib/practice-solution-note";
import ProblemDebriefPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getStudentState: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/db/coding-practice", () => ({
  getCodingProblemForStudent: mocks.getStudentState,
}));

const problem = CODING_PROBLEMS[0];
const acceptedCode =
  "function solve(input) { const [a, b] = input.split(' ').map(Number); return String(a + b); }";
const acceptedState = {
  code: acceptedCode,
  latestAcceptedCode: acceptedCode,
  bestVerdict: "Accepted",
  attempts: [],
  customTestCases: [],
  solutionNote: {
    content: serializePracticeJournal({
      inputShape: "Two integers separated by one space.",
      edgeCase: "Negative values and zero.",
      steps: "Split, convert, add, and return the total.",
      reflection: "Explicit number conversion kept addition numeric.",
    }),
    updatedAt: "2026-08-11T18:00:00.000Z",
  },
};

describe("ProblemDebriefPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "learner-1" } });
    mocks.getStudentState.mockResolvedValue(acceptedState);
  });

  afterEach(cleanup);

  it("keeps the private debrief out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects before reading learner data when signed out", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(
      ProblemDebriefPage({ params: Promise.resolve({ problemSlug: problem.slug }) }),
    ).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Fpractice%2Fsum-two-numbers%2Fdebrief",
    );
    expect(mocks.getStudentState).not.toHaveBeenCalled();
  });

  it("keeps the debrief locked before Accepted", async () => {
    mocks.getStudentState.mockResolvedValue({
      ...acceptedState,
      latestAcceptedCode: null,
      bestVerdict: null,
    });

    render(
      await ProblemDebriefPage({
        params: Promise.resolve({ problemSlug: problem.slug }),
      }),
    );

    expect(
      screen.getByRole("heading", { name: "Reach Accepted first." }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Continue the problem" }),
    ).toHaveAttribute("href", `/practice/${problem.slug}`);
    expect(screen.queryByText("Truthful interview wording")).not.toBeInTheDocument();
  });

  it("turns the latest Accepted source and journal into a private rehearsal", async () => {
    render(
      await ProblemDebriefPage({
        params: Promise.resolve({ problemSlug: problem.slug }),
      }),
    );

    expect(mocks.getStudentState).toHaveBeenCalledWith("learner-1", problem.slug);
    expect(
      screen.getByRole("heading", { name: "Explain why your solution works." }),
    ).toBeVisible();
    expect(screen.getByText("4 checks passed")).toBeVisible();
    expect(screen.getByText("Truthful interview wording")).toBeVisible();
    expect(screen.getByText("Interview rehearsal")).toBeVisible();
    expect(screen.getByText(/INPUT SHAPE/)).toHaveTextContent(
      "Two integers separated by one space.",
    );
    expect(
      screen.getByText("Review the exact Accepted source"),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Print problem debrief" }),
    ).toBeVisible();
  });
});
