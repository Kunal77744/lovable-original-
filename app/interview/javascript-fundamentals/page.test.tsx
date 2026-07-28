import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({
        user: {
          id: "learner-1",
        },
      }),
    },
  },
}));

vi.mock("@/db/interview-drill", () => ({
  getInterviewDrillForStudent: vi.fn().mockResolvedValue({
    status: "not-started",
    currentQuestion: 0,
    answers: [],
    startedAt: null,
    completedAt: null,
    updatedAt: null,
  }),
}));

vi.mock("@/components/interview-drill", () => ({
  InterviewDrill: () => <section aria-label="Interview drill" />,
}));

import JavaScriptInterviewDrillPage from "./page";

describe("JavaScriptInterviewDrillPage", () => {
  it("explains the account-only answer boundary beside the page heading", async () => {
    render(await JavaScriptInterviewDrillPage());

    const privateCue = screen.getByText("Private interview practice");
    const privatePractice = screen.getByRole("complementary", {
      name: "Private interview practice",
    });

    expect(privateCue).toBeVisible();
    expect(privatePractice).toContainElement(privateCue);
    expect(
      screen.getByText(
        "Saved answers belong only to your signed-in account.",
      ),
    ).toBeVisible();
  });
});
