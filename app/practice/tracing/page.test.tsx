import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import JavaScriptTracingPage, { metadata } from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
  },
}));

const getSession = vi.mocked(auth.api.getSession);
const redirectMock = vi.mocked(redirect);

describe("JavaScriptTracingPage", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => cleanup());

  it("redirects signed-out visitors before rendering the lab", async () => {
    getSession.mockResolvedValue(null);
    redirectMock.mockImplementation(() => {
      throw new Error("NEXT_REDIRECT");
    });

    await expect(JavaScriptTracingPage()).rejects.toThrow("NEXT_REDIRECT");
    expect(redirectMock).toHaveBeenCalledWith(
      "/account?mode=signin&next=/practice/tracing",
    );
  });

  it("renders the four-trace lab for a signed-in learner", async () => {
    getSession.mockResolvedValue({
      user: { id: "trace-learner" },
    } as Awaited<ReturnType<typeof auth.api.getSession>>);

    render(await JavaScriptTracingPage());

    expect(
      screen.getByRole("heading", { name: "Read the code before you run it." }),
    ).toBeInTheDocument();
    expect(screen.getByText("Trace 1 of 4")).toBeInTheDocument();
    expect(screen.getByText("No attempt or score is saved.")).toBeInTheDocument();
  });

  it("keeps the private route out of search", () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});

