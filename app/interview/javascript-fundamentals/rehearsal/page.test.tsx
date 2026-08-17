import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { InterviewDrillProgress } from "@/lib/interview-drill";
import JavaScriptInterviewRehearsalPage, { metadata } from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getProgress: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: mocks.getSession } },
}));

vi.mock("@/db/interview-drill", () => ({
  getInterviewDrillForStudent: mocks.getProgress,
}));

const completedProgress: InterviewDrillProgress = {
  status: "completed",
  currentQuestion: 4,
  answers: [
    {
      questionSlug: "const-let-var",
      answer: "I default to const, use let when reassignment is required, and avoid var because it is function-scoped.",
      rating: "ready",
    },
    {
      questionSlug: "strict-equality",
      answer: "Strict equality compares type and value without coercion, so it is my default.",
      rating: "ready",
    },
    {
      questionSlug: "closures",
      answer: "A closure lets a function remember variables from the scope where it was created.",
      rating: "almost",
    },
    {
      questionSlug: "async-order",
      answer: "Promise callbacks are microtasks, and those run before the next task queue callback.",
      rating: "ready",
    },
    {
      questionSlug: "array-transformations",
      answer: "Map transforms, filter selects, and reduce combines values into one result.",
      rating: "needs-work",
    },
  ],
  startedAt: "2026-08-10T09:00:00.000Z",
  completedAt: "2026-08-11T09:12:00.000Z",
  updatedAt: "2026-08-11T09:12:00.000Z",
};

describe("JavaScriptInterviewRehearsalPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue({ user: { id: "learner-1" } });
    mocks.getProgress.mockResolvedValue(completedProgress);
  });

  afterEach(() => cleanup());

  it("keeps saved interview answers out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("redirects before reading private progress when signed out", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expect(JavaScriptInterviewRehearsalPage()).rejects.toThrow(
      "REDIRECT:/account?mode=signin&next=%2Finterview%2Fjavascript-fundamentals%2Frehearsal",
    );
    expect(mocks.getProgress).not.toHaveBeenCalled();
  });

  it("keeps the sheet locked until every answer is saved", async () => {
    mocks.getProgress.mockResolvedValue({
      ...completedProgress,
      status: "in-progress",
      answers: completedProgress.answers.slice(0, 4),
    });

    render(await JavaScriptInterviewRehearsalPage());

    expect(
      screen.getByRole("heading", {
        name: "Finish the five-question round first.",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Continue the interview drill" }),
    ).toHaveAttribute("href", "/interview/javascript-fundamentals");
    expect(screen.queryByText("Your saved round")).not.toBeInTheDocument();
  });

  it("turns the exact saved round into spoken rehearsal", async () => {
    render(await JavaScriptInterviewRehearsalPage());

    expect(mocks.getProgress).toHaveBeenCalledWith(
      "learner-1",
      "javascript-fundamentals",
    );
    expect(
      screen.getByRole("heading", {
        name: "Turn saved answers into a spoken round.",
      }),
    ).toBeVisible();
    expect(screen.getByText("3/5")).toBeVisible();
    expect(screen.getByText("August 11, 2026")).toBeVisible();
    expect(
      screen.getByText(completedProgress.answers[0].answer),
    ).toBeVisible();
    expect(screen.getAllByText("Follow-up")).toHaveLength(5);
    expect(
      screen.getByRole("button", { name: "Print or save as PDF" }),
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Improve 2 saved answers" }),
    ).toHaveAttribute("href", "/interview/javascript-fundamentals");
  });
});
