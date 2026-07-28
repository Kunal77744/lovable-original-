import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountForm } from "./account-form";

const mocks = vi.hoisted(() => ({
  captureAccountCreated: vi.fn(),
  push: vi.fn(),
  refresh: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: { email: mocks.signIn },
    signUp: { email: mocks.signUp },
  },
}));

vi.mock("@/lib/product-analytics", () => ({
  captureAccountCreated: mocks.captureAccountCreated,
}));

describe("AccountForm analytics", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.signUp.mockResolvedValue({ error: null });
  });

  it("captures account_created only after account creation succeeds", async () => {
    render(<AccountForm />);

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Preview Learner" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "learner@example.test" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/), {
      target: { value: "a-safe-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create my account" }));

    await waitFor(() => expect(mocks.captureAccountCreated).toHaveBeenCalledOnce());
    expect(mocks.signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackURL: "/dashboard",
        email: "learner@example.test",
        name: "Preview Learner",
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/dashboard");
  });

  it("reassures learners that account entry is free without adding another action", () => {
    const { container } = render(<AccountForm />);
    const accountForm = within(container);

    expect(
      accountForm.getByText("Free. No payment details required."),
    ).toBeInTheDocument();
    expect(
      accountForm.getAllByRole("button", { name: "Create my account" }),
    ).toHaveLength(1);
  });

  it("gives every account field an explicit autofill identifier", () => {
    const { container } = render(<AccountForm />);
    const accountForm = within(container);

    expect(accountForm.getByLabelText("Name")).toHaveAttribute(
      "id",
      "account-name",
    );
    expect(accountForm.getByLabelText("Email")).toHaveAttribute(
      "id",
      "account-email",
    );
    expect(accountForm.getByLabelText(/^Password/)).toHaveAttribute(
      "id",
      "account-password",
    );
  });
});
