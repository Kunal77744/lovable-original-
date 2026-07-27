import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getGuidedProjectForStudent } from "@/db/guided-project";
import { auth } from "@/lib/auth";
import SemanticHtmlProjectPage, { metadata } from "./page";

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

vi.mock("@/db/guided-project", () => ({
  getGuidedProjectForStudent: vi.fn(),
}));

const getSession = vi.mocked(auth.api.getSession);
const getProject = vi.mocked(getGuidedProjectForStudent);

describe("SemanticHtmlProjectPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({
      user: { id: "learner-1" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
    getProject.mockResolvedValue({
      html: "<main><article></article></main>",
      saved: false,
      updatedAt: null,
      hasUnreviewedChanges: false,
      submission: null,
    });
  });

  it("keeps the account-only project out of search", () => {
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it("loads the private learner project and its bounded brief", async () => {
    render(await SemanticHtmlProjectPage());

    expect(getProject).toHaveBeenCalledWith(
      "learner-1",
      "semantic-html-article",
    );
    expect(screen.getByText("Private guided project")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Semantic HTML field guide" }),
    ).toBeInTheDocument();
    expect(screen.getByText("6 checks")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Build, review, revise." }),
    ).toBeInTheDocument();
  });
});
