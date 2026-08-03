import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import AccountPage, { metadata } from "./page";

vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
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
  it("names the first course result without adding a second primary action", async () => {
    render(await AccountPage());

    expect(
      screen.getByRole("region", {
        name: "Build a page the browser understands.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Web Development Foundations")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Create your student account to complete this two-lesson course: 18 minutes of semantic HTML and 16 minutes of CSS selectors and the box model, with saved results.",
      ),
    ).toBeInTheDocument();
    expect(metadata.description).toBe(
      "Create your student account to complete the two-lesson Web Development Foundations course.",
    );
    expect(
      screen.getByText("Pass the four-question recall check at 75%"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Complete the course and keep your best quiz score saved"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sign back in anytime and your saved course work, JavaScript code, and CSS practice will return.",
      ),
    ).toBeInTheDocument();
    expect(
      document.querySelectorAll(".primary-action, .account-submit"),
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: "Create my account" }),
    ).toHaveLength(1);
  });
});
