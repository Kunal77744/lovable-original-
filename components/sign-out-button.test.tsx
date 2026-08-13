import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SignOutButton } from "./sign-out-button";

const authMocks = vi.hoisted(() => ({
  signOut: vi.fn(),
}));

const navigationMocks = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signOut: authMocks.signOut,
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigationMocks,
}));

describe("SignOutButton", () => {
  beforeEach(() => {
    authMocks.signOut.mockReset();
    navigationMocks.push.mockReset();
    navigationMocks.refresh.mockReset();
  });

  afterEach(() => cleanup());

  it("keeps sign-out retryable after a network failure", async () => {
    authMocks.signOut.mockRejectedValueOnce(new Error("Network unavailable"));
    authMocks.signOut.mockResolvedValueOnce({ error: null });

    render(<SignOutButton />);

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(
      "We couldn’t sign you out. Check your connection and try again.",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
    expect(navigationMocks.push).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    await waitFor(() =>
      expect(navigationMocks.push).toHaveBeenCalledWith("/"),
    );
    expect(navigationMocks.refresh).toHaveBeenCalledOnce();
  });

  it("keeps an ordinary sign-out error retryable", async () => {
    authMocks.signOut.mockResolvedValue({
      error: { message: "Session could not be cleared" },
    });

    render(<SignOutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn’t sign you out. Try again.",
    );
    expect(screen.getByRole("button", { name: "Sign out" })).toBeEnabled();
    expect(navigationMocks.push).not.toHaveBeenCalled();
  });
});
