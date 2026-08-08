import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AccountPage from "./page";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: mocks.getSession,
    },
  },
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
}));

vi.mock("@/components/account-form", () => ({
  AccountForm: () => (
    <form aria-label="Create your student account">
      <button className="account-submit" type="submit">
        Create my account
      </button>
    </form>
  ),
}));

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(null);
  });

  it("names the first course result without adding a second primary action", async () => {
    render(await AccountPage());

    expect(
      screen.getByRole("region", {
        name: "Build a page the browser understands.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Web Development Foundations")).toBeInTheDocument();
    expect(screen.getByText(/18-minute semantic HTML lesson/)).toBeInTheDocument();
    expect(
      screen.getByText("Pass the four-question recall check at 75%"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Complete the course and keep your best quiz score saved"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sign back in anytime and your saved course work and JavaScript code will return.",
      ),
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll(".primary-action, .account-submit"),
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: "Create my account" }),
    ).toHaveLength(1);
  });

  it("sends an existing session to its safe requested destination", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "learner-1" } });

    await expect(
      AccountPage({
        searchParams: Promise.resolve({ next: "/playground" }),
      }),
    ).rejects.toThrow("REDIRECT:/playground");
  });

  it("rejects an external requested destination", async () => {
    mocks.getSession.mockResolvedValue({ user: { id: "learner-1" } });

    await expect(
      AccountPage({
        searchParams: Promise.resolve({ next: "https://example.com/collect" }),
      }),
    ).rejects.toThrow("REDIRECT:/dashboard");
  });
});
