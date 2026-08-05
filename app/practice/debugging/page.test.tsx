import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { auth } from "@/lib/auth";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));

vi.mock("@/components/debugging-lab", () => ({
  DebuggingLab: () => <section aria-label="Debugging workbench" />,
}));

import { redirect } from "next/navigation";
import DebuggingPage, { metadata } from "./page";

describe("JavaScriptDebuggingLabPage", () => {
  it("protects the private lab before rendering learner work", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue(null);

    await DebuggingPage();

    expect(redirect).toHaveBeenCalledWith("/account?mode=signin");
  });

  it("shows the browser-only lab boundary to a signed-in learner", async () => {
    vi.mocked(auth.api.getSession).mockResolvedValue({
      user: { id: "learner-1" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);

    render(await DebuggingPage());

    expect(screen.getByRole("heading", { name: "Find the defect. Prove the repair." })).toBeInTheDocument();
    expect(screen.getByText(/creates no saved attempt, progress, or analytics record/)).toBeInTheDocument();
    expect(screen.getByLabelText("Debugging workbench")).toBeInTheDocument();
  });

  it("keeps the private lab out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
