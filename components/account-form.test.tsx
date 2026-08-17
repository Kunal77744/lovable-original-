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
  search: "",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mocks.push,
    refresh: mocks.refresh,
  }),
  useSearchParams: () => new URLSearchParams(mocks.search),
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
    mocks.search = "";
    mocks.signUp.mockResolvedValue({ error: null });
    mocks.signIn.mockResolvedValue({ error: null });
  });

  it("returns a signed-in learner to the private route they requested", async () => {
    mocks.search = "mode=signin&next=%2Fplayground";
    render(<AccountForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "learner@example.test" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/), {
      target: { value: "a-safe-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledOnce());
    expect(mocks.signIn).toHaveBeenCalledWith(
      expect.objectContaining({
        callbackURL: "/playground",
        email: "learner@example.test",
      }),
    );
    expect(mocks.push).toHaveBeenCalledWith("/playground");
  });

  it("keeps a pending sign-in in the same mode and restores retry after a thrown failure", async () => {
    let rejectSignIn: (error: Error) => void = () => {};
    mocks.search = "mode=signin";
    mocks.signIn.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectSignIn = reject;
        }),
    );
    render(<AccountForm />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "learner@example.test" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/), {
      target: { value: "a-safe-password" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    const createTab = screen.getByRole("tab", { name: "Create account" });
    const signInTab = screen.getByRole("tab", { name: "Sign in" });
    expect(createTab).toBeDisabled();
    expect(signInTab).toBeDisabled();
    fireEvent.click(createTab);
    expect(signInTab).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();

    rejectSignIn(new Error("Network unavailable"));

    expect(
      await screen.findByText(
        "Something went wrong. Check your connection and try again.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
    expect(createTab).toBeEnabled();
    expect(signInTab).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(mocks.signIn).toHaveBeenCalledTimes(2));
    expect(mocks.push).toHaveBeenCalledWith("/dashboard");
  });

  it("keeps pending account creation in the same mode and restores retry after a thrown failure", async () => {
    let rejectSignUp: (error: Error) => void = () => {};
    mocks.signUp.mockImplementationOnce(
      () =>
        new Promise((_, reject) => {
          rejectSignUp = reject;
        }),
    );
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

    const signInTab = screen.getByRole("tab", { name: "Sign in" });
    expect(signInTab).toBeDisabled();
    fireEvent.click(signInTab);
    expect(screen.getByRole("tab", { name: "Create account" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByLabelText("Name")).toHaveValue("Preview Learner");

    rejectSignUp(new Error("Network unavailable"));

    expect(
      await screen.findByText(
        "Something went wrong. Check your connection and try again.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Create my account" }),
    ).toBeEnabled();
    expect(signInTab).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Create my account" }));
    await waitFor(() => expect(mocks.signUp).toHaveBeenCalledTimes(2));
    expect(mocks.captureAccountCreated).toHaveBeenCalledOnce();
    expect(mocks.push).toHaveBeenCalledWith("/dashboard");
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
