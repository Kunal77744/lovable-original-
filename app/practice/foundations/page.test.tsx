import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";
import JavaScriptFoundationsPage, { metadata } from "./page";

const { redirect } = vi.hoisted(() => ({ redirect: vi.fn() }));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({ redirect }));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/components/javascript-foundations-warmup", () => ({
  JavaScriptFoundationsWarmup: () => (
    <section aria-label="JavaScript foundations workbench" />
  ),
}));

const getSession = vi.mocked(auth.api.getSession);

describe("JavaScriptFoundationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockResolvedValue({
      user: { id: "learner-1" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);
  });

  it("renders the private three-concept bridge into judged practice", async () => {
    render(await JavaScriptFoundationsPage());

    expect(
      screen.getByRole("heading", {
        name: "Understand the code before you chase Accepted.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "JavaScript foundations workbench" }),
    ).toBeInTheDocument();
    expect(screen.getByText("No new record")).toBeInTheDocument();
  });

  it("redirects signed-out visitors before the private route renders", async () => {
    getSession.mockResolvedValue(null);

    await JavaScriptFoundationsPage();

    expect(redirect).toHaveBeenCalledWith(
      "/account?mode=signin&next=/practice/foundations",
    );
  });

  it("keeps the private warm-up out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
