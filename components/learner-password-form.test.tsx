import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LearnerPasswordForm } from "./learner-password-form";

const mocks = vi.hoisted(() => ({
  changePassword: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    changePassword: mocks.changePassword,
  },
}));

function fillPasswordForm({
  current = "current-password",
  next = "a-new-safe-password",
  confirmation = next,
} = {}) {
  fireEvent.change(screen.getByLabelText("Current password"), {
    target: { value: current },
  });
  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: next },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: confirmation },
  });
}

describe("LearnerPasswordForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.changePassword.mockResolvedValue({ error: null });
  });

  afterEach(cleanup);

  it("changes the password and closes other signed-in sessions", async () => {
    render(<LearnerPasswordForm />);
    fillPasswordForm();

    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    await waitFor(() => expect(mocks.changePassword).toHaveBeenCalledOnce());
    expect(mocks.changePassword).toHaveBeenCalledWith({
      currentPassword: "current-password",
      newPassword: "a-new-safe-password",
      revokeOtherSessions: true,
    });
    expect(
      screen.getByText(
        "Password changed. Your other signed-in sessions are closed.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toHaveValue("");
    expect(screen.getByLabelText("New password")).toHaveValue("");
    expect(screen.getByLabelText("Confirm new password")).toHaveValue("");
  });

  it("rejects a mismatched confirmation before making a request", () => {
    render(<LearnerPasswordForm />);
    fillPasswordForm({ confirmation: "a-different-password" });

    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(screen.getByText("Your new passwords don’t match.")).toBeInTheDocument();
    expect(mocks.changePassword).not.toHaveBeenCalled();
  });

  it("keeps the form retryable when the current password is wrong", async () => {
    mocks.changePassword.mockResolvedValue({
      error: { code: "INVALID_PASSWORD" },
    });
    render(<LearnerPasswordForm />);
    fillPasswordForm();

    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(
      await screen.findByText(
        "Your current password didn’t match. Nothing changed.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Current password")).toHaveValue(
      "current-password",
    );
    expect(screen.getByRole("button", { name: "Change password" })).toBeEnabled();
  });

  it("explains how to refresh an older session", async () => {
    mocks.changePassword.mockResolvedValue({
      error: { code: "SESSION_NOT_FRESH" },
    });
    render(<LearnerPasswordForm />);
    fillPasswordForm();

    fireEvent.click(screen.getByRole("button", { name: "Change password" }));

    expect(
      await screen.findByText(
        "Sign out and back in, then change your password. Nothing changed.",
      ),
    ).toBeInTheDocument();
  });
});
